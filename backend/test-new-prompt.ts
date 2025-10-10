import { CodeGeneratorAgent } from './src/agents/specialized/CodeGeneratorAgent.js';

async function testNewPrompt() {
  console.log('🧪 Testing updated TypeScript prompt with calculator app...\n');
  
  const requirements = `
Create a simple calculator web application with:
- Basic arithmetic operations (+, -, *, /)
- Clean UI with buttons
- Display for showing results
- Clear button
`;

  try {
    const { runner } = await CodeGeneratorAgent({
      language: 'typescript',
      requirements
    });

    console.log('📤 Sending request to agent...');
    const startTime = Date.now();
    
    const response = await runner.ask(
      `Generate code for: ${requirements}`
    );

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`⏱️  Completed in ${duration}s\n`);

    const result = response.data;
    
    if (!result || !result.files || !Array.isArray(result.files)) {
      console.error('❌ Invalid response structure:', result);
      return;
    }

    console.log(`✅ Generated ${result.files.length} files:\n`);
    
    let hasIndexHtml = false;
    let hasViteConfig = false;
    let hasPackageJson = false;
    
    result.files.forEach((file: any, idx: number) => {
      const truncated = file.content.length > 200 ? '...(truncated)' : '';
      console.log(`[${idx + 1}] ${file.path} (${file.content.length} chars)`);
      console.log(file.content.substring(0, 200) + truncated);
      console.log('');
      
      if (file.path === 'index.html') hasIndexHtml = true;
      if (file.path.includes('vite.config')) hasViteConfig = true;
      if (file.path === 'package.json') hasPackageJson = true;
    });

    console.log('\n📋 Validation Results:');
    console.log(`${hasIndexHtml ? '✅' : '❌'} index.html present`);
    console.log(`${hasViteConfig ? '✅' : '❌'} vite.config present`);
    console.log(`${hasPackageJson ? '✅' : '❌'} package.json present`);
    
    if (hasIndexHtml && hasViteConfig && hasPackageJson) {
      console.log('\n🎉 SUCCESS! Prompt is working correctly!');
    } else {
      console.log('\n⚠️  WARNING: Missing critical files for web app deployment');
    }

  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
  }
}

testNewPrompt();
