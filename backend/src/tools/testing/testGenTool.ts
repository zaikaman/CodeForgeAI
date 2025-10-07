import { parseCode, ParsedFunction, ParsedClass } from '../code/codeParseTool'

/**
 * Test Generation Tool
 * Generate Jest tests from function and class signatures
 */

export interface TestOptions {
  framework?: 'jest' | 'vitest'
  includeSetup?: boolean
  includeMocks?: boolean
  includeEdgeCases?: boolean
}

/**
 * Generate test for a function
 */
export function generateFunctionTest(
  func: ParsedFunction,
  options: TestOptions = {}
): string {
  const { framework: _framework = 'jest', includeSetup = true, includeEdgeCases = true } = options

  const { name, parameters, returnType, isAsync } = func

  let test = `describe('${name}', () => {\n`

  if (includeSetup) {
    test += `  beforeEach(() => {\n`
    test += `    // Setup before each test\n`
    test += `  })\n\n`

    test += `  afterEach(() => {\n`
    test += `    // Cleanup after each test\n`
    test += `  })\n\n`
  }

  // Basic test
  const awaitKeyword = isAsync ? 'await ' : ''
  const testParams = parameters.map(p => `/* ${p.name}: ${p.type} */`).join(', ')

  test += `  it('should be defined', () => {\n`
  test += `    expect(${name}).toBeDefined()\n`
  test += `  })\n\n`

  // Happy path test
  test += `  it('should return expected result with valid input', ${isAsync ? 'async ' : ''}() => {\n`
  test += `    const result = ${awaitKeyword}${name}(${testParams})\n`
  test += `    expect(result).toBeDefined()\n`
  test += `    // TODO: Add specific assertions\n`
  test += `  })\n\n`

  // Edge cases
  if (includeEdgeCases) {
    if (parameters.length > 0) {
      test += `  it('should handle null/undefined parameters', ${isAsync ? 'async ' : ''}() => {\n`
      test += `    // TODO: Test null/undefined handling\n`
      test += `    expect(() => ${name}(null as any)).toBeDefined()\n`
      test += `  })\n\n`
    }

    if (returnType !== 'void' && !returnType.includes('never')) {
      test += `  it('should return correct type', ${isAsync ? 'async ' : ''}() => {\n`
      test += `    const result = ${awaitKeyword}${name}(${testParams})\n`
      test += `    expect(typeof result).toBe('${inferJSType(returnType)}')\n`
      test += `  })\n\n`
    }

    if (isAsync || returnType.includes('Promise')) {
      test += `  it('should handle errors gracefully', async () => {\n`
      test += `    // TODO: Test error handling\n`
      test += `    await expect(${name}(/* invalid params */)).rejects.toThrow()\n`
      test += `  })\n\n`
    }
  }

  test += `})\n`

  return test
}

/**
 * Generate test for a class
 */
export function generateClassTest(
  cls: ParsedClass,
  options: TestOptions = {}
): string {
  const { framework: _framework = 'jest', includeSetup = true, includeMocks: _includeMocks = true } = options

  const { name, methods, properties } = cls

  let test = `describe('${name}', () => {\n`
  test += `  let instance: ${name}\n\n`

  if (includeSetup) {
    test += `  beforeEach(() => {\n`
    const constructorParams = properties
      .map(p => `/* ${p.name}: ${p.type} */`)
      .join(', ')
    test += `    instance = new ${name}(${constructorParams})\n`
    test += `  })\n\n`

    test += `  afterEach(() => {\n`
    test += `    // Cleanup\n`
    test += `  })\n\n`
  }

  // Constructor test
  test += `  it('should create instance', () => {\n`
  test += `    expect(instance).toBeDefined()\n`
  test += `    expect(instance).toBeInstanceOf(${name})\n`
  test += `  })\n\n`

  // Property tests
  if (properties.length > 0) {
    test += `  describe('properties', () => {\n`
    properties.forEach(prop => {
      test += `    it('should have ${prop.name} property', () => {\n`
      test += `      expect(instance['${prop.name}']).toBeDefined()\n`
      test += `    })\n\n`
    })
    test += `  })\n\n`
  }

  // Method tests
  if (methods.length > 0) {
    test += `  describe('methods', () => {\n`
    methods.forEach(method => {
      const awaitKeyword = method.isAsync ? 'await ' : ''
      const testParams = method.parameters
        .map(p => `/* ${p.name}: ${p.type} */`)
        .join(', ')

      test += `    it('should have ${method.name} method', () => {\n`
      test += `      expect(instance.${method.name}).toBeDefined()\n`
      test += `      expect(typeof instance.${method.name}).toBe('function')\n`
      test += `    })\n\n`

      test += `    it('${method.name} should work correctly', ${method.isAsync ? 'async ' : ''}() => {\n`
      test += `      const result = ${awaitKeyword}instance.${method.name}(${testParams})\n`
      test += `      // TODO: Add specific assertions\n`
      test += `      expect(result).toBeDefined()\n`
      test += `    })\n\n`
    })
    test += `  })\n\n`
  }

  test += `})\n`

  return test
}

/**
 * Generate tests from source code
 */
export async function generateTests(
  code: string,
  options: TestOptions = {},
  filePath: string = 'temp.ts'
): Promise<string> {
  const parseResult = await parseCode(code, filePath)

  let allTests = `/**\n * Generated tests\n */\n\n`

  // Generate function tests
  for (const func of parseResult.functions) {
    if (func.isExported) {
      const test = await generateFunctionTest(func, options)
      allTests += test + '\n\n'
    }
  }

  // Generate class tests
  for (const cls of parseResult.classes) {
    if (cls.isExported) {
      const test = await generateClassTest(cls, options)
      allTests += test + '\n\n'
    }
  }

  return allTests
}

/**
 * Generate test file with imports
 */
export async function generateTestFile(
  sourceFilePath: string,
  code: string,
  options: TestOptions = {}
): Promise<string> {
  const parseResult = await parseCode(code, sourceFilePath)

  // Generate imports
  const baseName = sourceFilePath.replace(/\.(ts|tsx|js|jsx)$/, '')
  let testFile = `import {\n`

  const exports = [
    ...parseResult.functions.filter(f => f.isExported).map(f => f.name),
    ...parseResult.classes.filter(c => c.isExported).map(c => c.name),
  ]

  testFile += exports.map(e => `  ${e}`).join(',\n')
  testFile += `\n} from './${baseName}'\n\n`

  // Generate tests
  const tests = await generateTests(code, options, sourceFilePath)
  testFile += tests

  return testFile
}

/**
 * Generate integration test template
 */
export function generateIntegrationTest(
  testName: string,
  description?: string
): string {
  return `/**
 * ${description || `Integration test for ${testName}`}
 */

describe('${testName} Integration', () => {
  beforeAll(async () => {
    // Setup before all tests (database, services, etc.)
  })

  afterAll(async () => {
    // Cleanup after all tests
  })

  beforeEach(async () => {
    // Setup before each test
  })

  afterEach(async () => {
    // Cleanup after each test
  })

  it('should complete end-to-end workflow', async () => {
    // TODO: Implement integration test
    expect(true).toBe(true)
  })

  it('should handle errors in workflow', async () => {
    // TODO: Test error scenarios
    expect(true).toBe(true)
  })
})
`
}

/**
 * Generate performance test template
 */
export function generatePerformanceTest(
  testName: string,
  maxDurationMs: number = 1000
): string {
  return `/**
 * Performance test for ${testName}
 */

describe('${testName} Performance', () => {
  it('should complete within ${maxDurationMs}ms', async () => {
    const startTime = Date.now()

    // TODO: Execute operation

    const endTime = Date.now()
    const duration = endTime - startTime

    expect(duration).toBeLessThan(${maxDurationMs})
  })

  it('should handle load', async () => {
    const iterations = 100
    const startTime = Date.now()

    for (let i = 0; i < iterations; i++) {
      // TODO: Execute operation
    }

    const endTime = Date.now()
    const avgTime = (endTime - startTime) / iterations

    console.log(\`Average time per iteration: \${avgTime}ms\`)
    expect(avgTime).toBeLessThan(${maxDurationMs})
  })
})
`
}

/**
 * Generate mock for a class or interface
 */
export async function generateMock(
  code: string,
  symbolName: string,
  filePath: string = 'temp.ts'
): Promise<string> {
  const parseResult = await parseCode(code, filePath)

  // Find class
  const cls = parseResult.classes.find(c => c.name === symbolName)
  if (cls) {
    let mock = `const mock${symbolName} = {\n`
    cls.methods.forEach(method => {
      const asyncPrefix = method.isAsync ? 'async ' : ''
      mock += `  ${method.name}: jest.fn(${asyncPrefix}() => {\n`
      mock += `    // TODO: Implement mock\n`
      mock += `  }),\n`
    })
    mock += `}\n`
    return mock
  }

  // Find interface
  const iface = parseResult.interfaces.find(i => i.name === symbolName)
  if (iface) {
    let mock = `const mock${symbolName}: ${symbolName} = {\n`
    iface.properties.forEach(prop => {
      mock += `  ${prop.name}: /* TODO: mock value */,\n`
    })
    mock += `}\n`
    return mock
  }

  throw new Error(`Symbol '${symbolName}' not found`)
}

/**
 * Infer JavaScript type from TypeScript type
 */
function inferJSType(tsType: string): string {
  if (tsType.includes('string')) return 'string'
  if (tsType.includes('number')) return 'number'
  if (tsType.includes('boolean')) return 'boolean'
  if (tsType.includes('[]') || tsType.includes('Array')) return 'object'
  if (tsType.includes('Promise')) return 'object'
  return 'object'
}
