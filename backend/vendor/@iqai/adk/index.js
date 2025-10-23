"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { newObj[key] = obj[key]; } } } newObj.default = obj; return newObj; } } function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; } function _nullishCoalesce(lhs, rhsFn) { if (lhs != null) { return lhs; } else { return rhsFn(); } } function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; } async function _asyncOptionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = await fn(value); } else if (op === 'call' || op === 'optionalCall') { value = await fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; } var _class; var _class2; var _class3; var _class4; var _class5; var _class6; var _class7; var _class8; var _class9; var _class10; var _class11; var _class12; var _class13; var _class14; var _class15; var _class16; var _class17; var _class18; var _class19; var _class20; var _class21; var _class22; var _class23; var _class24; var _class25; var _class26; var _class27; var _class28; var _class29; var _class30; var _class31; var _class32; var _class33; var _class34; var _class35;var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/logger/index.ts
var _chalk = require('chalk'); var _chalk2 = _interopRequireDefault(_chalk);
function isDebugEnabled() {
  return process.env.NODE_ENV === "development" || process.env.ADK_DEBUG === "true";
}
var LOG_LEVELS, Logger;
var init_logger = __esm({
  "src/logger/index.ts"() {
    LOG_LEVELS = {
      debug: { icon: "\u{1F41B}", color: _chalk2.default.blue, method: console.log },
      info: { icon: "\u2139\uFE0F", color: _chalk2.default.cyan, method: console.debug },
      warn: { icon: "\u{1F6A7}", color: _chalk2.default.yellow, method: console.warn },
      error: { icon: "\u274C", color: _chalk2.default.red, method: console.error }
    };
    Logger = (_class = class {
      
      __init2() {this.isDebugEnabled = isDebugEnabled()}
      constructor({ name }) {;_class.prototype.__init2.call(this);
        this.name = name;
      }
      debug(message, ...args) {
        if (this.isDebugEnabled) {
          this.log("debug", message, ...args);
        }
      }
      info(message, ...args) {
        this.log("info", message, ...args);
      }
      warn(message, ...args) {
        this.log("warn", message, ...args);
      }
      error(message, ...args) {
        this.log("error", message, ...args);
      }
      log(level, message, ...args) {
        const { icon, color, method } = LOG_LEVELS[level];
        const time = (/* @__PURE__ */ new Date()).toLocaleTimeString();
        const isProd = process.env.NODE_ENV === "production";
        const forceBoxes = process.env.ADK_FORCE_BOXES === "true";
        const { meta, otherArgs } = this.extractMeta(args);
        const lines = this.formatArgs(otherArgs, level === "error");
        if (meta.suggestion) lines.unshift(`\u2022 Suggestion: ${meta.suggestion}`);
        if (meta.context && Object.keys(meta.context).length) {
          const contextStr = Object.entries(meta.context).map(([k, v]) => `${k}=${this.stringify(v)}`).join("  ");
          lines.unshift(`\u2022 Context: ${contextStr}`);
        }
        if (isProd && !forceBoxes) {
          const header = `[${time}] ${icon} [${this.name}] ${message}`;
          const output = lines.length ? [header, ...lines].join("\n") : header;
          method(color(output));
          return;
        }
        if (level === "warn" || level === "error") {
          const box = this.formatBox({
            title: `${icon} ${this.capitalize(level)} @ ${time} (${this.name})`,
            description: message,
            lines,
            color,
            wrap: true
          });
          method(box);
        } else {
          const header = `[${time}] ${icon} [${this.name}] ${message}`;
          const output = lines.length ? [header, ...lines].join("\n") : header;
          method(color(output));
        }
      }
      extractMeta(args) {
        const meta = {};
        const otherArgs = [];
        let metaFound = false;
        for (const arg of args) {
          if (!arg) continue;
          if (!metaFound && typeof arg === "object" && !(arg instanceof Error) && ("suggestion" in arg || "context" in arg)) {
            meta.suggestion = arg.suggestion;
            meta.context = arg.context;
            metaFound = true;
          } else {
            otherArgs.push(arg);
          }
        }
        return { meta, otherArgs };
      }
      formatArgs(args, includeStack = false) {
        const lines = [];
        const maxFrames = process.env.ADK_ERROR_STACK_FRAMES !== void 0 ? Number(process.env.ADK_ERROR_STACK_FRAMES) : Number.POSITIVE_INFINITY;
        for (const arg of args) {
          if (!arg) continue;
          if (arg instanceof Error) {
            lines.push(`\u2022 ${arg.name}: ${arg.message}`);
            if (includeStack && arg.stack) {
              const frames = this.parseStackFrames(arg.stack, maxFrames);
              if (frames.length) {
                lines.push("\u2022 Stack:", ...frames);
              }
            }
          } else {
            lines.push(`\u2022 ${this.stringify(arg)}`);
          }
        }
        return lines;
      }
      parseStackFrames(stack, maxFrames) {
        const frames = stack.split(/\n/).slice(1).map((f) => f.trim()).filter(Boolean).slice(0, maxFrames);
        const result = frames.map((frame) => {
          const cleaned = frame.replace(/^at\s+/, "").replace(process.cwd(), ".");
          return `  \u21B3 ${cleaned}`;
        });
        const totalFrames = stack.split(/\n/).length - 1;
        if (totalFrames > maxFrames) {
          result.push(`  \u21B3 \u2026 ${totalFrames - maxFrames} more frames`);
        }
        return result;
      }
      stringify(value) {
        if (typeof value === "string") return value;
        if (typeof value === "number" || typeof value === "boolean")
          return String(value);
        if (value === null || value === void 0) return String(value);
        try {
          return JSON.stringify(value);
        } catch (e2) {
          return String(value);
        }
      }
      capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
      }
      formatBox(params) {
        const {
          title,
          description,
          lines = [],
          width = 60,
          maxWidthPct = 0.9,
          color = _chalk2.default.yellow,
          pad = 1,
          borderChar = "\u2500",
          wrap = false
        } = params;
        const isProd = process.env.NODE_ENV === "production";
        const forceBoxes = process.env.ADK_FORCE_BOXES === "true";
        if (isProd && !forceBoxes) {
          return [`${title}: ${description}`, ...lines].join("\n");
        }
        const termWidth = process.stdout.columns || 80;
        const maxWidth = Math.floor(termWidth * maxWidthPct);
        const contentWidth = Math.max(
          width,
          title.length + 2,
          description.length,
          ...lines.map((l) => l.length)
        );
        const innerWidth = Math.min(contentWidth + pad * 2, maxWidth - 2);
        const horizontal = borderChar.repeat(innerWidth + 2);
        const top = `\u250C${horizontal}\u2510`;
        const separator = `\u251C${horizontal}\u2524`;
        const bottom = `\u2514${horizontal}\u2518`;
        const maxContent = innerWidth - pad * 2;
        const wrapText = (text) => {
          if (!wrap) {
            const truncated = text.length > maxContent ? `${text.slice(0, maxContent - 1)}\u2026` : text;
            const padded = " ".repeat(pad) + truncated;
            return [padded + " ".repeat(innerWidth - padded.length)];
          }
          const out = [];
          let remaining = text;
          while (remaining.length > 0) {
            if (remaining.length <= maxContent) {
              const padded2 = " ".repeat(pad) + remaining;
              out.push(padded2 + " ".repeat(innerWidth - padded2.length));
              break;
            }
            let sliceEnd = maxContent;
            const slice = remaining.slice(0, maxContent + 1);
            const lastSpace = slice.lastIndexOf(" ");
            if (lastSpace > -1 && lastSpace >= Math.floor(maxContent * 0.6)) {
              sliceEnd = lastSpace;
            }
            const chunk = remaining.slice(0, sliceEnd).trimEnd();
            const padded = " ".repeat(pad) + chunk;
            out.push(padded + " ".repeat(innerWidth - padded.length));
            remaining = remaining.slice(sliceEnd).trimStart();
          }
          return out;
        };
        const content = [top];
        for (const l of wrapText(title)) content.push(`\u2502 ${l} \u2502`);
        content.push(separator);
        for (const l of wrapText(description)) content.push(`\u2502 ${l} \u2502`);
        for (const line of lines)
          for (const l of wrapText(line)) content.push(`\u2502 ${l} \u2502`);
        content.push(bottom);
        return `
${content.map((line) => color(line)).join("\n")}`;
      }
      /**
       * Structured warning with code, suggestion, context.
       */
      warnStructured(warning, opts = {}) {
        const format = opts.format || process.env.ADK_WARN_FORMAT || "pretty";
        const verbose = opts.verbose || process.env.ADK_AGENT_BUILDER_WARN === "verbose";
        const timestamp = warning.timestamp || (/* @__PURE__ */ new Date()).toISOString();
        const severity = warning.severity || "warn";
        if (format === "json") {
          this.warn(
            JSON.stringify({
              level: severity,
              source: this.name,
              timestamp,
              ...warning
            })
          );
          return;
        }
        const { icon } = LOG_LEVELS[severity] || LOG_LEVELS.warn;
        const base = `${icon} ${warning.code} ${warning.message}`;
        const parts = [base];
        if (warning.suggestion) {
          parts.push(`   \u2022 Suggestion: ${warning.suggestion}`);
        }
        if (verbose && warning.context && Object.keys(warning.context).length) {
          const contextStr = Object.entries(warning.context).map(([k, v]) => `${k}=${this.stringify(v)}`).join("  ");
          parts.push(`   \u2022 Context: ${contextStr}`);
        }
        if (format === "pretty") {
          this.warn(parts.join("\n"));
        } else {
          const textParts = [`[${warning.code}] ${warning.message}`];
          if (warning.suggestion) textParts.push(`  -> ${warning.suggestion}`);
          if (verbose && warning.context && Object.keys(warning.context).length) {
            const contextStr = Object.entries(warning.context).map(([k, v]) => `${k}=${this.stringify(v)}`).join("  ");
            textParts.push(`   \u2022 Context: ${contextStr}`);
          }
          this.warn(textParts.join("\n"));
        }
      }
      debugStructured(title, data) {
        if (!this.isDebugEnabled) return;
        const time = (/* @__PURE__ */ new Date()).toLocaleTimeString();
        const lines = this.objectToLines(data);
        const box = this.formatBox({
          title: `\u{1F41B} Debug @ ${time} (${this.name})`,
          description: title,
          lines,
          color: _chalk2.default.blue
        });
        console.log(box);
      }
      debugArray(title, items) {
        if (!this.isDebugEnabled) return;
        const time = (/* @__PURE__ */ new Date()).toLocaleTimeString();
        const lines = this.arrayToLines(items);
        const box = this.formatBox({
          title: `\u{1F41B} Debug List @ ${time} (${this.name})`,
          description: title,
          lines,
          color: _chalk2.default.blue,
          width: 78,
          maxWidthPct: 0.95
        });
        console.log(box);
      }
      objectToLines(obj) {
        const entries = Object.entries(obj || {});
        if (!entries.length) return ["(empty)"];
        const keyWidth = Math.min(
          30,
          Math.max(6, ...entries.map(([k]) => k.length))
        );
        return entries.slice(0, 200).map(([k, v]) => {
          const value = this.stringify(v);
          const truncated = value.length > 140 ? `${value.slice(0, 139)}\u2026` : value;
          return `${k.padEnd(keyWidth)}: ${truncated}`;
        });
      }
      arrayToLines(items) {
        if (!items.length) return ["(empty list)"];
        const maxItems = 50;
        const lines = items.slice(0, maxItems).map((obj, i) => {
          const props = Object.entries(obj).map(([k, v]) => {
            const value = this.stringify(v);
            const truncated = value.length > 160 ? `${value.slice(0, 159)}\u2026` : value;
            return `${k}=${truncated}`;
          }).join("  \u2022  ");
          return `[${i + 1}] ${props}`;
        });
        if (items.length > maxItems) {
          lines.push(`\u2026 ${items.length - maxItems} more items omitted`);
        }
        return lines;
      }
    }, _class);
  }
});

// src/tools/base/base-tool.ts
var BaseTool;
var init_base_tool = __esm({
  "src/tools/base/base-tool.ts"() {
    init_logger();
    BaseTool = exports.BaseTool = (_class2 = class {
      /**
       * Name of the tool
       */
      
      /**
       * Description of the tool
       */
      
      /**
       * Whether the tool is a long running operation, which typically returns a
       * resource id first and finishes the operation later.
       */
      
      /**
       * Whether the tool execution should be retried on failure
       */
      
      /**
       * Maximum retry attempts
       */
      
      /**
       * Base delay for retry in ms (will be used with exponential backoff)
       */
      __init3() {this.baseRetryDelay = 1e3}
      /**
       * Maximum delay for retry in ms
       */
      __init4() {this.maxRetryDelay = 1e4}
      __init5() {this.logger = new Logger({ name: "BaseTool" })}
      /**
       * Constructor for BaseTool
       */
      constructor(config) {;_class2.prototype.__init3.call(this);_class2.prototype.__init4.call(this);_class2.prototype.__init5.call(this);
        this.name = config.name;
        this.description = config.description;
        this.isLongRunning = config.isLongRunning || false;
        this.shouldRetryOnFailure = config.shouldRetryOnFailure || false;
        this.maxRetryAttempts = config.maxRetryAttempts || 3;
        if (!/^[a-zA-Z0-9_]+$/.test(this.name)) {
          throw new Error(
            `Invalid tool name: "${this.name}". Tool names must contain only alphanumeric characters and underscores.`
          );
        }
        if (!this.description || this.description.length < 3) {
          throw new Error(
            `Tool description for "${this.name}" is too short. Provide a meaningful description.`
          );
        }
      }
      /**
       * Gets the OpenAPI specification of this tool in the form of a FunctionDeclaration
       *
       * NOTE:
       * - Required if subclass uses the default implementation of processLlmRequest
       *   to add function declaration to LLM request.
       * - Otherwise, can return null, e.g. for a built-in GoogleSearch tool.
       *
       * @returns The FunctionDeclaration of this tool, or null if it doesn't need to be
       *          added to LlmRequest.config.
       */
      getDeclaration() {
        return null;
      }
      /**
       * Validates the arguments against the schema in the function declaration
       * @param args Arguments to validate
       * @returns True if arguments are valid
       */
      validateArguments(args) {
        const declaration = this.getDeclaration();
        if (!declaration || !declaration.parameters) {
          return true;
        }
        const required = declaration.parameters.required || [];
        for (const param of required) {
          if (!(param in args)) {
            console.error(
              `Missing required parameter "${param}" for tool "${this.name}"`
            );
            return false;
          }
        }
        return true;
      }
      /**
       * Runs the tool with the given arguments and context
       *
       * NOTE:
       * - Required if this tool needs to run at the client side.
       * - Otherwise, can be skipped, e.g. for a built-in GoogleSearch tool.
       *
       * @param args The LLM-filled arguments
       * @param context The context of the tool
       * @returns The result of running the tool
       */
      async runAsync(args, context4) {
        throw new Error(`${this.constructor.name} runAsync is not implemented`);
      }
      /**
       * Processes the outgoing LLM request for this tool.
       *
       * Use cases:
       * - Most common use case is adding this tool to the LLM request.
       * - Some tools may just preprocess the LLM request before it's sent out.
       *
       * @param toolContext The context of the tool
       * @param llmRequest The outgoing LLM request, mutable by this method
       */
      async processLlmRequest(_toolContext, llmRequest) {
        const functionDeclaration = this.getDeclaration();
        if (!functionDeclaration) {
          return;
        }
        llmRequest.toolsDict[this.name] = this;
        const toolWithFunctionDeclarations = this.findToolWithFunctionDeclarations(llmRequest);
        if (toolWithFunctionDeclarations) {
          if (!toolWithFunctionDeclarations.functionDeclarations) {
            toolWithFunctionDeclarations.functionDeclarations = [];
          }
          const alreadyExists = toolWithFunctionDeclarations.functionDeclarations.some(
            (fd) => _optionalChain([fd, 'optionalAccess', _2 => _2.name]) === functionDeclaration.name
          );
          if (alreadyExists) {
            return;
          }
          toolWithFunctionDeclarations.functionDeclarations.push(
            functionDeclaration
          );
        } else {
          if (!llmRequest.config) {
            llmRequest.config = {};
          }
          if (!llmRequest.config.tools) {
            llmRequest.config.tools = [];
          }
          llmRequest.config.tools.push({
            functionDeclarations: [functionDeclaration]
          });
        }
      }
      /**
       * Gets the API variant for this tool
       */
      get apiVariant() {
        return "google";
      }
      /**
       * Executes the tool with error handling and retries
       *
       * @param args Arguments for the tool
       * @param context Tool execution context
       * @returns Result of the tool execution or error information
       */
      async safeExecute(args, context4) {
        if (!this.validateArguments(args)) {
          return {
            error: "Invalid arguments",
            message: "The provided arguments do not match the tool's requirements."
          };
        }
        let lastError = null;
        let attempts = 0;
        while (attempts <= (this.shouldRetryOnFailure ? this.maxRetryAttempts : 0)) {
          try {
            if (attempts > 0) {
              this.logger.debug(
                `Retrying tool ${this.name} (attempt ${attempts} of ${this.maxRetryAttempts})...`
              );
              const delay = Math.min(
                this.baseRetryDelay * 2 ** (attempts - 1) + Math.random() * 1e3,
                this.maxRetryDelay
              );
              await new Promise((resolve) => setTimeout(resolve, delay));
            }
            const result = await this.runAsync(args, context4);
            return { result };
          } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            console.error(`Error executing tool ${this.name}:`, lastError.message);
            attempts++;
          }
        }
        return {
          error: "Execution failed",
          message: _optionalChain([lastError, 'optionalAccess', _3 => _3.message]) || "Unknown error occurred",
          tool: this.name
        };
      }
      /**
       * Helper method to find a tool with function declarations in the LLM request
       */
      findToolWithFunctionDeclarations(llmRequest) {
        if (!llmRequest.config || !llmRequest.config.tools) {
          return null;
        }
        const toolWithFunctionDeclaration = llmRequest.config.tools.find(
          (tool) => "functionDeclarations" in tool && tool.functionDeclarations && tool.functionDeclarations.length > 0
        ) || null;
        return toolWithFunctionDeclaration;
      }
    }, _class2);
  }
});

// src/tools/function/function-utils.ts
var _genai = require('@google/genai');
function buildFunctionDeclaration(func, options = {}) {
  const funcStr = func.toString();
  const name = options.name || func.name;
  let description = options.description || "";
  if (!description) {
    const docMatch = funcStr.match(/\/\*\*([\s\S]*?)\*\//);
    if (docMatch) {
      description = docMatch[1].replace(/\n\s*\*/g, "\n").replace(/^\s+|\s+$/g, "").trim();
    }
  }
  const parameters = extractParametersSchema(func, options.ignoreParams || []);
  return {
    name,
    description,
    parameters
  };
}
function extractParametersSchema(func, ignoreParams = []) {
  const funcStr = func.toString();
  const paramMatch = funcStr.match(/\(([^)]*)\)/);
  if (!paramMatch) return { type: _genai.Type.OBJECT, properties: {} };
  const paramList = paramMatch[1].split(",").map((param) => param.trim()).filter((param) => param !== "");
  if (paramList.length === 0 || paramList.length === 1 && paramList[0] === "") {
    return { type: _genai.Type.OBJECT, properties: {} };
  }
  const jsDocParams = extractJSDocParams(funcStr);
  const jsDocTypes = extractJSDocTypes(funcStr);
  const properties = {};
  const required = [];
  for (const param of paramList) {
    let paramName = param;
    let isOptional = false;
    let paramType = "string";
    const paramParts = param.split(/\s*[:=]\s*/);
    if (paramParts.length > 0) {
      const nameMatch = paramParts[0].match(/^(\w+)(?:\s*:.*)?$/);
      if (nameMatch) {
        paramName = nameMatch[1];
      }
      isOptional = param.includes("=");
      if (jsDocTypes[paramName]) {
        paramType = jsDocTypes[paramName];
      } else if (param.includes(":")) {
        const typeMatch = param.match(/:\s*(\w+)/);
        if (typeMatch) {
          paramType = mapTypescriptTypeToJsonSchemaType(typeMatch[1]);
        }
      }
    }
    if (ignoreParams.includes(paramName)) {
      continue;
    }
    if (!isOptional) {
      required.push(paramName);
    }
    properties[paramName] = {
      type: paramType
    };
    if (jsDocParams[paramName]) {
      properties[paramName].description = jsDocParams[paramName];
    }
  }
  const schema = {
    type: _genai.Type.OBJECT,
    properties
  };
  if (required.length > 0) {
    schema.required = required;
  }
  return schema;
}
function mapTypescriptTypeToJsonSchemaType(tsType) {
  const lowerType = tsType.toLowerCase();
  switch (lowerType) {
    case "string":
      return "string";
    case "number":
    case "bigint":
      return "number";
    case "boolean":
    case "bool":
      return "boolean";
    case "array":
      return "array";
    case "object":
      return "object";
    case "null":
    case "undefined":
      return "null";
    // Default to string for unknown types
    default:
      return "string";
  }
}
function extractJSDocParams(funcStr) {
  const paramDocs = {};
  const paramRegex = /@param\s+(?:{[^}]+}\s+)?(\w+)\s+(.+?)(?=\n\s*@|\n\s*\*\/|$)/gs;
  let match;
  while (true) {
    match = paramRegex.exec(funcStr);
    if (!match) {
      break;
    }
    const paramName = match[1];
    const description = match[2].trim();
    paramDocs[paramName] = description;
  }
  return paramDocs;
}
function extractJSDocTypes(funcStr) {
  const typeDocs = {};
  const typeRegex = /@param\s+\{([^}]+)\}\s+(\w+)/gs;
  let match;
  while (true) {
    match = typeRegex.exec(funcStr);
    if (!match) {
      break;
    }
    const typeName = match[1].trim();
    const paramName = match[2];
    typeDocs[paramName] = mapTypescriptTypeToJsonSchemaType(typeName);
  }
  return typeDocs;
}
var init_function_utils = __esm({
  "src/tools/function/function-utils.ts"() {
  }
});

// src/tools/function/function-tool.ts
var function_tool_exports = {};
__export(function_tool_exports, {
  FunctionTool: () => FunctionTool
});
var FunctionTool;
var init_function_tool = __esm({
  "src/tools/function/function-tool.ts"() {
    init_base_tool();
    init_function_utils();
    FunctionTool = exports.FunctionTool = (_class3 = class extends BaseTool {
      
      __init6() {this.mandatoryArgs = []}
      __init7() {this.parameterTypes = {}}
      /**
       * Creates a new FunctionTool wrapping the provided function.
       *
       * @param func The function to wrap
       * @param options Optional configuration for the tool
       */
      constructor(func, options) {
        const name = _optionalChain([options, 'optionalAccess', _4 => _4.name]) || func.name;
        const description = _optionalChain([options, 'optionalAccess', _5 => _5.description]) || _optionalChain([(func.toString().match(/\/\*\*([\s\S]*?)\*\//) || []), 'access', _6 => _6[1], 'optionalAccess', _7 => _7.trim, 'call', _8 => _8()]) || "";
        super({
          name,
          description,
          isLongRunning: _optionalChain([options, 'optionalAccess', _9 => _9.isLongRunning]) || false,
          shouldRetryOnFailure: _optionalChain([options, 'optionalAccess', _10 => _10.shouldRetryOnFailure]) || false,
          maxRetryAttempts: _optionalChain([options, 'optionalAccess', _11 => _11.maxRetryAttempts]) || 3
        });_class3.prototype.__init6.call(this);_class3.prototype.__init7.call(this);;
        this.func = func;
        this.mandatoryArgs = this.getMandatoryArgs(func);
        this.parameterTypes = _optionalChain([options, 'optionalAccess', _12 => _12.parameterTypes]) || {};
      }
      /**
       * Executes the wrapped function with the provided arguments.
       */
      async runAsync(args, context4) {
        try {
          const missingArgs = this.getMissingMandatoryArgs(args);
          if (missingArgs.length > 0) {
            const missingArgsStr = missingArgs.join("\n");
            return {
              error: `Invoking \`${this.name}()\` failed as the following mandatory input parameters are not present:
${missingArgsStr}
You could retry calling this tool, but it is IMPORTANT for you to provide all the mandatory parameters.`
            };
          }
          const argsToCall = { ...args };
          if (this.functionAcceptsToolContext()) {
            argsToCall.toolContext = context4;
          }
          const funcParams = this.getFunctionParameters();
          const argValues = [];
          for (const paramName of funcParams) {
            if (paramName === "toolContext" && this.functionAcceptsToolContext()) {
              argValues.push(context4);
            } else if (paramName in argsToCall) {
              const convertedValue = this.convertArgumentType(
                argsToCall[paramName],
                paramName
              );
              argValues.push(convertedValue);
            } else {
              argValues.push(void 0);
            }
          }
          if (this.isAsyncFunction(this.func)) {
            return await this.func(...argValues) || {};
          }
          return this.func(...argValues) || {};
        } catch (error) {
          return {
            error: `Error executing function ${this.name}: ${error instanceof Error ? error.message : String(error)}`
          };
        }
      }
      /**
       * Returns the function declaration for this tool.
       */
      getDeclaration() {
        const declaration = buildFunctionDeclaration(this.func, {
          name: this.name,
          description: this.description,
          ignoreParams: ["toolContext"]
        });
        if (Object.keys(this.parameterTypes).length > 0 && _optionalChain([declaration, 'access', _13 => _13.parameters, 'optionalAccess', _14 => _14.properties])) {
          for (const [paramName, paramType] of Object.entries(
            this.parameterTypes
          )) {
            if (declaration.parameters.properties[paramName]) {
              declaration.parameters.properties[paramName].type = paramType;
            }
          }
        }
        return declaration;
      }
      /**
       * Checks if the wrapped function accepts a toolContext parameter.
       */
      functionAcceptsToolContext() {
        const funcStr = this.func.toString();
        return funcStr.includes("toolContext") || funcStr.includes("context");
      }
      /**
       * Checks if the wrapped function is async.
       */
      isAsyncFunction(func) {
        return func.constructor.name === "AsyncFunction";
      }
      /**
       * Extracts the mandatory arguments from a function.
       * In TypeScript, we can't easily inspect parameter defaults at runtime,
       * so this is a best-effort approach.
       */
      getMandatoryArgs(func) {
        const funcStr = func.toString();
        const paramMatch = funcStr.match(/\(([^)]*)\)/);
        if (!paramMatch) return [];
        const paramList = paramMatch[1].split(",");
        return paramList.map((param) => param.trim()).filter((param) => !param.includes("=") && param !== "").map((param) => {
          const nameMatch = param.match(/^(\w+)(?:\s*:[^=]+)?$/);
          return nameMatch ? nameMatch[1] : param;
        }).filter((param) => param !== "toolContext" && param !== "context");
      }
      /**
       * Checks which mandatory arguments are missing from the provided args.
       */
      getMissingMandatoryArgs(args) {
        return this.mandatoryArgs.filter((arg) => !(arg in args));
      }
      /**
       * Extracts the function parameters from the function's signature.
       */
      getFunctionParameters() {
        const funcStr = this.func.toString();
        const paramMatch = funcStr.match(/\(([^)]*)\)/);
        if (!paramMatch) return [];
        const paramList = paramMatch[1].split(",");
        return paramList.map((param) => param.trim()).filter((param) => param !== "").map((param) => {
          const nameMatch = param.match(/^(\w+)(?:\s*[:=].*)?$/);
          return nameMatch ? nameMatch[1] : param;
        });
      }
      /**
       * Converts an argument to the proper type based on the function signature.
       */
      convertArgumentType(value, paramName) {
        if (value === null || value === void 0) {
          return value;
        }
        const paramType = this.getParameterType(paramName);
        switch (paramType) {
          case "number":
            if (typeof value === "string" && !Number.isNaN(Number(value))) {
              return Number(value);
            }
            if (typeof value === "number") {
              return value;
            }
            break;
          case "boolean":
            if (typeof value === "string") {
              return value.toLowerCase() === "true";
            }
            if (typeof value === "boolean") {
              return value;
            }
            break;
          case "string":
            return String(value);
          default:
            return value;
        }
        return value;
      }
      /**
       * Extracts the type of a specific parameter from the function signature.
       */
      getParameterType(paramName) {
        if (this.parameterTypes[paramName]) {
          return this.parameterTypes[paramName].toLowerCase();
        }
        const declaration = this.getDeclaration();
        if (_optionalChain([declaration, 'optionalAccess', _15 => _15.parameters, 'optionalAccess', _16 => _16.properties])) {
          const paramSchema = declaration.parameters.properties[paramName];
          if (_optionalChain([paramSchema, 'optionalAccess', _17 => _17.type])) {
            return paramSchema.type.toLowerCase();
          }
        }
        return "string";
      }
    }, _class3);
  }
});

// src/agents/index.ts
var agents_exports = {};
__export(agents_exports, {
  Agent: () => LlmAgent,
  AgentBuilder: () => AgentBuilder,
  BaseAgent: () => BaseAgent,
  CallbackContext: () => CallbackContext,
  InvocationContext: () => InvocationContext,
  LangGraphAgent: () => LangGraphAgent,
  LlmAgent: () => LlmAgent,
  LlmCallsLimitExceededError: () => LlmCallsLimitExceededError,
  LoopAgent: () => LoopAgent,
  ParallelAgent: () => ParallelAgent,
  ReadonlyContext: () => ReadonlyContext,
  RunConfig: () => RunConfig,
  SequentialAgent: () => SequentialAgent,
  StreamingMode: () => StreamingMode,
  createBranchContextForSubAgent: () => createBranchContextForSubAgent,
  mergeAgentRun: () => mergeAgentRun,
  newInvocationContextId: () => newInvocationContextId
});

// src/models/index.ts
var models_exports = {};
__export(models_exports, {
  AiSdkLlm: () => AiSdkLlm,
  AnthropicLlm: () => AnthropicLlm,
  ApiKeyCredential: () => ApiKeyCredential,
  ApiKeyScheme: () => ApiKeyScheme,
  AuthConfig: () => AuthConfig,
  AuthCredential: () => AuthCredential,
  AuthCredentialType: () => AuthCredentialType,
  AuthHandler: () => AuthHandler,
  AuthScheme: () => AuthScheme,
  AuthSchemeType: () => AuthSchemeType,
  BaseLLMConnection: () => BaseLLMConnection,
  BaseLlm: () => BaseLlm,
  BasicAuthCredential: () => BasicAuthCredential,
  BearerTokenCredential: () => BearerTokenCredential,
  GoogleLlm: () => GoogleLlm,
  HttpScheme: () => HttpScheme,
  LLMRegistry: () => LLMRegistry,
  LlmRequest: () => LlmRequest,
  LlmResponse: () => LlmResponse,
  OAuth2Credential: () => OAuth2Credential,
  OAuth2Scheme: () => OAuth2Scheme,
  OpenAiLlm: () => OpenAiLlm,
  OpenIdConnectScheme: () => OpenIdConnectScheme,
  State: () => State,
  registerProviders: () => registerProviders
});

// src/models/llm-request.ts
var LlmRequest = class {
  /**
   * The model name.
   */
  
  /**
   * The contents to send to the model.
   */
  
  /**
   * Additional config for the generate content request.
   * Tools in generate_content_config should not be set.
   */
  
  /**
   * Live connect config for the request.
   */
  
  /**
   * The tools dictionary.
   */
  
  constructor(data) {
    this.model = _optionalChain([data, 'optionalAccess', _18 => _18.model]);
    this.contents = _nullishCoalesce(_optionalChain([data, 'optionalAccess', _19 => _19.contents]), () => ( []));
    this.config = _optionalChain([data, 'optionalAccess', _20 => _20.config]);
    this.liveConnectConfig = _nullishCoalesce(_optionalChain([data, 'optionalAccess', _21 => _21.liveConnectConfig]), () => ( {}));
    this.toolsDict = _nullishCoalesce(_optionalChain([data, 'optionalAccess', _22 => _22.toolsDict]), () => ( {}));
  }
  /**
   * Appends instructions to the system instruction.
   * @param instructions The instructions to append.
   */
  appendInstructions(instructions) {
    if (!this.config) this.config = {};
    if (this.config.systemInstruction) {
      this.config.systemInstruction += `

${instructions.join("\n\n")}`;
    } else {
      this.config.systemInstruction = instructions.join("\n\n");
    }
  }
  /**
   * Appends tools to the request.
   * @param tools The tools to append.
   */
  appendTools(tools) {
    if (!_optionalChain([tools, 'optionalAccess', _23 => _23.length])) return;
    const declarations = [];
    for (const tool of tools) {
      const declaration = _optionalChain([tool, 'access', _24 => _24.getDeclaration, 'optionalCall', _25 => _25()]);
      if (declaration) {
        declarations.push(declaration);
        this.toolsDict[tool.name] = tool;
      }
    }
    if (declarations.length) {
      if (!this.config) this.config = {};
      if (!this.config.tools) this.config.tools = [];
      this.config.tools.push({ functionDeclarations: declarations });
    }
  }
  /**
   * Sets the output schema for the request.
   * @param baseModel The base model to set as the output schema.
   */
  setOutputSchema(baseModel) {
    if (!this.config) this.config = {};
    this.config.responseSchema = baseModel;
    this.config.responseMimeType = "application/json";
  }
  /**
   * Extracts the system instruction as plain text from Content or string.
   * System instructions can be either string or Content type.
   * @returns The system instruction as a string, or undefined if not set.
   */
  getSystemInstructionText() {
    if (!_optionalChain([this, 'access', _26 => _26.config, 'optionalAccess', _27 => _27.systemInstruction])) {
      return void 0;
    }
    const systemInstruction = this.config.systemInstruction;
    if (typeof systemInstruction === "string") {
      return systemInstruction;
    }
    if (systemInstruction && typeof systemInstruction === "object" && "parts" in systemInstruction) {
      const content = systemInstruction;
      if (content.parts) {
        return content.parts.map((part) => part.text || "").filter(Boolean).join("");
      }
    }
    return String(systemInstruction || "");
  }
  /**
   * Extracts text content from a Content object.
   * Used for extracting text from message contents.
   * @param content The Content object to extract text from.
   * @returns The extracted text as a string.
   */
  static extractTextFromContent(content) {
    if (typeof content === "string") {
      return content;
    }
    if (Array.isArray(content)) {
      return content.map((part) => part.text || "").filter(Boolean).join("");
    }
    if (_optionalChain([content, 'optionalAccess', _28 => _28.parts])) {
      return content.parts.map((part) => part.text || "").filter(Boolean).join("");
    }
    return String(content || "");
  }
};

// src/models/llm-response.ts
var LlmResponse = class _LlmResponse {
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  constructor(data = {}) {
    Object.assign(this, data);
  }
  static create(generateContentResponse) {
    const usageMetadata = generateContentResponse.usageMetadata;
    if (generateContentResponse.candidates && generateContentResponse.candidates.length > 0) {
      const candidate = generateContentResponse.candidates[0];
      if (candidate.content && candidate.content.parts) {
        return new _LlmResponse({
          content: candidate.content,
          groundingMetadata: candidate.groundingMetadata,
          usageMetadata
        });
      }
      return new _LlmResponse({
        errorCode: candidate.finishReason,
        errorMessage: candidate.finishMessage,
        usageMetadata
      });
    }
    if (generateContentResponse.promptFeedback) {
      const promptFeedback = generateContentResponse.promptFeedback;
      return new _LlmResponse({
        errorCode: promptFeedback.blockReason,
        errorMessage: promptFeedback.blockReasonMessage,
        usageMetadata
      });
    }
    return new _LlmResponse({
      errorCode: "UNKNOWN_ERROR",
      errorMessage: "Unknown error.",
      usageMetadata
    });
  }
  static fromError(error, options = {}) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorCode = options.errorCode || "UNKNOWN_ERROR";
    return new _LlmResponse({
      errorCode,
      errorMessage: `LLM call failed for model ${options.model || "unknown"}: ${errorMessage}`,
      content: {
        role: "model",
        parts: [{ text: `Error: ${errorMessage}` }]
      },
      finishReason: "STOP",
      error: error instanceof Error ? error : new Error(errorMessage)
    });
  }
};

// src/models/base-llm.ts
init_logger();

// src/telemetry.ts






var _api = require('@opentelemetry/api');
var _autoinstrumentationsnode = require('@opentelemetry/auto-instrumentations-node');
var _exportertraceotlphttp = require('@opentelemetry/exporter-trace-otlp-http');
var _resources = require('@opentelemetry/resources');
var _sdknode = require('@opentelemetry/sdk-node');



var _semanticconventions = require('@opentelemetry/semantic-conventions');
var TelemetryService = (_class4 = class {
  __init8() {this.sdk = null}
  __init9() {this.isInitialized = false}
  
  __init10() {this.config = null}
  constructor() {;_class4.prototype.__init8.call(this);_class4.prototype.__init9.call(this);_class4.prototype.__init10.call(this);
    this.tracer = _api.trace.getTracer("iqai-adk", "0.1.0");
  }
  /**
   * Initialize telemetry with the provided configuration
   */
  initialize(config) {
    if (this.isInitialized) {
      _api.diag.warn("Telemetry is already initialized. Skipping.");
      return;
    }
    this.config = config;
    _api.diag.setLogger(new (0, _api.DiagConsoleLogger)(), _api.DiagLogLevel.INFO);
    const resource = _resources.resourceFromAttributes.call(void 0, {
      [_semanticconventions.ATTR_SERVICE_NAME]: config.appName,
      [_semanticconventions.ATTR_SERVICE_VERSION]: config.appVersion
    });
    const traceExporter = new (0, _exportertraceotlphttp.OTLPTraceExporter)({
      url: config.otlpEndpoint,
      headers: config.otlpHeaders
    });
    this.sdk = new (0, _sdknode.NodeSDK)({
      resource,
      traceExporter,
      instrumentations: [
        _autoinstrumentationsnode.getNodeAutoInstrumentations.call(void 0, {
          // Follow Python ADK approach: let all HTTP instrumentation through.
          // This provides transparency and aligns with standard OpenTelemetry behavior.
          // High-level LLM tracing is provided through dedicated ADK spans.
          "@opentelemetry/instrumentation-http": {
            ignoreIncomingRequestHook: (req) => {
              return true;
            }
          }
        })
      ]
    });
    try {
      this.sdk.start();
      this.isInitialized = true;
      this.tracer = _api.trace.getTracer("iqai-adk", config.appVersion || "0.1.0");
      _api.diag.debug("OpenTelemetry SDK started successfully.");
    } catch (error) {
      _api.diag.error("Error starting OpenTelemetry SDK:", error);
      throw error;
    }
  }
  /**
   * Get the tracer instance
   */
  getTracer() {
    return this.tracer;
  }
  /**
   * Check if telemetry is initialized
   */
  get initialized() {
    return this.isInitialized;
  }
  /**
   * Get the current configuration
   */
  getConfig() {
    return this.config;
  }
  /**
   * Shutdown telemetry with optional timeout
   */
  async shutdown(timeoutMs = 5e3) {
    if (!this.sdk || !this.isInitialized) {
      _api.diag.warn("Telemetry is not initialized or already shut down.");
      return;
    }
    try {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(
          () => reject(
            new Error(`Telemetry shutdown timeout after ${timeoutMs}ms`)
          ),
          timeoutMs
        );
      });
      await Promise.race([this.sdk.shutdown(), timeoutPromise]);
      this.isInitialized = false;
      _api.diag.debug("Telemetry terminated successfully.");
    } catch (error) {
      if (error instanceof Error && error.message.includes("timeout")) {
        _api.diag.warn("Telemetry shutdown timed out, some traces may be lost");
      } else {
        _api.diag.error("Error terminating telemetry:", error);
      }
      throw error;
    } finally {
      this.sdk = null;
    }
  }
  /**
   * Traces a tool call by adding detailed attributes to the current span.
   */
  traceToolCall(tool, args, functionResponseEvent, llmRequest, invocationContext) {
    const span = _api.trace.getActiveSpan();
    if (!span) return;
    let toolCallId = "<not specified>";
    let toolResponse = "<not specified>";
    if (_optionalChain([functionResponseEvent, 'access', _29 => _29.content, 'optionalAccess', _30 => _30.parts]) && functionResponseEvent.content.parts.length > 0) {
      const functionResponse = functionResponseEvent.content.parts[0].functionResponse;
      if (functionResponse) {
        toolCallId = functionResponse.id || "<not specified>";
        toolResponse = JSON.stringify(functionResponse.response) || "<not specified>";
      }
    }
    span.setAttributes({
      "gen_ai.system": "iqai-adk",
      "gen_ai.operation.name": "execute_tool",
      "gen_ai.tool.name": tool.name,
      "gen_ai.tool.description": tool.description,
      "gen_ai.tool.call.id": toolCallId,
      // Session and user tracking
      ...invocationContext && {
        "session.id": invocationContext.session.id,
        "user.id": invocationContext.userId
      },
      // Environment
      ...process.env.NODE_ENV && {
        "deployment.environment.name": process.env.NODE_ENV
      },
      // ADK-specific attributes (matching Python namespace pattern)
      "adk.tool_call_args": this._safeJsonStringify(args),
      "adk.event_id": functionResponseEvent.invocationId,
      "adk.tool_response": this._safeJsonStringify(toolResponse),
      "adk.llm_request": llmRequest ? this._safeJsonStringify(this._buildLlmRequestForTrace(llmRequest)) : "{}",
      "adk.llm_response": "{}"
    });
  }
  /**
   * Traces a call to the LLM by adding detailed attributes to the current span.
   */
  traceLlmCall(invocationContext, eventId, llmRequest, llmResponse) {
    const span = _api.trace.getActiveSpan();
    if (!span) return;
    const requestData = this._buildLlmRequestForTrace(llmRequest);
    span.setAttributes({
      // Standard OpenTelemetry attributes (following Python pattern)
      "gen_ai.system": "iqai-adk",
      "gen_ai.request.model": llmRequest.model,
      // Session and user tracking (maps to Langfuse sessionId, userId)
      "session.id": invocationContext.session.id,
      "user.id": invocationContext.userId,
      // Environment (maps to Langfuse environment)
      ...process.env.NODE_ENV && {
        "deployment.environment.name": process.env.NODE_ENV
      },
      // Model parameters (maps to Langfuse modelParameters)
      "gen_ai.request.max_tokens": llmRequest.config.maxOutputTokens || 0,
      "gen_ai.request.temperature": llmRequest.config.temperature || 0,
      "gen_ai.request.top_p": llmRequest.config.topP || 0,
      "adk.system_name": "iqai-adk",
      "adk.request_model": llmRequest.model,
      // ADK-specific attributes (matching Python namespace pattern)
      "adk.invocation_id": invocationContext.invocationId,
      "adk.session_id": invocationContext.session.id,
      "adk.event_id": eventId,
      "adk.llm_request": this._safeJsonStringify(requestData),
      "adk.llm_response": this._safeJsonStringify(llmResponse)
    });
    if (llmResponse.usageMetadata) {
      span.setAttributes({
        "gen_ai.usage.input_tokens": llmResponse.usageMetadata.promptTokenCount || 0,
        "gen_ai.usage.output_tokens": llmResponse.usageMetadata.candidatesTokenCount || 0
      });
    }
    span.addEvent("gen_ai.content.prompt", {
      "gen_ai.prompt": this._safeJsonStringify(requestData.messages)
    });
    span.addEvent("gen_ai.content.completion", {
      "gen_ai.completion": this._safeJsonStringify(llmResponse.content || "")
    });
  }
  /**
   * Wraps an async generator with tracing
   */
  async *traceAsyncGenerator(spanName, generator) {
    const span = this.tracer.startSpan(spanName);
    const spanContext = _api.trace.setSpan(_api.context.active(), span);
    try {
      while (true) {
        const result = await _api.context.with(spanContext, () => generator.next());
        if (result.done) {
          break;
        }
        yield result.value;
      }
    } catch (error) {
      span.recordException(error);
      span.setStatus({ code: 2, message: error.message });
      throw error;
    } finally {
      span.end();
    }
  }
  // --- Private Helper Methods ---
  _safeJsonStringify(obj) {
    try {
      return JSON.stringify(obj);
    } catch (e) {
      return "<not serializable>";
    }
  }
  /**
   * Builds a dictionary representation of the LLM request for tracing.
   *
   * This function prepares a dictionary representation of the LlmRequest
   * object, suitable for inclusion in a trace. It excludes fields that cannot
   * be serialized (e.g., function pointers) and avoids sending bytes data.
   */
  _buildLlmRequestForTrace(llmRequest) {
    const result = {
      model: llmRequest.model,
      config: this._excludeNonSerializableFromConfig(llmRequest.config),
      contents: []
    };
    for (const content of llmRequest.contents || []) {
      const parts = _optionalChain([content, 'access', _31 => _31.parts, 'optionalAccess', _32 => _32.filter, 'call', _33 => _33((part) => !part.inlineData)]) || [];
      result.contents.push({
        role: content.role,
        parts
      });
    }
    return result;
  }
  /**
   * Excludes non-serializable fields from config, similar to Python's exclude logic
   */
  _excludeNonSerializableFromConfig(config) {
    const result = {};
    for (const [key, value] of Object.entries(config)) {
      if (key === "response_schema") {
        continue;
      }
      if (value === void 0 || value === null) {
        continue;
      }
      if (key === "functions" && Array.isArray(value)) {
        result[key] = value.map((func) => ({
          name: func.name,
          description: func.description,
          parameters: func.parameters
          // Exclude actual function pointers
        }));
      } else {
        result[key] = value;
      }
    }
    return result;
  }
}, _class4);
var telemetryService = new TelemetryService();
var tracer = telemetryService.getTracer();
var initializeTelemetry = (config) => telemetryService.initialize(config);
var shutdownTelemetry = (timeoutMs) => telemetryService.shutdown(timeoutMs);
var traceToolCall = (tool, args, functionResponseEvent, llmRequest, invocationContext) => telemetryService.traceToolCall(
  tool,
  args,
  functionResponseEvent,
  llmRequest,
  invocationContext
);
var traceLlmCall = (invocationContext, eventId, llmRequest, llmResponse) => telemetryService.traceLlmCall(
  invocationContext,
  eventId,
  llmRequest,
  llmResponse
);

// src/models/base-llm.ts
var BaseLlm = (_class5 = class {
  /**
   * The name of the LLM, e.g. gemini-2.5-flash or gemini-2.5-flash-001.
   */
  
  __init11() {this.logger = new Logger({ name: "BaseLlm" })}
  /**
   * Constructor for BaseLlm
   */
  constructor(model) {;_class5.prototype.__init11.call(this);
    this.model = model;
  }
  /**
   * Returns a list of supported models in regex for LLMRegistry
   */
  static supportedModels() {
    return [];
  }
  /**
   * Generates one content from the given contents and tools.
   *
   * @param llmRequest LlmRequest, the request to send to the LLM.
   * @param stream bool = false, whether to do streaming call.
   * @returns a generator of LlmResponse.
   *
   * For non-streaming call, it will only yield one LlmResponse.
   *
   * For streaming call, it may yield more than one response, but all yielded
   * responses should be treated as one response by merging the
   * parts list.
   */
  async *generateContentAsync(llmRequest, stream) {
    this.maybeAppendUserContent(llmRequest);
    yield* tracer.startActiveSpan(
      `llm_generate [${this.model}]`,
      async function* (span) {
        try {
          span.setAttributes({
            "gen_ai.system.name": "iqai-adk",
            "gen_ai.operation.name": "generate",
            "gen_ai.request.model": this.model,
            "gen_ai.request.max_tokens": _optionalChain([llmRequest, 'access', _34 => _34.config, 'optionalAccess', _35 => _35.maxOutputTokens]) || 0,
            "gen_ai.request.temperature": _optionalChain([llmRequest, 'access', _36 => _36.config, 'optionalAccess', _37 => _37.temperature]) || 0,
            "gen_ai.request.top_p": _optionalChain([llmRequest, 'access', _38 => _38.config, 'optionalAccess', _39 => _39.topP]) || 0,
            "adk.llm_request": JSON.stringify({
              model: this.model,
              contents: _optionalChain([llmRequest, 'access', _40 => _40.contents, 'optionalAccess', _41 => _41.map, 'call', _42 => _42((content) => ({
                role: content.role,
                parts: _optionalChain([content, 'access', _43 => _43.parts, 'optionalAccess', _44 => _44.map, 'call', _45 => _45((part) => ({
                  text: typeof part.text === "string" ? part.text.substring(0, 200) + (part.text.length > 200 ? "..." : "") : "[non_text_content]"
                }))])
              }))]),
              config: llmRequest.config
            }),
            "adk.streaming": stream || false
          });
          let responseCount = 0;
          let totalTokens = 0;
          for await (const response of this.generateContentAsyncImpl(
            llmRequest,
            stream
          )) {
            responseCount++;
            if (response.usage) {
              totalTokens += response.usage.total_tokens || 0;
              span.setAttributes({
                "gen_ai.response.finish_reasons": [
                  response.finish_reason || "unknown"
                ],
                "gen_ai.usage.input_tokens": response.usage.prompt_tokens || 0,
                "gen_ai.usage.output_tokens": response.usage.completion_tokens || 0,
                "gen_ai.usage.total_tokens": response.usage.total_tokens || 0
              });
            }
            yield response;
          }
          span.setAttributes({
            "adk.response_count": responseCount,
            "adk.total_tokens": totalTokens
          });
        } catch (error) {
          span.recordException(error);
          span.setStatus({ code: 2, message: error.message });
          this.logger.error("\u274C ADK LLM Error:", {
            model: this.model,
            error: error.message
          });
          throw error;
        } finally {
          span.end();
        }
      }.bind(this)
    );
  }
  /**
   * Appends a user content, so that model can continue to output.
   *
   * @param llmRequest LlmRequest, the request to send to the LLM.
   */
  maybeAppendUserContent(llmRequest) {
    if (!llmRequest.contents || llmRequest.contents.length === 0) {
      llmRequest.contents = llmRequest.contents || [];
      llmRequest.contents.push({
        role: "user",
        parts: [
          {
            text: "Handle the requests as specified in the System Instruction."
          }
        ]
      });
      return;
    }
    if (llmRequest.contents[llmRequest.contents.length - 1].role !== "user") {
      llmRequest.contents.push({
        role: "user",
        parts: [
          {
            text: "Continue processing previous requests as instructed. Exit or provide a summary if no more outputs are needed."
          }
        ]
      });
    }
  }
  /**
   * Creates a live connection to the LLM.
   *
   * @param llmRequest LlmRequest, the request to send to the LLM.
   * @returns BaseLLMConnection, the connection to the LLM.
   */
  connect(_llmRequest) {
    throw new Error(`Live connection is not supported for ${this.model}.`);
  }
}, _class5);

// src/models/base-llm-connection.ts
var BaseLLMConnection = class {
};

// src/models/ai-sdk.ts
init_logger();




var _ai = require('ai');
var AiSdkLlm = (_class6 = class extends BaseLlm {
  
  __init12() {this.logger = new Logger({ name: "AiSdkLlm" })}
  /**
   * Constructor accepts a pre-configured LanguageModel instance
   * @param model - Pre-configured LanguageModel from provider(modelName)
   */
  constructor(modelInstance) {
    let modelId = "ai-sdk-model";
    if (typeof modelInstance !== "string") {
      modelId = modelInstance.modelId;
    }
    super(modelId);_class6.prototype.__init12.call(this);;
    this.modelInstance = modelInstance;
  }
  /**
   * Returns empty array - following Python ADK pattern
   */
  static supportedModels() {
    return [];
  }
  async *generateContentAsyncImpl(request, stream = false) {
    try {
      const messages = this.convertToAiSdkMessages(request);
      const systemMessage = request.getSystemInstructionText();
      const tools = this.convertToAiSdkTools(request);
      const requestParams = {
        model: this.modelInstance,
        messages,
        system: systemMessage,
        tools: Object.keys(tools).length > 0 ? tools : void 0,
        maxTokens: _optionalChain([request, 'access', _46 => _46.config, 'optionalAccess', _47 => _47.maxOutputTokens]),
        temperature: _optionalChain([request, 'access', _48 => _48.config, 'optionalAccess', _49 => _49.temperature]),
        topP: _optionalChain([request, 'access', _50 => _50.config, 'optionalAccess', _51 => _51.topP])
      };
      if (stream) {
        const result = _ai.streamText.call(void 0, requestParams);
        let accumulatedText = "";
        for await (const delta of result.textStream) {
          accumulatedText += delta;
          yield new LlmResponse({
            content: {
              role: "model",
              parts: [{ text: accumulatedText }]
            },
            partial: true
          });
        }
        const toolCalls = await result.toolCalls;
        const parts = [];
        if (accumulatedText) {
          parts.push({ text: accumulatedText });
        }
        if (toolCalls && toolCalls.length > 0) {
          for (const toolCall of toolCalls) {
            parts.push({
              functionCall: {
                id: toolCall.toolCallId,
                name: toolCall.toolName,
                args: toolCall.input
              }
            });
          }
        }
        const finalUsage = await result.usage;
        const finishReason = await result.finishReason;
        yield new LlmResponse({
          content: {
            role: "model",
            parts: parts.length > 0 ? parts : [{ text: "" }]
          },
          usageMetadata: finalUsage ? {
            promptTokenCount: finalUsage.inputTokens,
            candidatesTokenCount: finalUsage.outputTokens,
            totalTokenCount: finalUsage.totalTokens
          } : void 0,
          finishReason: this.mapFinishReason(finishReason),
          turnComplete: true
        });
      } else {
        const result = await _ai.generateText.call(void 0, requestParams);
        const parts = [];
        if (result.text) {
          parts.push({ text: result.text });
        }
        if (result.toolCalls && result.toolCalls.length > 0) {
          for (const toolCall of result.toolCalls) {
            parts.push({
              functionCall: {
                id: toolCall.toolCallId,
                name: toolCall.toolName,
                args: toolCall.input
              }
            });
          }
        }
        yield new LlmResponse({
          content: {
            role: "model",
            parts: parts.length > 0 ? parts : [{ text: "" }]
          },
          usageMetadata: result.usage ? {
            promptTokenCount: result.usage.inputTokens,
            candidatesTokenCount: result.usage.outputTokens,
            totalTokenCount: result.usage.totalTokens
          } : void 0,
          finishReason: this.mapFinishReason(result.finishReason),
          turnComplete: true
        });
      }
    } catch (error) {
      this.logger.error(`AI SDK Error: ${String(error)}`, { error, request });
      yield LlmResponse.fromError(error, {
        errorCode: "AI_SDK_ERROR",
        model: this.model
      });
    }
  }
  /**
   * Convert ADK LlmRequest to AI SDK CoreMessage format
   */
  convertToAiSdkMessages(llmRequest) {
    const messages = [];
    for (const content of llmRequest.contents || []) {
      const message = this.contentToAiSdkMessage(content);
      if (message) {
        messages.push(message);
      }
    }
    return messages;
  }
  /**
   * Transform JSON schema to use lowercase types for AI SDK compatibility
   */
  transformSchemaForAiSdk(schema) {
    if (Array.isArray(schema)) {
      return schema.map((item) => this.transformSchemaForAiSdk(item));
    }
    if (!schema || typeof schema !== "object") {
      return schema;
    }
    const transformedSchema = { ...schema };
    if (transformedSchema.type && typeof transformedSchema.type === "string") {
      transformedSchema.type = transformedSchema.type.toLowerCase();
    }
    if (transformedSchema.properties) {
      transformedSchema.properties = Object.fromEntries(
        Object.entries(transformedSchema.properties).map(([key, value]) => [
          key,
          this.transformSchemaForAiSdk(value)
        ])
      );
    }
    if (transformedSchema.items) {
      transformedSchema.items = this.transformSchemaForAiSdk(
        transformedSchema.items
      );
    }
    const arrayKeywords = ["anyOf", "oneOf", "allOf"];
    for (const keyword of arrayKeywords) {
      if (transformedSchema[keyword]) {
        transformedSchema[keyword] = this.transformSchemaForAiSdk(
          transformedSchema[keyword]
        );
      }
    }
    return transformedSchema;
  }
  /**
   * Convert ADK tools to AI SDK tools format
   */
  convertToAiSdkTools(llmRequest) {
    const tools = {};
    if (_optionalChain([llmRequest, 'access', _52 => _52.config, 'optionalAccess', _53 => _53.tools])) {
      for (const toolConfig of llmRequest.config.tools) {
        if ("functionDeclarations" in toolConfig) {
          for (const funcDecl of toolConfig.functionDeclarations) {
            tools[funcDecl.name] = {
              description: funcDecl.description,
              inputSchema: _ai.jsonSchema.call(void 0, 
                this.transformSchemaForAiSdk(funcDecl.parameters || {})
              )
            };
          }
        }
      }
    }
    return tools;
  }
  /**
   * Convert ADK Content to AI SDK CoreMessage
   */
  contentToAiSdkMessage(content) {
    const role = this.mapRole(content.role);
    if (!content.parts || content.parts.length === 0) {
      return null;
    }
    if (content.parts.length === 1 && content.parts[0].text) {
      const textContent = content.parts[0].text;
      if (role === "system") {
        return { role: "system", content: textContent };
      }
      if (role === "assistant") {
        return { role: "assistant", content: textContent };
      }
      return { role: "user", content: textContent };
    }
    if (_optionalChain([content, 'access', _54 => _54.parts, 'optionalAccess', _55 => _55.some, 'call', _56 => _56((part) => part.functionCall)])) {
      const textParts = content.parts.filter((part) => part.text);
      const functionCalls = content.parts.filter((part) => part.functionCall);
      const contentParts2 = [];
      for (const textPart of textParts) {
        if (textPart.text) {
          contentParts2.push({
            type: "text",
            text: textPart.text
          });
        }
      }
      for (const funcPart of functionCalls) {
        if (funcPart.functionCall) {
          contentParts2.push({
            type: "tool-call",
            toolCallId: funcPart.functionCall.id,
            toolName: funcPart.functionCall.name,
            input: funcPart.functionCall.args
          });
        }
      }
      return {
        role: "assistant",
        content: contentParts2
      };
    }
    if (_optionalChain([content, 'access', _57 => _57.parts, 'optionalAccess', _58 => _58.some, 'call', _59 => _59((part) => part.functionResponse)])) {
      const functionResponses = content.parts.filter(
        (part) => part.functionResponse
      );
      const contentParts2 = functionResponses.map((part) => {
        let output;
        const response = part.functionResponse.response;
        if (response === void 0 || response === null) {
          output = { type: "json", value: null };
        } else if (typeof response === "string") {
          output = { type: "text", value: response };
        } else {
          output = { type: "json", value: response };
        }
        return {
          type: "tool-result",
          toolCallId: part.functionResponse.id,
          toolName: part.functionResponse.name || "unknown",
          output
        };
      });
      return {
        role: "tool",
        content: contentParts2
      };
    }
    const contentParts = [];
    for (const part of content.parts) {
      if (part.text) {
        contentParts.push({
          type: "text",
          text: part.text
        });
      }
    }
    if (contentParts.length === 0) {
      return null;
    }
    if (contentParts.length === 1) {
      const textContent = contentParts[0].text;
      if (role === "system") {
        return { role: "system", content: textContent };
      }
      if (role === "assistant") {
        return { role: "assistant", content: textContent };
      }
      return { role: "user", content: textContent };
    }
    if (role === "system") {
      const combinedText = contentParts.map((p) => p.text).join("");
      return { role: "system", content: combinedText };
    }
    if (role === "assistant") {
      return { role: "assistant", content: contentParts };
    }
    return { role: "user", content: contentParts };
  }
  /**
   * Map ADK role to AI SDK role
   */
  mapRole(role) {
    switch (role) {
      case "model":
      case "assistant":
        return "assistant";
      case "system":
        return "system";
      default:
        return "user";
    }
  }
  /**
   * Map AI SDK finish reason to ADK finish reason
   */
  mapFinishReason(finishReason) {
    switch (finishReason) {
      case "stop":
      case "end_of_message":
        return "STOP";
      case "length":
      case "max_tokens":
        return "MAX_TOKENS";
      default:
        return "FINISH_REASON_UNSPECIFIED";
    }
  }
}, _class6);

// src/models/anthropic-llm.ts
init_logger();
var _sdk = require('@anthropic-ai/sdk'); var _sdk2 = _interopRequireDefault(_sdk);
var MAX_TOKENS = 1024;
var AnthropicLlm = (_class7 = class extends BaseLlm {
  
  __init13() {this.logger = new Logger({ name: "AnthropicLlm" })}
  /**
   * Constructor for Anthropic LLM
   */
  constructor(model = "claude-3-5-sonnet-20241022") {
    super(model);_class7.prototype.__init13.call(this);;
  }
  /**
   * Provides the list of supported models
   */
  static supportedModels() {
    return ["claude-3-.*", "claude-.*-4.*"];
  }
  /**
   * Main content generation method - handles both streaming and non-streaming
   */
  async *generateContentAsyncImpl(llmRequest, stream = false) {
    const model = llmRequest.model || this.model;
    const messages = (llmRequest.contents || []).map(
      (content) => this.contentToAnthropicMessage(content)
    );
    let tools;
    if (_optionalChain([llmRequest, 'access', _60 => _60.config, 'optionalAccess', _61 => _61.tools, 'optionalAccess', _62 => _62[0], 'optionalAccess', _63 => _63.functionDeclarations])) {
      tools = llmRequest.config.tools[0].functionDeclarations.map(
        (decl) => this.functionDeclarationToAnthropicTool(decl)
      );
    }
    const systemInstruction = llmRequest.getSystemInstructionText();
    if (stream) {
      throw new Error("Streaming is not yet supported for Anthropic models");
    }
    const anthropicMessages = messages.map((msg) => {
      const content = Array.isArray(msg.content) ? msg.content.map((block) => this.partToAnthropicBlock(block)) : msg.content;
      return {
        role: msg.role,
        content
      };
    });
    const message = await this.client.messages.create({
      model,
      system: systemInstruction,
      messages: anthropicMessages,
      tools,
      tool_choice: tools ? { type: "auto" } : void 0,
      max_tokens: _optionalChain([llmRequest, 'access', _64 => _64.config, 'optionalAccess', _65 => _65.maxOutputTokens]) || MAX_TOKENS,
      temperature: _optionalChain([llmRequest, 'access', _66 => _66.config, 'optionalAccess', _67 => _67.temperature]),
      top_p: _optionalChain([llmRequest, 'access', _68 => _68.config, 'optionalAccess', _69 => _69.topP])
    });
    yield this.anthropicMessageToLlmResponse(message);
  }
  /**
   * Live connection is not supported for Anthropic models
   */
  connect(_llmRequest) {
    throw new Error(`Live connection is not supported for ${this.model}.`);
  }
  /**
   * Convert Anthropic Message to ADK LlmResponse
   */
  anthropicMessageToLlmResponse(message) {
    this.logger.debug(
      `Anthropic response: ${message.usage.output_tokens} tokens, ${message.stop_reason}`
    );
    return new LlmResponse({
      content: {
        role: "model",
        parts: message.content.map((block) => this.anthropicBlockToPart(block))
      },
      usageMetadata: {
        promptTokenCount: message.usage.input_tokens,
        candidatesTokenCount: message.usage.output_tokens,
        totalTokenCount: message.usage.input_tokens + message.usage.output_tokens
      },
      finishReason: this.toAdkFinishReason(message.stop_reason)
    });
  }
  /**
   * Convert ADK Content to Anthropic MessageParam
   */
  contentToAnthropicMessage(content) {
    return {
      role: this.toAnthropicRole(content.role),
      content: (content.parts || []).map(
        (part) => this.partToAnthropicBlock(part)
      )
    };
  }
  /**
   * Convert ADK Part to Anthropic content block
   */
  partToAnthropicBlock(part) {
    if (part.text) {
      return {
        type: "text",
        text: part.text
      };
    }
    if (part.function_call) {
      return {
        type: "tool_use",
        id: part.function_call.id || "",
        name: part.function_call.name,
        input: part.function_call.args || {}
      };
    }
    if (part.function_response) {
      let content = "";
      if (_optionalChain([part, 'access', _70 => _70.function_response, 'access', _71 => _71.response, 'optionalAccess', _72 => _72.result])) {
        content = String(part.function_response.response.result);
      }
      return {
        type: "tool_result",
        tool_use_id: part.function_response.id || "",
        content,
        is_error: false
      };
    }
    throw new Error("Unsupported part type for Anthropic conversion");
  }
  /**
   * Convert Anthropic content block to ADK Part
   */
  anthropicBlockToPart(block) {
    if (block.type === "text") {
      return { text: block.text };
    }
    if (block.type === "tool_use") {
      return {
        function_call: {
          id: block.id,
          name: block.name,
          args: block.input
        }
      };
    }
    throw new Error("Unsupported Anthropic content block type");
  }
  /**
   * Convert ADK function declaration to Anthropic tool param
   */
  functionDeclarationToAnthropicTool(functionDeclaration) {
    const properties = {};
    if (_optionalChain([functionDeclaration, 'access', _73 => _73.parameters, 'optionalAccess', _74 => _74.properties])) {
      for (const [key, value] of Object.entries(
        functionDeclaration.parameters.properties
      )) {
        const valueDict = { ...value };
        this.updateTypeString(valueDict);
        properties[key] = valueDict;
      }
    }
    return {
      name: functionDeclaration.name,
      description: functionDeclaration.description || "",
      input_schema: {
        type: "object",
        properties
      }
    };
  }
  /**
   * Convert ADK role to Anthropic role format
   */
  toAnthropicRole(role) {
    if (role === "model" || role === "assistant") {
      return "assistant";
    }
    return "user";
  }
  /**
   * Convert Anthropic stop reason to ADK finish reason
   */
  toAdkFinishReason(anthropicStopReason) {
    if (["end_turn", "stop_sequence", "tool_use"].includes(
      anthropicStopReason || ""
    )) {
      return "STOP";
    }
    if (anthropicStopReason === "max_tokens") {
      return "MAX_TOKENS";
    }
    return "FINISH_REASON_UNSPECIFIED";
  }
  /**
   * Update type strings in schema to lowercase for Anthropic compatibility
   */
  updateTypeString(valueDict) {
    if ("type" in valueDict) {
      valueDict.type = valueDict.type.toLowerCase();
    }
    if ("items" in valueDict) {
      this.updateTypeString(valueDict.items);
      if ("properties" in valueDict.items) {
        for (const value of Object.values(valueDict.items.properties)) {
          this.updateTypeString(value);
        }
      }
    }
  }
  /**
   * Gets the Anthropic client
   */
  get client() {
    if (!this._client) {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        throw new Error(
          "ANTHROPIC_API_KEY environment variable is required for Anthropic models"
        );
      }
      this._client = new (0, _sdk2.default)({
        apiKey
      });
    }
    return this._client;
  }
}, _class7);

// src/models/google-llm.ts




var AGENT_ENGINE_TELEMETRY_TAG = "remote_reasoning_engine";
var AGENT_ENGINE_TELEMETRY_ENV_VARIABLE_NAME = "GOOGLE_CLOUD_AGENT_ENGINE_ID";
var GoogleLlm = class extends BaseLlm {
  
  
  
  
  /**
   * Constructor for Gemini
   */
  constructor(model = "gemini-2.5-flash") {
    super(model);
  }
  /**
   * Provides the list of supported models.
   */
  static supportedModels() {
    return [
      "gemini-.*",
      // fine-tuned vertex endpoint pattern
      "projects/.+/locations/.+/endpoints/.+",
      // vertex gemini long name
      "projects/.+/locations/.+/publishers/google/models/gemini.+"
    ];
  }
  /**
   * Main content generation method - handles both streaming and non-streaming
   */
  async *generateContentAsyncImpl(llmRequest, stream = false) {
    this.preprocessRequest(llmRequest);
    const model = llmRequest.model || this.model;
    const contents = this.convertContents(llmRequest.contents || []);
    const config = llmRequest.config;
    if (stream) {
      const responses = await this.apiClient.models.generateContentStream({
        model,
        contents,
        config
      });
      let response = null;
      let thoughtText = "";
      let text = "";
      let usageMetadata = null;
      for await (const resp of responses) {
        response = resp;
        const llmResponse = LlmResponse.create(resp);
        usageMetadata = llmResponse.usageMetadata;
        if (_optionalChain([llmResponse, 'access', _75 => _75.content, 'optionalAccess', _76 => _76.parts, 'optionalAccess', _77 => _77[0], 'optionalAccess', _78 => _78.text])) {
          const part0 = llmResponse.content.parts[0];
          if (part0.thought) {
            thoughtText += part0.text;
          } else {
            text += part0.text;
          }
          llmResponse.partial = true;
        } else if ((thoughtText || text) && (!llmResponse.content || !llmResponse.content.parts || !this.hasInlineData(resp))) {
          const parts = [];
          if (thoughtText) {
            parts.push({ text: thoughtText, thought: true });
          }
          if (text) {
            parts.push({ text });
          }
          yield new LlmResponse({
            content: {
              parts,
              role: "model"
            },
            usageMetadata
          });
          thoughtText = "";
          text = "";
        }
        yield llmResponse;
      }
      if ((text || thoughtText) && response && response.candidates && _optionalChain([response, 'access', _79 => _79.candidates, 'access', _80 => _80[0], 'optionalAccess', _81 => _81.finishReason]) === _genai.FinishReason.STOP) {
        const parts = [];
        if (thoughtText) {
          parts.push({ text: thoughtText, thought: true });
        }
        if (text) {
          parts.push({ text });
        }
        yield new LlmResponse({
          content: {
            parts,
            role: "model"
          },
          usageMetadata
        });
      }
    } else {
      const response = await this.apiClient.models.generateContent({
        model,
        contents,
        config
      });
      const llmResponse = LlmResponse.create(response);
      this.logger.debug(
        `Google response: ${_optionalChain([llmResponse, 'access', _82 => _82.usageMetadata, 'optionalAccess', _83 => _83.candidatesTokenCount]) || 0} tokens`
      );
      yield llmResponse;
    }
  }
  /**
   * Connects to the Gemini model and returns an llm connection.
   */
  connect(_llmRequest) {
    throw new Error(`Live connection is not supported for ${this.model}.`);
  }
  /**
   * Check if response has inline data
   */
  hasInlineData(response) {
    const parts = _optionalChain([response, 'access', _84 => _84.candidates, 'optionalAccess', _85 => _85[0], 'optionalAccess', _86 => _86.content, 'optionalAccess', _87 => _87.parts]);
    return _optionalChain([parts, 'optionalAccess', _88 => _88.some, 'call', _89 => _89((part) => _optionalChain([part, 'optionalAccess', _90 => _90.inlineData]))]) || false;
  }
  /**
   * Convert LlmRequest contents to GoogleGenAI format
   */
  convertContents(contents) {
    return contents.map((content) => ({
      role: content.role === "assistant" ? "model" : content.role,
      parts: content.parts || [{ text: content.content || "" }]
    }));
  }
  /**
   * Preprocesses the request based on the API backend.
   */
  preprocessRequest(llmRequest) {
    if (this.apiBackend === "GEMINI_API" /* GEMINI_API */) {
      if (llmRequest.config) {
        llmRequest.config.labels = void 0;
      }
      if (llmRequest.contents) {
        for (const content of llmRequest.contents) {
          if (!content.parts) continue;
          for (const part of content.parts) {
            this.removeDisplayNameIfPresent(part.inlineData);
            this.removeDisplayNameIfPresent(part.fileData);
          }
        }
      }
    }
  }
  /**
   * Sets display_name to null for the Gemini API (non-Vertex) backend.
   */
  removeDisplayNameIfPresent(dataObj) {
    if (_optionalChain([dataObj, 'optionalAccess', _91 => _91.displayName])) {
      dataObj.displayName = null;
    }
  }
  /**
   * Provides the api client.
   */
  get apiClient() {
    if (!this._apiClient) {
      const useVertexAI = process.env.GOOGLE_GENAI_USE_VERTEXAI === "true";
      const apiKey = process.env.GOOGLE_API_KEY;
      const project = process.env.GOOGLE_CLOUD_PROJECT;
      const location = process.env.GOOGLE_CLOUD_LOCATION;
      if (useVertexAI && project && location) {
        this._apiClient = new (0, _genai.GoogleGenAI)({
          vertexai: true,
          project,
          location
        });
      } else if (apiKey) {
        this._apiClient = new (0, _genai.GoogleGenAI)({
          apiKey
        });
      } else {
        throw new Error(
          "Google API Key or Vertex AI configuration is required. Set GOOGLE_API_KEY or GOOGLE_GENAI_USE_VERTEXAI=true with GOOGLE_CLOUD_PROJECT and GOOGLE_CLOUD_LOCATION."
        );
      }
    }
    return this._apiClient;
  }
  /**
   * Gets the API backend type.
   */
  get apiBackend() {
    if (!this._apiBackend) {
      const useVertexAI = process.env.GOOGLE_GENAI_USE_VERTEXAI === "true";
      this._apiBackend = useVertexAI ? "VERTEX_AI" /* VERTEX_AI */ : "GEMINI_API" /* GEMINI_API */;
    }
    return this._apiBackend;
  }
  /**
   * Gets the tracking headers.
   */
  get trackingHeaders() {
    if (!this._trackingHeaders) {
      let frameworkLabel = "google-adk/1.0.0";
      if (process.env[AGENT_ENGINE_TELEMETRY_ENV_VARIABLE_NAME]) {
        frameworkLabel = `${frameworkLabel}+${AGENT_ENGINE_TELEMETRY_TAG}`;
      }
      const languageLabel = `gl-node/${process.version}`;
      const versionHeaderValue = `${frameworkLabel} ${languageLabel}`;
      this._trackingHeaders = {
        "x-goog-api-client": versionHeaderValue,
        "user-agent": versionHeaderValue
      };
    }
    return this._trackingHeaders;
  }
  /**
   * Gets the live API version.
   */
  get liveApiVersion() {
    return this.apiBackend === "VERTEX_AI" /* VERTEX_AI */ ? "v1beta1" : "v1alpha";
  }
  /**
   * Gets the live API client.
   */
  get liveApiClient() {
    if (!this._liveApiClient) {
      const useVertexAI = process.env.GOOGLE_GENAI_USE_VERTEXAI === "true";
      const apiKey = process.env.GOOGLE_API_KEY;
      const project = process.env.GOOGLE_CLOUD_PROJECT;
      const location = process.env.GOOGLE_CLOUD_LOCATION;
      if (useVertexAI && project && location) {
        this._liveApiClient = new (0, _genai.GoogleGenAI)({
          vertexai: true,
          project,
          location,
          apiVersion: this.liveApiVersion
        });
      } else if (apiKey) {
        this._liveApiClient = new (0, _genai.GoogleGenAI)({
          apiKey,
          apiVersion: this.liveApiVersion
        });
      } else {
        throw new Error("API configuration required for live client");
      }
    }
    return this._liveApiClient;
  }
};

// src/models/openai-llm.ts
var _openai = require('openai'); var _openai2 = _interopRequireDefault(_openai);
var OpenAiLlm = class extends BaseLlm {
  
  
  /**
   * Constructor for OpenAI LLM
   */
  constructor(model = "gpt-4o-mini", config) {
    super(model);
    this._config = config;
  }
  /**
   * Provides the list of supported models
   */
  static supportedModels() {
    return ["gpt-3.5-.*", "gpt-4.*", "gpt-4o.*", "gpt-5.*", "o1-.*", "o3-.*"];
  }
  /**
   * Main content generation method - handles both streaming and non-streaming
   */
  async *generateContentAsyncImpl(llmRequest, stream = false) {
    this.preprocessRequest(llmRequest);
    const model = llmRequest.model || this.model;
    const messages = (llmRequest.contents || []).map(
      (content) => this.contentToOpenAiMessage(content)
    );
    let tools;
    if (_optionalChain([llmRequest, 'access', _92 => _92.config, 'optionalAccess', _93 => _93.tools, 'optionalAccess', _94 => _94[0], 'optionalAccess', _95 => _95.functionDeclarations])) {
      tools = llmRequest.config.tools[0].functionDeclarations.map(
        (funcDecl) => this.functionDeclarationToOpenAiTool(funcDecl)
      );
    }
    const systemContent = llmRequest.getSystemInstructionText();
    if (systemContent) {
      messages.unshift({
        role: "system",
        content: systemContent
      });
    }
    const openAiMessages = messages;
    const requestParams = {
      model,
      messages: openAiMessages,
      tools,
      tool_choice: tools ? "auto" : void 0,
      max_tokens: _optionalChain([llmRequest, 'access', _96 => _96.config, 'optionalAccess', _97 => _97.maxOutputTokens]),
      temperature: _optionalChain([llmRequest, 'access', _98 => _98.config, 'optionalAccess', _99 => _99.temperature]),
      top_p: _optionalChain([llmRequest, 'access', _100 => _100.config, 'optionalAccess', _101 => _101.topP]),
      stream
    };
    if (stream) {
      const streamResponse = await this.client.chat.completions.create({
        ...requestParams,
        stream: true
      });
      let thoughtText = "";
      let text = "";
      let usageMetadata;
      const accumulatedToolCalls = [];
      for await (const chunk of streamResponse) {
        const choice = chunk.choices[0];
        if (!choice) continue;
        const delta = choice.delta;
        const llmResponse = this.createChunkResponse(delta, chunk.usage);
        if (chunk.usage) {
          usageMetadata = chunk.usage;
        }
        if (_optionalChain([llmResponse, 'access', _102 => _102.content, 'optionalAccess', _103 => _103.parts, 'optionalAccess', _104 => _104[0], 'optionalAccess', _105 => _105.text])) {
          const part0 = llmResponse.content.parts[0];
          if (part0.thought) {
            thoughtText += part0.text;
          } else {
            text += part0.text;
          }
          llmResponse.partial = true;
        } else if ((thoughtText || text) && (!llmResponse.content || !llmResponse.content.parts || !this.hasInlineData(llmResponse))) {
          const parts = [];
          if (thoughtText) {
            parts.push({ text: thoughtText, thought: true });
          }
          if (text) {
            parts.push({ text });
          }
          yield new LlmResponse({
            content: {
              parts,
              role: "model"
            },
            usageMetadata: usageMetadata ? {
              promptTokenCount: usageMetadata.prompt_tokens,
              candidatesTokenCount: usageMetadata.completion_tokens,
              totalTokenCount: usageMetadata.total_tokens
            } : void 0
          });
          thoughtText = "";
          text = "";
        }
        if (delta.tool_calls) {
          for (const toolCall of delta.tool_calls) {
            const index = toolCall.index || 0;
            if (!accumulatedToolCalls[index]) {
              accumulatedToolCalls[index] = {
                index,
                id: toolCall.id || "",
                type: "function",
                function: { name: "", arguments: "" }
              };
            }
            if (_optionalChain([toolCall, 'access', _106 => _106.function, 'optionalAccess', _107 => _107.name])) {
              accumulatedToolCalls[index].function.name += toolCall.function.name;
            }
            if (_optionalChain([toolCall, 'access', _108 => _108.function, 'optionalAccess', _109 => _109.arguments])) {
              accumulatedToolCalls[index].function.arguments += toolCall.function.arguments;
            }
          }
        }
        if (choice.finish_reason) {
          const parts = [];
          if (thoughtText) {
            parts.push({ text: thoughtText, thought: true });
          }
          if (text) {
            parts.push({ text });
          }
          if (accumulatedToolCalls.length > 0) {
            for (const toolCall of accumulatedToolCalls) {
              if (_optionalChain([toolCall, 'access', _110 => _110.function, 'optionalAccess', _111 => _111.name])) {
                parts.push({
                  functionCall: {
                    id: toolCall.id,
                    name: toolCall.function.name,
                    args: JSON.parse(toolCall.function.arguments || "{}")
                  }
                });
              }
            }
          }
          const finalResponse = new LlmResponse({
            content: {
              role: "model",
              parts
            },
            usageMetadata: usageMetadata ? {
              promptTokenCount: usageMetadata.prompt_tokens,
              candidatesTokenCount: usageMetadata.completion_tokens,
              totalTokenCount: usageMetadata.total_tokens
            } : void 0,
            finishReason: this.toAdkFinishReason(choice.finish_reason)
          });
          yield finalResponse;
        } else {
          yield llmResponse;
        }
      }
      if ((text || thoughtText) && usageMetadata) {
        const parts = [];
        if (thoughtText) {
          parts.push({ text: thoughtText, thought: true });
        }
        if (text) {
          parts.push({ text });
        }
        yield new LlmResponse({
          content: {
            parts,
            role: "model"
          },
          usageMetadata: {
            promptTokenCount: usageMetadata.prompt_tokens,
            candidatesTokenCount: usageMetadata.completion_tokens,
            totalTokenCount: usageMetadata.total_tokens
          }
        });
      }
    } else {
      const response = await this.client.chat.completions.create({
        ...requestParams,
        stream: false
      });
      const choice = response.choices[0];
      if (choice) {
        const llmResponse = this.openAiMessageToLlmResponse(
          choice,
          response.usage
        );
        this.logger.debug(
          `OpenAI response: ${_optionalChain([response, 'access', _112 => _112.usage, 'optionalAccess', _113 => _113.completion_tokens]) || 0} tokens`
        );
        yield llmResponse;
      }
    }
  }
  /**
   * Live connection is not supported for OpenAI models
   */
  connect(_llmRequest) {
    throw new Error(`Live connection is not supported for ${this.model}.`);
  }
  /**
   * Create LlmResponse from streaming chunk - similar to Google's LlmResponse.create
   */
  createChunkResponse(delta, usage) {
    const parts = [];
    if (delta.content) {
      const contentType = this.getContentType(delta.content);
      if (contentType === "thought") {
        parts.push({ text: delta.content, thought: true });
      } else {
        parts.push({ text: delta.content });
      }
    }
    if (delta.tool_calls) {
      for (const toolCall of delta.tool_calls) {
        if (toolCall.type === "function" && _optionalChain([toolCall, 'access', _114 => _114.function, 'optionalAccess', _115 => _115.name])) {
          parts.push({
            functionCall: {
              id: toolCall.id || "",
              name: toolCall.function.name,
              args: JSON.parse(toolCall.function.arguments || "{}")
            }
          });
        }
      }
    }
    return new LlmResponse({
      content: parts.length > 0 ? {
        role: "model",
        parts
      } : void 0,
      usageMetadata: usage ? {
        promptTokenCount: usage.prompt_tokens,
        candidatesTokenCount: usage.completion_tokens,
        totalTokenCount: usage.total_tokens
      } : void 0
    });
  }
  /**
   * Convert OpenAI message to ADK LlmResponse
   */
  openAiMessageToLlmResponse(choice, usage) {
    const message = choice.message;
    const parts = [];
    if (message.content) {
      parts.push({ text: message.content });
    }
    if (message.tool_calls) {
      for (const toolCall of message.tool_calls) {
        if (toolCall.type === "function") {
          parts.push({
            functionCall: {
              id: toolCall.id,
              name: toolCall.function.name,
              args: JSON.parse(toolCall.function.arguments || "{}")
            }
          });
        }
      }
    }
    return new LlmResponse({
      content: {
        role: "model",
        parts
      },
      usageMetadata: usage ? {
        promptTokenCount: usage.prompt_tokens,
        candidatesTokenCount: usage.completion_tokens,
        totalTokenCount: usage.total_tokens
      } : void 0,
      finishReason: this.toAdkFinishReason(choice.finish_reason)
    });
  }
  /**
   * Convert ADK Content to OpenAI ChatCompletionMessage
   */
  contentToOpenAiMessage(content) {
    const role = this.toOpenAiRole(content.role);
    if (role === "system") {
      return {
        role: "system",
        content: _optionalChain([content, 'access', _116 => _116.parts, 'optionalAccess', _117 => _117[0], 'optionalAccess', _118 => _118.text]) || ""
      };
    }
    if (_optionalChain([content, 'access', _119 => _119.parts, 'optionalAccess', _120 => _120.some, 'call', _121 => _121((part) => part.functionCall)])) {
      const functionCallPart = content.parts.find(
        (part) => part.functionCall
      );
      return {
        role: "assistant",
        tool_calls: [
          {
            id: functionCallPart.functionCall.id || "",
            type: "function",
            function: {
              name: functionCallPart.functionCall.name,
              arguments: JSON.stringify(
                functionCallPart.functionCall.args || {}
              )
            }
          }
        ]
      };
    }
    if (_optionalChain([content, 'access', _122 => _122.parts, 'optionalAccess', _123 => _123.some, 'call', _124 => _124((part) => part.functionResponse)])) {
      const functionResponsePart = content.parts.find(
        (part) => part.functionResponse
      );
      return {
        role: "tool",
        tool_call_id: functionResponsePart.functionResponse.id || "",
        content: JSON.stringify(
          functionResponsePart.functionResponse.response || {}
        )
      };
    }
    if (_optionalChain([content, 'access', _125 => _125.parts, 'optionalAccess', _126 => _126.length]) === 1 && content.parts[0].text) {
      return {
        role,
        content: content.parts[0].text
      };
    }
    return {
      role,
      content: (content.parts || []).map(
        (part) => this.partToOpenAiContent(part)
      )
    };
  }
  /**
   * Convert ADK Part to OpenAI message content
   */
  partToOpenAiContent(part) {
    if (part.text) {
      return {
        type: "text",
        text: part.text
      };
    }
    if (_optionalChain([part, 'access', _127 => _127.inline_data, 'optionalAccess', _128 => _128.mime_type]) && _optionalChain([part, 'access', _129 => _129.inline_data, 'optionalAccess', _130 => _130.data])) {
      return {
        type: "image_url",
        image_url: {
          url: `data:${part.inline_data.mime_type};base64,${part.inline_data.data}`
        }
      };
    }
    throw new Error("Unsupported part type for OpenAI conversion");
  }
  /**
   * Transform JSON schema to use lowercase types for OpenAI compatibility
   */
  transformSchemaForOpenAi(schema) {
    if (Array.isArray(schema)) {
      return schema.map((item) => this.transformSchemaForOpenAi(item));
    }
    if (!schema || typeof schema !== "object") {
      return schema;
    }
    const transformedSchema = { ...schema };
    if (transformedSchema.type && typeof transformedSchema.type === "string") {
      transformedSchema.type = transformedSchema.type.toLowerCase();
    }
    if (transformedSchema.properties) {
      transformedSchema.properties = Object.fromEntries(
        Object.entries(transformedSchema.properties).map(([key, value]) => [
          key,
          this.transformSchemaForOpenAi(value)
        ])
      );
    }
    if (transformedSchema.items) {
      transformedSchema.items = this.transformSchemaForOpenAi(
        transformedSchema.items
      );
    }
    const arrayKeywords = ["anyOf", "oneOf", "allOf"];
    for (const keyword of arrayKeywords) {
      if (transformedSchema[keyword]) {
        transformedSchema[keyword] = this.transformSchemaForOpenAi(
          transformedSchema[keyword]
        );
      }
    }
    return transformedSchema;
  }
  /**
   * Convert ADK function declaration to OpenAI tool
   */
  functionDeclarationToOpenAiTool(functionDeclaration) {
    return {
      type: "function",
      function: {
        name: functionDeclaration.name,
        description: functionDeclaration.description || "",
        parameters: this.transformSchemaForOpenAi(
          functionDeclaration.parameters || {}
        )
      }
    };
  }
  /**
   * Convert ADK role to OpenAI role format
   */
  toOpenAiRole(role) {
    if (role === "model") {
      return "assistant";
    }
    if (role === "system") {
      return "system";
    }
    return "user";
  }
  /**
   * Convert OpenAI finish reason to ADK finish reason
   */
  toAdkFinishReason(openaiFinishReason) {
    switch (openaiFinishReason) {
      case "stop":
      case "tool_calls":
        return "STOP";
      case "length":
        return "MAX_TOKENS";
      default:
        return "FINISH_REASON_UNSPECIFIED";
    }
  }
  /**
   * Preprocess request similar to Google LLM
   */
  preprocessRequest(llmRequest) {
    if (llmRequest.config) {
      llmRequest.config.labels = void 0;
      if (llmRequest.contents) {
        for (const content of llmRequest.contents) {
          if (!content.parts) continue;
          for (const part of content.parts) {
            this.preprocessPart(part);
          }
        }
      }
    }
  }
  /**
   * Preprocess individual parts for OpenAI compatibility
   */
  preprocessPart(part) {
    if (part.inline_data) {
      if (!part.inline_data.mime_type || !part.inline_data.data) {
        delete part.inline_data;
      }
    }
  }
  /**
   * Detect content type for flow control
   * This is a simplified implementation - you may need to adjust based on your specific requirements
   */
  getContentType(content) {
    if (content.includes("<thinking>") || content.includes("[thinking]")) {
      return "thought";
    }
    return "regular";
  }
  /**
   * Check if response has inline data (similar to Google LLM)
   */
  hasInlineData(response) {
    const parts = _optionalChain([response, 'access', _131 => _131.content, 'optionalAccess', _132 => _132.parts]);
    return _optionalChain([parts, 'optionalAccess', _133 => _133.some, 'call', _134 => _134((part) => part.inlineData)]) || false;
  }
  /**
   * Gets the OpenAI client
   */
  get client() {
    if (!this._client) {
      const apiKey = _optionalChain([this, 'access', _135 => _135._config, 'optionalAccess', _136 => _136.apiKey]) || process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error(
          "OPENAI_API_KEY environment variable is required for OpenAI models"
        );
      }
      const baseURL = _optionalChain([this, 'access', _137 => _137._config, 'optionalAccess', _138 => _138.baseURL]) || process.env.OPENAI_BASE_URL;
      const clientConfig = {
        apiKey
      };
      if (baseURL) {
        clientConfig.baseURL = baseURL;
      }
      this._client = new (0, _openai2.default)(clientConfig);
    }
    return this._client;
  }
};

// src/models/llm-registry.ts
init_logger();
var LLMRegistry = (_class8 = class _LLMRegistry {
  static __initStatic() {this.llmRegistry = /* @__PURE__ */ new Map()}
  static __initStatic2() {this.modelInstances = /* @__PURE__ */ new Map()}
  /**
   * Default provider to use when model doesn't match any pattern
   * Can be set via environment variable ADK_DEFAULT_LLM_PROVIDER
   */
  
  static __initStatic3() {this.logger = new Logger({ name: "LLMRegistry" })}
  static newLLM(model) {
    const llmClass = _LLMRegistry.resolve(model);
    if (!llmClass) {
      const availableProviders = _LLMRegistry.getAvailableProviders();
      throw new Error(
        `No LLM class found for model: ${model}
Available providers: ${availableProviders.join(", ")}
Set the appropriate API key environment variable (OPENAI_API_KEY, ANTHROPIC_API_KEY, or GOOGLE_API_KEY) to enable fallback detection.`
      );
    }
    return new llmClass(model);
  }
  static resolve(model) {
    for (const [regex, llmClass] of _LLMRegistry.llmRegistry.entries()) {
      if (regex.test(model)) {
        return llmClass;
      }
    }
    const fallbackClass = _LLMRegistry.detectProviderFallback(model);
    if (fallbackClass) {
      return fallbackClass;
    }
    return null;
  }
  /**
   * Detect provider based on model name patterns or environment configuration
   */
  static detectProviderFallback(model) {
    if (_LLMRegistry.defaultProvider) {
      _LLMRegistry.logger.debug(`Using default provider for model: ${model}`);
      return _LLMRegistry.defaultProvider;
    }
    const defaultProviderName = _optionalChain([process, 'access', _139 => _139.env, 'access', _140 => _140.ADK_DEFAULT_LLM_PROVIDER, 'optionalAccess', _141 => _141.toLowerCase, 'call', _142 => _142()]);
    if (defaultProviderName) {
      for (const [, llmClass] of _LLMRegistry.llmRegistry.entries()) {
        const patterns = llmClass.supportedModels();
        if (defaultProviderName === "openai" && patterns.some((p) => p.includes("gpt")) || defaultProviderName === "anthropic" && patterns.some((p) => p.includes("claude")) || defaultProviderName === "google" && patterns.some((p) => p.includes("gemini"))) {
          _LLMRegistry.logger.debug(`Using ${defaultProviderName} provider (from ADK_DEFAULT_LLM_PROVIDER) for model: ${model}`);
          return llmClass;
        }
      }
    }
    if (process.env.OPENAI_API_KEY) {
      _LLMRegistry.logger.debug(`Fallback: Using OpenAI provider for model: ${model}`);
      for (const [, llmClass] of _LLMRegistry.llmRegistry.entries()) {
        const patterns = llmClass.supportedModels();
        if (patterns.some((p) => p.includes("gpt") || p.includes("o1") || p.includes("o3"))) {
          return llmClass;
        }
      }
    }
    if (process.env.ANTHROPIC_API_KEY) {
      _LLMRegistry.logger.debug(`Fallback: Using Anthropic provider for model: ${model}`);
      for (const [, llmClass] of _LLMRegistry.llmRegistry.entries()) {
        const patterns = llmClass.supportedModels();
        if (patterns.some((p) => p.includes("claude"))) {
          return llmClass;
        }
      }
    }
    if (process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENAI_USE_VERTEXAI === "true") {
      _LLMRegistry.logger.debug(`Fallback: Using Google provider for model: ${model}`);
      for (const [, llmClass] of _LLMRegistry.llmRegistry.entries()) {
        const patterns = llmClass.supportedModels();
        if (patterns.some((p) => p.includes("gemini"))) {
          return llmClass;
        }
      }
    }
    return null;
  }
  /**
   * Set the default provider to use for models that don't match any pattern
   * @param providerName - 'openai', 'anthropic', or 'google'
   */
  static setDefaultProvider(providerName) {
    for (const [, llmClass] of _LLMRegistry.llmRegistry.entries()) {
      const patterns = llmClass.supportedModels();
      if (providerName === "openai" && patterns.some((p) => p.includes("gpt")) || providerName === "anthropic" && patterns.some((p) => p.includes("claude")) || providerName === "google" && patterns.some((p) => p.includes("gemini"))) {
        _LLMRegistry.defaultProvider = llmClass;
        _LLMRegistry.logger.debug(`Default provider set to: ${providerName}`);
        return;
      }
    }
    throw new Error(`Provider ${providerName} not found in registry`);
  }
  /**
   * Clear the default provider
   */
  static clearDefaultProvider() {
    _LLMRegistry.defaultProvider = void 0;
  }
  static register(modelNameRegex, llmClass) {
    _LLMRegistry.llmRegistry.set(new RegExp(modelNameRegex), llmClass);
  }
  static registerLLM(llmClass) {
    const modelPatterns = llmClass.supportedModels();
    for (const pattern of modelPatterns) {
      _LLMRegistry.register(pattern, llmClass);
    }
  }
  static registerModel(name, model) {
    _LLMRegistry.modelInstances.set(name, model);
  }
  static getModel(name) {
    const model = _LLMRegistry.modelInstances.get(name);
    if (!model) {
      throw new Error(`Model '${name}' not found in registry`);
    }
    return model;
  }
  static hasModel(name) {
    return _LLMRegistry.modelInstances.has(name);
  }
  static unregisterModel(name) {
    _LLMRegistry.modelInstances.delete(name);
  }
  static getModelOrCreate(name) {
    if (_LLMRegistry.hasModel(name)) {
      return _LLMRegistry.getModel(name);
    }
    return _LLMRegistry.newLLM(name);
  }
  static clear() {
    _LLMRegistry.llmRegistry.clear();
    _LLMRegistry.modelInstances.clear();
  }
  static clearModels() {
    _LLMRegistry.modelInstances.clear();
  }
  static clearClasses() {
    _LLMRegistry.llmRegistry.clear();
  }
  static logRegisteredModels() {
    const classPatterns = [..._LLMRegistry.llmRegistry.entries()].map(
      ([regex]) => regex.toString()
    );
    const instanceNames = [..._LLMRegistry.modelInstances.keys()];
    _LLMRegistry.logger.debug("Registered LLM class patterns:", classPatterns);
    _LLMRegistry.logger.debug("Registered LLM instances:", instanceNames);
  }
  /**
   * Get list of available provider names based on registered LLM classes
   */
  static getAvailableProviders() {
    const providers = [];
    for (const [, llmClass] of _LLMRegistry.llmRegistry.entries()) {
      const patterns = llmClass.supportedModels();
      if (patterns.some((p) => p.includes("gpt") || p.includes("o1") || p.includes("o3"))) {
        if (!providers.includes("OpenAI")) providers.push("OpenAI");
      }
      if (patterns.some((p) => p.includes("claude"))) {
        if (!providers.includes("Anthropic")) providers.push("Anthropic");
      }
      if (patterns.some((p) => p.includes("gemini"))) {
        if (!providers.includes("Google")) providers.push("Google");
      }
    }
    return providers;
  }
}, _class8.__initStatic(), _class8.__initStatic2(), _class8.__initStatic3(), _class8);

// src/models/registry.ts
function registerProviders() {
  LLMRegistry.registerLLM(GoogleLlm);
  LLMRegistry.registerLLM(AnthropicLlm);
  LLMRegistry.registerLLM(OpenAiLlm);
}
registerProviders();

// src/auth/auth-config.ts
var AuthConfig = class {
  /**
   * The authentication scheme
   */
  
  /**
   * Additional context properties
   */
  
  /**
   * Constructor for AuthConfig
   */
  constructor(config) {
    this.authScheme = config.authScheme;
    this.context = config.context;
  }
};

// src/auth/auth-credential.ts
var AuthCredentialType = /* @__PURE__ */ ((AuthCredentialType2) => {
  AuthCredentialType2["API_KEY"] = "api_key";
  AuthCredentialType2["BASIC"] = "basic";
  AuthCredentialType2["BEARER"] = "bearer";
  AuthCredentialType2["OAUTH2"] = "oauth2";
  AuthCredentialType2["CUSTOM"] = "custom";
  return AuthCredentialType2;
})(AuthCredentialType || {});
var AuthCredential = class {
  /**
   * Type of credential
   */
  
  /**
   * Constructor for AuthCredential
   */
  constructor(type) {
    this.type = type;
  }
  /**
   * Whether the token can be refreshed
   */
  canRefresh() {
    return false;
  }
  /**
   * Refreshes the token
   */
  async refresh() {
    throw new Error("Token refresh not supported for this credential type");
  }
};
var ApiKeyCredential = class extends AuthCredential {
  /**
   * The API key
   */
  
  /**
   * Constructor for ApiKeyCredential
   */
  constructor(apiKey) {
    super("api_key" /* API_KEY */);
    this.apiKey = apiKey;
  }
  /**
   * Gets the API key as the token
   */
  getToken() {
    return this.apiKey;
  }
  /**
   * Gets headers for HTTP requests
   */
  getHeaders(config) {
    const scheme = config.authScheme;
    if (scheme.in === "header") {
      return { [scheme.name]: this.apiKey };
    }
    return {};
  }
};
var BasicAuthCredential = class extends AuthCredential {
  /**
   * The username
   */
  
  /**
   * The password
   */
  
  /**
   * Constructor for BasicAuthCredential
   */
  constructor(username, password) {
    super("basic" /* BASIC */);
    this.username = username;
    this.password = password;
  }
  /**
   * Gets the encoded basic auth token
   */
  getToken() {
    return Buffer.from(`${this.username}:${this.password}`).toString("base64");
  }
  /**
   * Gets headers for HTTP requests
   */
  getHeaders() {
    return {
      Authorization: `Basic ${this.getToken()}`
    };
  }
};
var BearerTokenCredential = class extends AuthCredential {
  /**
   * The bearer token
   */
  
  /**
   * Constructor for BearerTokenCredential
   */
  constructor(token) {
    super("bearer" /* BEARER */);
    this.token = token;
  }
  /**
   * Gets the bearer token
   */
  getToken() {
    return this.token;
  }
  /**
   * Gets headers for HTTP requests
   */
  getHeaders() {
    return {
      Authorization: `Bearer ${this.token}`
    };
  }
};
var OAuth2Credential = class extends AuthCredential {
  /**
   * The access token
   */
  
  /**
   * The refresh token
   */
  
  /**
   * When the token expires
   */
  
  /**
   * Function to refresh the token
   */
  
  /**
   * Constructor for OAuth2Credential
   */
  constructor(config) {
    super("oauth2" /* OAUTH2 */);
    this.accessToken = config.accessToken;
    this.refreshToken = config.refreshToken;
    if (config.expiresIn) {
      this.expiresAt = new Date(Date.now() + config.expiresIn * 1e3);
    }
    this.refreshFunction = config.refreshFunction;
  }
  /**
   * Gets the access token
   */
  getToken() {
    return this.accessToken;
  }
  /**
   * Gets headers for HTTP requests
   */
  getHeaders() {
    return {
      Authorization: `Bearer ${this.accessToken}`
    };
  }
  /**
   * Whether the token can be refreshed
   */
  canRefresh() {
    return !!this.refreshToken && !!this.refreshFunction;
  }
  /**
   * Whether the token is expired
   */
  isExpired() {
    if (!this.expiresAt) {
      return false;
    }
    return this.expiresAt.getTime() - 3e4 < Date.now();
  }
  /**
   * Refreshes the token
   */
  async refresh() {
    if (!this.canRefresh()) {
      throw new Error(
        "Cannot refresh token: no refresh token or refresh function"
      );
    }
    const result = await _optionalChain([this, 'access', _143 => _143.refreshFunction, 'optionalCall', _144 => _144(this.refreshToken)]);
    if (!result) {
      throw new Error("Failed to refresh token");
    }
    this.accessToken = result.accessToken;
    if (result.refreshToken) {
      this.refreshToken = result.refreshToken;
    }
    if (result.expiresIn) {
      this.expiresAt = new Date(Date.now() + result.expiresIn * 1e3);
    }
  }
};

// src/auth/auth-handler.ts
var AuthHandler = class {
  /**
   * The authentication configuration
   */
  
  /**
   * The authentication credential
   */
  
  /**
   * Constructor for AuthHandler
   */
  constructor(config) {
    this.authConfig = config.authConfig;
    this.credential = config.credential;
  }
  /**
   * Gets the authentication token
   */
  getToken() {
    return _optionalChain([this, 'access', _145 => _145.credential, 'optionalAccess', _146 => _146.getToken, 'call', _147 => _147()]);
  }
  /**
   * Gets headers for HTTP requests
   */
  getHeaders() {
    if (!this.credential) {
      return {};
    }
    return this.credential.getHeaders(this.authConfig);
  }
  /**
   * Refreshes the token if necessary
   */
  async refreshToken() {
    if (_optionalChain([this, 'access', _148 => _148.credential, 'optionalAccess', _149 => _149.canRefresh, 'call', _150 => _150()])) {
      await this.credential.refresh();
    }
  }
};

// src/auth/auth-schemes.ts
var AuthSchemeType = /* @__PURE__ */ ((AuthSchemeType2) => {
  AuthSchemeType2["APIKEY"] = "apiKey";
  AuthSchemeType2["HTTP"] = "http";
  AuthSchemeType2["OAUTH2"] = "oauth2";
  AuthSchemeType2["OPENID_CONNECT"] = "openIdConnect";
  return AuthSchemeType2;
})(AuthSchemeType || {});
var AuthScheme = class {
  /**
   * The type of authentication scheme
   */
  
  constructor(type) {
    this.type = type;
  }
};
var ApiKeyScheme = class extends AuthScheme {
  /**
   * Where the API key is sent
   */
  
  /**
   * Name of the parameter
   */
  
  /**
   * Description of the API key
   */
  
  /**
   * Constructor for ApiKeyScheme
   */
  constructor(config) {
    super("apiKey" /* APIKEY */);
    this.in = config.in;
    this.name = config.name;
    this.description = config.description;
  }
};
var HttpScheme = class extends AuthScheme {
  /**
   * The HTTP authentication scheme
   */
  
  /**
   * Bearer format when scheme is 'bearer'
   */
  
  /**
   * Description of the scheme
   */
  
  /**
   * Constructor for HttpScheme
   */
  constructor(config) {
    super("http" /* HTTP */);
    this.scheme = config.scheme;
    this.bearerFormat = config.bearerFormat;
    this.description = config.description;
  }
};
var OAuth2Scheme = class extends AuthScheme {
  /**
   * OAuth flows
   */
  
  /**
   * Description of the scheme
   */
  
  /**
   * Constructor for OAuth2Scheme
   */
  constructor(config) {
    super("oauth2" /* OAUTH2 */);
    this.flows = config.flows;
    this.description = config.description;
  }
};
var OpenIdConnectScheme = class extends AuthScheme {
  /**
   * OpenID Connect URL
   */
  
  /**
   * Description of the scheme
   */
  
  /**
   * Constructor for OpenIdConnectScheme
   */
  constructor(config) {
    super("openIdConnect" /* OPENID_CONNECT */);
    this.openIdConnectUrl = config.openIdConnectUrl;
    this.description = config.description;
  }
};

// src/sessions/state.ts
var State = (_class9 = class _State {
  static __initStatic4() {this.APP_PREFIX = "app:"}
  static __initStatic5() {this.USER_PREFIX = "user:"}
  static __initStatic6() {this.TEMP_PREFIX = "temp:"}
  
  
  /**
   * Constructor for State
   *
   * @param value - The current value of the state dict.
   * @param delta - The delta change to the current value that hasn't been committed.
   */
  constructor(value, delta) {
    this._value = value;
    this._delta = delta;
  }
  /**
   * Returns the value of the state dict for the given key.
   */
  get(key, defaultValue) {
    if (!this.has(key)) {
      return defaultValue;
    }
    return this[key];
  }
  /**
   * Sets the value of the state dict for the given key.
   */
  set(key, value) {
    this._value[key] = value;
    this._delta[key] = value;
  }
  /**
   * Whether the state dict contains the given key.
   */
  has(key) {
    return key in this._value || key in this._delta;
  }
  /**
   * Whether the state has pending delta.
   */
  hasDelta() {
    return Object.keys(this._delta).length > 0;
  }
  /**
   * Updates the state dict with the given delta.
   */
  update(delta) {
    Object.assign(this._value, delta);
    Object.assign(this._delta, delta);
  }
  /**
   * Returns the state dict.
   */
  toDict() {
    const result = {};
    Object.assign(result, this._value);
    Object.assign(result, this._delta);
    return result;
  }
  /**
   * Proxy handler for array-like access
   */
  static createProxy(state) {
    return new Proxy(state, {
      get(target, prop) {
        if (typeof prop === "string" && !prop.startsWith("_") && !(prop in target)) {
          if (prop in target._delta) {
            return target._delta[prop];
          }
          return target._value[prop];
        }
        return target[prop];
      },
      set(target, prop, value) {
        if (typeof prop === "string" && !prop.startsWith("_") && !(prop in target)) {
          target.set(prop, value);
          return true;
        }
        target[prop] = value;
        return true;
      },
      has(target, prop) {
        if (typeof prop === "string" && !prop.startsWith("_") && !(prop in target)) {
          return target.has(prop);
        }
        return prop in target;
      }
    });
  }
  /**
   * Factory method to create a proxied State instance
   */
  static create(value, delta) {
    const state = new _State(value, delta);
    return _State.createProxy(state);
  }
}, _class9.__initStatic4(), _class9.__initStatic5(), _class9.__initStatic6(), _class9);

// src/events/event.ts
var _uuid = require('uuid');

// src/events/event-actions.ts
var EventActions = (_class10 = class {
  /**
   * If true, it won't call model to summarize function response.
   * Only used for function_response event.
   */
  
  /**
   * Indicates that the event is updating the state with the given delta.
   */
  __init14() {this.stateDelta = {}}
  /**
   * Indicates that the event is updating an artifact. key is the filename,
   * value is the version.
   */
  __init15() {this.artifactDelta = {}}
  /**
   * If set, the event transfers to the specified agent.
   */
  
  /**
   * The agent is escalating to a higher level agent.
   */
  
  /**
   * Requested authentication configurations.
   */
  
  /**
   * Constructor for EventActions
   */
  constructor(options = {}) {;_class10.prototype.__init14.call(this);_class10.prototype.__init15.call(this);
    this.skipSummarization = options.skipSummarization;
    this.stateDelta = options.stateDelta || {};
    this.artifactDelta = options.artifactDelta || {};
    this.transferToAgent = options.transferToAgent;
    this.escalate = options.escalate;
    this.requestedAuthConfigs = options.requestedAuthConfigs;
  }
}, _class10);

// src/events/event.ts
var Event = (_class11 = class _Event extends LlmResponse {
  /** The invocation ID of the event. */
  __init16() {this.invocationId = ""}
  /** 'user' or the name of the agent, indicating who appended the event to the session. */
  
  /** The actions taken by the agent. */
  __init17() {this.actions = new EventActions()}
  /**
   * Set of ids of the long running function calls.
   * Agent client will know from this field about which function call is long running.
   * Only valid for function call event.
   */
  
  /**
   * The branch of the event.
   * The format is like agent_1.agent_2.agent_3, where agent_1 is the parent of
   * agent_2, and agent_2 is the parent of agent_3. Branch is used when multiple
   * sub-agents shouldn't see their peer agents' conversation history.
   */
  
  /** The unique identifier of the event. */
  __init18() {this.id = ""}
  /** The timestamp of the event (seconds since epoch). */
  __init19() {this.timestamp = Math.floor(Date.now() / 1e3)}
  /**
   * Constructor for Event.
   */
  constructor(opts) {
    super({
      content: opts.content,
      partial: opts.partial
    });_class11.prototype.__init16.call(this);_class11.prototype.__init17.call(this);_class11.prototype.__init18.call(this);_class11.prototype.__init19.call(this);;
    this.invocationId = _nullishCoalesce(opts.invocationId, () => ( ""));
    this.author = opts.author;
    this.actions = _nullishCoalesce(opts.actions, () => ( new EventActions()));
    this.longRunningToolIds = opts.longRunningToolIds;
    this.branch = opts.branch;
    this.id = _nullishCoalesce(opts.id, () => ( _Event.newId()));
    this.timestamp = _nullishCoalesce(opts.timestamp, () => ( Math.floor(Date.now() / 1e3)));
  }
  /**
   * Returns whether the event is the final response of the agent.
   */
  isFinalResponse() {
    if (this.actions.skipSummarization || this.longRunningToolIds) {
      return true;
    }
    return this.getFunctionCalls().length === 0 && this.getFunctionResponses().length === 0 && !this.partial && !this.hasTrailingCodeExecutionResult();
  }
  /**
   * Returns the function calls in the event.
   */
  getFunctionCalls() {
    const funcCalls = [];
    if (this.content && Array.isArray(this.content.parts)) {
      for (const part of this.content.parts) {
        if (part.functionCall) {
          funcCalls.push(part.functionCall);
        }
      }
    }
    return funcCalls;
  }
  /**
   * Returns the function responses in the event.
   */
  getFunctionResponses() {
    const funcResponses = [];
    if (this.content && Array.isArray(this.content.parts)) {
      for (const part of this.content.parts) {
        if (part.functionResponse) {
          funcResponses.push(part.functionResponse);
        }
      }
    }
    return funcResponses;
  }
  /**
   * Returns whether the event has a trailing code execution result.
   */
  hasTrailingCodeExecutionResult() {
    if (this.content && Array.isArray(this.content.parts) && this.content.parts.length > 0) {
      return this.content.parts[this.content.parts.length - 1].codeExecutionResult != null;
    }
    return false;
  }
  /**
   * Generates a new random ID for an event.
   */
  static newId() {
    return _uuid.v4.call(void 0, ).replace(/-/g, "").substring(0, 8);
  }
}, _class11);

// src/agents/readonly-context.ts
var ReadonlyContext = class {
  
  constructor(invocationContext) {
    this._invocationContext = invocationContext;
  }
  /**
   * The user content that started this invocation. READONLY field.
   */
  get userContent() {
    return this._invocationContext.userContent;
  }
  /**
   * The current invocation id.
   */
  get invocationId() {
    return this._invocationContext.invocationId;
  }
  /**
   * The name of the agent that is currently running.
   */
  get agentName() {
    return this._invocationContext.agent.name;
  }
  /**
   * The state of the current session. READONLY field.
   */
  get state() {
    return Object.freeze({ ...this._invocationContext.session.state });
  }
};

// src/agents/callback-context.ts
var CallbackContext = class extends ReadonlyContext {
  /**
   * TODO: make this public for Agent Development Kit, but private for users.
   */
  
  
  constructor(invocationContext, options = {}) {
    super(invocationContext);
    this._eventActions = options.eventActions || new EventActions();
    this._state = State.create(
      invocationContext.session.state,
      this._eventActions.stateDelta
    );
  }
  /**
   * The delta-aware state of the current session.
   * For any state change, you can mutate this object directly,
   * e.g. `ctx.state['foo'] = 'bar'`
   */
  get state() {
    return this._state;
  }
  /**
   * Loads an artifact attached to the current session.
   *
   * @param filename - The filename of the artifact.
   * @param version - The version of the artifact. If undefined, the latest version will be returned.
   * @returns The artifact.
   */
  async loadArtifact(filename, version) {
    if (this._invocationContext.artifactService === void 0) {
      throw new Error("Artifact service is not initialized.");
    }
    return await this._invocationContext.artifactService.loadArtifact({
      appName: this._invocationContext.appName,
      userId: this._invocationContext.userId,
      sessionId: this._invocationContext.session.id,
      filename,
      version
    });
  }
  /**
   * Saves an artifact and records it as delta for the current session.
   *
   * @param filename - The filename of the artifact.
   * @param artifact - The artifact to save.
   * @returns The version of the artifact.
   */
  async saveArtifact(filename, artifact) {
    if (this._invocationContext.artifactService === void 0) {
      throw new Error("Artifact service is not initialized.");
    }
    const version = await this._invocationContext.artifactService.saveArtifact({
      appName: this._invocationContext.appName,
      userId: this._invocationContext.userId,
      sessionId: this._invocationContext.session.id,
      filename,
      artifact
    });
    this._eventActions.artifactDelta[filename] = version;
    return version;
  }
  /**
   * Gets the event actions associated with this context.
   */
  get eventActions() {
    return this._eventActions;
  }
};

// src/agents/base-agent.ts
var BaseAgent = (_class12 = class {
  /**
   * The agent's name.
   * Agent name must be a valid identifier and unique within the agent tree.
   * Agent name cannot be "user", since it's reserved for end-user's input.
   */
  
  /**
   * Description about the agent's capability.
   * The model uses this to determine whether to delegate control to the agent.
   * One-line description is enough and preferred.
   */
  __init20() {this.description = ""}
  /**
   * The parent agent of this agent.
   * Note that an agent can ONLY be added as sub-agent once.
   * If you want to add one agent twice as sub-agent, consider to create two agent
   * instances with identical config, but with different name and add them to the
   * agent tree.
   */
  
  /**
   * The sub-agents of this agent.
   */
  __init21() {this.subAgents = []}
  /**
   * Callback or list of callbacks to be invoked before the agent run.
   * When a list of callbacks is provided, the callbacks will be called in the
   * order they are listed until a callback does not return undefined.
   *
   * Args:
   *   callbackContext: The callback context.
   *
   * Returns:
   *   Content | undefined: The content to return to the user.
   *     When the content is present, the agent run will be skipped and the
   *     provided content will be returned to user.
   */
  
  /**
   * Callback or list of callbacks to be invoked after the agent run.
   * When a list of callbacks is provided, the callbacks will be called in the
   * order they are listed until a callback does not return undefined.
   *
   * Args:
   *   callbackContext: The callback context.
   *
   * Returns:
   *   Content | undefined: The content to return to the user.
   *     When the content is present, the provided content will be used as agent
   *     response and appended to event history as agent response.
   */
  
  /**
   * Constructor for BaseAgent
   */
  constructor(config) {;_class12.prototype.__init20.call(this);_class12.prototype.__init21.call(this);
    this.name = config.name;
    this.description = config.description || "";
    this.subAgents = config.subAgents || [];
    this.beforeAgentCallback = config.beforeAgentCallback;
    this.afterAgentCallback = config.afterAgentCallback;
    this.validateName(this.name);
    this.setParentAgentForSubAgents();
  }
  /**
   * Entry method to run an agent via text-based conversation.
   */
  async *runAsync(parentContext) {
    yield* telemetryService.traceAsyncGenerator(
      `agent_run [${this.name}]`,
      this.runAsyncInternal(parentContext)
    );
  }
  /**
   * Entry method to run an agent via video/audio-based conversation.
   */
  async *runLive(parentContext) {
    yield* telemetryService.traceAsyncGenerator(
      `agent_run_live [${this.name}]`,
      this.runLiveInternal(parentContext)
    );
  }
  /**
   * Internal implementation for runAsync
   */
  async *runAsyncInternal(parentContext) {
    const ctx = this.createInvocationContext(parentContext);
    const beforeEvent = await this.handleBeforeAgentCallback(ctx);
    if (beforeEvent) {
      yield beforeEvent;
    }
    if (ctx.endInvocation) {
      return;
    }
    for await (const event of this.runAsyncImpl(ctx)) {
      yield event;
    }
    if (ctx.endInvocation) {
      return;
    }
    const afterEvent = await this.handleAfterAgentCallback(ctx);
    if (afterEvent) {
      yield afterEvent;
    }
  }
  /**
   * Internal implementation for runLive
   */
  async *runLiveInternal(parentContext) {
    const ctx = this.createInvocationContext(parentContext);
    for await (const event of this.runLiveImpl(ctx)) {
      yield event;
    }
  }
  /**
   * Core logic to run this agent via text-based conversation.
   *
   * @param ctx - The invocation context for this agent.
   * @yields Event - The events generated by the agent.
   */
  // biome-ignore lint/correctness/useYield: This is a abstract method
  async *runAsyncImpl(_ctx) {
    throw new Error(
      `runAsyncImpl for ${this.constructor.name} is not implemented.`
    );
  }
  /**
   * Core logic to run this agent via video/audio-based conversation.
   *
   * @param ctx - The invocation context for this agent.
   * @yields Event - The events generated by the agent.
   */
  // biome-ignore lint/correctness/useYield: This is a abstract method
  async *runLiveImpl(_ctx) {
    throw new Error(
      `runLiveImpl for ${this.constructor.name} is not implemented.`
    );
  }
  /**
   * Gets the root agent of this agent.
   */
  get rootAgent() {
    let rootAgent = this;
    while (rootAgent.parentAgent !== void 0) {
      rootAgent = rootAgent.parentAgent;
    }
    return rootAgent;
  }
  /**
   * Finds the agent with the given name in this agent and its descendants.
   *
   * @param name - The name of the agent to find.
   * @returns The agent with the matching name, or undefined if no such agent is found.
   */
  findAgent(name) {
    if (this.name === name) {
      return this;
    }
    return this.findSubAgent(name);
  }
  /**
   * Finds the agent with the given name in this agent's descendants.
   *
   * @param name - The name of the agent to find.
   * @returns The agent with the matching name, or undefined if no such agent is found.
   */
  findSubAgent(name) {
    for (const subAgent of this.subAgents) {
      const result = subAgent.findAgent(name);
      if (result) {
        return result;
      }
    }
    return void 0;
  }
  /**
   * Creates a new invocation context for this agent.
   */
  createInvocationContext(parentContext) {
    return parentContext.createChildContext(this);
  }
  /**
   * The resolved beforeAgentCallback field as a list of SingleAgentCallback.
   * This method is only for use by Agent Development Kit.
   */
  get canonicalBeforeAgentCallbacks() {
    if (!this.beforeAgentCallback) {
      return [];
    }
    if (Array.isArray(this.beforeAgentCallback)) {
      return this.beforeAgentCallback;
    }
    return [this.beforeAgentCallback];
  }
  /**
   * The resolved afterAgentCallback field as a list of SingleAgentCallback.
   * This method is only for use by Agent Development Kit.
   */
  get canonicalAfterAgentCallbacks() {
    if (!this.afterAgentCallback) {
      return [];
    }
    if (Array.isArray(this.afterAgentCallback)) {
      return this.afterAgentCallback;
    }
    return [this.afterAgentCallback];
  }
  /**
   * Runs the beforeAgentCallback if it exists.
   *
   * @returns An event if callback provides content or changed state.
   */
  async handleBeforeAgentCallback(ctx) {
    let retEvent;
    if (this.canonicalBeforeAgentCallbacks.length === 0) {
      return retEvent;
    }
    const callbackContext = new CallbackContext(ctx);
    for (const callback of this.canonicalBeforeAgentCallbacks) {
      let beforeAgentCallbackContent = callback(callbackContext);
      if (beforeAgentCallbackContent instanceof Promise) {
        beforeAgentCallbackContent = await beforeAgentCallbackContent;
      }
      if (beforeAgentCallbackContent) {
        retEvent = new Event({
          invocationId: ctx.invocationId,
          author: this.name,
          branch: ctx.branch,
          content: beforeAgentCallbackContent,
          actions: callbackContext.eventActions
        });
        ctx.endInvocation = true;
        return retEvent;
      }
    }
    if (callbackContext.state.hasDelta()) {
      retEvent = new Event({
        invocationId: ctx.invocationId,
        author: this.name,
        branch: ctx.branch,
        actions: callbackContext.eventActions
      });
    }
    return retEvent;
  }
  /**
   * Runs the afterAgentCallback if it exists.
   *
   * @returns An event if callback provides content or changed state.
   */
  async handleAfterAgentCallback(invocationContext) {
    let retEvent;
    if (this.canonicalAfterAgentCallbacks.length === 0) {
      return retEvent;
    }
    const callbackContext = new CallbackContext(invocationContext);
    let afterAgentCallbackContent;
    for (const callback of this.canonicalAfterAgentCallbacks) {
      afterAgentCallbackContent = await callback(callbackContext);
      if (afterAgentCallbackContent instanceof Promise) {
        afterAgentCallbackContent = await afterAgentCallbackContent;
      }
      if (afterAgentCallbackContent) {
        retEvent = new Event({
          invocationId: invocationContext.invocationId,
          author: this.name,
          branch: invocationContext.branch,
          content: afterAgentCallbackContent,
          actions: callbackContext.eventActions
        });
        return retEvent;
      }
    }
    if (callbackContext.state.hasDelta()) {
      retEvent = new Event({
        invocationId: invocationContext.invocationId,
        author: this.name,
        branch: invocationContext.branch,
        content: afterAgentCallbackContent,
        actions: callbackContext.eventActions
      });
    }
    return retEvent;
  }
  /**
   * Validates the agent name.
   */
  validateName(value) {
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(value)) {
      throw new Error(
        `Found invalid agent name: \`${value}\`. Agent name must be a valid identifier. It should start with a letter (a-z, A-Z) or an underscore (_), and can only contain letters, digits (0-9), and underscores.`
      );
    }
    if (value === "user") {
      throw new Error(
        "Agent name cannot be `user`. `user` is reserved for end-user's input."
      );
    }
  }
  /**
   * Sets parent agent for sub-agents.
   */
  setParentAgentForSubAgents() {
    for (const subAgent of this.subAgents) {
      if (subAgent.parentAgent !== void 0) {
        throw new Error(
          `Agent \`${subAgent.name}\` already has a parent agent, current parent: \`${subAgent.parentAgent.name}\`, trying to add: \`${this.name}\``
        );
      }
      subAgent.parentAgent = this;
    }
  }
}, _class12);

// src/agents/llm-agent.ts
init_logger();

// src/events/index.ts
var events_exports = {};
__export(events_exports, {
  Event: () => Event,
  EventActions: () => EventActions
});

// src/flows/llm-flows/base-llm-flow.ts
init_logger();

// src/logger/log-formatter.ts
var LogFormatter = class _LogFormatter {
  /**
   * Formats function calls for display in logs.
   * Returns a comma-separated string of function names with argument previews.
   *
   * @param functionCalls Array of Parts containing function calls
   * @returns Formatted string representation of function calls
   */
  static formatFunctionCalls(functionCalls) {
    if (!functionCalls || functionCalls.length === 0) {
      return "none";
    }
    return functionCalls.filter((part) => part.functionCall).map((part) => {
      const fc = part.functionCall;
      const argsPreview = fc.args ? JSON.stringify(fc.args).substring(0, 50) + (JSON.stringify(fc.args).length > 50 ? "..." : "") : "{}";
      return `${fc.name}(${argsPreview})`;
    }).join(", ");
  }
  /**
   * Formats content preview for debug logging.
   * Uses a consistent format for displaying content in logs.
   *
   * @param content Content object to format
   * @returns Formatted string representation of content
   */
  static formatContentPreview(content) {
    if (!content) return "none";
    if (content.parts && Array.isArray(content.parts)) {
      const textParts = content.parts.filter((part) => part.text).map((part) => part.text).join(" ");
      return textParts.length > 80 ? `${textParts.substring(0, 80)}...` : textParts || "no text content";
    }
    const stringified = JSON.stringify(content);
    return stringified.length > 80 ? `${stringified.substring(0, 80)}...` : stringified;
  }
  /**
   * Formats response content preview for debug logging.
   * Specifically handles LlmResponse content structure.
   *
   * @param llmResponse LlmResponse object to format
   * @returns Formatted string representation of response content
   */
  static formatResponsePreview(llmResponse) {
    if (!llmResponse.content) return "none";
    return _LogFormatter.formatContentPreview(llmResponse.content);
  }
  /**
   * Formats a single function call for detailed logging.
   * Provides more detailed formatting than formatFunctionCalls for individual calls.
   *
   * @param functionCall FunctionCall object to format
   * @returns Formatted string representation of the function call
   */
  static formatSingleFunctionCall(functionCall) {
    const argsStr = functionCall.args ? JSON.stringify(functionCall.args, null, 2) : "{}";
    return `${functionCall.name}(
${argsStr}
)`;
  }
  /**
   * Formats function response for detailed logging.
   * Provides detailed formatting for function response objects.
   *
   * @param part Part containing function response
   * @returns Formatted string representation of the function response
   */
  static formatFunctionResponse(part) {
    if (!part.functionResponse) return "none";
    const response = part.functionResponse;
    const responseStr = response.response ? JSON.stringify(response.response, null, 2) : "{}";
    return `${response.name} -> ${responseStr}`;
  }
  /**
   * Formats content parts for detailed inspection.
   * Shows the structure and content of all parts in a Content object.
   *
   * @param content Content object with parts to format
   * @returns Array of formatted strings, one per part
   */
  static formatContentParts(content) {
    if (!content.parts) return ["no parts"];
    return content.parts.map((part, index) => {
      const partType = _LogFormatter.getPartType(part);
      const preview = _LogFormatter.getPartPreview(part);
      return `[${index}] ${partType}: ${preview}`;
    });
  }
  /**
   * Gets the type of a Part for logging purposes.
   *
   * @param part Part object to analyze
   * @returns String describing the part type
   */
  static getPartType(part) {
    if (part.text !== void 0) return "text";
    if (part.functionCall !== void 0) return "function_call";
    if (part.functionResponse !== void 0) return "function_response";
    if (part.fileData !== void 0) return "file_data";
    if (part.executableCode !== void 0) return "executable_code";
    if (part.codeExecutionResult !== void 0) return "code_execution_result";
    return "unknown";
  }
  /**
   * Gets a preview of Part content for logging purposes.
   *
   * @param part Part object to preview
   * @returns String preview of the part content
   */
  static getPartPreview(part) {
    if (part.text !== void 0) {
      return part.text.length > 50 ? `"${part.text.substring(0, 50)}..."` : `"${part.text}"`;
    }
    if (part.functionCall !== void 0) {
      return _LogFormatter.formatSingleFunctionCall(part.functionCall);
    }
    if (part.functionResponse !== void 0) {
      return _LogFormatter.formatFunctionResponse(part);
    }
    if (part.fileData !== void 0) {
      return `file: ${part.fileData.mimeType || "unknown type"}`;
    }
    if (part.executableCode !== void 0) {
      const code = part.executableCode.code || "";
      return code.length > 50 ? `"${code.substring(0, 50)}..."` : `"${code}"`;
    }
    if (part.codeExecutionResult !== void 0) {
      const outcome = part.codeExecutionResult.outcome || "unknown";
      return `execution result: ${outcome}`;
    }
    return "unknown content";
  }
};

// src/tools/index.ts
var tools_exports = {};
__export(tools_exports, {
  AgentTool: () => AgentTool,
  BaseTool: () => BaseTool,
  ExitLoopTool: () => ExitLoopTool,
  FileOperationsTool: () => FileOperationsTool,
  FunctionTool: () => FunctionTool,
  GetUserChoiceTool: () => GetUserChoiceTool,
  GoogleSearch: () => GoogleSearch,
  HttpRequestTool: () => HttpRequestTool,
  LoadArtifactsTool: () => LoadArtifactsTool,
  LoadMemoryTool: () => LoadMemoryTool,
  McpAbi: () => McpAbi,
  McpAtp: () => McpAtp,
  McpBamm: () => McpBamm,
  McpCoinGecko: () => McpCoinGecko,
  McpDiscord: () => McpDiscord,
  McpError: () => McpError,
  McpErrorType: () => McpErrorType,
  McpFilesystem: () => McpFilesystem,
  McpFraxlend: () => McpFraxlend,
  McpGeneric: () => McpGeneric,
  McpIqWiki: () => McpIqWiki,
  McpMemory: () => McpMemory,
  McpNearAgent: () => McpNearAgent,
  McpNearIntents: () => McpNearIntents,
  McpOdos: () => McpOdos,
  McpSamplingHandler: () => McpSamplingHandler,
  McpTelegram: () => McpTelegram,
  McpToolset: () => McpToolset,
  McpUpbit: () => McpUpbit,
  ToolContext: () => ToolContext,
  TransferToAgentTool: () => TransferToAgentTool,
  UserInteractionTool: () => UserInteractionTool,
  adkToMcpToolType: () => adkToMcpToolType,
  buildFunctionDeclaration: () => buildFunctionDeclaration,
  convertMcpToolToBaseTool: () => convertMcpToolToBaseTool,
  createFunctionTool: () => createFunctionTool,
  createSamplingHandler: () => createSamplingHandler,
  createTool: () => createTool,
  getMcpTools: () => getMcpTools,
  jsonSchemaToDeclaration: () => jsonSchemaToDeclaration,
  mcpSchemaToParameters: () => mcpSchemaToParameters,
  normalizeJsonSchema: () => normalizeJsonSchema
});
init_base_tool();

// src/tools/base/create-tool.ts
init_base_tool();
var _zod = require('zod'); var z = _interopRequireWildcard(_zod);
var CreatedTool = class extends BaseTool {
  
  
  
  constructor(config) {
    super({
      name: config.name,
      description: config.description,
      isLongRunning: _nullishCoalesce(config.isLongRunning, () => ( false)),
      shouldRetryOnFailure: _nullishCoalesce(config.shouldRetryOnFailure, () => ( false)),
      maxRetryAttempts: _nullishCoalesce(config.maxRetryAttempts, () => ( 3))
    });
    this.func = config.fn;
    this.schema = _nullishCoalesce(config.schema, () => ( z.object({})));
    this.functionDeclaration = this.buildDeclaration();
  }
  /**
   * Executes the tool function with validation
   */
  async runAsync(args, context4) {
    try {
      const validatedArgs = this.schema.parse(args);
      const result = await Promise.resolve(this.func(validatedArgs, context4));
      return _nullishCoalesce(result, () => ( {}));
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          error: `Invalid arguments for ${this.name}: ${error.message}`
        };
      }
      return {
        error: `Error executing ${this.name}: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
  /**
   * Returns the function declaration for this tool
   */
  getDeclaration() {
    return this.functionDeclaration;
  }
  /**
   * Builds the function declaration from the Zod schema
   */
  buildDeclaration() {
    const rawParameters = z.toJSONSchema(this.schema);
    const { $schema, ...parameters } = rawParameters;
    return {
      name: this.name,
      description: this.description,
      parameters
    };
  }
};
function createTool(config) {
  return new CreatedTool(config);
}

// src/tools/common/agent-tool.ts
init_logger();



// src/agents/invocation-context.ts
var LlmCallsLimitExceededError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "LlmCallsLimitExceededError";
  }
};
var InvocationCostManager = (_class13 = class {constructor() { _class13.prototype.__init22.call(this); }
  /**
   * A counter that keeps track of number of llm calls made.
   */
  __init22() {this._numberOfLlmCalls = 0}
  /**
   * Increments _numberOfLlmCalls and enforces the limit.
   */
  incrementAndEnforceLlmCallsLimit(runConfig) {
    this._numberOfLlmCalls += 1;
    if (runConfig && runConfig.maxLlmCalls > 0 && this._numberOfLlmCalls > runConfig.maxLlmCalls) {
      throw new LlmCallsLimitExceededError(
        `Max number of llm calls limit of \`${runConfig.maxLlmCalls}\` exceeded`
      );
    }
  }
}, _class13);
function newInvocationContextId() {
  return `e-${crypto.randomUUID()}`;
}
var InvocationContext = (_class14 = class _InvocationContext {
  
  
  
  /**
   * The id of this invocation context. Readonly.
   */
  
  /**
   * The branch of the invocation context.
   *
   * The format is like agent_1.agent_2.agent_3, where agent_1 is the parent of
   * agent_2, and agent_2 is the parent of agent_3.
   *
   * Branch is used when multiple sub-agents shouldn't see their peer agents'
   * conversation history.
   */
  
  /**
   * The current agent of this invocation context. Readonly.
   */
  
  /**
   * The user content that started this invocation. Readonly.
   */
  
  /**
   * The current session of this invocation context. Readonly.
   */
  
  /**
   * Whether to end this invocation.
   *
   * Set to True in callbacks or tools to terminate this invocation.
   */
  __init23() {this.endInvocation = false}
  /**
   * The queue to receive live requests.
   */
  
  /**
   * The running streaming tools of this invocation.
   */
  
  /**
   * Caches necessary, data audio or contents, that are needed by transcription.
   */
  
  /**
   * Configurations for live agents under this invocation.
   */
  
  /**
   * A container to keep track of different kinds of costs incurred as a part
   * of this invocation.
   */
  __init24() {this._invocationCostManager = new InvocationCostManager()}
  /**
   * Constructor for InvocationContext
   */
  constructor(options) {;_class14.prototype.__init23.call(this);_class14.prototype.__init24.call(this);
    this.artifactService = options.artifactService;
    this.sessionService = options.sessionService;
    this.memoryService = options.memoryService;
    this.invocationId = options.invocationId || newInvocationContextId();
    this.branch = options.branch;
    this.agent = options.agent;
    this.userContent = options.userContent;
    this.session = options.session;
    this.endInvocation = options.endInvocation || false;
    this.liveRequestQueue = options.liveRequestQueue;
    this.activeStreamingTools = options.activeStreamingTools;
    this.transcriptionCache = options.transcriptionCache;
    this.runConfig = options.runConfig;
  }
  /**
   * App name from the session
   */
  get appName() {
    return this.session.appName;
  }
  /**
   * User ID from the session
   */
  get userId() {
    return this.session.userId;
  }
  /**
   * Tracks number of llm calls made.
   *
   * @throws {LlmCallsLimitExceededError} If number of llm calls made exceed the set threshold.
   */
  incrementLlmCallCount() {
    this._invocationCostManager.incrementAndEnforceLlmCallsLimit(
      this.runConfig
    );
  }
  /**
   * Creates a child invocation context for a sub-agent
   */
  createChildContext(agent) {
    return new _InvocationContext({
      artifactService: this.artifactService,
      sessionService: this.sessionService,
      memoryService: this.memoryService,
      invocationId: this.invocationId,
      // Keep same invocation ID
      branch: this.branch ? `${this.branch}.${agent.name}` : agent.name,
      // Update branch
      agent,
      // Update to the new agent
      userContent: this.userContent,
      session: this.session,
      endInvocation: this.endInvocation,
      liveRequestQueue: this.liveRequestQueue,
      activeStreamingTools: this.activeStreamingTools,
      transcriptionCache: this.transcriptionCache,
      runConfig: this.runConfig
    });
  }
}, _class14);

// src/tools/common/agent-tool.ts
init_base_tool();
function isLlmAgent(agent) {
  return true;
}
var AgentTool = (_class15 = class extends BaseTool {
  /**
   * The agent used by this tool
   */
  
  /**
   * The function declaration schema
   */
  
  /**
   * The key to store the tool output in the state
   */
  
  /**
   * Whether to skip summarization of the agent's response
   */
  
  __init25() {this.logger = new Logger({ name: "AgentTool" })}
  /**
   * Create a new agent tool
   */
  constructor(config) {
    super({
      name: config.name,
      description: config.description || config.agent.description,
      isLongRunning: config.isLongRunning || false,
      shouldRetryOnFailure: config.shouldRetryOnFailure || false,
      maxRetryAttempts: config.maxRetryAttempts || 3
    });_class15.prototype.__init25.call(this);;
    this.agent = config.agent;
    this.functionDeclaration = config.functionDeclaration;
    this.outputKey = config.outputKey;
    this.skipSummarization = config.skipSummarization || false;
  }
  /**
   * Get the function declaration for the tool
   */
  getDeclaration() {
    if (this.functionDeclaration) {
      return this.functionDeclaration;
    }
    const description = isLlmAgent(this.agent) ? typeof this.agent.instruction === "string" ? this.agent.instruction : this.description : this.description;
    return {
      name: this.name,
      description,
      parameters: {
        type: _genai.Type.OBJECT,
        properties: {
          input: {
            type: _genai.Type.STRING,
            description: "The input to provide to the agent"
          }
        },
        required: ["input"]
      }
    };
  }
  /**
   * Execute the tool by running the agent with the provided input
   */
  async runAsync(params, context4) {
    try {
      const input = params.input || Object.values(params)[0];
      if (!isLlmAgent(this.agent)) {
        throw new Error(
          `Agent ${this.name} does not support running as a tool`
        );
      }
      const parentInvocation = context4._invocationContext;
      const childInvocationContext = new InvocationContext({
        invocationId: _uuid.v4.call(void 0, ),
        agent: this.agent,
        session: parentInvocation.session,
        artifactService: parentInvocation.artifactService,
        sessionService: parentInvocation.sessionService,
        memoryService: parentInvocation.memoryService,
        runConfig: parentInvocation.runConfig,
        userContent: {
          role: "user",
          parts: [{ text: String(input) }]
        },
        branch: parentInvocation.branch ? `${parentInvocation.branch}.${this.agent.name}` : this.agent.name
      });
      let lastEvent = null;
      for await (const event of this.agent.runAsync(childInvocationContext)) {
        if (!event.partial) {
          await childInvocationContext.sessionService.appendEvent(
            childInvocationContext.session,
            event
          );
        }
        if (event.content && event.author === this.agent.name) {
          lastEvent = event;
        }
      }
      if (!lastEvent || !lastEvent.content || !lastEvent.content.parts) {
        return "";
      }
      const mergedText = lastEvent.content.parts.filter((part) => part.text !== void 0 && part.text !== null).map((part) => part.text).join("\n");
      let toolResult;
      try {
        toolResult = JSON.parse(mergedText);
      } catch (e3) {
        toolResult = mergedText;
      }
      if (this.outputKey && _optionalChain([context4, 'optionalAccess', _151 => _151.state])) {
        context4.state[this.outputKey] = toolResult;
      }
      return toolResult;
    } catch (error) {
      this.logger.error(`Error executing agent tool ${this.name}:`, error);
      throw new Error(
        `Agent tool execution failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}, _class15);

// src/tools/tool-context.ts
var ToolContext = class extends CallbackContext {
  /**
   * The function call id of the current tool call. This id was
   * returned in the function call event from LLM to identify a function call.
   * If LLM didn't return this id, ADK will assign one to it. This id is used
   * to map function call response to the original function call.
   */
  
  /**
   * Constructor for ToolContext
   */
  constructor(invocationContext, options = {}) {
    super(invocationContext, { eventActions: options.eventActions });
    this.functionCallId = options.functionCallId;
  }
  /**
   * Gets the event actions of the current tool call
   */
  get actions() {
    return this.eventActions;
  }
  /**
   * Lists the filenames of the artifacts attached to the current session
   */
  async listArtifacts() {
    if (!this._invocationContext.artifactService) {
      throw new Error("Artifact service is not initialized.");
    }
    return await this._invocationContext.artifactService.listArtifactKeys({
      appName: this._invocationContext.appName,
      userId: this._invocationContext.userId,
      sessionId: this._invocationContext.session.id
    });
  }
  /**
   * Searches the memory of the current user
   */
  async searchMemory(query) {
    if (!this._invocationContext.memoryService) {
      throw new Error("Memory service is not available.");
    }
    return await this._invocationContext.memoryService.searchMemory({
      query,
      appName: this._invocationContext.appName,
      userId: this._invocationContext.userId
    });
  }
};

// src/tools/index.ts
init_function_tool();

// src/tools/function/index.ts
init_function_tool();
init_function_utils();
function createFunctionTool(func, options) {
  const { FunctionTool: FunctionTool2 } = (init_function_tool(), __toCommonJS(function_tool_exports));
  return new FunctionTool2(func, options);
}

// src/tools/index.ts
init_function_utils();

// src/tools/common/google-search.ts
init_logger();
init_base_tool();

var GoogleSearch = (_class16 = class extends BaseTool {
  __init26() {this.logger = new Logger({ name: "GoogleSearch" })}
  /**
   * Constructor for GoogleSearch
   */
  constructor() {
    super({
      name: "google_search",
      description: "Search the web using Google"
    });_class16.prototype.__init26.call(this);;
  }
  /**
   * Get the function declaration for the tool
   */
  getDeclaration() {
    return {
      name: this.name,
      description: this.description,
      parameters: {
        type: _genai.Type.OBJECT,
        properties: {
          query: {
            type: _genai.Type.STRING,
            description: "The search query to execute"
          },
          num_results: {
            type: _genai.Type.INTEGER,
            description: "Number of results to return (max 10)",
            default: 5
          }
        },
        required: ["query"]
      }
    };
  }
  /**
   * Execute the search
   * This is a simplified implementation that doesn't actually search, just returns mock results
   */
  async runAsync(args, _context) {
    this.logger.debug(
      `[GoogleSearch] Executing Google search for: ${args.query}`
    );
    return {
      results: [
        {
          title: `Result 1 for ${args.query}`,
          link: "https://example.com/1",
          snippet: `This is a sample result for the query "${args.query}".`
        },
        {
          title: `Result 2 for ${args.query}`,
          link: "https://example.com/2",
          snippet: `Another sample result for "${args.query}".`
        }
      ]
    };
  }
}, _class16);

// src/tools/common/http-request-tool.ts
init_base_tool();

var HttpRequestTool = class extends BaseTool {
  constructor() {
    super({
      name: "http_request",
      description: "Make HTTP requests to external APIs and web services"
    });
  }
  /**
   * Get the function declaration for the tool
   */
  getDeclaration() {
    return {
      name: this.name,
      description: this.description,
      parameters: {
        type: _genai.Type.OBJECT,
        properties: {
          url: {
            type: _genai.Type.STRING,
            description: "The URL to send the request to"
          },
          method: {
            type: _genai.Type.STRING,
            description: "The HTTP method to use (GET, POST, PUT, DELETE, etc.)",
            enum: ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"],
            default: "GET"
          },
          headers: {
            type: _genai.Type.OBJECT,
            description: "Request headers to include"
          },
          body: {
            type: _genai.Type.STRING,
            description: "Request body content (as string, typically JSON)"
          },
          params: {
            type: _genai.Type.OBJECT,
            description: "URL query parameters to include"
          },
          timeout: {
            type: _genai.Type.INTEGER,
            description: "Request timeout in milliseconds",
            default: 1e4
          }
        },
        required: ["url"]
      }
    };
  }
  /**
   * Execute the HTTP request
   */
  async runAsync(args, _context) {
    try {
      const {
        url,
        method = "GET",
        headers = {},
        body,
        params,
        timeout = 1e4
      } = args;
      const urlObj = new URL(url);
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          urlObj.searchParams.append(key, value);
        });
      }
      const requestHeaders = { ...headers };
      if (body && !requestHeaders["Content-Type"] && this.isValidJson(body)) {
        requestHeaders["Content-Type"] = "application/json";
      }
      const options = {
        method,
        headers: requestHeaders,
        body,
        signal: AbortSignal.timeout(timeout)
      };
      const response = await fetch(urlObj.toString(), options);
      const responseHeaders = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });
      const responseBody = await response.text();
      return {
        statusCode: response.status,
        headers: responseHeaders,
        body: responseBody
      };
    } catch (error) {
      return {
        statusCode: 0,
        headers: {},
        body: "",
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  /**
   * Check if a string is valid JSON
   */
  isValidJson(str) {
    try {
      JSON.parse(str);
      return true;
    } catch (e) {
      return false;
    }
  }
};

// src/tools/common/file-operations-tool.ts
init_base_tool();
var _promises = require('fs/promises'); var fs2 = _interopRequireWildcard(_promises);
var _path = require('path'); var path2 = _interopRequireWildcard(_path);

var FileOperationsTool = class extends BaseTool {
  
  constructor(options) {
    super({
      name: "file_operations",
      description: "Perform file system operations like reading, writing, and managing files"
    });
    this.basePath = _optionalChain([options, 'optionalAccess', _152 => _152.basePath]) || process.cwd();
  }
  /**
   * Get the function declaration for the tool
   */
  getDeclaration() {
    return {
      name: this.name,
      description: this.description,
      parameters: {
        type: _genai.Type.OBJECT,
        properties: {
          operation: {
            type: _genai.Type.STRING,
            description: "The file operation to perform",
            enum: [
              "read",
              "write",
              "append",
              "delete",
              "exists",
              "list",
              "mkdir"
            ]
          },
          filepath: {
            type: _genai.Type.STRING,
            description: "Path to the file or directory (relative to the base path)"
          },
          content: {
            type: _genai.Type.STRING,
            description: "Content to write to the file (for write and append operations)"
          },
          encoding: {
            type: _genai.Type.STRING,
            description: "File encoding to use",
            default: "utf8"
          }
        },
        required: ["operation", "filepath"]
      }
    };
  }
  /**
   * Execute the file operation
   */
  async runAsync(args, _context) {
    try {
      const resolvedPath = this.resolvePath(args.filepath);
      this.validatePath(resolvedPath);
      const encoding = args.encoding || "utf8";
      switch (args.operation) {
        case "read":
          return await this.readFile(resolvedPath, encoding);
        case "write":
          return await this.writeFile(
            resolvedPath,
            args.content || "",
            encoding
          );
        case "append":
          return await this.appendFile(
            resolvedPath,
            args.content || "",
            encoding
          );
        case "delete":
          return await this.deleteFile(resolvedPath);
        case "exists":
          return await this.fileExists(resolvedPath);
        case "list":
          return await this.listDirectory(resolvedPath);
        case "mkdir":
          return await this.makeDirectory(resolvedPath);
        default:
          throw new Error(`Unsupported operation: ${args.operation}`);
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  /**
   * Resolve a file path relative to the base path
   */
  resolvePath(filepath) {
    return path2.default.isAbsolute(filepath) ? filepath : path2.default.resolve(this.basePath, filepath);
  }
  /**
   * Validate that a path is within the base path for security
   */
  validatePath(filepath) {
    const normalizedPath = path2.default.normalize(filepath);
    const normalizedBasePath = path2.default.normalize(this.basePath);
    if (!normalizedPath.startsWith(normalizedBasePath)) {
      throw new Error(
        `Access denied: Can't access paths outside the base directory`
      );
    }
  }
  /**
   * Read a file
   */
  async readFile(filepath, encoding) {
    try {
      const content = await fs2.default.readFile(filepath, { encoding });
      return {
        success: true,
        data: content
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to read file: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
  /**
   * Write to a file
   */
  async writeFile(filepath, content, encoding) {
    try {
      const dir = path2.default.dirname(filepath);
      await fs2.default.mkdir(dir, { recursive: true });
      await fs2.default.writeFile(filepath, content, { encoding });
      return {
        success: true
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to write to file: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
  /**
   * Append to a file
   */
  async appendFile(filepath, content, encoding) {
    try {
      const dir = path2.default.dirname(filepath);
      await fs2.default.mkdir(dir, { recursive: true });
      await fs2.default.appendFile(filepath, content, { encoding });
      return {
        success: true
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to append to file: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
  /**
   * Delete a file
   */
  async deleteFile(filepath) {
    try {
      await fs2.default.unlink(filepath);
      return {
        success: true
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to delete file: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
  /**
   * Check if a file exists
   */
  async fileExists(filepath) {
    try {
      await fs2.default.access(filepath);
      return {
        success: true,
        data: true
      };
    } catch (e4) {
      return {
        success: true,
        data: false
      };
    }
  }
  /**
   * List directory contents
   */
  async listDirectory(dirpath) {
    try {
      const entries = await fs2.default.readdir(dirpath, { withFileTypes: true });
      const results = await Promise.all(
        entries.map(async (entry) => {
          const entryPath = path2.default.join(dirpath, entry.name);
          const stats = await fs2.default.stat(entryPath);
          return {
            name: entry.name,
            path: entryPath,
            isFile: entry.isFile(),
            isDirectory: entry.isDirectory(),
            size: stats.size,
            created: stats.birthtime,
            modified: stats.mtime
          };
        })
      );
      return {
        success: true,
        data: results
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to list directory: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
  /**
   * Create a directory
   */
  async makeDirectory(dirpath) {
    try {
      await fs2.default.mkdir(dirpath, { recursive: true });
      return {
        success: true
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to create directory: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
};

// src/tools/common/user-interaction-tool.ts
init_base_tool();

var UserInteractionTool = class extends BaseTool {
  constructor() {
    super({
      name: "user_interaction",
      description: "Prompt the user for input during agent execution",
      isLongRunning: true
    });
  }
  /**
   * Get the function declaration for the tool
   */
  getDeclaration() {
    return {
      name: this.name,
      description: this.description,
      parameters: {
        type: _genai.Type.OBJECT,
        properties: {
          prompt: {
            type: _genai.Type.STRING,
            description: "The prompt message to display to the user"
          },
          options: {
            type: _genai.Type.ARRAY,
            description: "Optional array of choices to present to the user",
            items: {
              type: _genai.Type.STRING
            }
          },
          defaultValue: {
            type: _genai.Type.STRING,
            description: "Optional default value for the input field"
          }
        },
        required: ["prompt"]
      }
    };
  }
  /**
   * Execute the user interaction
   */
  async runAsync(args, context4) {
    try {
      const actions = context4.actions;
      if (!actions || !actions.promptUser) {
        return {
          success: false,
          error: "User interaction is not supported in the current environment"
        };
      }
      if (actions.skipSummarization) {
        actions.skipSummarization(true);
      }
      const promptOptions = args.options && args.options.length > 0 ? {
        choices: args.options
      } : void 0;
      const response = await actions.promptUser({
        prompt: args.prompt,
        defaultValue: args.defaultValue,
        options: promptOptions
      });
      return {
        success: true,
        userInput: response
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
};

// src/tools/common/exit-loop-tool.ts
init_logger();
init_base_tool();
var ExitLoopTool = (_class17 = class extends BaseTool {
  __init27() {this.logger = new Logger({ name: "ExitLoopTool" })}
  /**
   * Constructor for ExitLoopTool
   */
  constructor() {
    super({
      name: "exit_loop",
      description: "Exits the loop. Call this function only when you are instructed to do so."
    });_class17.prototype.__init27.call(this);;
  }
  /**
   * Execute the exit loop action
   */
  async runAsync(_args, context4) {
    this.logger.debug("Executing exit loop tool");
    context4.actions.escalate = true;
  }
}, _class17);

// src/tools/common/get-user-choice-tool.ts
init_logger();
init_base_tool();

var GetUserChoiceTool = (_class18 = class extends BaseTool {
  __init28() {this.logger = new Logger({ name: "GetUserChoiceTool" })}
  /**
   * Constructor for GetUserChoiceTool
   */
  constructor() {
    super({
      name: "get_user_choice",
      description: "This tool provides the options to the user and asks them to choose one. Use this tool when you need the user to make a selection between multiple options. Do not list options in your response - use this tool instead.",
      isLongRunning: true
    });_class18.prototype.__init28.call(this);;
  }
  /**
   * Get the function declaration for the tool
   */
  getDeclaration() {
    return {
      name: this.name,
      description: this.description,
      parameters: {
        type: _genai.Type.OBJECT,
        properties: {
          options: {
            type: _genai.Type.ARRAY,
            description: "List of options for the user to choose from",
            items: {
              type: _genai.Type.STRING
            }
          },
          question: {
            type: _genai.Type.STRING,
            description: "The question or prompt to show the user before presenting options"
          }
        },
        required: ["options"]
      }
    };
  }
  /**
   * Execute the user choice action
   * This is a long running operation that will return null initially
   * and the actual choice will be provided asynchronously
   */
  async runAsync(args, context4) {
    this.logger.debug(
      `Executing get_user_choice with options: ${args.options.join(", ")}`
    );
    if (args.question) {
      this.logger.debug(`Question: ${args.question}`);
    }
    context4.actions.skipSummarization = true;
    return null;
  }
}, _class18);

// src/tools/common/transfer-to-agent-tool.ts
init_logger();
init_base_tool();

var TransferToAgentTool = (_class19 = class extends BaseTool {
  __init29() {this.logger = new Logger({ name: "TransferToAgentTool" })}
  /**
   * Constructor for TransferToAgentTool
   */
  constructor() {
    super({
      name: "transfer_to_agent",
      description: "Transfer the question to another agent when it's more suitable to answer the user's question according to the agent's description. Use this function when you determine that another agent in the system would be better equipped to handle the user's request based on their specialized capabilities and expertise areas."
    });_class19.prototype.__init29.call(this);;
  }
  /**
   * Get the function declaration for the tool
   */
  getDeclaration() {
    return {
      name: this.name,
      description: this.description,
      parameters: {
        type: _genai.Type.OBJECT,
        properties: {
          agent_name: {
            type: _genai.Type.STRING,
            description: "The name of the agent to transfer control to"
          }
        },
        required: ["agent_name"]
      }
    };
  }
  /**
   * Execute the transfer to agent action
   */
  async runAsync(args, context4) {
    this.logger.debug(`Executing transfer to agent: ${args.agent_name}`);
    context4.actions.transferToAgent = args.agent_name;
  }
}, _class19);

// src/tools/common/load-memory-tool.ts
init_logger();
init_base_tool();

var LoadMemoryTool = (_class20 = class extends BaseTool {
  __init30() {this.logger = new Logger({ name: "LoadMemoryTool" })}
  /**
   * Constructor for LoadMemoryTool
   */
  constructor() {
    super({
      name: "load_memory",
      description: "Loads the memory for the current user based on a query."
    });_class20.prototype.__init30.call(this);;
  }
  /**
   * Get the function declaration for the tool
   */
  getDeclaration() {
    return {
      name: this.name,
      description: this.description,
      parameters: {
        type: _genai.Type.OBJECT,
        properties: {
          query: {
            type: _genai.Type.STRING,
            description: "The query to load memories for"
          }
        },
        required: ["query"]
      }
    };
  }
  /**
   * Execute the memory loading action
   */
  async runAsync(args, context4) {
    this.logger.debug(`Executing load_memory with query: ${args.query}`);
    try {
      const searchResult = await context4.searchMemory(args.query);
      return {
        memories: searchResult.memories || [],
        count: _optionalChain([searchResult, 'access', _153 => _153.memories, 'optionalAccess', _154 => _154.length]) || 0
      };
    } catch (error) {
      console.error("Error searching memory:", error);
      return {
        error: "Memory search failed",
        message: error instanceof Error ? error.message : String(error)
      };
    }
  }
}, _class20);

// src/tools/common/load-artifacts-tool.ts
init_base_tool();

var LoadArtifactsTool = class extends BaseTool {
  constructor() {
    super({
      name: "load_artifacts",
      description: "Loads the artifacts and adds them to the session."
    });
  }
  /**
   * Get the function declaration for the tool
   */
  getDeclaration() {
    return {
      name: this.name,
      description: this.description,
      parameters: {
        type: _genai.Type.OBJECT,
        properties: {
          artifact_names: {
            type: _genai.Type.ARRAY,
            items: {
              type: _genai.Type.STRING
            },
            description: "List of artifact names to load"
          }
        },
        required: []
      }
    };
  }
  /**
   * Execute the load artifacts operation
   */
  async runAsync(args, context4) {
    const artifactNames = args.artifact_names || [];
    return { artifact_names: artifactNames };
  }
  /**
   * Processes the outgoing LLM request for this tool.
   */
  async processLlmRequest(toolContext, llmRequest) {
    await super.processLlmRequest(toolContext, llmRequest);
    await this.appendArtifactsToLlmRequest(toolContext, llmRequest);
  }
  /**
   * Appends artifacts information to the LLM request
   */
  async appendArtifactsToLlmRequest(toolContext, llmRequest) {
    try {
      const artifactNames = await toolContext.listArtifacts();
      if (!artifactNames || artifactNames.length === 0) {
        return;
      }
      const instructions = [
        `You have a list of artifacts:
${JSON.stringify(artifactNames)}

When the user asks questions about any of the artifacts, you should call the
\`load_artifacts\` function to load the artifact. Do not generate any text other
than the function call.
`
      ];
      if (llmRequest.appendInstructions) {
        llmRequest.appendInstructions(instructions);
      }
      if (llmRequest.contents && llmRequest.contents.length > 0) {
        const lastContent = llmRequest.contents[llmRequest.contents.length - 1];
        if (lastContent.parts && lastContent.parts.length > 0) {
          const firstPart = lastContent.parts[0];
          const functionResponse = this.extractFunctionResponse(firstPart);
          if (functionResponse && functionResponse.name === "load_artifacts") {
            const requestedArtifactNames = functionResponse.response.artifact_names || [];
            for (const artifactName of requestedArtifactNames) {
              try {
                const artifact = await toolContext.loadArtifact(artifactName);
                if (artifact) {
                  llmRequest.contents.push({
                    role: "user",
                    parts: [
                      {
                        text: `Artifact ${artifactName} is:`
                      },
                      artifact
                    ]
                  });
                }
              } catch (error) {
                console.error(
                  `Failed to load artifact ${artifactName}:`,
                  error
                );
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Error appending artifacts to LLM request:", error);
    }
  }
  /**
   * Extracts function response from a part if it exists
   */
  extractFunctionResponse(part) {
    if ("functionResponse" in part && part.functionResponse) {
      return part.functionResponse;
    }
    return null;
  }
};

// src/tools/mcp/client.ts
init_logger();
var _indexjs = require('@modelcontextprotocol/sdk/client/index.js');
var _ssejs = require('@modelcontextprotocol/sdk/client/sse.js');
var _stdiojs = require('@modelcontextprotocol/sdk/client/stdio.js');
var _typesjs = require('@modelcontextprotocol/sdk/types.js');

// src/tools/mcp/sampling-handler.ts
init_logger();





// src/tools/mcp/types.ts
var McpErrorType = /* @__PURE__ */ ((McpErrorType2) => {
  McpErrorType2["CONNECTION_ERROR"] = "connection_error";
  McpErrorType2["TOOL_EXECUTION_ERROR"] = "tool_execution_error";
  McpErrorType2["RESOURCE_CLOSED_ERROR"] = "resource_closed_error";
  McpErrorType2["TIMEOUT_ERROR"] = "timeout_error";
  McpErrorType2["INVALID_SCHEMA_ERROR"] = "invalid_schema_error";
  McpErrorType2["SAMPLING_ERROR"] = "SAMPLING_ERROR";
  McpErrorType2["INVALID_REQUEST_ERROR"] = "INVALID_REQUEST_ERROR";
  return McpErrorType2;
})(McpErrorType || {});
var McpError = class extends Error {
  
  
  constructor(message, type, originalError) {
    super(message);
    this.name = "McpError";
    this.type = type;
    this.originalError = originalError;
  }
};

// src/tools/mcp/sampling-handler.ts
var McpSamplingHandler = (_class21 = class {
  __init31() {this.logger = new Logger({ name: "McpSamplingHandler" })}
  
  constructor(samplingHandler) {;_class21.prototype.__init31.call(this);
    this.samplingHandler = samplingHandler;
  }
  /**
   * Handle MCP sampling request and convert between formats
   */
  async handleSamplingRequest(request) {
    try {
      if (request.method !== "sampling/createMessage") {
        this.logger.error(
          `Invalid method for sampling handler: ${request.method}. Expected: sampling/createMessage`
        );
        throw new McpError(
          `Invalid method: ${request.method}. This handler only processes sampling/createMessage requests.`,
          "INVALID_REQUEST_ERROR" /* INVALID_REQUEST_ERROR */
        );
      }
      const validationResult = _typesjs.CreateMessageRequestSchema.safeParse(request);
      if (!validationResult.success) {
        this.logger.error(
          "Invalid MCP sampling request:",
          validationResult.error
        );
        throw new McpError(
          `Invalid sampling request: ${validationResult.error.message}`,
          "INVALID_REQUEST_ERROR" /* INVALID_REQUEST_ERROR */
        );
      }
      const mcpParams = request.params;
      if (!mcpParams.messages || !Array.isArray(mcpParams.messages)) {
        throw new McpError(
          "Invalid sampling request: messages array is required",
          "INVALID_REQUEST_ERROR" /* INVALID_REQUEST_ERROR */
        );
      }
      if (!mcpParams.maxTokens || mcpParams.maxTokens <= 0) {
        throw new McpError(
          "Invalid sampling request: maxTokens must be a positive number",
          "INVALID_REQUEST_ERROR" /* INVALID_REQUEST_ERROR */
        );
      }
      this.logger.debug("Converting MCP request to ADK format");
      const adkContents = this.convertMcpMessagesToADK(
        mcpParams.messages,
        mcpParams.systemPrompt
      );
      const requestModel = mcpParams.model || "gemini-2.0-flash";
      const adkRequest = new LlmRequest({
        model: requestModel,
        contents: adkContents,
        config: {
          temperature: mcpParams.temperature,
          maxOutputTokens: mcpParams.maxTokens
        }
      });
      this.logger.debug("Calling ADK sampling handler");
      const adkResponse = await this.samplingHandler(adkRequest);
      this.logger.debug("Converting ADK response to MCP format");
      const mcpResponse = this.convertADKResponseToMcp(
        adkResponse,
        requestModel
      );
      const responseValidation = _typesjs.CreateMessageResultSchema.safeParse(mcpResponse);
      if (!responseValidation.success) {
        this.logger.error(
          "Invalid MCP response generated:",
          responseValidation.error
        );
        throw new McpError(
          `Invalid response generated: ${responseValidation.error.message}`,
          "SAMPLING_ERROR" /* SAMPLING_ERROR */
        );
      }
      return mcpResponse;
    } catch (error) {
      this.logger.error("Error handling sampling request:", error);
      if (error instanceof McpError) {
        throw error;
      }
      throw new McpError(
        `Sampling request failed: ${error instanceof Error ? error.message : String(error)}`,
        "SAMPLING_ERROR" /* SAMPLING_ERROR */,
        error instanceof Error ? error : void 0
      );
    }
  }
  /**
   * Convert MCP messages to ADK Content format
   */
  convertMcpMessagesToADK(mcpMessages, systemPrompt) {
    const contents = [];
    if (systemPrompt) {
      contents.push({
        role: "user",
        // System messages are typically sent as user role in content
        parts: [{ text: systemPrompt }]
      });
    }
    const transformedMessages = mcpMessages.map(
      (mcpMessage) => this.convertSingleMcpMessageToADK(mcpMessage)
    );
    contents.push(...transformedMessages);
    return contents;
  }
  /**
   * Convert a single MCP message to ADK Content format
   */
  convertSingleMcpMessageToADK(mcpMessage) {
    const adkRole = mcpMessage.role === "assistant" ? "model" : "user";
    const adkParts = this.convertMcpContentToADKParts(mcpMessage.content);
    const adkContent = {
      role: adkRole,
      parts: adkParts
    };
    this.logger.debug(
      `Converted MCP message - role: ${mcpMessage.role} -> ${adkRole}, content type: ${mcpMessage.content.type}`
    );
    return adkContent;
  }
  /**
   * Convert MCP message content to ADK parts format
   */
  convertMcpContentToADKParts(mcpContent) {
    if (mcpContent.type === "text") {
      const textContent = mcpContent.text || "";
      return [{ text: textContent }];
    }
    if (mcpContent.type === "image") {
      const parts = [];
      if (mcpContent.text && typeof mcpContent.text === "string") {
        parts.push({ text: mcpContent.text });
      }
      if (mcpContent.data && typeof mcpContent.data === "string") {
        const mimeType = mcpContent.mimeType || "image/jpeg";
        parts.push({
          inlineData: {
            data: mcpContent.data,
            mimeType
          }
        });
      }
      return parts.length > 0 ? parts : [{ text: "" }];
    }
    this.logger.warn(`Unknown MCP content type: ${mcpContent.type}`);
    const fallbackText = typeof mcpContent.data === "string" ? mcpContent.data : "";
    return [{ text: fallbackText }];
  }
  /**
   * Convert ADK response to MCP response format
   */
  convertADKResponseToMcp(adkResponse, model) {
    let responseText = "";
    if (typeof adkResponse === "string") {
      responseText = adkResponse;
    } else {
      if (adkResponse.content) {
        if (typeof adkResponse.content === "string") {
          responseText = adkResponse.content;
        } else if (adkResponse.content.parts) {
          responseText = adkResponse.content.parts.map((part) => {
            return typeof part.text === "string" ? part.text : "";
          }).join("");
        }
      }
    }
    const mcpResponse = {
      model,
      // Use the model from the request
      role: "assistant",
      // ADK responses are always from assistant
      content: {
        type: "text",
        text: responseText
      }
    };
    this.logger.debug(`Received content: ${responseText}`);
    return mcpResponse;
  }
  /**
   * Update the ADK handler
   */
  updateHandler(handler) {
    this.samplingHandler = handler;
    this.logger.debug("ADK sampling handler updated");
  }
}, _class21);
function createSamplingHandler(handler) {
  return handler;
}

// src/tools/mcp/utils.ts
function withRetry(fn, instance, reinitMethod, maxRetries = 1) {
  return async (...args) => {
    let attempt = 0;
    while (attempt <= maxRetries) {
      try {
        return await fn.apply(instance, args);
      } catch (error) {
        const isClosedResourceError = error instanceof Error && (error.message.includes("closed") || error.message.includes("ECONNRESET") || error.message.includes("socket hang up"));
        if (!isClosedResourceError || attempt >= maxRetries) {
          throw error;
        }
        console.warn(
          `Resource closed, reinitializing (attempt ${attempt + 1}/${maxRetries + 1})...`
        );
        try {
          await reinitMethod(instance);
        } catch (reinitError) {
          console.error("Error reinitializing resources:", reinitError);
          throw new Error(`Failed to reinitialize resources: ${reinitError}`);
        }
        attempt++;
      }
    }
    throw new Error("Unexpected end of retry loop");
  };
}

// src/tools/mcp/client.ts
var McpClientService = (_class22 = class {
  
  __init32() {this.client = null}
  __init33() {this.transport = null}
  __init34() {this.isClosing = false}
  __init35() {this.mcpSamplingHandler = null}
  __init36() {this.logger = new Logger({ name: "McpClientService" })}
  constructor(config) {;_class22.prototype.__init32.call(this);_class22.prototype.__init33.call(this);_class22.prototype.__init34.call(this);_class22.prototype.__init35.call(this);_class22.prototype.__init36.call(this);
    this.config = config;
    if (config.samplingHandler) {
      this.mcpSamplingHandler = new McpSamplingHandler(config.samplingHandler);
    }
  }
  /**
   * Initializes and returns an MCP client based on configuration.
   * Will create a new client if one doesn't exist yet.
   */
  async initialize() {
    if (this.isClosing) {
      throw new McpError(
        "Cannot initialize a client that is being closed",
        "resource_closed_error" /* RESOURCE_CLOSED_ERROR */
      );
    }
    if (this.client) {
      return this.client;
    }
    try {
      if (!this.transport) {
        this.transport = await this.createTransport();
      }
      const client = new (0, _indexjs.Client)(
        {
          name: this.config.name,
          version: "0.0.1"
        },
        {
          capabilities: {
            prompts: {},
            resources: {},
            tools: {},
            sampling: {}
            // Enable sampling capability
          }
        }
      );
      const connectPromise = client.connect(this.transport);
      if (this.config.timeout) {
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => {
            reject(
              new McpError(
                `MCP client connection timed out after ${this.config.timeout}ms`,
                "timeout_error" /* TIMEOUT_ERROR */
              )
            );
          }, this.config.timeout);
        });
        await Promise.race([connectPromise, timeoutPromise]);
      } else {
        await connectPromise;
      }
      await this.setupSamplingHandler(client);
      this.logger.debug("\u2705 MCP client connected successfully");
      this.client = client;
      return client;
    } catch (error) {
      await this.cleanupResources();
      if (!(error instanceof McpError)) {
        this.logger.error("Failed to initialize MCP client:", error);
        throw new McpError(
          `Failed to initialize MCP client: ${error instanceof Error ? error.message : String(error)}`,
          "connection_error" /* CONNECTION_ERROR */,
          error instanceof Error ? error : void 0
        );
      }
      throw error;
    }
  }
  /**
   * Creates a transport based on the configuration.
   */
  async createTransport() {
    try {
      if (this.config.transport.mode === "sse") {
        this.logger.debug(
          "\u{1F680} Initializing MCP client in SSE mode",
          this.config.transport.serverUrl
        );
        const headers = {
          ...this.config.transport.headers || {},
          ...this.config.headers || {}
        };
        return new (0, _ssejs.SSEClientTransport)(
          new URL(this.config.transport.serverUrl),
          {
            requestInit: {
              headers,
              ...this.config.timeout ? { timeout: this.config.timeout } : {}
            }
          }
        );
      }
      this.logger.debug(
        "\u{1F680} Initializing MCP client in STDIO mode",
        this.config.transport.command
      );
      return new (0, _stdiojs.StdioClientTransport)({
        command: this.config.transport.command,
        args: this.config.transport.args,
        env: this.config.transport.env
      });
    } catch (error) {
      throw new McpError(
        `Failed to create transport: ${error instanceof Error ? error.message : String(error)}`,
        "connection_error" /* CONNECTION_ERROR */,
        error instanceof Error ? error : void 0
      );
    }
  }
  /**
   * Re-initializes the MCP client when a session is closed.
   * Used by the retry mechanism.
   */
  async reinitialize() {
    this.logger.debug("\u{1F504} Reinitializing MCP client after closed connection");
    await this.cleanupResources();
    this.client = null;
    this.transport = null;
    await this.initialize();
  }
  /**
   * Cleans up resources associated with this client service.
   * Similar to Python's AsyncExitStack.aclose() functionality.
   */
  async cleanupResources() {
    try {
      this.isClosing = true;
      if (this.client) {
        try {
          if (typeof this.client.close === "function") {
            await this.client.close();
          }
        } catch (err) {
        }
      }
      if (this.transport && typeof this.transport.close === "function") {
        await this.transport.close();
      }
      this.logger.debug("\u{1F9F9} Cleaned up MCP client resources");
    } catch (error) {
      this.logger.error("Error cleaning up MCP resources:", error);
    } finally {
      this.client = null;
      this.transport = null;
      this.isClosing = false;
    }
  }
  /**
   * Call an MCP tool with retry capability if the session is closed.
   */
  async callTool(name, args) {
    try {
      const wrappedCall = withRetry(
        async function() {
          const client = await this.initialize();
          return client.callTool({
            name,
            arguments: args
          });
        },
        this,
        async (instance) => await instance.reinitialize(),
        _optionalChain([this, 'access', _155 => _155.config, 'access', _156 => _156.retryOptions, 'optionalAccess', _157 => _157.maxRetries]) || 2
      );
      return await wrappedCall();
    } catch (error) {
      if (!(error instanceof McpError)) {
        throw new McpError(
          `Error calling tool "${name}": ${error instanceof Error ? error.message : String(error)}`,
          "tool_execution_error" /* TOOL_EXECUTION_ERROR */,
          error instanceof Error ? error : void 0
        );
      }
      throw error;
    }
  }
  /**
   * Closes and cleans up all resources.
   * Should be called when the service is no longer needed.
   * Similar to Python's close() method.
   */
  async close() {
    this.logger.debug("\u{1F51A} Closing MCP client service");
    await this.cleanupResources();
  }
  /**
   * Checks if the client is currently connected
   */
  isConnected() {
    return !!this.client && !this.isClosing;
  }
  async setupSamplingHandler(client) {
    if (!this.mcpSamplingHandler) {
      this.logger.debug(
        "\u26A0\uFE0F No sampling handler provided - sampling requests will be rejected"
      );
      return;
    }
    try {
      client.setRequestHandler(
        _typesjs.CreateMessageRequestSchema,
        async (request) => {
          try {
            this.logger.debug("Received sampling request:", request);
            const response = await this.mcpSamplingHandler.handleSamplingRequest(request);
            this.logger.debug("\u2705 Sampling request completed successfully");
            return response;
          } catch (error) {
            this.logger.error("\u274C Error handling sampling request:", error);
            if (error instanceof McpError) {
              throw error;
            }
            throw new McpError(
              `Sampling request failed: ${error instanceof Error ? error.message : String(error)}`,
              "SAMPLING_ERROR" /* SAMPLING_ERROR */,
              error instanceof Error ? error : void 0
            );
          }
        }
      );
      this.logger.debug("\u{1F3AF} Sampling handler registered successfully");
    } catch (error) {
      this.logger.error("Failed to setup sampling handler:", error);
      this.logger.debug(
        "\u26A0\uFE0F Sampling handler registration failed, continuing without sampling support"
      );
    }
  }
  /**
   * Set a new ADK sampling handler
   */
  setSamplingHandler(handler) {
    this.mcpSamplingHandler = new McpSamplingHandler(handler);
    if (this.client) {
      this.setupSamplingHandler(this.client).catch((error) => {
        this.logger.error("Failed to update ADK sampling handler:", error);
      });
    }
  }
  /**
   * Remove the sampling handler
   */
  removeSamplingHandler() {
    this.mcpSamplingHandler = null;
    if (this.client) {
      try {
        _optionalChain([this, 'access', _158 => _158.client, 'access', _159 => _159.removeRequestHandler, 'optionalCall', _160 => _160("sampling/createMessage")]);
      } catch (error) {
        this.logger.error("Failed to remove sampling handler:", error);
      }
    }
  }
}, _class22);

// src/tools/mcp/create-tool.ts
init_logger();
init_base_tool();

// src/tools/mcp/schema-conversion.ts

function adkToMcpToolType(tool) {
  const declaration = tool.getDeclaration();
  const params = declarationToJsonSchema(declaration);
  return {
    name: tool.name,
    description: tool.description || "",
    inputSchema: {
      type: "object",
      properties: params
    }
  };
}
function declarationToJsonSchema(declaration) {
  if (!declaration.parameters) {
    return {};
  }
  if (declaration.parameters.properties) {
    return declaration.parameters.properties;
  }
  return declaration.parameters;
}
function jsonSchemaToDeclaration(name, description, schema) {
  let parameters;
  if (schema) {
    if (typeof schema === "object" && "type" in schema && typeof schema.type === "string") {
      parameters = schema;
    } else {
      parameters = {
        type: _genai.Type.OBJECT,
        properties: schema
      };
    }
  } else {
    parameters = {
      type: _genai.Type.OBJECT,
      properties: {}
    };
  }
  return {
    name,
    description,
    parameters
  };
}
function normalizeJsonSchema(schema) {
  if (!schema) {
    return { type: _genai.Type.OBJECT, properties: {} };
  }
  const normalizedSchema = { ...schema };
  if (!normalizedSchema.type) {
    normalizedSchema.type = determineSchemaType(normalizedSchema);
  }
  switch (normalizedSchema.type) {
    case "object":
      return normalizeObjectSchema(normalizedSchema);
    case "array":
      return normalizeArraySchema(normalizedSchema);
    case "string":
      return normalizeStringSchema(normalizedSchema);
    case "number":
    case "integer":
      return normalizeNumberSchema(normalizedSchema);
    case "boolean":
      return { type: _genai.Type.BOOLEAN };
    case "null":
      return { type: _genai.Type.NULL };
    default:
      return normalizedSchema;
  }
}
function determineSchemaType(schema) {
  if (schema.properties || schema.required || schema.additionalProperties !== void 0) {
    return _genai.Type.OBJECT;
  }
  if (schema.items) {
    return _genai.Type.ARRAY;
  }
  if (schema.enum !== void 0) {
    if (schema.enum.length === 0) return _genai.Type.STRING;
    const firstItem = schema.enum[0];
    if (typeof firstItem === "string") return _genai.Type.STRING;
    if (typeof firstItem === "number") return _genai.Type.NUMBER;
    if (typeof firstItem === "boolean") return _genai.Type.BOOLEAN;
    return _genai.Type.STRING;
  }
  if (schema.minLength !== void 0 || schema.maxLength !== void 0 || schema.pattern) {
    return _genai.Type.STRING;
  }
  if (schema.minimum !== void 0 || schema.maximum !== void 0 || schema.exclusiveMinimum !== void 0 || schema.exclusiveMaximum !== void 0) {
    return schema.multipleOf === void 0 || schema.multipleOf % 1 === 0 ? _genai.Type.INTEGER : _genai.Type.NUMBER;
  }
  return _genai.Type.OBJECT;
}
function normalizeObjectSchema(schema) {
  const normalizedSchema = {
    type: _genai.Type.OBJECT,
    properties: {}
  };
  if (schema.properties) {
    normalizedSchema.properties = {};
    for (const [key, value] of Object.entries(schema.properties)) {
      normalizedSchema.properties[key] = normalizeJsonSchema(
        value
      );
    }
  }
  if (schema.required) normalizedSchema.required = schema.required;
  if (schema.title) normalizedSchema.title = schema.title;
  if (schema.description) normalizedSchema.description = schema.description;
  return normalizedSchema;
}
function normalizeArraySchema(schema) {
  const normalizedSchema = {
    type: _genai.Type.ARRAY
  };
  if (schema.items) {
    normalizedSchema.items = normalizeJsonSchema(
      schema.items
    );
  }
  if (schema.minItems !== void 0)
    normalizedSchema.minItems = schema.minItems;
  if (schema.maxItems !== void 0)
    normalizedSchema.maxItems = schema.maxItems;
  if (schema.title) normalizedSchema.title = schema.title;
  if (schema.description) normalizedSchema.description = schema.description;
  return normalizedSchema;
}
function normalizeStringSchema(schema) {
  const normalizedSchema = {
    type: _genai.Type.STRING
  };
  if (schema.minLength !== void 0)
    normalizedSchema.minLength = schema.minLength;
  if (schema.maxLength !== void 0)
    normalizedSchema.maxLength = schema.maxLength;
  if (schema.pattern) normalizedSchema.pattern = schema.pattern;
  if (schema.format) normalizedSchema.format = schema.format;
  if (schema.enum) normalizedSchema.enum = schema.enum;
  if (schema.title) normalizedSchema.title = schema.title;
  if (schema.description) normalizedSchema.description = schema.description;
  return normalizedSchema;
}
function normalizeNumberSchema(schema) {
  const normalizedSchema = {
    type: schema.type
  };
  if (schema.minimum !== void 0) normalizedSchema.minimum = schema.minimum;
  if (schema.maximum !== void 0) normalizedSchema.maximum = schema.maximum;
  if (schema.enum) normalizedSchema.enum = schema.enum;
  if (schema.title) normalizedSchema.title = schema.title;
  if (schema.description) normalizedSchema.description = schema.description;
  return normalizedSchema;
}
function mcpSchemaToParameters(mcpTool) {
  let schema;
  if (mcpTool.inputSchema) {
    schema = mcpTool.inputSchema;
  } else if (mcpTool.parameters) {
    schema = mcpTool.parameters;
  }
  if (!schema) {
    return {
      type: _genai.Type.OBJECT,
      properties: {}
    };
  }
  return normalizeJsonSchema(schema);
}

// src/tools/mcp/create-tool.ts
async function convertMcpToolToBaseTool(params) {
  try {
    return new McpToolAdapter(
      params.mcpTool,
      params.client,
      params.toolHandler
    );
  } catch (error) {
    if (!(error instanceof McpError)) {
      throw new McpError(
        `Failed to create tool from MCP tool: ${error instanceof Error ? error.message : String(error)}`,
        "invalid_schema_error" /* INVALID_SCHEMA_ERROR */,
        error instanceof Error ? error : void 0
      );
    }
    throw error;
  }
}
var McpToolAdapter = (_class23 = class extends BaseTool {
  
  
  __init37() {this.clientService = null}
  
  __init38() {this.logger = new Logger({ name: "McpToolAdapter" })}
  constructor(mcpTool, client, handler) {
    const metadata = mcpTool.metadata || {};
    super({
      name: mcpTool.name || `mcp_${Date.now()}`,
      description: mcpTool.description || "MCP Tool",
      isLongRunning: _nullishCoalesce(metadata.isLongRunning, () => ( false)),
      shouldRetryOnFailure: _nullishCoalesce(metadata.shouldRetryOnFailure, () => ( false)),
      maxRetryAttempts: _nullishCoalesce(metadata.maxRetryAttempts, () => ( 3))
    });_class23.prototype.__init37.call(this);_class23.prototype.__init38.call(this);;
    this.mcpTool = mcpTool;
    this.client = client;
    this.toolHandler = handler;
    if (client && client.reinitialize && typeof client.reinitialize === "function") {
      this.clientService = client;
    }
  }
  getDeclaration() {
    try {
      const parameters = mcpSchemaToParameters(this.mcpTool);
      return {
        name: this.name,
        description: this.description,
        parameters
      };
    } catch (error) {
      throw new McpError(
        `Failed to convert schema for tool ${this.name}: ${error instanceof Error ? error.message : String(error)}`,
        "invalid_schema_error" /* INVALID_SCHEMA_ERROR */,
        error instanceof Error ? error : void 0
      );
    }
  }
  async runAsync(args, _context) {
    this.logger.debug(`Executing MCP tool ${this.name} with args:`, args);
    try {
      if (typeof this.mcpTool.execute === "function") {
        return await this.mcpTool.execute(args);
      }
      if (this.clientService) {
        return await this.clientService.callTool(this.name, args);
      }
      if (this.client && typeof this.client.callTool === "function") {
        if (this.shouldRetryOnFailure) {
          const executeWithRetry = withRetry(
            async () => {
              return await this.client.callTool({
                name: this.name,
                arguments: args
              });
            },
            this,
            async () => {
              console.warn(
                `MCP tool ${this.name} encountered a closed resource, but cannot reinitialize client.`
              );
            },
            this.maxRetryAttempts
          );
          return await executeWithRetry();
        }
        const result = await this.client.callTool({
          name: this.name,
          arguments: args
        });
        return result;
      }
      if (this.toolHandler) {
        return await this.toolHandler(this.name, args);
      }
      throw new McpError(
        `Cannot execute MCP tool ${this.name}: No execution method found`,
        "tool_execution_error" /* TOOL_EXECUTION_ERROR */
      );
    } catch (error) {
      if (!(error instanceof McpError)) {
        console.error(`Error executing MCP tool ${this.name}:`, error);
        throw new McpError(
          `Error executing MCP tool ${this.name}: ${error instanceof Error ? error.message : String(error)}`,
          "tool_execution_error" /* TOOL_EXECUTION_ERROR */,
          error instanceof Error ? error : void 0
        );
      }
      throw error;
    }
  }
}, _class23);

// src/tools/mcp/servers.ts
function createMcpConfig(name, packageName, config = {}) {
  const {
    debug,
    description,
    retryOptions,
    env: envVars = {},
    samplingHandler
  } = config;
  const env = {};
  for (const [key, value] of Object.entries(envVars)) {
    if (value !== void 0) {
      env[key] = String(value);
    }
  }
  if (!env.PATH) {
    env.PATH = process.env.PATH || "";
  }
  return {
    name,
    description: description || `Client for ${name}`,
    debug: debug || false,
    retryOptions: retryOptions || { maxRetries: 2, initialDelay: 200 },
    transport: {
      mode: "stdio",
      command: "npx",
      args: ["-y", packageName],
      env
    },
    samplingHandler
  };
}
function McpAbi(config = {}) {
  const mcpConfig = createMcpConfig("ABI MCP Client", "@iqai/mcp-abi", config);
  return new McpToolset(mcpConfig);
}
function McpAtp(config = {}) {
  const mcpConfig = createMcpConfig("ATP MCP Client", "@iqai/mcp-atp", config);
  return new McpToolset(mcpConfig);
}
function McpBamm(config = {}) {
  const mcpConfig = createMcpConfig(
    "BAMM MCP Client",
    "@iqai/mcp-bamm",
    config
  );
  return new McpToolset(mcpConfig);
}
function McpFraxlend(config = {}) {
  const mcpConfig = createMcpConfig(
    "Fraxlend MCP Client",
    "@iqai/mcp-fraxlend",
    config
  );
  return new McpToolset(mcpConfig);
}
function McpIqWiki(config = {}) {
  const mcpConfig = createMcpConfig(
    "IQWiki MCP Client",
    "@iqai/mcp-iqwiki",
    config
  );
  return new McpToolset(mcpConfig);
}
function McpNearAgent(config = {}) {
  const mcpConfig = createMcpConfig(
    "NEAR Agent MCP Client",
    "@iqai/mcp-near-agent",
    config
  );
  return new McpToolset(mcpConfig);
}
function McpNearIntents(config = {}) {
  const mcpConfig = createMcpConfig(
    "Near Intents Swaps MCP Client",
    "@iqai/mcp-near-intents",
    config
  );
  return new McpToolset(mcpConfig);
}
function McpOdos(config = {}) {
  const mcpConfig = createMcpConfig(
    "ODOS MCP Client",
    "@iqai/mcp-odos",
    config
  );
  return new McpToolset(mcpConfig);
}
function McpTelegram(config = {}) {
  const mcpConfig = createMcpConfig(
    "Telegram MCP Client",
    "@iqai/mcp-telegram",
    config
  );
  return new McpToolset(mcpConfig);
}
function McpDiscord(config = {}) {
  const mcpConfig = createMcpConfig(
    "Discord MCP Client",
    "@iqai/mcp-discord",
    config
  );
  return new McpToolset(mcpConfig);
}
function McpCoinGecko(config = {}) {
  const mcpConfig = createMcpConfig(
    "CoinGecko MCP Client",
    "@coingecko/coingecko-mcp",
    config
  );
  return new McpToolset(mcpConfig);
}
function McpUpbit(config = {}) {
  const mcpConfig = createMcpConfig(
    "Upbit MCP Client",
    "@iqai/mcp-upbit",
    config
  );
  return new McpToolset(mcpConfig);
}
function McpFilesystem(config = {}) {
  const mcpConfig = createMcpConfig(
    "Filesystem MCP Client",
    "@modelcontextprotocol/server-filesystem",
    config
  );
  return new McpToolset(mcpConfig);
}
function McpMemory(config = {}) {
  const mcpConfig = createMcpConfig(
    "Memory MCP Client",
    "@modelcontextprotocol/server-memory",
    config
  );
  return new McpToolset(mcpConfig);
}
function McpGeneric(packageName, config = {}, name) {
  const clientName = name || `${packageName} Client`;
  const mcpConfig = createMcpConfig(clientName, packageName, config);
  return new McpToolset(mcpConfig);
}

// src/tools/mcp/index.ts
var McpToolset = (_class24 = class {
  
  __init39() {this.clientService = null}
  __init40() {this.toolFilter = null}
  __init41() {this.tools = []}
  __init42() {this.isClosing = false}
  constructor(config, toolFilter = null) {;_class24.prototype.__init39.call(this);_class24.prototype.__init40.call(this);_class24.prototype.__init41.call(this);_class24.prototype.__init42.call(this);
    this.config = config;
    this.toolFilter = toolFilter;
    this.clientService = new McpClientService(config);
  }
  /**
   * Checks if a tool should be included based on the tool filter.
   * Similar to Python's _is_selected method.
   */
  isSelected(tool, context4) {
    if (!this.toolFilter) {
      return true;
    }
    if (typeof this.toolFilter === "function") {
      return this.toolFilter(tool, context4);
    }
    if (Array.isArray(this.toolFilter)) {
      return this.toolFilter.includes(tool.name);
    }
    return true;
  }
  /**
   * Initializes the client service and establishes a connection.
   */
  async initialize() {
    if (this.isClosing) {
      throw new McpError(
        "Cannot initialize a toolset that is being closed",
        "resource_closed_error" /* RESOURCE_CLOSED_ERROR */
      );
    }
    if (!this.clientService) {
      this.clientService = new McpClientService(this.config);
    }
    await this.clientService.initialize();
    return this.clientService;
  }
  /**
   * Set a sampling handler for this MCP toolset.
   * This allows MCP servers to request LLM completions through your ADK agent.
   *
   * @param handler - ADK sampling handler that receives ADK-formatted messages
   */
  setSamplingHandler(handler) {
    if (!this.clientService) {
      this.clientService = new McpClientService(this.config);
    }
    this.clientService.setSamplingHandler(handler);
    if (this.config.debug) {
      console.log("\u{1F3AF} Sampling handler set for MCP toolset");
    }
  }
  /**
   * Remove the sampling handler
   */
  removeSamplingHandler() {
    if (this.clientService) {
      this.clientService.removeSamplingHandler();
      if (this.config.debug) {
        console.log("\u{1F6AB} Sampling handler removed from MCP toolset");
      }
    }
  }
  /**
   * Retrieves tools from the MCP server and converts them to BaseTool instances.
   * Similar to Python's get_tools method.
   */
  async getTools(context4) {
    try {
      if (this.isClosing) {
        throw new McpError(
          "Cannot get tools from a toolset that is being closed",
          "resource_closed_error" /* RESOURCE_CLOSED_ERROR */
        );
      }
      if (this.tools.length > 0 && !_optionalChain([this, 'access', _161 => _161.config, 'access', _162 => _162.cacheConfig, 'optionalAccess', _163 => _163.enabled]) === false) {
        return this.tools;
      }
      if (!this.clientService) {
        await this.initialize();
      }
      const client = await this.clientService.initialize();
      const toolsResponse = await client.listTools();
      if (!toolsResponse.tools || !Array.isArray(toolsResponse.tools)) {
        console.warn("MCP server returned no tools or invalid tools array");
        return [];
      }
      const tools = [];
      for (const mcpTool of toolsResponse.tools) {
        if (this.isSelected(mcpTool, context4)) {
          try {
            const tool = await convertMcpToolToBaseTool({
              mcpTool,
              client
            });
            tools.push(tool);
          } catch (toolError) {
            console.error(
              `Failed to create tool from MCP tool "${mcpTool.name}":`,
              toolError
            );
          }
        }
      }
      if (_optionalChain([this, 'access', _164 => _164.config, 'access', _165 => _165.cacheConfig, 'optionalAccess', _166 => _166.enabled]) !== false) {
        this.tools = tools;
      }
      return tools;
    } catch (error) {
      if (!(error instanceof McpError)) {
        console.error("Error retrieving MCP tools:", error);
        throw new McpError(
          `Error retrieving MCP tools: ${error instanceof Error ? error.message : String(error)}`,
          "connection_error" /* CONNECTION_ERROR */,
          error instanceof Error ? error : void 0
        );
      }
      throw error;
    }
  }
  /**
   * Converts ADK tools to MCP tool format for bidirectional support
   */
  convertADKToolsToMCP(tools) {
    return tools.map((tool) => adkToMcpToolType(tool));
  }
  /**
   * Refreshes the tool cache by clearing it and fetching tools again
   */
  async refreshTools(context4) {
    this.tools = [];
    return this.getTools(context4);
  }
  /**
   * Closes the connection to the MCP server.
   * Similar to Python's close method.
   */
  async close() {
    if (this.isClosing) {
      return;
    }
    try {
      this.isClosing = true;
      if (this.clientService) {
        await this.clientService.close();
        this.clientService = null;
      }
      this.tools = [];
      if (this.config.debug) {
        console.log("\u2705 MCP toolset closed successfully");
      }
    } catch (error) {
      console.error("Error closing MCP toolset:", error);
    } finally {
      this.isClosing = false;
    }
  }
  /**
   * Disposes of all resources. This method should be called when the toolset is no longer needed.
   * Provides alignment with disposal patterns common in TypeScript.
   */
  async dispose() {
    await this.close();
  }
}, _class24);
async function getMcpTools(config, toolFilter) {
  const toolset = new McpToolset(config, toolFilter);
  try {
    return await toolset.getTools();
  } finally {
    await toolset.close().catch((err) => console.error("Error closing toolset:", err));
  }
}

// src/flows/llm-flows/functions.ts

var AF_FUNCTION_CALL_ID_PREFIX = "adk-";
var REQUEST_EUC_FUNCTION_CALL_NAME = "adk_request_credential";
function generateClientFunctionCallId() {
  return `${AF_FUNCTION_CALL_ID_PREFIX}${crypto.randomUUID()}`;
}
function populateClientFunctionCallId(modelResponseEvent) {
  const functionCalls = modelResponseEvent.getFunctionCalls();
  if (!functionCalls) {
    return;
  }
  for (const functionCall of functionCalls) {
    if (!functionCall.id) {
      functionCall.id = generateClientFunctionCallId();
    }
  }
}
function removeClientFunctionCallId(content) {
  if (_optionalChain([content, 'optionalAccess', _167 => _167.parts])) {
    for (const part of content.parts) {
      if (_optionalChain([part, 'access', _168 => _168.functionCall, 'optionalAccess', _169 => _169.id, 'optionalAccess', _170 => _170.startsWith, 'call', _171 => _171(AF_FUNCTION_CALL_ID_PREFIX)])) {
        part.functionCall.id = void 0;
      }
      if (_optionalChain([part, 'access', _172 => _172.functionResponse, 'optionalAccess', _173 => _173.id, 'optionalAccess', _174 => _174.startsWith, 'call', _175 => _175(AF_FUNCTION_CALL_ID_PREFIX)])) {
        part.functionResponse.id = void 0;
      }
    }
  }
}
function getLongRunningFunctionCalls(functionCalls, toolsDict) {
  const longRunningToolIds = /* @__PURE__ */ new Set();
  for (const functionCall of functionCalls) {
    if (functionCall.id && functionCall.name in toolsDict && toolsDict[functionCall.name].isLongRunning) {
      longRunningToolIds.add(functionCall.id);
    }
  }
  return longRunningToolIds;
}
function generateAuthEvent(invocationContext, functionResponseEvent) {
  if (!functionResponseEvent.actions.requestedAuthConfigs) {
    return null;
  }
  const parts = [];
  const longRunningToolIds = /* @__PURE__ */ new Set();
  for (const [functionCallId, authConfig] of Object.entries(
    functionResponseEvent.actions.requestedAuthConfigs
  )) {
    const requestEucFunctionCall = {
      name: REQUEST_EUC_FUNCTION_CALL_NAME,
      args: {
        function_call_id: functionCallId,
        auth_config: authConfig
      }
    };
    requestEucFunctionCall.id = generateClientFunctionCallId();
    longRunningToolIds.add(requestEucFunctionCall.id);
    parts.push({ functionCall: requestEucFunctionCall });
  }
  return new Event({
    invocationId: invocationContext.invocationId,
    author: invocationContext.agent.name,
    branch: invocationContext.branch,
    content: {
      parts,
      role: functionResponseEvent.content.role
    },
    longRunningToolIds
  });
}
async function handleFunctionCallsAsync(invocationContext, functionCallEvent, toolsDict, filters) {
  const agent = invocationContext.agent;
  if (!isLlmAgent2(agent)) {
    return null;
  }
  const functionCalls = functionCallEvent.getFunctionCalls();
  if (!functionCalls) {
    return null;
  }
  const functionResponseEvents = [];
  for (const functionCall of functionCalls) {
    if (filters && functionCall.id && !filters.has(functionCall.id)) {
      continue;
    }
    const { tool, toolContext } = getToolAndContext(
      invocationContext,
      functionCallEvent,
      functionCall,
      toolsDict
    );
    const functionArgs = functionCall.args || {};
    const tracer2 = telemetryService.getTracer();
    const span = tracer2.startSpan(`execute_tool ${tool.name}`);
    const spanContext = _api.trace.setSpan(_api.context.active(), span);
    try {
      const functionResponse = await _api.context.with(spanContext, async () => {
        const result = await callToolAsync(tool, functionArgs, toolContext);
        if (tool.isLongRunning && !result) {
          return null;
        }
        const functionResponseEvent = buildResponseEvent(
          tool,
          result,
          toolContext,
          invocationContext
        );
        telemetryService.traceToolCall(
          tool,
          functionArgs,
          functionResponseEvent
        );
        return { result, event: functionResponseEvent };
      });
      if (!functionResponse) {
        continue;
      }
      functionResponseEvents.push(functionResponse.event);
      span.setStatus({ code: 1 });
    } catch (error) {
      span.recordException(error);
      span.setStatus({ code: 2, message: error.message });
      throw error;
    } finally {
      span.end();
    }
  }
  if (!functionResponseEvents.length) {
    return null;
  }
  return mergeParallelFunctionResponseEvents(functionResponseEvents);
}
async function handleFunctionCallsLive(invocationContext, functionCallEvent, toolsDict) {
  return handleFunctionCallsAsync(
    invocationContext,
    functionCallEvent,
    toolsDict
  );
}
function getToolAndContext(invocationContext, functionCallEvent, functionCall, toolsDict) {
  if (!(functionCall.name in toolsDict)) {
    throw new Error(
      `Function ${functionCall.name} is not found in the tools_dict.`
    );
  }
  const toolContext = new ToolContext(invocationContext, {
    functionCallId: functionCall.id || ""
  });
  const tool = toolsDict[functionCall.name];
  return { tool, toolContext };
}
async function callToolAsync(tool, args, toolContext) {
  return await tool.runAsync(args, toolContext);
}
function buildResponseEvent(tool, functionResult, toolContext, invocationContext) {
  let result = functionResult;
  if (typeof functionResult !== "object" || functionResult === null) {
    result = { result: functionResult };
  }
  const partFunctionResponse = {
    functionResponse: {
      name: tool.name,
      response: result,
      id: toolContext.functionCallId
    }
  };
  const content = {
    role: "user",
    parts: [partFunctionResponse]
  };
  return new Event({
    invocationId: invocationContext.invocationId,
    author: invocationContext.agent.name,
    content,
    actions: toolContext.actions,
    branch: invocationContext.branch
  });
}
function mergeParallelFunctionResponseEvents(functionResponseEvents) {
  if (!functionResponseEvents.length) {
    throw new Error("No function response events provided.");
  }
  if (functionResponseEvents.length === 1) {
    return functionResponseEvents[0];
  }
  const mergedParts = [];
  for (const event of functionResponseEvents) {
    if (_optionalChain([event, 'access', _176 => _176.content, 'optionalAccess', _177 => _177.parts])) {
      for (const part of event.content.parts) {
        mergedParts.push(part);
      }
    }
  }
  const baseEvent = functionResponseEvents[0];
  const mergedActions = new EventActions();
  const mergedRequestedAuthConfigs = {};
  for (const event of functionResponseEvents) {
    Object.assign(
      mergedRequestedAuthConfigs,
      event.actions.requestedAuthConfigs
    );
    Object.assign(mergedActions, event.actions);
  }
  mergedActions.requestedAuthConfigs = mergedRequestedAuthConfigs;
  const mergedEvent = new Event({
    invocationId: Event.newId(),
    author: baseEvent.author,
    branch: baseEvent.branch,
    content: { role: "user", parts: mergedParts },
    actions: mergedActions
  });
  mergedEvent.timestamp = baseEvent.timestamp;
  return mergedEvent;
}
function isLlmAgent2(agent) {
  return agent && typeof agent === "object" && "canonicalModel" in agent;
}

// src/flows/llm-flows/base-llm-flow.ts
var _ADK_AGENT_NAME_LABEL_KEY = "adk_agent_name";
var BaseLlmFlow = (_class25 = class {constructor() { _class25.prototype.__init43.call(this);_class25.prototype.__init44.call(this);_class25.prototype.__init45.call(this); }
  __init43() {this.requestProcessors = []}
  __init44() {this.responseProcessors = []}
  __init45() {this.logger = new Logger({ name: "BaseLlmFlow" })}
  async *runAsync(invocationContext) {
    this.logger.debug(`Agent '${invocationContext.agent.name}' started.`);
    let stepCount = 0;
    while (true) {
      stepCount++;
      let lastEvent = null;
      for await (const event of this._runOneStepAsync(invocationContext)) {
        lastEvent = event;
        yield event;
      }
      if (!lastEvent || lastEvent.isFinalResponse()) {
        this.logger.debug(
          `Agent '${invocationContext.agent.name}' finished after ${stepCount} steps.`
        );
        break;
      }
      if (lastEvent.partial) {
        this.logger.error(
          "Partial event encountered. LLM max output limit may be reached."
        );
        throw new Error(
          "Last event shouldn't be partial. LLM max output limit may be reached."
        );
      }
    }
  }
  async *runLive(invocationContext) {
    this.logger.warn("\u26A0\uFE0F runLive not fully implemented, delegating to runAsync");
    yield* this.runAsync(invocationContext);
  }
  async *_runOneStepAsync(invocationContext) {
    const llmRequest = new LlmRequest();
    let preprocessEventCount = 0;
    for await (const event of this._preprocessAsync(
      invocationContext,
      llmRequest
    )) {
      preprocessEventCount++;
      yield event;
    }
    if (invocationContext.endInvocation) {
      this.logger.debug("Invocation ended during preprocessing.");
      return;
    }
    const modelResponseEvent = new Event({
      id: Event.newId(),
      invocationId: invocationContext.invocationId,
      author: invocationContext.agent.name,
      branch: invocationContext.branch
    });
    let llmResponseCount = 0;
    for await (const llmResponse of this._callLlmAsync(
      invocationContext,
      llmRequest,
      modelResponseEvent
    )) {
      llmResponseCount++;
      for await (const event of this._postprocessAsync(
        invocationContext,
        llmRequest,
        llmResponse,
        modelResponseEvent
      )) {
        modelResponseEvent.id = Event.newId();
        yield event;
      }
    }
  }
  async *_preprocessAsync(invocationContext, llmRequest) {
    const agent = invocationContext.agent;
    if (!("canonicalTools" in agent) || typeof agent.canonicalTools !== "function") {
      return;
    }
    for (const processor of this.requestProcessors) {
      for await (const event of processor.runAsync(
        invocationContext,
        llmRequest
      )) {
        yield event;
      }
    }
    let tools = await agent.canonicalTools(
      new ReadonlyContext(invocationContext)
    );
    if (tools.length > 1) {
      const seen = /* @__PURE__ */ new Set();
      const filtered = [];
      for (const t of tools) {
        const name = _optionalChain([t, 'optionalAccess', _178 => _178.name]);
        if (!name) continue;
        if (seen.has(name)) {
          continue;
        }
        seen.add(name);
        filtered.push(t);
      }
      tools = filtered;
    }
    for (const tool of tools) {
      const toolContext = new ToolContext(invocationContext);
      await tool.processLlmRequest(toolContext, llmRequest);
    }
    if (tools.length > 0) {
      const toolsData = tools.map((tool) => ({
        Name: tool.name,
        Description: _optionalChain([tool, 'access', _179 => _179.description, 'optionalAccess', _180 => _180.substring, 'call', _181 => _181(0, 50)]) + (_optionalChain([tool, 'access', _182 => _182.description, 'optionalAccess', _183 => _183.length]) > 50 ? "..." : ""),
        "Long Running": tool.isLongRunning ? "Yes" : "No"
      }));
      this.logger.debugArray("\u{1F6E0}\uFE0F Available Tools", toolsData);
    }
  }
  async *_postprocessAsync(invocationContext, llmRequest, llmResponse, modelResponseEvent) {
    for await (const event of this._postprocessRunProcessorsAsync(
      invocationContext,
      llmResponse
    )) {
      yield event;
    }
    if (!llmResponse.content && !llmResponse.errorCode && !llmResponse.interrupted) {
      return;
    }
    const finalizedEvent = this._finalizeModelResponseEvent(
      llmRequest,
      llmResponse,
      modelResponseEvent
    );
    yield finalizedEvent;
    const functionCalls = finalizedEvent.getFunctionCalls();
    if (functionCalls && functionCalls.length > 0) {
      const functionCallsData = functionCalls.map((fc) => ({
        Name: fc.name,
        Arguments: JSON.stringify(fc.args).substring(0, 100) + (JSON.stringify(fc.args).length > 100 ? "..." : ""),
        ID: fc.id || "auto"
      }));
      this.logger.debugArray("\u{1F527} Function Calls", functionCallsData);
      for await (const event of this._postprocessHandleFunctionCallsAsync(
        invocationContext,
        finalizedEvent,
        llmRequest
      )) {
        yield event;
      }
    }
  }
  async *_postprocessLive(invocationContext, llmRequest, llmResponse, modelResponseEvent) {
    for await (const event of this._postprocessRunProcessorsAsync(
      invocationContext,
      llmResponse
    )) {
      yield event;
    }
    if (!llmResponse.content && !llmResponse.errorCode && !llmResponse.interrupted && !llmResponse.turnComplete) {
      return;
    }
    const finalizedEvent = this._finalizeModelResponseEvent(
      llmRequest,
      llmResponse,
      modelResponseEvent
    );
    yield finalizedEvent;
    if (finalizedEvent.getFunctionCalls()) {
      const functionResponseEvent = await handleFunctionCallsAsync(
        invocationContext,
        finalizedEvent,
        llmRequest.toolsDict || {}
      );
      if (functionResponseEvent) {
        yield functionResponseEvent;
        const transferToAgent = _optionalChain([functionResponseEvent, 'access', _184 => _184.actions, 'optionalAccess', _185 => _185.transferToAgent]);
        if (transferToAgent) {
          this.logger.debug(`\u{1F504} Live transfer to agent '${transferToAgent}'`);
          const agentToRun = this._getAgentToRun(
            invocationContext,
            transferToAgent
          );
          for await (const event of _optionalChain([agentToRun, 'access', _186 => _186.runLive, 'optionalCall', _187 => _187(invocationContext)]) || agentToRun.runAsync(invocationContext)) {
            yield event;
          }
        }
      }
    }
  }
  async *_postprocessRunProcessorsAsync(invocationContext, llmResponse) {
    for (const processor of this.responseProcessors) {
      for await (const event of processor.runAsync(
        invocationContext,
        llmResponse
      )) {
        yield event;
      }
    }
  }
  async *_postprocessHandleFunctionCallsAsync(invocationContext, functionCallEvent, llmRequest) {
    const functionResponseEvent = await handleFunctionCallsAsync(
      invocationContext,
      functionCallEvent,
      llmRequest.toolsDict || {}
    );
    if (functionResponseEvent) {
      const authEvent = generateAuthEvent(
        invocationContext,
        functionResponseEvent
      );
      if (authEvent) {
        yield authEvent;
      }
      yield functionResponseEvent;
      const transferToAgent = _optionalChain([functionResponseEvent, 'access', _188 => _188.actions, 'optionalAccess', _189 => _189.transferToAgent]);
      if (transferToAgent) {
        this.logger.debug(`\u{1F504} Transferring to agent '${transferToAgent}'`);
        const agentToRun = this._getAgentToRun(
          invocationContext,
          transferToAgent
        );
        for await (const event of agentToRun.runAsync(invocationContext)) {
          yield event;
        }
      }
    }
  }
  _getAgentToRun(invocationContext, agentName) {
    const rootAgent = invocationContext.agent.rootAgent;
    const agentToRun = rootAgent.findAgent(agentName);
    if (!agentToRun) {
      this.logger.error(`Agent '${agentName}' not found in the agent tree.`);
      throw new Error(`Agent ${agentName} not found in the agent tree.`);
    }
    return agentToRun;
  }
  async *_callLlmAsync(invocationContext, llmRequest, modelResponseEvent) {
    const beforeModelCallbackContent = await this._handleBeforeModelCallback(
      invocationContext,
      llmRequest,
      modelResponseEvent
    );
    if (beforeModelCallbackContent) {
      yield beforeModelCallbackContent;
      return;
    }
    llmRequest.config = llmRequest.config || {};
    llmRequest.config.labels = llmRequest.config.labels || {};
    if (!(_ADK_AGENT_NAME_LABEL_KEY in llmRequest.config.labels)) {
      llmRequest.config.labels[_ADK_AGENT_NAME_LABEL_KEY] = invocationContext.agent.name;
    }
    const llm = this.__getLlm(invocationContext);
    const runConfig = invocationContext.runConfig;
    if (runConfig.supportCfc) {
      this.logger.warn(
        "CFC (supportCfc) not fully implemented, using standard flow."
      );
    }
    invocationContext.incrementLlmCallCount();
    const isStreaming = invocationContext.runConfig.streamingMode === "sse" /* SSE */;
    let tools = _optionalChain([llmRequest, 'access', _190 => _190.config, 'optionalAccess', _191 => _191.tools]) || [];
    if (tools.length) {
      const deduped = [];
      const seenFn = /* @__PURE__ */ new Set();
      for (const t of tools) {
        const tool = t;
        if (tool && Array.isArray(tool.functionDeclarations)) {
          const newFds = tool.functionDeclarations.filter(
            (fd) => {
              if (_optionalChain([fd, 'optionalAccess', _192 => _192.name])) {
                if (seenFn.has(fd.name)) {
                  return false;
                }
                seenFn.add(fd.name);
              }
              return true;
            }
          );
          if (newFds.length) {
            deduped.push({ ...tool, functionDeclarations: newFds });
          }
        } else if (_optionalChain([tool, 'optionalAccess', _193 => _193.name])) {
          if (seenFn.has(tool.name)) continue;
          seenFn.add(tool.name);
          deduped.push(tool);
        } else {
          deduped.push(tool);
        }
      }
      if (deduped.length !== tools.length) {
        this.logger.debug(
          `\u{1F501} Deduplicated tool/function declarations: ${tools.length} -> ${deduped.length}`
        );
      }
      llmRequest.config.tools = tools = deduped;
    }
    const toolNames = tools.map((tool) => {
      if (tool.functionDeclarations && Array.isArray(tool.functionDeclarations)) {
        return tool.functionDeclarations.map((fn) => fn.name).join(", ");
      }
      if (tool.name) return tool.name;
      if (_optionalChain([tool, 'access', _194 => _194.function, 'optionalAccess', _195 => _195.name])) return tool.function.name;
      if (_optionalChain([tool, 'access', _196 => _196.function, 'optionalAccess', _197 => _197.function, 'optionalAccess', _198 => _198.name])) return tool.function.function.name;
      return "unknown";
    }).join(", ");
    const systemInstruction = llmRequest.getSystemInstructionText() || "";
    const truncatedSystemInstruction = systemInstruction.length > 100 ? `${systemInstruction.substring(0, 100)}...` : systemInstruction;
    const contentPreview = _optionalChain([llmRequest, 'access', _199 => _199.contents, 'optionalAccess', _200 => _200.length]) > 0 ? LogFormatter.formatContentPreview(llmRequest.contents[0]) : "none";
    this.logger.debugStructured("\u{1F4E4} LLM Request", {
      Model: llm.model,
      Agent: invocationContext.agent.name,
      "Content Items": _optionalChain([llmRequest, 'access', _201 => _201.contents, 'optionalAccess', _202 => _202.length]) || 0,
      "Content Preview": contentPreview,
      "System Instruction": truncatedSystemInstruction || "none",
      "Available Tools": toolNames || "none",
      "Tool Count": _optionalChain([llmRequest, 'access', _203 => _203.config, 'optionalAccess', _204 => _204.tools, 'optionalAccess', _205 => _205.length]) || 0,
      Streaming: isStreaming ? "Yes" : "No"
    });
    let responseCount = 0;
    for await (const llmResponse of llm.generateContentAsync(
      llmRequest,
      isStreaming
    )) {
      responseCount++;
      traceLlmCall(
        invocationContext,
        modelResponseEvent.id,
        llmRequest,
        llmResponse
      );
      const tokenCount = _optionalChain([llmResponse, 'access', _206 => _206.usageMetadata, 'optionalAccess', _207 => _207.totalTokenCount]) || "unknown";
      const functionCalls = _optionalChain([llmResponse, 'access', _208 => _208.content, 'optionalAccess', _209 => _209.parts, 'optionalAccess', _210 => _210.filter, 'call', _211 => _211((part) => part.functionCall)]) || [];
      const functionCallsDisplay = LogFormatter.formatFunctionCalls(functionCalls);
      const responsePreview = LogFormatter.formatResponsePreview(llmResponse);
      this.logger.debugStructured("\u{1F4E5} LLM Response", {
        Model: llm.model,
        "Token Count": tokenCount,
        "Function Calls": functionCallsDisplay,
        "Response Preview": responsePreview,
        "Finish Reason": llmResponse.finishReason || "unknown",
        "Response #": responseCount,
        Partial: llmResponse.partial ? "Yes" : "No",
        Error: llmResponse.errorCode || "none"
      });
      const alteredLlmResponse = await this._handleAfterModelCallback(
        invocationContext,
        llmResponse,
        modelResponseEvent
      );
      yield alteredLlmResponse || llmResponse;
    }
  }
  async _handleBeforeModelCallback(invocationContext, llmRequest, modelResponseEvent) {
    const agent = invocationContext.agent;
    if (!("canonicalBeforeModelCallbacks" in agent)) {
      return;
    }
    const beforeCallbacks = agent.canonicalBeforeModelCallbacks;
    if (!beforeCallbacks) {
      return;
    }
    const callbackContext = new CallbackContext(invocationContext, {
      eventActions: modelResponseEvent.actions
    });
    for (const callback of beforeCallbacks) {
      let beforeModelCallbackContent = callback({
        callbackContext,
        llmRequest
      });
      if (beforeModelCallbackContent instanceof Promise) {
        beforeModelCallbackContent = await beforeModelCallbackContent;
      }
      if (beforeModelCallbackContent) {
        return beforeModelCallbackContent;
      }
    }
  }
  async _handleAfterModelCallback(invocationContext, llmResponse, modelResponseEvent) {
    const agent = invocationContext.agent;
    if (!("canonicalAfterModelCallbacks" in agent)) {
      return;
    }
    const afterCallbacks = agent.canonicalAfterModelCallbacks;
    if (!afterCallbacks) {
      return;
    }
    const callbackContext = new CallbackContext(invocationContext, {
      eventActions: modelResponseEvent.actions
    });
    for (const callback of afterCallbacks) {
      let afterModelCallbackContent = callback({
        callbackContext,
        llmResponse
      });
      if (afterModelCallbackContent instanceof Promise) {
        afterModelCallbackContent = await afterModelCallbackContent;
      }
      if (afterModelCallbackContent) {
        return afterModelCallbackContent;
      }
    }
  }
  _finalizeModelResponseEvent(llmRequest, llmResponse, modelResponseEvent) {
    const eventData = { ...modelResponseEvent };
    const responseData = { ...llmResponse };
    Object.keys(responseData).forEach((key) => {
      if (responseData[key] !== null && responseData[key] !== void 0) {
        eventData[key] = responseData[key];
      }
    });
    const event = new Event(eventData);
    if (event.content) {
      const functionCalls = event.getFunctionCalls();
      if (functionCalls) {
        populateClientFunctionCallId(event);
        event.longRunningToolIds = getLongRunningFunctionCalls(
          functionCalls,
          llmRequest.toolsDict || {}
        );
      }
    }
    return event;
  }
  __getLlm(invocationContext) {
    const llm = invocationContext.agent.canonicalModel;
    return llm;
  }
}, _class25);

// src/flows/llm-flows/base-llm-processor.ts
var BaseLlmRequestProcessor = class {
};
var BaseLlmResponseProcessor = class {
};

// src/auth/auth-tool.ts
var EnhancedAuthConfig = class {
  /**
   * The authentication scheme
   */
  
  /**
   * Raw auth credential used to collect credentials
   * Used in auth schemes that need to exchange credentials (e.g. OAuth2, OIDC)
   */
  
  /**
   * Exchanged auth credential after processing
   * Filled by ADK and client working together
   */
  
  /**
   * User-specified key for credential storage and retrieval
   */
  
  /**
   * Additional context properties
   */
  
  /**
   * Constructor for EnhancedAuthConfig
   */
  constructor(config) {
    this.authScheme = config.authScheme;
    this.rawAuthCredential = config.rawAuthCredential;
    this.exchangedAuthCredential = config.exchangedAuthCredential;
    this.context = config.context;
    this.credentialKey = config.credentialKey || this.generateCredentialKey();
  }
  /**
   * Generates a credential key based on auth scheme and raw credential
   * Used for saving/loading credentials from credential service
   */
  generateCredentialKey() {
    const schemeKey = this.authScheme.type || "unknown";
    const credentialKey = _optionalChain([this, 'access', _212 => _212.rawAuthCredential, 'optionalAccess', _213 => _213.type]) || "none";
    const timestamp = Date.now();
    return `adk_${schemeKey}_${credentialKey}_${timestamp}`;
  }
  /**
   * Gets the credential key for storage
   */
  getCredentialKey() {
    return this.credentialKey || this.generateCredentialKey();
  }
};
var AuthTool = class {
  /**
   * Processes auth tool arguments and returns appropriate response
   */
  static async processAuthRequest(args) {
    try {
      const { function_call_id, auth_config } = args;
      let credentialKey;
      if (auth_config instanceof EnhancedAuthConfig) {
        credentialKey = auth_config.getCredentialKey();
      } else {
        credentialKey = `adk_${auth_config.authScheme.type}_${Date.now()}`;
      }
      return {
        status: "auth_request_processed",
        authConfig: auth_config,
        credentialKey
      };
    } catch (error) {
      return {
        status: "auth_request_failed"
      };
    }
  }
  /**
   * Validates auth tool arguments
   */
  static validateAuthArguments(args) {
    return typeof args === "object" && typeof args.function_call_id === "string" && args.auth_config && typeof args.auth_config === "object";
  }
};
function createAuthToolArguments(functionCallId, authConfig) {
  return {
    function_call_id: functionCallId,
    auth_config: authConfig
  };
}
function isEnhancedAuthConfig(config) {
  return config instanceof EnhancedAuthConfig;
}

// src/auth/auth-preprocessor.ts
var AuthLlmRequestProcessor = class extends BaseLlmRequestProcessor {
  /**
   * Processes authentication information from session events
   * and resumes function calls that required authentication
   */
  async *runAsync(invocationContext, llmRequest) {
    const agent = invocationContext.agent;
    if (!agent || typeof agent.canonicalTools !== "function") {
      return;
    }
    const events = invocationContext.session.events;
    if (!events || events.length === 0) {
      return;
    }
    const requestEucFunctionCallIds = /* @__PURE__ */ new Set();
    for (let i = events.length - 1; i >= 0; i--) {
      const event = events[i];
      if (!event.author || event.author !== "user") {
        continue;
      }
      const responses = event.getFunctionResponses();
      if (!responses || responses.length === 0) {
        return;
      }
      for (const functionCallResponse of responses) {
        if (functionCallResponse.name !== REQUEST_EUC_FUNCTION_CALL_NAME) {
          continue;
        }
        requestEucFunctionCallIds.add(functionCallResponse.id);
        try {
          const authConfig = EnhancedAuthConfig.prototype.constructor(
            JSON.parse(functionCallResponse.response)
          );
          const authHandler = new AuthHandler({
            authConfig
          });
          this.parseAndStoreAuthResponse(authHandler, invocationContext);
        } catch (error) {
          console.warn("Failed to parse auth response:", error);
        }
      }
      break;
    }
    if (requestEucFunctionCallIds.size === 0) {
      return;
    }
    for (let i = events.length - 2; i >= 0; i--) {
      const event = events[i];
      const functionCalls = event.getFunctionCalls();
      if (!functionCalls || functionCalls.length === 0) {
        continue;
      }
      const toolsToResume = /* @__PURE__ */ new Set();
      for (const functionCall of functionCalls) {
        if (!requestEucFunctionCallIds.has(functionCall.id)) {
          continue;
        }
        try {
          const args = JSON.parse(functionCall.args);
          toolsToResume.add(args.function_call_id);
        } catch (error) {
          console.warn("Failed to parse auth tool arguments:", error);
        }
      }
      if (toolsToResume.size === 0) {
        continue;
      }
      for (let j = i - 1; j >= 0; j--) {
        const originalEvent = events[j];
        const originalFunctionCalls = originalEvent.getFunctionCalls();
        if (!originalFunctionCalls || originalFunctionCalls.length === 0) {
          continue;
        }
        const hasMatchingCall = originalFunctionCalls.some(
          (functionCall) => toolsToResume.has(functionCall.id)
        );
        if (hasMatchingCall) {
          const readonlyContext = new ReadonlyContext(invocationContext);
          const canonicalTools = await agent.canonicalTools(
            readonlyContext
          );
          const toolsMap = Object.fromEntries(
            canonicalTools.map((tool) => [tool.name, tool])
          );
          const functionResponseEvent = await handleFunctionCallsAsync(
            invocationContext,
            originalEvent,
            toolsMap,
            toolsToResume
          );
          if (functionResponseEvent) {
            yield functionResponseEvent;
          }
          return;
        }
      }
      return;
    }
  }
  /**
   * Parses and stores authentication response in session state
   */
  parseAndStoreAuthResponse(authHandler, invocationContext) {
    try {
      const credentialKey = _optionalChain([authHandler, 'access', _214 => _214.authConfig, 'access', _215 => _215.context, 'optionalAccess', _216 => _216.credentialKey]) || `temp:${Date.now()}`;
      const fullCredentialKey = credentialKey.startsWith("temp:") ? credentialKey : `temp:${credentialKey}`;
      invocationContext.session.state[fullCredentialKey] = authHandler.credential;
      if (authHandler.authConfig.authScheme.type === "oauth2" || authHandler.authConfig.authScheme.type === "openIdConnect") {
      }
    } catch (error) {
      console.warn("Failed to store auth response:", error);
    }
  }
};
var requestProcessor = new AuthLlmRequestProcessor();

// src/flows/llm-flows/basic.ts
init_logger();
var BasicLlmRequestProcessor = class extends BaseLlmRequestProcessor {
  async *runAsync(invocationContext, llmRequest) {
    const agent = invocationContext.agent;
    if (!this.isLlmAgent(agent)) {
      return;
    }
    llmRequest.model = typeof agent.canonicalModel === "string" ? agent.canonicalModel : agent.canonicalModel.model;
    if (agent.generateContentConfig) {
      llmRequest.config = JSON.parse(
        JSON.stringify(agent.generateContentConfig)
      );
    } else {
      llmRequest.config = {};
    }
    if (agent.outputSchema) {
      const hasTools = await _asyncOptionalChain([(await _optionalChain([agent, 'access', _217 => _217.canonicalTools, 'optionalCall', _218 => _218(invocationContext)])), 'optionalAccess', async _219 => _219.length]) > 0;
      const hasTransfers = !!("subAgents" in agent && agent.subAgents && agent.subAgents.length > 0 && !(agent.disallowTransferToParent && agent.disallowTransferToPeers));
      if (!hasTools && !hasTransfers) {
        llmRequest.setOutputSchema(agent.outputSchema);
      } else {
        (() => {
          try {
            const logger = new Logger({ name: "BasicLlmRequestProcessor" });
            logger.debug(
              `Skipping request-level output schema for agent ${agent.name} because tools/transfers are present. Schema will be validated during response processing.`
            );
          } catch (e) {
          }
        })();
      }
    }
    const runConfig = invocationContext.runConfig;
    if (!llmRequest.liveConnectConfig) {
      llmRequest.liveConnectConfig = {};
    }
    if (runConfig.responseModalities) {
      llmRequest.liveConnectConfig.responseModalities = runConfig.responseModalities;
    }
    llmRequest.liveConnectConfig.speechConfig = runConfig.speechConfig;
    llmRequest.liveConnectConfig.outputAudioTranscription = runConfig.outputAudioTranscription;
    llmRequest.liveConnectConfig.inputAudioTranscription = runConfig.inputAudioTranscription;
    llmRequest.liveConnectConfig.realtimeInputConfig = runConfig.realtimeInputConfig;
    llmRequest.liveConnectConfig.enableAffectiveDialog = runConfig.enableAffectiveDialog;
    llmRequest.liveConnectConfig.proactivity = runConfig.proactivity;
    for await (const _ of []) {
      yield _;
    }
  }
  /**
   * Type guard to check if agent is an LlmAgent
   */
  isLlmAgent(agent) {
    return agent && typeof agent === "object" && "canonicalModel" in agent;
  }
};
var requestProcessor2 = new BasicLlmRequestProcessor();

// src/code-executors/base-code-executor.ts
var BaseCodeExecutor = class {
  
  constructor(config = {}) {
    this.config = {
      optimizeDataFile: _nullishCoalesce(config.optimizeDataFile, () => ( false)),
      stateful: _nullishCoalesce(config.stateful, () => ( false)),
      errorRetryAttempts: _nullishCoalesce(config.errorRetryAttempts, () => ( 2)),
      codeBlockDelimiters: _nullishCoalesce(config.codeBlockDelimiters, () => ( [
        ["`tool_code\n", "\n`"],
        ["`python\n", "\n`"]
      ])),
      executionResultDelimiters: _nullishCoalesce(config.executionResultDelimiters, () => ( [
        "`tool_output\n",
        "\n`"
      ]))
    };
  }
  // Getters for configuration
  get optimizeDataFile() {
    return this.config.optimizeDataFile;
  }
  get stateful() {
    return this.config.stateful;
  }
  get errorRetryAttempts() {
    return this.config.errorRetryAttempts;
  }
  get codeBlockDelimiters() {
    return this.config.codeBlockDelimiters;
  }
  get executionResultDelimiters() {
    return this.config.executionResultDelimiters;
  }
};

// src/code-executors/built-in-code-executor.ts
var BuiltInCodeExecutor = class extends BaseCodeExecutor {
  constructor(config = {}) {
    super(config);
  }
  async executeCode(invocationContext, codeExecutionInput) {
    throw new Error(
      "BuiltInCodeExecutor.executeCode should not be called directly"
    );
  }
  /**
   * Pre-process the LLM request for Gemini 2.0+ models to use the code execution tool
   */
  processLlmRequest(llmRequest) {
    if (!_optionalChain([llmRequest, 'access', _220 => _220.model, 'optionalAccess', _221 => _221.startsWith, 'call', _222 => _222("gemini-2")])) {
      throw new Error(
        `Gemini code execution tool is not supported for model ${llmRequest.model}`
      );
    }
    if (!llmRequest.config) {
      llmRequest.config = {};
    }
    if (!llmRequest.config.tools) {
      llmRequest.config.tools = [];
    }
    const codeExecutionTool = {
      codeExecution: {}
    };
    llmRequest.config.tools.push(codeExecutionTool);
  }
};

// src/code-executors/code-execution-utils.ts

var CodeExecutionUtils = class _CodeExecutionUtils {
  /**
   * Gets the file content as a base64-encoded string
   */
  static getEncodedFileContent(data) {
    let decodedData;
    if (data instanceof ArrayBuffer) {
      decodedData = new TextDecoder().decode(data);
    }
    if (_CodeExecutionUtils.isBase64Encoded(decodedData)) {
      return decodedData;
    }
    return btoa(decodedData);
  }
  static isBase64Encoded(str) {
    try {
      return btoa(atob(str)) === str;
    } catch (e5) {
      return false;
    }
  }
  /**
   * Extracts the first code block from the content and truncates everything after it
   */
  static extractCodeAndTruncateContent(content, codeBlockDelimiters) {
    if (!_optionalChain([content, 'optionalAccess', _223 => _223.parts, 'optionalAccess', _224 => _224.length])) {
      return null;
    }
    for (let idx = 0; idx < content.parts.length; idx++) {
      const part = content.parts[idx];
      if (part.executableCode && (idx === content.parts.length - 1 || !content.parts[idx + 1].codeExecutionResult)) {
        content.parts = content.parts.slice(0, idx + 1);
        return part.executableCode.code;
      }
    }
    const textParts = content.parts.filter((p) => p.text);
    if (!textParts.length) {
      return null;
    }
    const responseText = textParts.map((p) => p.text).join("\n");
    const leadingDelimiterPattern = codeBlockDelimiters.map(([start]) => _CodeExecutionUtils.escapeRegex(start)).join("|");
    const trailingDelimiterPattern = codeBlockDelimiters.map(([, end]) => _CodeExecutionUtils.escapeRegex(end)).join("|");
    const pattern = new RegExp(
      `(.*?)(${leadingDelimiterPattern})(.*?)(${trailingDelimiterPattern})(.*?)$`,
      "s"
    );
    const match = responseText.match(pattern);
    if (!match) {
      return null;
    }
    const [, prefix, , code, , suffix] = match;
    if (!code) {
      return null;
    }
    content.parts = [];
    if (prefix) {
      content.parts.push({ text: prefix });
    }
    content.parts.push(_CodeExecutionUtils.buildExecutableCodePart(code));
    return code;
  }
  static escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
  /**
   * Builds an executable code part with code string
   */
  static buildExecutableCodePart(code) {
    return {
      executableCode: {
        code,
        language: _genai.Language.PYTHON
      }
    };
  }
  /**
   * Builds the code execution result part from the code execution result
   */
  static buildCodeExecutionResultPart(codeExecutionResult) {
    if (codeExecutionResult.stderr) {
      return {
        codeExecutionResult: {
          outcome: _genai.Outcome.OUTCOME_FAILED,
          output: codeExecutionResult.stderr
        }
      };
    }
    const finalResult = [];
    if (codeExecutionResult.stdout || !codeExecutionResult.outputFiles.length) {
      finalResult.push(
        `Code execution result:
${codeExecutionResult.stdout}
`
      );
    }
    if (codeExecutionResult.outputFiles.length) {
      const fileNames = codeExecutionResult.outputFiles.map((f) => `\`${f.name}\``).join(",");
      finalResult.push(`Saved artifacts:
${fileNames}`);
    }
    return {
      codeExecutionResult: {
        outcome: _genai.Outcome.OUTCOME_OK,
        output: finalResult.join("\n\n")
      }
    };
  }
  /**
   * Converts the code execution parts to text parts in a Content
   */
  static convertCodeExecutionParts(content, codeBlockDelimiter, executionResultDelimiters) {
    if (!_optionalChain([content, 'access', _225 => _225.parts, 'optionalAccess', _226 => _226.length])) {
      return;
    }
    const lastPart = content.parts[content.parts.length - 1];
    if (lastPart.executableCode) {
      content.parts[content.parts.length - 1] = {
        text: `${codeBlockDelimiter[0]}${lastPart.executableCode.code}${codeBlockDelimiter[1]}`
      };
    } else if (content.parts.length === 1 && lastPart.codeExecutionResult) {
      content.parts[content.parts.length - 1] = {
        text: `${executionResultDelimiters[0]}${lastPart.codeExecutionResult.output}${executionResultDelimiters[1]}`
      };
      content.role = "user";
    }
  }
};

// src/code-executors/code-executor-context.ts
var CONTEXT_KEY = "_code_execution_context";
var SESSION_ID_KEY = "execution_session_id";
var PROCESSED_FILE_NAMES_KEY = "processed_input_files";
var INPUT_FILE_KEY = "_code_executor_input_files";
var ERROR_COUNT_KEY = "_code_executor_error_counts";
var CODE_EXECUTION_RESULTS_KEY = "_code_execution_results";
var CodeExecutorContext = class {
  
  
  constructor(sessionState) {
    this.sessionState = sessionState;
    this.context = this.getCodeExecutorContext(sessionState);
  }
  /**
   * Gets the state delta to update in the persistent session state.
   */
  getStateDelta() {
    const contextToUpdate = JSON.parse(JSON.stringify(this.context));
    return { [CONTEXT_KEY]: contextToUpdate };
  }
  /**
   * Gets the session ID for the code executor.
   */
  getExecutionId() {
    if (!(SESSION_ID_KEY in this.context)) {
      return null;
    }
    return this.context[SESSION_ID_KEY];
  }
  /**
   * Sets the session ID for the code executor.
   */
  setExecutionId(sessionId) {
    this.context[SESSION_ID_KEY] = sessionId;
  }
  /**
   * Gets the processed file names from the session state.
   */
  getProcessedFileNames() {
    if (!(PROCESSED_FILE_NAMES_KEY in this.context)) {
      return [];
    }
    return this.context[PROCESSED_FILE_NAMES_KEY];
  }
  /**
   * Adds the processed file names to the session state.
   */
  addProcessedFileNames(fileNames) {
    if (!(PROCESSED_FILE_NAMES_KEY in this.context)) {
      this.context[PROCESSED_FILE_NAMES_KEY] = [];
    }
    this.context[PROCESSED_FILE_NAMES_KEY].push(...fileNames);
  }
  /**
   * Gets the code executor input files from the session state.
   */
  getInputFiles() {
    if (!(INPUT_FILE_KEY in this.sessionState)) {
      return [];
    }
    return this.sessionState[INPUT_FILE_KEY].map(
      (file) => file
    );
  }
  /**
   * Adds the input files to the code executor context.
   */
  addInputFiles(inputFiles) {
    if (!(INPUT_FILE_KEY in this.sessionState)) {
      this.sessionState[INPUT_FILE_KEY] = [];
    }
    const fileArray = this.sessionState[INPUT_FILE_KEY];
    for (const inputFile of inputFiles) {
      fileArray.push({
        name: inputFile.name,
        content: inputFile.content,
        mimeType: inputFile.mimeType
      });
    }
  }
  /**
   * Removes the input files and processed file names from the code executor context.
   */
  clearInputFiles() {
    if (INPUT_FILE_KEY in this.sessionState) {
      this.sessionState[INPUT_FILE_KEY] = [];
    }
    if (PROCESSED_FILE_NAMES_KEY in this.context) {
      this.context[PROCESSED_FILE_NAMES_KEY] = [];
    }
  }
  /**
   * Gets the error count from the session state.
   */
  getErrorCount(invocationId) {
    if (!(ERROR_COUNT_KEY in this.sessionState)) {
      return 0;
    }
    const errorCounts = this.sessionState[ERROR_COUNT_KEY];
    return _nullishCoalesce(errorCounts[invocationId], () => ( 0));
  }
  /**
   * Increments the error count for the given invocation ID.
   */
  incrementErrorCount(invocationId) {
    if (!(ERROR_COUNT_KEY in this.sessionState)) {
      this.sessionState[ERROR_COUNT_KEY] = {};
    }
    const errorCounts = this.sessionState[ERROR_COUNT_KEY];
    errorCounts[invocationId] = this.getErrorCount(invocationId) + 1;
  }
  /**
   * Resets the error count for the given invocation ID.
   */
  resetErrorCount(invocationId) {
    if (!(ERROR_COUNT_KEY in this.sessionState)) {
      return;
    }
    const errorCounts = this.sessionState[ERROR_COUNT_KEY];
    if (invocationId in errorCounts) {
      delete errorCounts[invocationId];
    }
  }
  /**
   * Updates the code execution result.
   */
  updateCodeExecutionResult(invocationId, code, resultStdout, resultStderr) {
    if (!(CODE_EXECUTION_RESULTS_KEY in this.sessionState)) {
      this.sessionState[CODE_EXECUTION_RESULTS_KEY] = {};
    }
    const results = this.sessionState[CODE_EXECUTION_RESULTS_KEY];
    if (!(invocationId in results)) {
      results[invocationId] = [];
    }
    results[invocationId].push({
      code,
      resultStdout,
      resultStderr,
      timestamp: Math.floor(Date.now() / 1e3)
    });
  }
  /**
   * Gets the code executor context from the session state.
   */
  getCodeExecutorContext(sessionState) {
    if (!(CONTEXT_KEY in sessionState)) {
      sessionState[CONTEXT_KEY] = {};
    }
    return sessionState[CONTEXT_KEY];
  }
};

// src/flows/llm-flows/code-execution.ts
var DATA_FILE_UTIL_MAP = {
  "text/csv": {
    extension: ".csv",
    loaderCodeTemplate: "pd.read_csv('{filename}')"
  }
};
var DATA_FILE_HELPER_LIB = `
import pandas as pd

def explore_df(df: pd.DataFrame) -> None:
  """Prints some information about a pandas DataFrame."""

  with pd.option_context(
      'display.max_columns', None, 'display.expand_frame_repr', False
  ):
    # Print the column names to never encounter KeyError when selecting one.
    df_dtypes = df.dtypes

    # Obtain information about data types and missing values.
    df_nulls = (len(df) - df.isnull().sum()).apply(
        lambda x: f'{x} / {df.shape[0]} non-null'
    )

    # Explore unique total values in columns using \`.unique()\`.
    df_unique_count = df.apply(lambda x: len(x.unique()))

    # Explore unique values in columns using \`.unique()\`.
    df_unique = df.apply(lambda x: crop(str(list(x.unique()))))

    df_info = pd.concat(
        (
            df_dtypes.rename('Dtype'),
            df_nulls.rename('Non-Null Count'),
            df_unique_count.rename('Unique Values Count'),
            df_unique.rename('Unique Values'),
        ),
        axis=1,
    )
    df_info.index.name = 'Columns'
    print(f"""Total rows: {df.shape[0]}
Total columns: {df.shape[1]}

{df_info}""")

def crop(text: str, max_length: int = 100) -> str:
    """Crop text to maximum length with ellipsis."""
    return text if len(text) <= max_length else text[:max_length] + "..."
`;
function hasCodeExecutor(agent) {
  return agent && typeof agent === "object" && "codeExecutor" in agent;
}
var CodeExecutionRequestProcessor = class extends BaseLlmRequestProcessor {
  async *runAsync(invocationContext, llmRequest) {
    const agent = invocationContext.agent;
    if (!hasCodeExecutor(agent)) {
      return;
    }
    if (!(agent instanceof LlmAgent) || !agent.codeExecutor) {
      return;
    }
    yield* runPreProcessor(invocationContext, llmRequest);
    if (!(agent.codeExecutor instanceof BaseCodeExecutor)) {
      return;
    }
    for (const content of llmRequest.contents || []) {
      CodeExecutionUtils.convertCodeExecutionParts(
        content,
        agent.codeExecutor.codeBlockDelimiters[0] || ["", ""],
        agent.codeExecutor.executionResultDelimiters
      );
    }
  }
};
var CodeExecutionResponseProcessor = class extends BaseLlmResponseProcessor {
  async *runAsync(invocationContext, llmResponse) {
    if (llmResponse.partial) {
      return;
    }
    yield* runPostProcessor(invocationContext, llmResponse);
  }
};
async function* runPreProcessor(invocationContext, llmRequest) {
  const agent = invocationContext.agent;
  if (!hasCodeExecutor(agent)) {
    return;
  }
  const codeExecutor = agent.codeExecutor;
  if (!codeExecutor || !(codeExecutor instanceof BaseCodeExecutor)) {
    return;
  }
  if (codeExecutor instanceof BuiltInCodeExecutor) {
    codeExecutor.processLlmRequest(llmRequest);
    return;
  }
  if (!codeExecutor.optimizeDataFile) {
    return;
  }
  const codeExecutorContext = new CodeExecutorContext(
    invocationContext.session.state
    // Type assertion for State compatibility
  );
  if (codeExecutorContext.getErrorCount(invocationContext.invocationId) >= codeExecutor.errorRetryAttempts) {
    return;
  }
  const allInputFiles = extractAndReplaceInlineFiles(
    codeExecutorContext,
    llmRequest
  );
  const processedFileNames = new Set(
    codeExecutorContext.getProcessedFileNames()
  );
  const filesToProcess = allInputFiles.filter(
    (f) => !processedFileNames.has(f.name)
  );
  for (const file of filesToProcess) {
    const codeStr = getDataFilePreprocessingCode(file);
    if (!codeStr) {
      continue;
    }
    const codeContent = {
      role: "model",
      parts: [
        { text: `Processing input file: \`${file.name}\`` },
        CodeExecutionUtils.buildExecutableCodePart(codeStr)
      ]
    };
    llmRequest.contents = llmRequest.contents || [];
    llmRequest.contents.push(structuredClone(codeContent));
    yield new Event({
      invocationId: invocationContext.invocationId,
      author: agent.name,
      branch: invocationContext.branch,
      content: codeContent
    });
    const codeExecutionResult = await codeExecutor.executeCode(
      invocationContext,
      {
        code: codeStr,
        inputFiles: [file],
        executionId: getOrSetExecutionId(
          invocationContext,
          codeExecutorContext
        )
      }
    );
    codeExecutorContext.updateCodeExecutionResult(
      invocationContext.invocationId,
      codeStr,
      codeExecutionResult.stdout,
      codeExecutionResult.stderr
    );
    codeExecutorContext.addProcessedFileNames([file.name]);
    const executionResultEvent = await postProcessCodeExecutionResult(
      invocationContext,
      codeExecutorContext,
      codeExecutionResult
    );
    yield executionResultEvent;
    llmRequest.contents.push(structuredClone(executionResultEvent.content));
  }
}
async function* runPostProcessor(invocationContext, llmResponse) {
  const agent = invocationContext.agent;
  if (!hasCodeExecutor(agent)) {
    return;
  }
  const codeExecutor = agent.codeExecutor;
  if (!(codeExecutor instanceof BaseCodeExecutor)) {
    return;
  }
  if (!llmResponse || !llmResponse.content) {
    return;
  }
  if (codeExecutor instanceof BuiltInCodeExecutor) {
    return;
  }
  const codeExecutorContext = new CodeExecutorContext(
    invocationContext.session.state
    // Type assertion for State compatibility
  );
  if (codeExecutorContext.getErrorCount(invocationContext.invocationId) >= codeExecutor.errorRetryAttempts) {
    return;
  }
  const responseContent = llmResponse.content;
  const codeStr = CodeExecutionUtils.extractCodeAndTruncateContent(
    responseContent,
    codeExecutor.codeBlockDelimiters
  );
  if (!codeStr) {
    return;
  }
  yield new Event({
    invocationId: invocationContext.invocationId,
    author: agent.name,
    branch: invocationContext.branch,
    content: responseContent,
    actions: new EventActions()
  });
  const codeExecutionResult = await codeExecutor.executeCode(
    invocationContext,
    {
      code: codeStr,
      inputFiles: codeExecutorContext.getInputFiles(),
      executionId: getOrSetExecutionId(invocationContext, codeExecutorContext)
    }
  );
  codeExecutorContext.updateCodeExecutionResult(
    invocationContext.invocationId,
    codeStr,
    codeExecutionResult.stdout,
    codeExecutionResult.stderr
  );
  yield await postProcessCodeExecutionResult(
    invocationContext,
    codeExecutorContext,
    codeExecutionResult
  );
  llmResponse.content = void 0;
}
function extractAndReplaceInlineFiles(codeExecutorContext, llmRequest) {
  const allInputFiles = codeExecutorContext.getInputFiles();
  const savedFileNames = new Set(allInputFiles.map((f) => f.name));
  for (let i = 0; i < (_optionalChain([llmRequest, 'access', _227 => _227.contents, 'optionalAccess', _228 => _228.length]) || 0); i++) {
    const content = llmRequest.contents[i];
    if (content.role !== "user" || !content.parts) {
      continue;
    }
    for (let j = 0; j < content.parts.length; j++) {
      const part = content.parts[j];
      if (!part.inlineData || !(part.inlineData.mimeType in DATA_FILE_UTIL_MAP)) {
        continue;
      }
      const mimeType = part.inlineData.mimeType;
      const fileName = `data_${i + 1}_${j + 1}${DATA_FILE_UTIL_MAP[mimeType].extension}`;
      llmRequest.contents[i].parts[j] = {
        text: `
Available file: \`${fileName}\`
`
      };
      const file = {
        name: fileName,
        content: CodeExecutionUtils.getEncodedFileContent(part.inlineData.data),
        mimeType
      };
      if (!savedFileNames.has(fileName)) {
        codeExecutorContext.addInputFiles([file]);
        allInputFiles.push(file);
      }
    }
  }
  return allInputFiles;
}
function getOrSetExecutionId(invocationContext, codeExecutorContext) {
  const agent = invocationContext.agent;
  if (!hasCodeExecutor(agent) || !_optionalChain([agent, 'access', _229 => _229.codeExecutor, 'optionalAccess', _230 => _230.stateful])) {
    return void 0;
  }
  let executionId = codeExecutorContext.getExecutionId();
  if (!executionId) {
    executionId = invocationContext.session.id;
    codeExecutorContext.setExecutionId(executionId);
  }
  return executionId;
}
async function postProcessCodeExecutionResult(invocationContext, codeExecutorContext, codeExecutionResult) {
  if (!invocationContext.artifactService) {
    throw new Error("Artifact service is not initialized.");
  }
  const resultContent = {
    role: "model",
    parts: [
      CodeExecutionUtils.buildCodeExecutionResultPart(codeExecutionResult)
    ]
  };
  const eventActions = new EventActions({
    stateDelta: codeExecutorContext.getStateDelta()
  });
  if (codeExecutionResult.stderr) {
    codeExecutorContext.incrementErrorCount(invocationContext.invocationId);
  } else {
    codeExecutorContext.resetErrorCount(invocationContext.invocationId);
  }
  for (const outputFile of codeExecutionResult.outputFiles) {
    const version = await invocationContext.artifactService.saveArtifact({
      appName: invocationContext.appName,
      userId: invocationContext.userId,
      sessionId: invocationContext.session.id,
      filename: outputFile.name,
      artifact: {
        inlineData: {
          data: atob(outputFile.content),
          // Convert from base64
          mimeType: outputFile.mimeType
        }
      }
    });
    eventActions.artifactDelta[outputFile.name] = version;
  }
  return new Event({
    invocationId: invocationContext.invocationId,
    author: invocationContext.agent.name,
    branch: invocationContext.branch,
    content: resultContent,
    actions: eventActions
  });
}
function getDataFilePreprocessingCode(file) {
  function getNormalizedFileName(fileName) {
    const baseName = fileName.split(".")[0];
    let varName2 = baseName.replace(/[^a-zA-Z0-9_]/g, "_");
    if (/^\d/.test(varName2)) {
      varName2 = `_${varName2}`;
    }
    return varName2;
  }
  if (!(file.mimeType in DATA_FILE_UTIL_MAP)) {
    return void 0;
  }
  const varName = getNormalizedFileName(file.name);
  const loaderCode = DATA_FILE_UTIL_MAP[file.mimeType].loaderCodeTemplate.replace("{filename}", file.name);
  return `
${DATA_FILE_HELPER_LIB}

# Load the dataframe.
${varName} = ${loaderCode}

# Use \`explore_df\` to guide my analysis.
explore_df(${varName})
`;
}
var requestProcessor3 = new CodeExecutionRequestProcessor();
var responseProcessor = new CodeExecutionResponseProcessor();

// src/flows/llm-flows/contents.ts
var ContentLlmRequestProcessor = class extends BaseLlmRequestProcessor {
  async *runAsync(invocationContext, llmRequest) {
    const agent = invocationContext.agent;
    if (!this.isLlmAgent(agent)) {
      return;
    }
    if (agent.includeContents === "default") {
      llmRequest.contents = getContents(
        invocationContext.branch,
        invocationContext.session.events,
        agent.name
      );
    } else if (agent.includeContents !== "none") {
      llmRequest.contents = getCurrentTurnContents(
        invocationContext.branch,
        invocationContext.session.events,
        agent.name
      );
    }
    for await (const _ of []) {
      yield _;
    }
  }
  /**
   * Type guard to check if agent is an LlmAgent
   */
  isLlmAgent(agent) {
    return agent && typeof agent === "object" && "canonicalModel" in agent;
  }
};
var requestProcessor4 = new ContentLlmRequestProcessor();
function rearrangeEventsForAsyncFunctionResponsesInHistory(events) {
  const functionCallIdToResponseEventsIndex = {};
  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    if (!event || typeof event.getFunctionResponses !== "function") {
      continue;
    }
    const functionResponses = event.getFunctionResponses();
    if (functionResponses) {
      for (const functionResponse of functionResponses) {
        const functionCallId = functionResponse.id;
        if (functionCallId) {
          functionCallIdToResponseEventsIndex[functionCallId] = i;
        }
      }
    }
  }
  const resultEvents = [];
  for (const event of events) {
    if (!event || typeof event.getFunctionResponses !== "function" || typeof event.getFunctionCalls !== "function") {
      resultEvents.push(event);
      continue;
    }
    if (event.getFunctionResponses().length > 0) {
      continue;
    }
    const functionCalls = event.getFunctionCalls();
    if (functionCalls.length > 0) {
      const functionResponseEventsIndices = /* @__PURE__ */ new Set();
      for (const functionCall of functionCalls) {
        const functionCallId = functionCall.id;
        if (functionCallId && functionCallId in functionCallIdToResponseEventsIndex) {
          functionResponseEventsIndices.add(
            functionCallIdToResponseEventsIndex[functionCallId]
          );
        }
      }
      resultEvents.push(event);
      if (functionResponseEventsIndices.size === 0) {
        continue;
      }
      if (functionResponseEventsIndices.size === 1) {
        const index = Array.from(functionResponseEventsIndices)[0];
        resultEvents.push(events[index]);
      } else {
        const eventsToMerge = Array.from(functionResponseEventsIndices).sort((a, b) => a - b).map((i) => events[i]);
        resultEvents.push(mergeFunctionResponseEvents(eventsToMerge));
      }
    } else {
      resultEvents.push(event);
    }
  }
  return resultEvents;
}
function rearrangeEventsForLatestFunctionResponse(events) {
  if (!events.length) {
    return events;
  }
  const lastEvent = events[events.length - 1];
  if (!lastEvent || typeof lastEvent.getFunctionResponses !== "function") {
    return events;
  }
  const functionResponses = lastEvent.getFunctionResponses();
  if (!functionResponses || functionResponses.length === 0) {
    return events;
  }
  const functionResponsesIds = /* @__PURE__ */ new Set();
  for (const functionResponse of functionResponses) {
    if (functionResponse.id) {
      functionResponsesIds.add(functionResponse.id);
    }
  }
  if (events.length >= 2) {
    const prevEvent = events[events.length - 2];
    if (!prevEvent || typeof prevEvent.getFunctionCalls !== "function") {
      return events;
    }
    const functionCalls = prevEvent.getFunctionCalls();
    if (functionCalls) {
      for (const functionCall of functionCalls) {
        if (functionCall.id && functionResponsesIds.has(functionCall.id)) {
          return events;
        }
      }
    }
  }
  let functionCallEventIdx = -1;
  for (let idx = events.length - 2; idx >= 0; idx--) {
    const event = events[idx];
    if (!event || typeof event.getFunctionCalls !== "function") {
      continue;
    }
    const functionCalls = event.getFunctionCalls();
    if (functionCalls) {
      for (const functionCall of functionCalls) {
        if (functionCall.id && functionResponsesIds.has(functionCall.id)) {
          functionCallEventIdx = idx;
          break;
        }
      }
      if (functionCallEventIdx !== -1) {
        for (const functionCall of functionCalls) {
          if (functionCall.id) {
            functionResponsesIds.add(functionCall.id);
          }
        }
        break;
      }
    }
  }
  if (functionCallEventIdx === -1) {
    return events;
  }
  const functionResponseEvents = [];
  for (let idx = functionCallEventIdx + 1; idx < events.length - 1; idx++) {
    const event = events[idx];
    if (!event || typeof event.getFunctionResponses !== "function") {
      continue;
    }
    const functionResponses2 = event.getFunctionResponses();
    if (_optionalChain([functionResponses2, 'optionalAccess', _231 => _231.some, 'call', _232 => _232((fr) => fr.id && functionResponsesIds.has(fr.id))])) {
      functionResponseEvents.push(event);
    }
  }
  functionResponseEvents.push(events[events.length - 1]);
  const resultEvents = events.slice(0, functionCallEventIdx + 1);
  resultEvents.push(mergeFunctionResponseEvents(functionResponseEvents));
  return resultEvents;
}
function getContents(currentBranch, events, agentName = "") {
  const filteredEvents = [];
  for (const event of events) {
    if (!event.content || !event.content.role || !event.content.parts || event.content.parts.length === 0) {
      continue;
    }
    const hasAnyContent = event.content.parts.some(
      (part) => part.text || part.functionCall || part.functionResponse
    );
    if (!hasAnyContent) {
      continue;
    }
    if (!isEventBelongsToBranch(currentBranch, event)) {
      continue;
    }
    if (isAuthEvent(event)) {
      continue;
    }
    filteredEvents.push(
      isOtherAgentReply(agentName, event) ? convertForeignEvent(event) : event
    );
  }
  let resultEvents = rearrangeEventsForLatestFunctionResponse(filteredEvents);
  resultEvents = rearrangeEventsForAsyncFunctionResponsesInHistory(resultEvents);
  const contents = [];
  for (const event of resultEvents) {
    const content = JSON.parse(JSON.stringify(event.content));
    removeClientFunctionCallId(content);
    contents.push(content);
  }
  return contents;
}
function getCurrentTurnContents(currentBranch, events, agentName = "") {
  for (let i = events.length - 1; i >= 0; i--) {
    const event = events[i];
    if (event.author === "user" || isOtherAgentReply(agentName, event)) {
      return getContents(currentBranch, events.slice(i), agentName);
    }
  }
  return [];
}
function isOtherAgentReply(currentAgentName, event) {
  return Boolean(
    currentAgentName && event.author !== currentAgentName && event.author !== "user"
  );
}
function convertForeignEvent(event) {
  if (!event.content || !event.content.parts) {
    return event;
  }
  const content = {
    role: "user",
    parts: [{ text: "For context:" }]
  };
  for (const part of event.content.parts) {
    if (part.text) {
      content.parts.push({
        text: `[${event.author}] said: ${part.text}`
      });
    } else if (part.functionCall) {
      content.parts.push({
        text: `[${event.author}] called tool \`${part.functionCall.name}\` with parameters: ${JSON.stringify(part.functionCall.args)}`
      });
    } else if (part.functionResponse) {
      content.parts.push({
        text: `[${event.author}] \`${part.functionResponse.name}\` tool returned result: ${JSON.stringify(part.functionResponse.response)}`
      });
    } else {
      content.parts.push(part);
    }
  }
  return new Event({
    timestamp: event.timestamp,
    author: "user",
    content,
    branch: event.branch
  });
}
function mergeFunctionResponseEvents(functionResponseEvents) {
  if (!functionResponseEvents.length) {
    throw new Error("At least one function_response event is required.");
  }
  const mergedEvent = JSON.parse(JSON.stringify(functionResponseEvents[0]));
  const partsInMergedEvent = mergedEvent.content.parts;
  if (!partsInMergedEvent) {
    throw new Error("There should be at least one function_response part.");
  }
  const partIndicesInMergedEvent = {};
  for (let idx = 0; idx < partsInMergedEvent.length; idx++) {
    const part = partsInMergedEvent[idx];
    if (_optionalChain([part, 'access', _233 => _233.functionResponse, 'optionalAccess', _234 => _234.id])) {
      partIndicesInMergedEvent[part.functionResponse.id] = idx;
    }
  }
  for (const event of functionResponseEvents.slice(1)) {
    if (!event.content.parts) {
      throw new Error("There should be at least one function_response part.");
    }
    for (const part of event.content.parts) {
      if (_optionalChain([part, 'access', _235 => _235.functionResponse, 'optionalAccess', _236 => _236.id])) {
        const functionCallId = part.functionResponse.id;
        if (functionCallId in partIndicesInMergedEvent) {
          partsInMergedEvent[partIndicesInMergedEvent[functionCallId]] = part;
        } else {
          partsInMergedEvent.push(part);
          partIndicesInMergedEvent[functionCallId] = partsInMergedEvent.length - 1;
        }
      } else {
        partsInMergedEvent.push(part);
      }
    }
  }
  return mergedEvent;
}
function isEventBelongsToBranch(invocationBranch, event) {
  if (!invocationBranch || !event.branch) {
    return true;
  }
  return invocationBranch.startsWith(event.branch);
}
function isAuthEvent(event) {
  if (!event.content.parts) {
    return false;
  }
  for (const part of event.content.parts) {
    if (part.functionCall && part.functionCall.name === REQUEST_EUC_FUNCTION_CALL_NAME) {
      return true;
    }
    if (part.functionResponse && part.functionResponse.name === REQUEST_EUC_FUNCTION_CALL_NAME) {
      return true;
    }
  }
  return false;
}

// src/flows/llm-flows/identity.ts
var IdentityLlmRequestProcessor = class extends BaseLlmRequestProcessor {
  async *runAsync(invocationContext, llmRequest) {
    const agent = invocationContext.agent;
    const instructions = [
      `You are an agent. Your internal name is "${agent.name}".`
    ];
    if (agent.description) {
      instructions.push(` The description about you is "${agent.description}"`);
    }
    llmRequest.appendInstructions(instructions);
    for await (const _ of []) {
      yield _;
    }
  }
};
var requestProcessor5 = new IdentityLlmRequestProcessor();

// src/flows/llm-flows/instructions.ts


// src/utils/instructions-utils.ts
async function injectSessionState(template, readonlyContext) {
  const invocationContext = readonlyContext._invocationContext;
  async function asyncReplace(pattern, replaceAsyncFn, string) {
    const result = [];
    let lastEnd = 0;
    const matches = Array.from(string.matchAll(pattern));
    for (const match of matches) {
      result.push(string.slice(lastEnd, match.index));
      const replacement = await replaceAsyncFn(match);
      result.push(replacement);
      lastEnd = (match.index || 0) + match[0].length;
    }
    result.push(string.slice(lastEnd));
    return result.join("");
  }
  async function replaceMatch(match) {
    let varName = match[0].replace(/[{}]/g, "").trim();
    let optional = false;
    if (varName.endsWith("?")) {
      optional = true;
      varName = varName.slice(0, -1);
    }
    if (varName.startsWith("artifact.")) {
      varName = varName.replace("artifact.", "");
      if (!invocationContext.artifactService) {
        throw new Error("Artifact service is not initialized.");
      }
      try {
        const artifact = await invocationContext.artifactService.loadArtifact({
          appName: invocationContext.session.appName,
          userId: invocationContext.session.userId,
          sessionId: invocationContext.session.id,
          filename: varName
        });
        if (!artifact) {
          throw new Error(`Artifact ${varName} not found.`);
        }
        return String(artifact);
      } catch (error) {
        if (optional) {
          return "";
        }
        throw error;
      }
    } else {
      if (!isValidStateName(varName)) {
        return match[0];
      }
      const sessionState = invocationContext.session.state;
      if (varName in sessionState) {
        return String(sessionState[varName]);
      }
      if (optional) {
        return "";
      }
      console.warn(`Context variable not found: \`${varName}\`. Returning original text.`);
      return match[0];
    }
  }
  return await asyncReplace(/{[^{}]*}/g, replaceMatch, template);
}
function isValidStateName(varName) {
  const parts = varName.split(":");
  if (parts.length === 1) {
    return isValidIdentifier(varName);
  }
  if (parts.length === 2) {
    const validPrefixes = ["app:", "user:", "temp:"];
    const prefix = `${parts[0]}:`;
    if (validPrefixes.includes(prefix)) {
      return isValidIdentifier(parts[1]);
    }
  }
  return false;
}
function isValidIdentifier(name) {
  const identifierRegex = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/;
  return identifierRegex.test(name);
}

// src/flows/llm-flows/instructions.ts
var InstructionsLlmRequestProcessor = class extends BaseLlmRequestProcessor {
  async *runAsync(invocationContext, llmRequest) {
    const agent = invocationContext.agent;
    if (!this.isLlmAgent(agent)) {
      return;
    }
    const rootAgent = agent.rootAgent;
    if (this.isLlmAgent(rootAgent) && rootAgent.globalInstruction) {
      const [rawInstruction, bypassStateInjection] = await rootAgent.canonicalGlobalInstruction(
        new ReadonlyContext(invocationContext)
      );
      let instruction = rawInstruction;
      if (!bypassStateInjection) {
        instruction = await injectSessionState(
          rawInstruction,
          new ReadonlyContext(invocationContext)
        );
      }
      llmRequest.appendInstructions([instruction]);
    }
    if (agent.instruction) {
      const [rawInstruction, bypassStateInjection] = await agent.canonicalInstruction(
        new ReadonlyContext(invocationContext)
      );
      let instruction = rawInstruction;
      if (!bypassStateInjection) {
        instruction = await injectSessionState(
          rawInstruction,
          new ReadonlyContext(invocationContext)
        );
      }
      llmRequest.appendInstructions([instruction]);
    }
    if (agent.outputSchema) {
      try {
        const raw = z.default.toJSONSchema(agent.outputSchema);
        const { $schema, ...json } = raw || {};
        llmRequest.appendInstructions([
          "You must respond with application/json that validates against this JSON Schema (do NOT wrap the output in markdown or code fences):",
          JSON.stringify(json, null, 2)
        ]);
        llmRequest.appendInstructions([
          'IMPORTANT: After any tool calls, function calls, or agent transfers have completed, produce ONE final assistant message whose entire content is ONLY the JSON object that conforms to the schema provided above. Do NOT include any explanatory text, markdown, or additional messages. Do NOT wrap the JSON in code fences (for example, do NOT use ```json or ```). If you cannot produce valid JSON that matches the schema, return a JSON object with an "error" field describing the problem.'
        ]);
      } catch (e6) {
      }
    }
    for await (const _ of []) {
      yield _;
    }
  }
  /**
   * Type guard to check if agent is an LlmAgent
   */
  isLlmAgent(agent) {
    return agent && typeof agent === "object" && "canonicalModel" in agent;
  }
};
var requestProcessor6 = new InstructionsLlmRequestProcessor();

// src/planners/base-planner.ts
var BasePlanner = class {
};

// src/planners/built-in-planner.ts
var BuiltInPlanner = class extends BasePlanner {
  /**
   * Config for model built-in thinking features. An error will be returned if this
   * field is set for models that don't support thinking.
   */
  
  /**
   * Initializes the built-in planner.
   *
   * @param options Configuration options
   */
  constructor(options) {
    super();
    this.thinkingConfig = options.thinkingConfig;
  }
  /**
   * Applies the thinking config to the LLM request.
   *
   * @param llmRequest The LLM request to apply the thinking config to
   */
  applyThinkingConfig(llmRequest) {
    if (this.thinkingConfig) {
      llmRequest.config = llmRequest.config || {};
      llmRequest.config.thinkingConfig = this.thinkingConfig;
    }
  }
  /**
   * Builds the planning instruction (returns undefined for built-in planner)
   */
  buildPlanningInstruction(readonlyContext, llmRequest) {
    return void 0;
  }
  /**
   * Processes the planning response (returns undefined for built-in planner)
   */
  processPlanningResponse(callbackContext, responseParts) {
    return void 0;
  }
};

// src/planners/plan-re-act-planner.ts
var PLANNING_TAG = "/*PLANNING*/";
var REPLANNING_TAG = "/*REPLANNING*/";
var REASONING_TAG = "/*REASONING*/";
var ACTION_TAG = "/*ACTION*/";
var FINAL_ANSWER_TAG = "/*FINAL_ANSWER*/";
var PlanReActPlanner = class extends BasePlanner {
  /**
   * Builds the planning instruction for the Plan-Re-Act planner
   */
  buildPlanningInstruction(readonlyContext, llmRequest) {
    return this._buildNlPlannerInstruction();
  }
  /**
   * Processes the LLM response for planning
   */
  processPlanningResponse(callbackContext, responseParts) {
    if (!responseParts || responseParts.length === 0) {
      return void 0;
    }
    const preservedParts = [];
    let firstFcPartIndex = -1;
    for (let i = 0; i < responseParts.length; i++) {
      if (responseParts[i].functionCall) {
        if (!_optionalChain([responseParts, 'access', _237 => _237[i], 'access', _238 => _238.functionCall, 'optionalAccess', _239 => _239.name])) {
          continue;
        }
        preservedParts.push(responseParts[i]);
        firstFcPartIndex = i;
        break;
      }
      this._handleNonFunctionCallParts(responseParts[i], preservedParts);
    }
    if (firstFcPartIndex > 0) {
      let j = firstFcPartIndex + 1;
      while (j < responseParts.length) {
        if (responseParts[j].functionCall) {
          preservedParts.push(responseParts[j]);
          j++;
        } else {
          break;
        }
      }
    }
    return preservedParts;
  }
  /**
   * Splits the text by the last occurrence of the separator
   */
  _splitByLastPattern(text, separator) {
    const index = text.lastIndexOf(separator);
    if (index === -1) {
      return [text, ""];
    }
    return [
      text.substring(0, index + separator.length),
      text.substring(index + separator.length)
    ];
  }
  /**
   * Handles non-function-call parts of the response
   */
  _handleNonFunctionCallParts(responsePart, preservedParts) {
    if (_optionalChain([responsePart, 'access', _240 => _240.text, 'optionalAccess', _241 => _241.includes, 'call', _242 => _242(FINAL_ANSWER_TAG)])) {
      const [reasoningText, finalAnswerText] = this._splitByLastPattern(
        responsePart.text,
        FINAL_ANSWER_TAG
      );
      if (reasoningText) {
        const reasoningPart = { text: reasoningText };
        this._markAsThought(reasoningPart);
        preservedParts.push(reasoningPart);
      }
      if (finalAnswerText) {
        preservedParts.push({
          text: finalAnswerText
        });
      }
    } else {
      const responseText = responsePart.text || "";
      if (responseText && (responseText.startsWith(PLANNING_TAG) || responseText.startsWith(REASONING_TAG) || responseText.startsWith(ACTION_TAG) || responseText.startsWith(REPLANNING_TAG))) {
        this._markAsThought(responsePart);
      }
      preservedParts.push(responsePart);
    }
  }
  /**
   * Marks the response part as thought
   */
  _markAsThought(responsePart) {
    if (responsePart.text) {
      responsePart.thought = true;
    }
  }
  /**
   * Builds the NL planner instruction for the Plan-Re-Act planner
   */
  _buildNlPlannerInstruction() {
    const highLevelPreamble = `
When answering the question, try to leverage the available tools to gather the information instead of your memorized knowledge.

Follow this process when answering the question: (1) first come up with a plan in natural language text format; (2) Then use tools to execute the plan and provide reasoning between tool usage to make a summary of current state and next step. Tool usage and reasoning should be interleaved with each other. (3) In the end, return one final answer.

Follow this format when answering the question: (1) The planning part should be under ${PLANNING_TAG}. (2) The tool usage should be under ${ACTION_TAG}, and the reasoning parts should be under ${REASONING_TAG}. (3) The final answer part should be under ${FINAL_ANSWER_TAG}.
`;
    const planningPreamble = `
Below are the requirements for the planning:
The plan is made to answer the user query if following the plan. The plan is coherent and covers all aspects of information from user query, and only involves the tools that are accessible by the agent. The plan contains the decomposed steps as a numbered list where each step should use one or multiple available tools. By reading the plan, you can intuitively know which tools to trigger or what actions to take.
If the initial plan cannot be successfully executed, you should learn from previous execution results and revise your plan. The revised plan should be be under ${REPLANNING_TAG}. Then use tools to follow the new plan.
`;
    const reasoningPreamble = `
Below are the requirements for the reasoning:
The reasoning makes a summary of the current trajectory based on the user query and tool outputs. Based on the tool outputs and plan, the reasoning also comes up with instructions to the next steps, making the trajectory closer to the final answer.
`;
    const finalAnswerPreamble = `
Below are the requirements for the final answer:
The final answer should be precise and follow query formatting requirements. Some queries may not be answerable with the available tools and information. In those cases, inform the user why you cannot process their query and ask for more information.
`;
    const toolUsagePreamble = `
Below are the requirements for tool usage:

**Available Tools:** The available tools are described in the context and can be directly used.
- You can only use tools and parameters that are explicitly defined in the function declarations.
- You cannot use any parameters, fields, or capabilities that are not documented in the tool specifications.
- Tool usage should be clear, efficient, and directly relevant to the user query and reasoning steps.
- When using tools, reference them by their exact function names as provided in the context.
- Do not attempt to use external libraries, services, or capabilities beyond the provided tools.
- If the available tools are insufficient to fully answer a query, clearly explain the limitations.
`;
    const userInputPreamble = `
VERY IMPORTANT instruction that you MUST follow in addition to the above instructions:

You should ask for clarification if you need more information to answer the question.
You should prefer using the information available in the context instead of repeated tool use.
`;
    return [
      highLevelPreamble,
      planningPreamble,
      reasoningPreamble,
      finalAnswerPreamble,
      toolUsagePreamble,
      userInputPreamble
    ].join("\n\n");
  }
};

// src/flows/llm-flows/nl-planning.ts
var NlPlanningRequestProcessor = class extends BaseLlmRequestProcessor {
  async *runAsync(invocationContext, llmRequest) {
    const planner = getPlanner(invocationContext);
    if (!planner) {
      return;
    }
    if (planner instanceof BuiltInPlanner) {
      planner.applyThinkingConfig(llmRequest);
    }
    const planningInstruction = planner.buildPlanningInstruction(
      new ReadonlyContext(invocationContext),
      llmRequest
    );
    if (planningInstruction) {
      if (llmRequest.appendInstructions) {
        llmRequest.appendInstructions([planningInstruction]);
      } else {
        const existingInstructions = llmRequest.instructions || "";
        llmRequest.instructions = `${existingInstructions}

${planningInstruction}`;
      }
    }
    removeThoughtFromRequest(llmRequest);
    for await (const _ of []) {
      yield _;
    }
  }
};
var NlPlanningResponseProcessor = class extends BaseLlmResponseProcessor {
  async *runAsync(invocationContext, llmResponse) {
    if (!llmResponse || !llmResponse.content || !llmResponse.content.parts || llmResponse.content.parts.length === 0) {
      return;
    }
    const planner = getPlanner(invocationContext);
    if (!planner) {
      return;
    }
    const callbackContext = new CallbackContext(invocationContext);
    const processedParts = planner.processPlanningResponse(
      callbackContext,
      llmResponse.content.parts
    );
    if (processedParts) {
      llmResponse.content.parts = processedParts;
    }
    if (callbackContext.state.hasDelta()) {
      const stateUpdateEvent = new Event({
        id: Event.newId(),
        invocationId: invocationContext.invocationId,
        author: invocationContext.agent.name,
        branch: invocationContext.branch,
        actions: callbackContext._eventActions
      });
      yield stateUpdateEvent;
    }
  }
};
function getPlanner(invocationContext) {
  const agent = invocationContext.agent;
  if (!("planner" in agent) || !agent.planner) {
    return null;
  }
  if (typeof agent.planner === "object" && "buildPlanningInstruction" in agent.planner && "processPlanningResponse" in agent.planner) {
    return agent.planner;
  }
  return new PlanReActPlanner();
}
function removeThoughtFromRequest(llmRequest) {
  if (!llmRequest.contents) {
    return;
  }
  for (const content of llmRequest.contents) {
    if (!content.parts) {
      continue;
    }
    for (const part of content.parts) {
      if ("thought" in part) {
        part.thought = void 0;
      }
    }
  }
}
var requestProcessor7 = new NlPlanningRequestProcessor();
var responseProcessor2 = new NlPlanningResponseProcessor();

// src/flows/llm-flows/output-schema.ts
var _jsonrepair = require('jsonrepair');
init_logger();
var OutputSchemaResponseProcessor = (_class26 = class extends BaseLlmResponseProcessor {constructor(...args2) { super(...args2); _class26.prototype.__init46.call(this); }
  __init46() {this.logger = new Logger({ name: "OutputSchemaResponseProcessor" })}
  async *runAsync(invocationContext, llmResponse) {
    if (!llmResponse || !llmResponse.content || !llmResponse.content.parts || llmResponse.content.parts.length === 0) {
      return;
    }
    const agent = invocationContext.agent;
    if (!("outputSchema" in agent) || !agent.outputSchema) {
      return;
    }
    let textContent = llmResponse.content.parts.map((part) => {
      if (part && typeof part === "object" && "text" in part) {
        return part.text || "";
      }
      return "";
    }).join("");
    if (!textContent.trim()) {
      return;
    }
    try {
      const candidate = this.stripCodeFences(textContent);
      const parsed = this.tryParseJson(candidate, agent.name);
      const validated = agent.outputSchema.parse(parsed);
      textContent = JSON.stringify(validated, null, 2);
      llmResponse.content.parts = llmResponse.content.parts.map((part) => {
        if (part && typeof part === "object" && "text" in part) {
          return {
            ...part,
            text: textContent
          };
        }
        return part;
      });
      this.logger.debug("Output schema validation successful", {
        agent: agent.name,
        originalLength: textContent.length,
        validatedKeys: Object.keys(validated)
      });
    } catch (error) {
      const skipError = error instanceof Error ? error.message : String(error);
      if (skipError.includes("SKIP_VALIDATION")) {
        this.logger.debug("Skipping validation for thinking/explanation text", {
          agent: agent.name,
          contentPreview: textContent.substring(0, 200)
        });
        return;
      }
      const errorMessage = error instanceof Error ? error.message : String(error);
      const detailedError = `Output schema validation failed for agent '${agent.name}': ${errorMessage}`;
      this.logger.error(detailedError, {
        agent: agent.name,
        responseContent: textContent.substring(0, 200) + (textContent.length > 200 ? "..." : ""),
        error: errorMessage
      });
      llmResponse.errorCode = "OUTPUT_SCHEMA_VALIDATION_FAILED";
      llmResponse.errorMessage = detailedError;
      llmResponse.error = new Error(detailedError);
      const errorEvent = new Event({
        id: Event.newId(),
        invocationId: invocationContext.invocationId,
        author: agent.name,
        branch: invocationContext.branch,
        content: {
          role: "assistant",
          parts: [
            {
              text: `Error: ${detailedError}`
            }
          ]
        }
      });
      errorEvent.errorCode = "OUTPUT_SCHEMA_VALIDATION_FAILED";
      errorEvent.errorMessage = detailedError;
      errorEvent.error = new Error(detailedError);
      yield errorEvent;
    }
  }
  // Strip common code fences and surrounding explanatory text from LLM output.
  stripCodeFences(raw) {
    const fencePattern = /```(?:json)?\s*([\s\S]*?)```/i;
    const fenceMatch = raw.match(fencePattern);
    if (_optionalChain([fenceMatch, 'optionalAccess', _243 => _243[1]])) {
      return fenceMatch[1].trim();
    }
    const lines = raw.split(/\r?\n/).map((l) => l.trim());
    const startIdx = lines.findIndex(
      (l) => l.startsWith("{") || l.startsWith("[")
    );
    if (startIdx >= 0) {
      return lines.slice(startIdx).join("\n").trim();
    }
    const firstBraceIdx = raw.indexOf("{");
    const firstBracketIdx = raw.indexOf("[");
    if (firstBraceIdx === -1 && firstBracketIdx === -1) {
      const thinkingPhrases = [
        "I'll help",
        "I'll ",
        "Let me",
        "I will",
        "First, I",
        "I'm going to",
        "I need to",
        "I should"
      ];
      const lowerRaw = raw.toLowerCase();
      const isThinkingText = thinkingPhrases.some(
        (phrase) => lowerRaw.includes(phrase.toLowerCase())
      );
      if (isThinkingText && raw.length < 500) {
        this.logger.debug("Detected thinking/explanation text without JSON, skipping validation", {
          contentPreview: raw.substring(0, 200)
        });
        throw new Error("SKIP_VALIDATION: Agent is thinking/explaining, JSON output will come in next response");
      }
      return raw.trim();
    }
    let startPos = -1;
    if (firstBraceIdx >= 0 && firstBracketIdx >= 0) {
      startPos = Math.min(firstBraceIdx, firstBracketIdx);
    } else if (firstBraceIdx >= 0) {
      startPos = firstBraceIdx;
    } else {
      startPos = firstBracketIdx;
    }
    return raw.substring(startPos).trim();
  }
  // Try parsing JSON; if parse fails, attempt to repair using jsonrepair and parse again.
  tryParseJson(candidate, agentName) {
    try {
      return JSON.parse(candidate);
    } catch (err) {
      this.logger.debug("Initial JSON.parse failed, attempting jsonrepair", {
        agent: agentName,
        errorPosition: err instanceof SyntaxError ? err.message : "unknown",
        candidatePreview: candidate.substring(0, 500) + (candidate.length > 500 ? "..." : "")
      });
      try {
        const repaired = _jsonrepair.jsonrepair.call(void 0, candidate);
        this.logger.debug("jsonrepair succeeded, attempting to parse repaired JSON", {
          agent: agentName,
          repairedPreview: repaired.substring(0, 500) + (repaired.length > 500 ? "..." : "")
        });
        return JSON.parse(repaired);
      } catch (repairErr) {
        this.logger.error("Both JSON.parse and jsonrepair failed", {
          agent: agentName,
          originalError: err instanceof Error ? err.message : String(err),
          repairError: repairErr instanceof Error ? repairErr.message : String(repairErr),
          candidateLength: candidate.length,
          candidateStart: candidate.substring(0, 200),
          candidateEnd: candidate.substring(Math.max(0, candidate.length - 200))
        });
        const contextError = new Error(
          `JSON parsing failed at position ${err instanceof SyntaxError && err.message ? err.message : "unknown"}. Original error: ${err instanceof Error ? err.message : String(err)}. Content length: ${candidate.length} chars. Repair also failed: ${repairErr instanceof Error ? repairErr.message : String(repairErr)}`
        );
        throw contextError;
      }
    }
  }
}, _class26);
var responseProcessor3 = new OutputSchemaResponseProcessor();

// src/flows/llm-flows/shared-memory.ts
var SharedMemoryRequestProcessor = class extends BaseLlmRequestProcessor {
  async *runAsync(invocationContext, llmRequest) {
    const memoryService = invocationContext.memoryService;
    if (!memoryService) return;
    const lastUserEvent = invocationContext.session.events.findLast(
      (e) => e.author === "user" && _optionalChain([e, 'access', _244 => _244.content, 'optionalAccess', _245 => _245.parts, 'optionalAccess', _246 => _246.length])
    );
    if (!lastUserEvent) return;
    const query = (_nullishCoalesce(lastUserEvent.content.parts, () => ( []))).map((p) => p.text || "").join(" ");
    const results = await memoryService.searchMemory({
      appName: invocationContext.appName,
      userId: invocationContext.userId,
      query
    });
    const sessionTexts = new Set(
      (llmRequest.contents || []).flatMap(
        (c) => _optionalChain([c, 'access', _247 => _247.parts, 'optionalAccess', _248 => _248.map, 'call', _249 => _249((p) => p.text)]) || []
      )
    );
    for (const memory of results.memories) {
      const memoryText = (_nullishCoalesce(memory.content.parts, () => ( []))).map((p) => p.text || "").join(" ");
      if (!sessionTexts.has(memoryText)) {
        llmRequest.contents = llmRequest.contents || [];
        llmRequest.contents.push({
          role: "user",
          parts: [
            {
              text: `[${memory.author}] said: ${memoryText}`
            }
          ]
        });
      }
    }
  }
};
var sharedMemoryRequestProcessor = new SharedMemoryRequestProcessor();

// src/flows/llm-flows/single-flow.ts
var SingleFlow = class extends BaseLlmFlow {
  /**
   * Constructor for SingleFlow
   */
  constructor() {
    super();
    this.requestProcessors.push(
      requestProcessor2,
      requestProcessor,
      // Phase 3: Auth preprocessor
      requestProcessor6,
      requestProcessor5,
      requestProcessor4,
      sharedMemoryRequestProcessor,
      // Some implementations of NL Planning mark planning contents as thoughts
      // in the post processor. Since these need to be unmarked, NL Planning
      // should be after contents.
      requestProcessor7,
      // Phase 5: NL Planning
      // Code execution should be after the contents as it mutates the contents
      // to optimize data files.
      requestProcessor3
      // Phase 5: Code Execution (placeholder)
    );
    this.responseProcessors.push(
      responseProcessor2,
      // Phase 5: NL Planning
      responseProcessor3,
      // Phase 6: Output Schema validation and parsing - validates response against agent's output schema
      responseProcessor
      // Phase 7: Code Execution (placeholder)
    );
    this.logger.debug("SingleFlow initialized with processors");
  }
};

// src/flows/llm-flows/agent-transfer.ts
var _dedent = require('dedent'); var _dedent2 = _interopRequireDefault(_dedent);
var AgentTransferLlmRequestProcessor = class extends BaseLlmRequestProcessor {
  /**
   * Processes agent transfer by adding transfer instructions and tools
   * if the agent has transfer targets available
   */
  async *runAsync(invocationContext, llmRequest) {
    const agent = invocationContext.agent;
    if (!("subAgents" in agent) || typeof agent.subAgents !== "object") {
      return;
    }
    const transferTargets = getTransferTargets(agent);
    if (!transferTargets || transferTargets.length === 0) {
      return;
    }
    const transferInstructions = buildTargetAgentsInstructions(
      agent,
      transferTargets
    );
    llmRequest.appendInstructions([transferInstructions]);
    const transferToAgentTool = new TransferToAgentTool();
    const toolContext = new ToolContext(invocationContext);
    await transferToAgentTool.processLlmRequest(toolContext, llmRequest);
    const shouldYield = false;
    if (shouldYield) {
      yield {};
    }
  }
};
function buildTargetAgentsInfo(targetAgent) {
  return _dedent2.default`
		Agent name: ${targetAgent.name}
		Agent description: ${targetAgent.description}
	`;
}
function buildTargetAgentsInstructions(agent, targetAgents) {
  const lineBreak = "\n";
  const transferFunctionName = "transfer_to_agent";
  let instructions = _dedent2.default`
		You have a list of other agents to transfer to:

		${targetAgents.map((targetAgent) => buildTargetAgentsInfo(targetAgent)).join(lineBreak)}

		If you are the best to answer the question according to your description, you
		can answer it.

		If another agent is better for answering the question according to its
		description, call \`${transferFunctionName}\` function to transfer the
		question to that agent. When transferring, do not generate any text other than
		the function call.
`;
  if (agent.parentAgent && !agent.disallowTransferToParent) {
    instructions += _dedent2.default`
			Your parent agent is ${agent.parentAgent.name}. If neither the other agents nor
			you are best for answering the question according to the descriptions, transfer
			to your parent agent.
		`;
  }
  return instructions;
}
function getTransferTargets(agent) {
  const targets = [];
  if (agent.subAgents && Array.isArray(agent.subAgents)) {
    targets.push(...agent.subAgents);
  }
  if (!agent.parentAgent || !("subAgents" in agent.parentAgent)) {
    return targets;
  }
  if (!agent.disallowTransferToParent) {
    targets.push(agent.parentAgent);
  }
  if (!agent.disallowTransferToPeers && agent.parentAgent.subAgents) {
    const peerAgents = agent.parentAgent.subAgents.filter(
      (peerAgent) => peerAgent.name !== agent.name
    );
    targets.push(...peerAgents);
  }
  return targets;
}
var requestProcessor8 = new AgentTransferLlmRequestProcessor();

// src/flows/llm-flows/auto-flow.ts
var AutoFlow = class extends SingleFlow {
  /**
   * Constructor for AutoFlow
   */
  constructor() {
    super();
    this.requestProcessors.push(requestProcessor8);
    this.logger.debug("AutoFlow initialized with agent transfer capability");
  }
};

// src/agents/llm-agent.ts
init_function_tool();
var LlmAgent = (_class27 = class _LlmAgent extends BaseAgent {
  /**
   * The model to use for the agent
   * When not set, the agent will inherit the model from its ancestor
   */
  
  /**
   * Instructions for the LLM model, guiding the agent's behavior
   */
  
  /**
   * Instructions for all the agents in the entire agent tree
   * ONLY the global_instruction in root agent will take effect
   */
  
  /**
   * Tools available to this agent
   */
  
  /**
   * Code executor for this agent
   */
  
  /**
   * Disallows LLM-controlled transferring to the parent agent
   */
  
  /**
   * Disallows LLM-controlled transferring to the peer agents
   */
  
  /**
   * Whether to include contents in the model request
   */
  
  /**
   * The output key in session state to store the output of the agent
   */
  
  /**
   * Instructs the agent to make a plan and execute it step by step
   */
  
  /**
   * Memory service for long-term storage and retrieval
   */
  
  /**
   * Session service for managing conversations
   */
  
  /**
   * Artifact service for file storage and management
   */
  
  /**
   * User ID for the session
   */
  
  /**
   * Application name
   */
  
  /**
   * Additional content generation configurations
   */
  
  /**
   * The input schema when agent is used as a tool
   */
  
  /**
   * The output schema when agent replies
   */
  
  /**
   * Callback or list of callbacks to be called before calling the LLM
   */
  
  /**
   * Callback or list of callbacks to be called after calling the LLM
   */
  
  /**
   * Callback or list of callbacks to be called before calling a tool
   */
  
  /**
   * Callback or list of callbacks to be called after calling a tool
   */
  
  __init47() {this.logger = new Logger({ name: "LlmAgent" })}
  /**
   * Constructor for LlmAgent
   */
  constructor(config) {
    super({
      name: config.name,
      description: config.description,
      subAgents: config.subAgents,
      beforeAgentCallback: config.beforeAgentCallback,
      afterAgentCallback: config.afterAgentCallback
    });_class27.prototype.__init47.call(this);;
    this.model = config.model || "";
    this.instruction = config.instruction || "";
    this.globalInstruction = config.globalInstruction || "";
    this.tools = config.tools || [];
    this.codeExecutor = config.codeExecutor;
    this.disallowTransferToParent = config.disallowTransferToParent || false;
    this.disallowTransferToPeers = config.disallowTransferToPeers || false;
    this.includeContents = config.includeContents || "default";
    this.outputKey = config.outputKey;
    this.planner = config.planner;
    this.memoryService = config.memoryService;
    this.sessionService = config.sessionService;
    this.artifactService = config.artifactService;
    this.userId = config.userId;
    this.appName = config.appName;
    this.generateContentConfig = config.generateContentConfig;
    this.inputSchema = config.inputSchema;
    this.outputSchema = config.outputSchema;
    this.beforeModelCallback = config.beforeModelCallback;
    this.afterModelCallback = config.afterModelCallback;
    this.beforeToolCallback = config.beforeToolCallback;
    this.afterToolCallback = config.afterToolCallback;
    this.validateOutputSchemaConfig();
  }
  /**
   * The resolved model field as BaseLLM
   * This method is only for use by Agent Development Kit
   */
  get canonicalModel() {
    if (typeof this.model === "string") {
      if (this.model) {
        return LLMRegistry.newLLM(this.model);
      }
    } else if (this.model instanceof BaseLlm) {
      return this.model;
    } else if (this.model) {
      return new AiSdkLlm(this.model);
    }
    let ancestorAgent = this.parentAgent;
    while (ancestorAgent !== null && ancestorAgent !== void 0) {
      if (ancestorAgent instanceof _LlmAgent) {
        return ancestorAgent.canonicalModel;
      }
      ancestorAgent = ancestorAgent.parentAgent;
    }
    throw new Error(
      `No model found for agent "${this.name}". Please specify a model directly on this agent using the 'model' property`
    );
  }
  /**
   * The resolved instruction field to construct instruction for this agent
   * This method is only for use by Agent Development Kit
   */
  async canonicalInstruction(ctx) {
    if (typeof this.instruction === "string") {
      return [this.instruction, false];
    }
    const instruction = await this.instruction(ctx);
    return [instruction, true];
  }
  /**
   * The resolved global_instruction field to construct global instruction
   * This method is only for use by Agent Development Kit
   */
  async canonicalGlobalInstruction(ctx) {
    if (typeof this.globalInstruction === "string") {
      return [this.globalInstruction, false];
    }
    const globalInstruction = await this.globalInstruction(ctx);
    return [globalInstruction, true];
  }
  /**
   * The resolved tools field as a list of BaseTool based on the context
   * This method is only for use by Agent Development Kit
   */
  async canonicalTools(ctx) {
    const resolvedTools = [];
    for (const toolUnion of this.tools) {
      if (typeof toolUnion === "function") {
        const functionTool = new FunctionTool(toolUnion);
        resolvedTools.push(functionTool);
      } else {
        resolvedTools.push(toolUnion);
      }
    }
    return resolvedTools;
  }
  /**
   * Gets the canonical before model callbacks as an array
   */
  get canonicalBeforeModelCallbacks() {
    if (!this.beforeModelCallback) {
      return [];
    }
    if (Array.isArray(this.beforeModelCallback)) {
      return this.beforeModelCallback;
    }
    return [this.beforeModelCallback];
  }
  /**
   * Gets the canonical after model callbacks as an array
   */
  get canonicalAfterModelCallbacks() {
    if (!this.afterModelCallback) {
      return [];
    }
    if (Array.isArray(this.afterModelCallback)) {
      return this.afterModelCallback;
    }
    return [this.afterModelCallback];
  }
  /**
   * Gets the canonical before tool callbacks as an array
   */
  get canonicalBeforeToolCallbacks() {
    if (!this.beforeToolCallback) {
      return [];
    }
    if (Array.isArray(this.beforeToolCallback)) {
      return this.beforeToolCallback;
    }
    return [this.beforeToolCallback];
  }
  /**
   * Gets the canonical after tool callbacks as an array
   */
  get canonicalAfterToolCallbacks() {
    if (!this.afterToolCallback) {
      return [];
    }
    if (Array.isArray(this.afterToolCallback)) {
      return this.afterToolCallback;
    }
    return [this.afterToolCallback];
  }
  /**
   * Validates output schema configuration
   * This matches the Python implementation's __check_output_schema
   */
  validateOutputSchemaConfig() {
    if (!this.outputSchema) {
      return;
    }
    if (!this.disallowTransferToParent || !this.disallowTransferToPeers) {
      this.logger.warn(
        `Agent ${this.name}: outputSchema is set while transfer flags allow transfers. The output schema will be applied in response post-processing to preserve tool-calling and transfer behavior.`
      );
    }
    if (this.subAgents && this.subAgents.length > 0) {
      this.logger.warn(
        `Agent ${this.name}: outputSchema is set and subAgents are present. Agent transfers to sub-agents will remain enabled; the schema will be validated after transfers/tools complete.`
      );
    }
    if (this.tools && this.tools.length > 0) {
      this.logger.warn(
        `Agent ${this.name}: outputSchema is set and tools are configured. Tools will be callable; the output schema will be applied during response post-processing.`
      );
    }
  }
  /**
   * Gets the appropriate LLM flow for this agent
   * This matches the Python implementation's _llm_flow property
   */
  get llmFlow() {
    if (this.disallowTransferToParent && this.disallowTransferToPeers && !_optionalChain([this, 'access', _250 => _250.subAgents, 'optionalAccess', _251 => _251.length])) {
      return new SingleFlow();
    }
    return new AutoFlow();
  }
  /**
   * Saves the model output to state if needed
   * This matches the Python implementation's __maybe_save_output_to_state
   */
  maybeSaveOutputToState(event) {
    if (event.author !== this.name) {
      this.logger.debug(
        `Skipping output save for agent ${this.name}: event authored by ${event.author}`
      );
      return;
    }
    if (this.outputKey && event.isFinalResponse() && _optionalChain([event, 'access', _252 => _252.content, 'optionalAccess', _253 => _253.parts])) {
      let result = event.content.parts.map((part) => part.text || "").join("");
      if (this.outputSchema) {
        if (!result.trim()) {
          return;
        }
        try {
          const parsed = JSON.parse(result);
          result = this.outputSchema.parse(parsed);
        } catch (error) {
          this.logger.error("Failed to validate output with schema:", error);
          throw new Error(
            `Output validation failed: ${error instanceof Error ? error.message : String(error)}`
          );
        }
      }
      if (result) {
        if (!event.actions.stateDelta) {
          event.actions.stateDelta = {};
        }
        event.actions.stateDelta[this.outputKey] = result;
      }
    }
  }
  /**
   * Core logic to run this agent via text-based conversation
   * This matches the Python implementation's _run_async_impl
   */
  async *runAsyncImpl(context4) {
    this.logger.debug(`Starting LlmAgent execution for "${this.name}"`);
    try {
      for await (const event of this.llmFlow.runAsync(context4)) {
        this.maybeSaveOutputToState(event);
        yield event;
      }
    } catch (error) {
      this.logger.error("Error in LlmAgent execution:", error);
      const errorEvent = new Event({
        invocationId: context4.invocationId,
        author: this.name,
        branch: context4.branch,
        content: {
          parts: [
            {
              text: `Error: ${error instanceof Error ? error.message : String(error)}`
            }
          ]
        }
      });
      errorEvent.errorCode = "AGENT_EXECUTION_ERROR";
      errorEvent.errorMessage = error instanceof Error ? error.message : String(error);
      yield errorEvent;
    }
  }
}, _class27);

// src/agents/sequential-agent.ts
var SequentialAgent = class extends BaseAgent {
  /**
   * Constructor for SequentialAgent
   */
  constructor(config) {
    super({
      name: config.name,
      description: config.description,
      subAgents: config.subAgents
    });
  }
  /**
   * Core logic to run this agent via text-based conversation
   */
  async *runAsyncImpl(ctx) {
    for (const subAgent of this.subAgents) {
      for await (const event of subAgent.runAsync(ctx)) {
        yield event;
      }
    }
  }
  /**
   * Core logic to run this agent via video/audio-based conversation
   *
   * Compared to the non-live case, live agents process a continuous stream of audio
   * or video, so there is no way to tell if it's finished and should pass
   * to the next agent or not. So we introduce a task_completed() function so the
   * model can call this function to signal that it's finished the task and we
   * can move on to the next agent.
   */
  async *runLiveImpl(ctx) {
    for (const subAgent of this.subAgents) {
      let taskCompleted = function() {
        return "Task completion signaled.";
      };
      if (subAgent instanceof LlmAgent) {
        const toolNames = subAgent.tools.map(
          (tool) => typeof tool === "function" ? tool.name : tool.name
        );
        if (!toolNames.includes(taskCompleted.name)) {
          subAgent.tools.push(taskCompleted);
          subAgent.instruction += `If you finished the user's request
according to its description, call the ${taskCompleted.name} function
to exit so the next agents can take over. When calling this function,
do not generate any text other than the function call.`;
        }
      }
    }
    for (const subAgent of this.subAgents) {
      for await (const event of subAgent.runLive(ctx)) {
        yield event;
      }
    }
  }
};

// src/agents/parallel-agent.ts
function createBranchContextForSubAgent(agent, subAgent, invocationContext) {
  const branchSuffix = `${agent.name}.${subAgent.name}`;
  const branch = invocationContext.branch ? `${invocationContext.branch}.${branchSuffix}` : branchSuffix;
  return new InvocationContext({
    artifactService: invocationContext.artifactService,
    sessionService: invocationContext.sessionService,
    memoryService: invocationContext.memoryService,
    invocationId: invocationContext.invocationId,
    branch,
    agent: subAgent,
    userContent: invocationContext.userContent,
    session: invocationContext.session,
    endInvocation: invocationContext.endInvocation,
    liveRequestQueue: invocationContext.liveRequestQueue,
    activeStreamingTools: invocationContext.activeStreamingTools,
    transcriptionCache: invocationContext.transcriptionCache,
    runConfig: invocationContext.runConfig
  });
}
async function* mergeAgentRun(agentRuns) {
  if (agentRuns.length === 0) {
    return;
  }
  const nextFor = (gen, index) => gen.next().then((result) => ({ index, result })).catch((error) => ({
    index,
    result: { done: true, value: void 0 },
    error
  }));
  const entries = agentRuns.map((gen, i) => ({ index: i, promise: nextFor(gen, i) }));
  const activePromises = () => entries.filter((e) => !!e).map((e) => e.promise);
  while (true) {
    const currentActivePromises = activePromises();
    if (currentActivePromises.length === 0) {
      break;
    }
    const { index, result, error } = await Promise.race(currentActivePromises);
    if (error) {
      console.error(`Error in parallel agent ${index}:`, error);
      entries[index] = void 0;
      continue;
    }
    if (!result.done) {
      yield result.value;
      entries[index] = { index, promise: nextFor(agentRuns[index], index) };
    } else {
      entries[index] = void 0;
    }
  }
}
var ParallelAgent = class extends BaseAgent {
  /**
   * Constructor for ParallelAgent
   */
  constructor(config) {
    super({
      name: config.name,
      description: config.description,
      subAgents: config.subAgents
    });
  }
  /**
   * Core logic to run this agent via text-based conversation
   */
  async *runAsyncImpl(ctx) {
    const agentRuns = this.subAgents.map(
      (subAgent) => subAgent.runAsync(createBranchContextForSubAgent(this, subAgent, ctx))
    );
    for await (const event of mergeAgentRun(agentRuns)) {
      yield event;
    }
  }
  /**
   * Core logic to run this agent via video/audio-based conversation
   */
  async *runLiveImpl(_ctx) {
    throw new Error("This is not supported yet for ParallelAgent.");
  }
};

// src/agents/loop-agent.ts
var LoopAgent = class extends BaseAgent {
  /**
   * The maximum number of iterations to run the loop agent.
   * If not set, the loop agent will run indefinitely until a sub-agent escalates.
   */
  
  /**
   * Constructor for LoopAgent
   */
  constructor(config) {
    super({
      name: config.name,
      description: config.description,
      subAgents: config.subAgents
    });
    this.maxIterations = config.maxIterations;
  }
  /**
   * Core logic to run this agent via text-based conversation
   */
  async *runAsyncImpl(ctx) {
    let timesLooped = 0;
    while (!this.maxIterations || timesLooped < this.maxIterations) {
      for (const subAgent of this.subAgents) {
        for await (const event of subAgent.runAsync(ctx)) {
          yield event;
          if (_optionalChain([event, 'access', _254 => _254.actions, 'optionalAccess', _255 => _255.escalate])) {
            return;
          }
        }
      }
      timesLooped++;
    }
  }
  /**
   * Core logic to run this agent via video/audio-based conversation
   */
  async *runLiveImpl(_ctx) {
    throw new Error("This is not supported yet for LoopAgent.");
  }
};

// src/agents/lang-graph-agent.ts
init_logger();
var LangGraphAgent = (_class28 = class extends BaseAgent {
  /**
   * Graph nodes (agents and their connections)
   */
  
  /**
   * Root node to start execution from
   */
  
  /**
   * Maximum number of steps to prevent infinite loops
   */
  
  /**
   * Results from node executions
   */
  __init48() {this.results = []}
  __init49() {this.logger = new Logger({ name: "LangGraphAgent" })}
  /**
   * Constructor for LangGraphAgent
   */
  constructor(config) {
    super({
      name: config.name,
      description: config.description
    });_class28.prototype.__init48.call(this);_class28.prototype.__init49.call(this);;
    this.nodes = /* @__PURE__ */ new Map();
    for (const node of config.nodes) {
      if (this.nodes.has(node.name)) {
        throw new Error(`Duplicate node name in graph: ${node.name}`);
      }
      this.nodes.set(node.name, node);
      this.subAgents.push(node.agent);
    }
    if (!this.nodes.has(config.rootNode)) {
      throw new Error(
        `Root node "${config.rootNode}" not found in graph nodes`
      );
    }
    this.rootNode = config.rootNode;
    this.maxSteps = config.maxSteps || 50;
    this.validateGraph();
  }
  /**
   * Validates the graph for potential issues
   */
  validateGraph() {
    for (const [nodeName, node] of Array.from(this.nodes)) {
      if (node.targets) {
        for (const target of node.targets) {
          if (!this.nodes.has(target)) {
            throw new Error(
              `Node "${nodeName}" targets non-existent node "${target}"`
            );
          }
        }
      }
    }
  }
  /**
   * Gets the next nodes to execute based on the current node and its result
   */
  async getNextNodes(currentNode, lastEvent, context4) {
    if (!currentNode.targets || currentNode.targets.length === 0) {
      return [];
    }
    const nextNodes = [];
    for (const targetName of currentNode.targets) {
      const targetNode = this.nodes.get(targetName);
      if (!targetNode) {
        this.logger.error(`Target node "${targetName}" not found`);
        continue;
      }
      if (targetNode.condition) {
        const shouldExecute = await targetNode.condition(lastEvent, context4);
        if (!shouldExecute) {
          this.logger.debug(`Skipping node "${targetName}" due to condition`);
          continue;
        }
      }
      nextNodes.push(targetNode);
    }
    return nextNodes;
  }
  /**
   * Core logic to run this agent via text-based conversation.
   */
  async *runAsyncImpl(context4) {
    this.logger.debug(
      `Starting graph execution from root node "${this.rootNode}"`
    );
    if (this.nodes.size === 0) {
      yield new Event({
        author: this.name,
        content: { parts: [{ text: "No nodes defined in the graph." }] }
      });
      return;
    }
    const rootNode = this.nodes.get(this.rootNode);
    if (!rootNode) {
      yield new Event({
        author: this.name,
        content: {
          parts: [{ text: `Root node "${this.rootNode}" not found.` }]
        }
      });
      return;
    }
    let stepCount = 0;
    const nodesToExecute = [{ node: rootNode, context: context4 }];
    const executedNodes = [];
    let lastEvent = null;
    while (nodesToExecute.length > 0 && stepCount < this.maxSteps) {
      stepCount++;
      const { node } = nodesToExecute.shift();
      this.logger.debug(`Step ${stepCount}: Executing node "${node.name}"`);
      executedNodes.push(node.name);
      const childContext = context4.createChildContext(node.agent);
      try {
        const nodeEvents = [];
        for await (const event of node.agent.runAsync(childContext)) {
          nodeEvents.push(event);
          lastEvent = event;
          yield event;
        }
        this.results.push({
          node: node.name,
          events: nodeEvents
        });
        if (lastEvent) {
          const nextNodes = await this.getNextNodes(node, lastEvent, context4);
          for (const nextNode of nextNodes) {
            nodesToExecute.push({
              node: nextNode,
              context: childContext
            });
          }
        }
      } catch (error) {
        this.logger.error(`Error in node "${node.name}":`, error);
        const errorEvent = new Event({
          author: this.name,
          content: {
            parts: [
              {
                text: `Error in node "${node.name}": ${error instanceof Error ? error.message : String(error)}`
              }
            ]
          }
        });
        errorEvent.errorCode = "NODE_EXECUTION_ERROR";
        errorEvent.errorMessage = error instanceof Error ? error.message : String(error);
        yield errorEvent;
        return;
      }
    }
    const completionEvent = new Event({
      author: this.name,
      content: {
        parts: [
          {
            text: `Graph execution complete. Executed nodes: ${executedNodes.join(" \u2192 ")}`
          }
        ]
      }
    });
    completionEvent.turnComplete = true;
    yield completionEvent;
  }
  /**
   * Core logic to run this agent via video/audio-based conversation.
   * For LangGraph, this follows the same execution pattern as text-based.
   */
  async *runLiveImpl(context4) {
    yield* this.runAsyncImpl(context4);
  }
  /**
   * Gets the execution results from the last run
   */
  getExecutionResults() {
    return [...this.results];
  }
  /**
   * Clears the execution history
   */
  clearExecutionHistory() {
    this.results = [];
  }
  /**
   * Gets all nodes in the graph
   */
  getNodes() {
    return Array.from(this.nodes.values());
  }
  /**
   * Gets a specific node by name
   */
  getNode(name) {
    return this.nodes.get(name);
  }
  /**
   * Gets the root node name
   */
  getRootNodeName() {
    return this.rootNode;
  }
  /**
   * Gets the maximum steps configuration
   */
  getMaxSteps() {
    return this.maxSteps;
  }
  /**
   * Updates the maximum steps configuration
   */
  setMaxSteps(maxSteps) {
    if (maxSteps <= 0) {
      throw new Error("maxSteps must be greater than 0");
    }
    this.maxSteps = maxSteps;
  }
}, _class28);

// src/agents/agent-builder.ts
init_logger();


// src/runners.ts


// src/agents/run-config.ts
var StreamingMode = /* @__PURE__ */ ((StreamingMode2) => {
  StreamingMode2["NONE"] = "NONE";
  StreamingMode2["SSE"] = "sse";
  StreamingMode2["BIDI"] = "bidi";
  return StreamingMode2;
})(StreamingMode || {});
var RunConfig = class {
  /**
   * Speech configuration for the live agent
   */
  
  /**
   * The output modalities. If not set, it's default to AUDIO.
   */
  
  /**
   * Whether or not to save the input blobs as artifacts.
   */
  
  /**
   * Whether to support CFC (Compositional Function Calling). Only applicable for
   * StreamingMode.SSE. If it's true. the LIVE API will be invoked. Since only LIVE
   * API supports CFC
   *
   * @warning This feature is **experimental** and its API or behavior may change
   * in future releases.
   */
  
  /**
   * Streaming mode, None or StreamingMode.SSE or StreamingMode.BIDI.
   */
  
  /**
   * Output transcription for live agents with audio response.
   */
  
  /**
   * Input transcription for live agents with audio input from user.
   */
  
  /**
   * Realtime input config for live agents with audio input from user.
   */
  
  /**
   * If enabled, the model will detect emotions and adapt its responses accordingly.
   */
  
  /**
   * Configures the proactivity of the model. This allows the model to respond
   * proactively to the input and to ignore irrelevant input.
   */
  
  /**
   * A limit on the total number of llm calls for a given run.
   *
   * Valid Values:
   *   - More than 0 and less than Number.MAX_SAFE_INTEGER: The bound on the number of llm
   *     calls is enforced, if the value is set in this range.
   *   - Less than or equal to 0: This allows for unbounded number of llm calls.
   */
  
  constructor(config) {
    this.speechConfig = _optionalChain([config, 'optionalAccess', _256 => _256.speechConfig]);
    this.responseModalities = _optionalChain([config, 'optionalAccess', _257 => _257.responseModalities]);
    this.saveInputBlobsAsArtifacts = _optionalChain([config, 'optionalAccess', _258 => _258.saveInputBlobsAsArtifacts]) || false;
    this.supportCFC = _optionalChain([config, 'optionalAccess', _259 => _259.supportCFC]) || false;
    this.streamingMode = _optionalChain([config, 'optionalAccess', _260 => _260.streamingMode]) || "NONE" /* NONE */;
    this.outputAudioTranscription = _optionalChain([config, 'optionalAccess', _261 => _261.outputAudioTranscription]);
    this.inputAudioTranscription = _optionalChain([config, 'optionalAccess', _262 => _262.inputAudioTranscription]);
    this.realtimeInputConfig = _optionalChain([config, 'optionalAccess', _263 => _263.realtimeInputConfig]);
    this.enableAffectiveDialog = _optionalChain([config, 'optionalAccess', _264 => _264.enableAffectiveDialog]);
    this.proactivity = _optionalChain([config, 'optionalAccess', _265 => _265.proactivity]);
    this.maxLlmCalls = _nullishCoalesce(_optionalChain([config, 'optionalAccess', _266 => _266.maxLlmCalls]), () => ( 500));
    this.validateMaxLlmCalls();
  }
  /**
   * Validates the maxLlmCalls value
   */
  validateMaxLlmCalls() {
    if (this.maxLlmCalls === Number.MAX_SAFE_INTEGER) {
      throw new Error(
        `maxLlmCalls should be less than ${Number.MAX_SAFE_INTEGER}.`
      );
    }
    if (this.maxLlmCalls <= 0) {
      console.warn(
        "maxLlmCalls is less than or equal to 0. This will result in no enforcement on total number of llm calls that will be made for a run. This may not be ideal, as this could result in a never ending communication between the model and the agent in certain cases."
      );
    }
  }
};

// src/artifacts/in-memory-artifact-service.ts
var InMemoryArtifactService = (_class29 = class {constructor() { _class29.prototype.__init50.call(this); }
  __init50() {this.artifacts = /* @__PURE__ */ new Map()}
  fileHasUserNamespace(filename) {
    return filename.startsWith("user:");
  }
  getArtifactPath(appName, userId, sessionId, filename) {
    if (this.fileHasUserNamespace(filename)) {
      return `${appName}/${userId}/user/${filename}`;
    }
    return `${appName}/${userId}/${sessionId}/${filename}`;
  }
  async saveArtifact(args) {
    const { appName, userId, sessionId, filename, artifact } = args;
    const path3 = this.getArtifactPath(appName, userId, sessionId, filename);
    if (!this.artifacts.has(path3)) {
      this.artifacts.set(path3, []);
    }
    const versions = this.artifacts.get(path3);
    const version = versions.length;
    versions.push(artifact);
    return version;
  }
  async loadArtifact(args) {
    const { appName, userId, sessionId, filename, version } = args;
    const path3 = this.getArtifactPath(appName, userId, sessionId, filename);
    const versions = this.artifacts.get(path3);
    if (!versions || versions.length === 0) {
      return null;
    }
    let targetVersion = version;
    if (targetVersion === void 0 || targetVersion === null) {
      targetVersion = versions.length - 1;
    }
    if (targetVersion < 0) {
      targetVersion = versions.length + targetVersion;
    }
    if (targetVersion < 0 || targetVersion >= versions.length) {
      return null;
    }
    return versions[targetVersion];
  }
  async listArtifactKeys(args) {
    const { appName, userId, sessionId } = args;
    const sessionPrefix = `${appName}/${userId}/${sessionId}/`;
    const userNamespacePrefix = `${appName}/${userId}/user/`;
    const filenames = [];
    for (const path3 of this.artifacts.keys()) {
      if (path3.startsWith(sessionPrefix)) {
        const filename = path3.substring(sessionPrefix.length);
        filenames.push(filename);
      } else if (path3.startsWith(userNamespacePrefix)) {
        const filename = path3.substring(userNamespacePrefix.length);
        filenames.push(filename);
      }
    }
    return filenames.sort();
  }
  async deleteArtifact(args) {
    const { appName, userId, sessionId, filename } = args;
    const path3 = this.getArtifactPath(appName, userId, sessionId, filename);
    if (!this.artifacts.has(path3)) {
      return;
    }
    this.artifacts.delete(path3);
  }
  async listVersions(args) {
    const { appName, userId, sessionId, filename } = args;
    const path3 = this.getArtifactPath(appName, userId, sessionId, filename);
    const versions = this.artifacts.get(path3);
    if (!versions || versions.length === 0) {
      return [];
    }
    return Array.from({ length: versions.length }, (_, i) => i);
  }
}, _class29);

// src/runners.ts
init_logger();

// src/memory/_utils.ts
function formatTimestamp(timestamp) {
  if (timestamp instanceof Date) {
    return timestamp.toISOString();
  }
  if (typeof timestamp === "string") {
    return timestamp;
  }
  if (typeof timestamp === "number") {
    return new Date(timestamp).toISOString();
  }
  return (/* @__PURE__ */ new Date()).toISOString();
}

// src/memory/in-memory-memory-service.ts
function _userKey(appName, userId) {
  return `${appName}/${userId}`;
}
function _extractWordsLower(text) {
  const words = text.match(/[A-Za-z]+/g) || [];
  return new Set(words.map((word) => word.toLowerCase()));
}
var InMemoryMemoryService = (_class30 = class {
  /**
   * Keys are app_name/user_id, session_id. Values are session event lists.
   */
  __init51() {this._sessionEvents = /* @__PURE__ */ new Map()}
  /**
   * Constructor for InMemoryMemoryService
   */
  constructor() {;_class30.prototype.__init51.call(this);
    this._sessionEvents = /* @__PURE__ */ new Map();
  }
  /**
   * Adds a session to the memory service
   * @param session The session to add
   */
  async addSessionToMemory(session) {
    const userKey = _userKey(session.appName, session.userId);
    if (!this._sessionEvents.has(userKey)) {
      this._sessionEvents.set(userKey, /* @__PURE__ */ new Map());
    }
    const userSessions = this._sessionEvents.get(userKey);
    const filteredEvents = session.events.filter(
      (event) => _optionalChain([event, 'access', _267 => _267.content, 'optionalAccess', _268 => _268.parts])
    );
    userSessions.set(session.id, filteredEvents);
  }
  /**
   * Searches memory for relevant information
   * @param options Search options containing app_name, user_id, and query
   * @returns Search results
   */
  async searchMemory(options) {
    const { appName, userId, query } = options;
    const userKey = _userKey(appName, userId);
    if (!this._sessionEvents.has(userKey)) {
      return { memories: [] };
    }
    const wordsInQuery = new Set(query.toLowerCase().split(" "));
    const response = { memories: [] };
    const userSessions = this._sessionEvents.get(userKey);
    for (const sessionEvents of userSessions.values()) {
      for (const event of sessionEvents) {
        if (!event.content || !event.content.parts) {
          continue;
        }
        const textParts = event.content.parts.filter((part) => part.text).map((part) => part.text).join(" ");
        const wordsInEvent = _extractWordsLower(textParts);
        if (wordsInEvent.size === 0) {
          continue;
        }
        const hasMatch = Array.from(wordsInQuery).some(
          (queryWord) => wordsInEvent.has(queryWord)
        );
        if (hasMatch) {
          const memoryEntry = {
            content: event.content,
            author: event.author,
            timestamp: formatTimestamp(event.timestamp)
          };
          response.memories.push(memoryEntry);
        }
      }
    }
    return response;
  }
  /**
   * Gets all sessions in the memory service (for backward compatibility)
   * @returns All sessions - Note: This method may not be fully compatible with the new structure
   */
  getAllSessions() {
    console.warn(
      "getAllSessions() is deprecated and may not work correctly with the new memory structure"
    );
    return [];
  }
  /**
   * Gets a session by ID (for backward compatibility)
   * @param sessionId The session ID
   * @returns The session or undefined if not found
   */
  getSession(sessionId) {
    console.warn(
      "getSession() is deprecated and may not work correctly with the new memory structure"
    );
    return void 0;
  }
  /**
   * Clears all sessions from memory
   */
  clear() {
    this._sessionEvents.clear();
  }
}, _class30);

// src/sessions/in-memory-session-service.ts
var _crypto = require('crypto');

// src/sessions/base-session-service.ts
var BaseSessionService = class {
  /**
   * Appends an event to a session object.
   * @param session The session to append the event to.
   * @param event The event to append.
   * @returns The appended event.
   */
  async appendEvent(session, event) {
    if (event.partial) {
      return event;
    }
    this.updateSessionState(session, event);
    session.events.push(event);
    return event;
  }
  /**
   * Updates the session state based on the event.
   * @param session The session to update.
   * @param event The event containing state changes.
   */
  updateSessionState(session, event) {
    if (!event.actions || !event.actions.stateDelta) {
      return;
    }
    for (const key in event.actions.stateDelta) {
      if (Object.prototype.hasOwnProperty.call(event.actions.stateDelta, key)) {
        if (key.startsWith("temp_")) {
          continue;
        }
        session.state[key] = event.actions.stateDelta[key];
      }
    }
  }
};

// src/sessions/in-memory-session-service.ts
var InMemorySessionService = (_class31 = class extends BaseSessionService {constructor(...args3) { super(...args3); _class31.prototype.__init52.call(this);_class31.prototype.__init53.call(this);_class31.prototype.__init54.call(this); }
  /**
   * A map from app name to a map from user ID to a map from session ID to session.
   */
  __init52() {this.sessions = /* @__PURE__ */ new Map()}
  /**
   * A map from app name to a map from user ID to a map from key to the value.
   */
  __init53() {this.userState = /* @__PURE__ */ new Map()}
  /**
   * A map from app name to a map from key to the value.
   */
  __init54() {this.appState = /* @__PURE__ */ new Map()}
  /**
   * Creates a new session.
   */
  async createSession(appName, userId, state, sessionId) {
    return this.createSessionImpl(appName, userId, state, sessionId);
  }
  /**
   * @deprecated Please migrate to the async method.
   */
  createSessionSync(appName, userId, state, sessionId) {
    console.warn("Deprecated. Please migrate to the async method.");
    return this.createSessionImpl(appName, userId, state, sessionId);
  }
  createSessionImpl(appName, userId, state, sessionId) {
    const finalSessionId = _optionalChain([sessionId, 'optionalAccess', _269 => _269.trim, 'call', _270 => _270()]) || _crypto.randomUUID.call(void 0, );
    const session = {
      appName,
      userId,
      id: finalSessionId,
      state: state || {},
      events: [],
      lastUpdateTime: Date.now() / 1e3
    };
    if (!this.sessions.has(appName)) {
      this.sessions.set(appName, /* @__PURE__ */ new Map());
    }
    if (!this.sessions.get(appName).has(userId)) {
      this.sessions.get(appName).set(userId, /* @__PURE__ */ new Map());
    }
    this.sessions.get(appName).get(userId).set(finalSessionId, session);
    const copiedSession = structuredClone(session);
    return this.mergeState(appName, userId, copiedSession);
  }
  /**
   * Gets a session.
   */
  async getSession(appName, userId, sessionId, config) {
    return this.getSessionImpl(appName, userId, sessionId, config);
  }
  /**
   * @deprecated Please migrate to the async method.
   */
  getSessionSync(appName, userId, sessionId, config) {
    console.warn("Deprecated. Please migrate to the async method.");
    return this.getSessionImpl(appName, userId, sessionId, config);
  }
  getSessionImpl(appName, userId, sessionId, config) {
    if (!this.sessions.has(appName)) {
      return void 0;
    }
    if (!this.sessions.get(appName).has(userId)) {
      return void 0;
    }
    if (!this.sessions.get(appName).get(userId).has(sessionId)) {
      return void 0;
    }
    const session = this.sessions.get(appName).get(userId).get(sessionId);
    if (!session) {
      return void 0;
    }
    const copiedSession = structuredClone(session);
    if (config) {
      if (config.numRecentEvents) {
        copiedSession.events = copiedSession.events.slice(
          -config.numRecentEvents
        );
      }
      if (config.afterTimestamp) {
        let i = copiedSession.events.length - 1;
        while (i >= 0) {
          if (copiedSession.events[i].timestamp < config.afterTimestamp) {
            break;
          }
          i--;
        }
        if (i >= 0) {
          copiedSession.events = copiedSession.events.slice(i + 1);
        }
      }
    }
    return this.mergeState(appName, userId, copiedSession);
  }
  mergeState(appName, userId, copiedSession) {
    if (this.appState.has(appName)) {
      for (const [key, value] of this.appState.get(appName).entries()) {
        copiedSession.state[State.APP_PREFIX + key] = value;
      }
    }
    if (!this.userState.has(appName) || !this.userState.get(appName).has(userId)) {
      return copiedSession;
    }
    for (const [key, value] of this.userState.get(appName).get(userId).entries()) {
      copiedSession.state[State.USER_PREFIX + key] = value;
    }
    return copiedSession;
  }
  /**
   * Lists all the sessions for a user.
   */
  async listSessions(appName, userId) {
    return this.listSessionsImpl(appName, userId);
  }
  /**
   * @deprecated Please migrate to the async method.
   */
  listSessionsSync(appName, userId) {
    console.warn("Deprecated. Please migrate to the async method.");
    return this.listSessionsImpl(appName, userId);
  }
  listSessionsImpl(appName, userId) {
    const emptyResponse = { sessions: [] };
    if (!this.sessions.has(appName)) {
      return emptyResponse;
    }
    if (!this.sessions.get(appName).has(userId)) {
      return emptyResponse;
    }
    const sessionsWithoutEvents = [];
    for (const session of this.sessions.get(appName).get(userId).values()) {
      const copiedSession = structuredClone(session);
      copiedSession.events = [];
      copiedSession.state = {};
      sessionsWithoutEvents.push(copiedSession);
    }
    return { sessions: sessionsWithoutEvents };
  }
  /**
   * Deletes a session.
   */
  async deleteSession(appName, userId, sessionId) {
    this.deleteSessionImpl(appName, userId, sessionId);
  }
  /**
   * @deprecated Please migrate to the async method.
   */
  deleteSessionSync(appName, userId, sessionId) {
    console.warn("Deprecated. Please migrate to the async method.");
    this.deleteSessionImpl(appName, userId, sessionId);
  }
  deleteSessionImpl(appName, userId, sessionId) {
    if (this.getSessionImpl(appName, userId, sessionId) === void 0) {
      return;
    }
    this.sessions.get(appName).get(userId).delete(sessionId);
  }
  /**
   * Appends an event to a session object.
   */
  async appendEvent(session, event) {
    await super.appendEvent(session, event);
    session.lastUpdateTime = event.timestamp;
    const appName = session.appName;
    const userId = session.userId;
    const sessionId = session.id;
    const warning = (message) => {
      console.warn(
        `Failed to append event to session ${sessionId}: ${message}`
      );
    };
    if (!this.sessions.has(appName)) {
      warning(`appName ${appName} not in sessions`);
      return event;
    }
    if (!this.sessions.get(appName).has(userId)) {
      warning(`userId ${userId} not in sessions[appName]`);
      return event;
    }
    if (!this.sessions.get(appName).get(userId).has(sessionId)) {
      warning(`sessionId ${sessionId} not in sessions[appName][userId]`);
      return event;
    }
    if (_optionalChain([event, 'access', _271 => _271.actions, 'optionalAccess', _272 => _272.stateDelta])) {
      for (const key in event.actions.stateDelta) {
        const value = event.actions.stateDelta[key];
        if (key.startsWith(State.APP_PREFIX)) {
          if (!this.appState.has(appName)) {
            this.appState.set(appName, /* @__PURE__ */ new Map());
          }
          this.appState.get(appName).set(key.substring(State.APP_PREFIX.length), value);
        }
        if (key.startsWith(State.USER_PREFIX)) {
          if (!this.userState.has(appName)) {
            this.userState.set(appName, /* @__PURE__ */ new Map());
          }
          if (!this.userState.get(appName).has(userId)) {
            this.userState.get(appName).set(userId, /* @__PURE__ */ new Map());
          }
          this.userState.get(appName).get(userId).set(key.substring(State.USER_PREFIX.length), value);
        }
      }
    }
    const storageSession = this.sessions.get(appName).get(userId).get(sessionId);
    await super.appendEvent(storageSession, event);
    storageSession.lastUpdateTime = event.timestamp;
    return event;
  }
}, _class31);

// src/runners.ts
function _findFunctionCallEventIfLastEventIsFunctionResponse(session) {
  const events = session.events;
  if (!events || events.length === 0) {
    return null;
  }
  const lastEvent = events[events.length - 1];
  if (_optionalChain([lastEvent, 'access', _273 => _273.content, 'optionalAccess', _274 => _274.parts, 'optionalAccess', _275 => _275.some, 'call', _276 => _276((part) => part.functionResponse)])) {
    const functionCallId = _optionalChain([lastEvent, 'access', _277 => _277.content, 'access', _278 => _278.parts, 'access', _279 => _279.find, 'call', _280 => _280(
      (part) => part.functionResponse
    ), 'optionalAccess', _281 => _281.functionResponse, 'optionalAccess', _282 => _282.id]);
    if (!functionCallId) return null;
    for (let i = events.length - 2; i >= 0; i--) {
      const event = events[i];
      const functionCalls = _optionalChain([event, 'access', _283 => _283.getFunctionCalls, 'optionalCall', _284 => _284()]) || [];
      for (const functionCall of functionCalls) {
        if (functionCall.id === functionCallId) {
          return event;
        }
      }
    }
  }
  return null;
}
var Runner = (_class32 = class {
  /**
   * The app name of the runner.
   */
  
  /**
   * The root agent to run.
   */
  
  /**
   * The artifact service for the runner.
   */
  
  /**
   * The session service for the runner.
   */
  
  /**
   * The memory service for the runner.
   */
  
  __init55() {this.logger = new Logger({ name: "Runner" })}
  /**
   * Initializes the Runner.
   */
  constructor({
    appName,
    agent,
    artifactService,
    sessionService,
    memoryService
  }) {;_class32.prototype.__init55.call(this);
    this.appName = appName;
    this.agent = agent;
    this.artifactService = artifactService;
    this.sessionService = sessionService;
    this.memoryService = memoryService;
  }
  /**
   * Runs the agent synchronously.
   * NOTE: This sync interface is only for local testing and convenience purpose.
   * Consider using `runAsync` for production usage.
   */
  run({
    userId,
    sessionId,
    newMessage,
    runConfig = new RunConfig()
  }) {
    const eventQueue = [];
    let queueIndex = 0;
    let asyncCompleted = false;
    const invokeRunAsync = async () => {
      try {
        for await (const event of this.runAsync({
          userId,
          sessionId,
          newMessage,
          runConfig
        })) {
          eventQueue.push(event);
        }
      } finally {
        eventQueue.push(null);
        asyncCompleted = true;
      }
    };
    invokeRunAsync();
    return (function* () {
      while (true) {
        while (queueIndex >= eventQueue.length && !asyncCompleted) {
        }
        if (queueIndex >= eventQueue.length && asyncCompleted) {
          break;
        }
        const event = eventQueue[queueIndex++];
        if (event === null) {
          break;
        }
        yield event;
      }
    })();
  }
  /**
   * Main entry method to run the agent in this runner.
   */
  async *runAsync({
    userId,
    sessionId,
    newMessage,
    runConfig = new RunConfig()
  }) {
    const span = tracer.startSpan("invocation");
    const spanContext = _api.trace.setSpan(_api.context.active(), span);
    try {
      const session = await _api.context.with(
        spanContext,
        () => this.sessionService.getSession(this.appName, userId, sessionId)
      );
      if (!session) {
        throw new Error(`Session not found: ${sessionId}`);
      }
      const invocationContext = this._newInvocationContext(session, {
        newMessage,
        runConfig
      });
      if (newMessage) {
        await _api.context.with(
          spanContext,
          () => this._appendNewMessageToSession(
            session,
            newMessage,
            invocationContext,
            runConfig.saveInputBlobsAsArtifacts || false
          )
        );
      }
      invocationContext.agent = this._findAgentToRun(session, this.agent);
      const agentGenerator = invocationContext.agent.runAsync(invocationContext);
      while (true) {
        const result = await _api.context.with(
          spanContext,
          () => agentGenerator.next()
        );
        if (result.done) {
          break;
        }
        const event = result.value;
        if (!event.partial) {
          await _api.context.with(spanContext, async () => {
            await this.sessionService.appendEvent(session, event);
            if (this.memoryService) {
              await this.memoryService.addSessionToMemory(session);
            }
          });
        }
        yield event;
      }
    } catch (error) {
      this.logger.debug("Error running agent:", error);
      span.recordException(error);
      span.setStatus({
        code: _api.SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : "Unknown error"
      });
      throw error;
    } finally {
      span.end();
    }
  }
  /**
   * Appends a new message to the session.
   */
  async _appendNewMessageToSession(session, newMessage, invocationContext, saveInputBlobsAsArtifacts = false) {
    if (!newMessage.parts) {
      throw new Error("No parts in the new_message.");
    }
    if (this.artifactService && saveInputBlobsAsArtifacts) {
      for (let i = 0; i < newMessage.parts.length; i++) {
        const part = newMessage.parts[i];
        if (!part.inlineData) {
          continue;
        }
        const fileName = `artifact_${invocationContext.invocationId}_${i}`;
        await this.artifactService.saveArtifact({
          appName: this.appName,
          userId: session.userId,
          sessionId: session.id,
          filename: fileName,
          artifact: part
        });
        newMessage.parts[i] = {
          text: `Uploaded file: ${fileName}. It is saved into artifacts`
        };
      }
    }
    const userContent = {
      ...newMessage,
      role: "user"
      // Ensure role is set for content filtering
    };
    const event = new Event({
      invocationId: invocationContext.invocationId,
      author: "user",
      content: userContent
    });
    await this.sessionService.appendEvent(session, event);
  }
  /**
   * Finds the agent to run to continue the session.
   */
  _findAgentToRun(session, rootAgent) {
    const event = _findFunctionCallEventIfLastEventIsFunctionResponse(session);
    if (_optionalChain([event, 'optionalAccess', _285 => _285.author])) {
      return rootAgent.findAgent(event.author);
    }
    const nonUserEvents = _optionalChain([session, 'access', _286 => _286.events, 'optionalAccess', _287 => _287.filter, 'call', _288 => _288((e) => e.author !== "user"), 'access', _289 => _289.reverse, 'call', _290 => _290()]) || [];
    for (const event2 of nonUserEvents) {
      if (event2.author === rootAgent.name) {
        return rootAgent;
      }
      const agent = _optionalChain([rootAgent, 'access', _291 => _291.findSubAgent, 'optionalCall', _292 => _292(event2.author)]);
      if (!agent) {
        this.logger.debug(
          `Event from an unknown agent: ${event2.author}, event id: ${event2.id}`
        );
        continue;
      }
      if (this._isTransferableAcrossAgentTree(agent)) {
        return agent;
      }
    }
    return rootAgent;
  }
  /**
   * Whether the agent to run can transfer to any other agent in the agent tree.
   */
  _isTransferableAcrossAgentTree(agentToRun) {
    let agent = agentToRun;
    while (agent) {
      if (!(agent instanceof LlmAgent)) {
        return false;
      }
      if (agent.disallowTransferToParent) {
        return false;
      }
      agent = agent.parentAgent || null;
    }
    return true;
  }
  /**
   * Creates a new invocation context.
   */
  _newInvocationContext(session, {
    newMessage,
    runConfig = new RunConfig()
  }) {
    const invocationId = newInvocationContextId();
    return new InvocationContext({
      artifactService: this.artifactService,
      sessionService: this.sessionService,
      memoryService: this.memoryService,
      invocationId,
      agent: this.agent,
      session,
      userContent: newMessage || null,
      liveRequestQueue: null,
      runConfig
    });
  }
}, _class32);
var InMemoryRunner = class extends Runner {
  /**
   * Deprecated. Please don't use. The in-memory session service for the runner.
   */
  
  /**
   * Initializes the InMemoryRunner.
   */
  constructor(agent, { appName = "InMemoryRunner" } = {}) {
    const inMemorySessionService = new InMemorySessionService();
    super({
      appName,
      agent,
      artifactService: new InMemoryArtifactService(),
      sessionService: inMemorySessionService,
      memoryService: new InMemoryMemoryService()
    });
    this._inMemorySessionService = inMemorySessionService;
  }
};

// src/agents/agent-builder.ts
var AgentBuilder = (_class33 = class _AgentBuilder {
  
  
  
  
  
  __init56() {this.agentType = "llm"}
  
  
  // If provided, reuse directly
  __init57() {this.definitionLocked = false}
  // Lock further definition mutation after withAgent
  __init58() {this.logger = new Logger({ name: "AgentBuilder" })}
  
  /**
   * Warn (once per method) if the definition has been locked by withAgent().
   */
  warnIfLocked(method) {
    if (!this.definitionLocked) return;
    this.logger.warn(
      `AgentBuilder: ${method}() ignored because builder is locked by withAgent()`,
      {
        suggestion: "Configure model/tools/etc. before calling withAgent(), or avoid withAgent() if you intend to mutate afterwards.",
        context: { method, agentName: this.config.name }
      }
    );
  }
  /**
   * Private constructor - use static create() method
   */
  constructor(name) {;_class33.prototype.__init56.call(this);_class33.prototype.__init57.call(this);_class33.prototype.__init58.call(this);
    this.config = { name };
  }
  /**
   * Create a new AgentBuilder instance
   * @param name The name of the agent (defaults to "default_agent")
   * @returns New AgentBuilder instance
   */
  static create(name = "default_agent") {
    return new _AgentBuilder(name);
  }
  /**
   * Convenience method to start building with a model directly
   * @param model The model identifier (e.g., "gemini-2.5-flash")
   * @returns New AgentBuilder instance with model set
   */
  static withModel(model) {
    return new _AgentBuilder("default_agent").withModel(model);
  }
  /**
   * Set the model for the agent
   * @param model The model identifier (e.g., "gemini-2.5-flash")
   * @returns This builder instance for chaining
   */
  withModel(model) {
    this.warnIfLocked("withModel");
    this.config.model = model;
    return this;
  }
  /**
   * Set the description for the agent
   * @param description Agent description
   * @returns This builder instance for chaining
   */
  withDescription(description) {
    this.warnIfLocked("withDescription");
    this.config.description = description;
    return this;
  }
  /**
   * Set the instruction for the agent
   * @param instruction System instruction for the agent
   * @returns This builder instance for chaining
   */
  withInstruction(instruction) {
    this.warnIfLocked("withInstruction");
    this.config.instruction = instruction;
    return this;
  }
  withInputSchema(schema) {
    this.warnIfLocked("withInputSchema");
    this.config.inputSchema = schema;
    return this;
  }
  withOutputSchema(schema) {
    this.warnIfLocked("withOutputSchema");
    if (this.agentType === "sequential" || this.agentType === "parallel") {
      const msg = "Output schemas cannot be applied to sequential or parallel agents. Define output schemas on each sub-agent instead.";
      this.logger.error(msg, {
        suggestion: "Apply outputSchema to each sub-agent individually.",
        context: {
          agentType: this.agentType
        }
      });
      throw new Error(msg);
    }
    this.config.outputSchema = schema;
    return this;
  }
  /**
   * Add tools to the agent
   * @param tools Tools to add to the agent
   * @returns This builder instance for chaining
   */
  withTools(...tools) {
    this.warnIfLocked("withTools");
    this.config.tools = [...this.config.tools || [], ...tools];
    return this;
  }
  /**
   * Set the planner for the agent
   * @param planner The planner to use
   * @returns This builder instance for chaining
   */
  withPlanner(planner) {
    this.warnIfLocked("withPlanner");
    this.config.planner = planner;
    return this;
  }
  /**
   * Set the code executor for the agent
   * @param codeExecutor The code executor to use for running code
   * @returns This builder instance for chaining
   */
  withCodeExecutor(codeExecutor) {
    this.warnIfLocked("withCodeExecutor");
    this.config.codeExecutor = codeExecutor;
    return this;
  }
  /**
   * Set the output key for the agent
   * @param outputKey The output key in session state to store the output of the agent
   * @returns This builder instance for chaining
   */
  withOutputKey(outputKey) {
    this.warnIfLocked("withOutputKey");
    if (this.agentType === "sequential" || this.agentType === "parallel") {
      this.logger.warn(
        "AgentBuilder: outputKey ignored for sequential/parallel aggregator",
        {
          suggestion: "Set outputKey on each sub-agent instead.",
          context: { attemptedOutputKey: outputKey, agentType: this.agentType }
        }
      );
      return this;
    }
    this.config.outputKey = outputKey;
    return this;
  }
  /**
   * Add sub-agents to the agent
   * @param subAgents Sub-agents to add to the agent
   * @returns This builder instance for chaining
   */
  withSubAgents(subAgents) {
    this.warnIfLocked("withSubAgents");
    this.config.subAgents = subAgents;
    return this;
  }
  /**
   * Set the before agent callback
   * @param callback Callback to invoke before agent execution
   * @returns This builder instance for chaining
   */
  withBeforeAgentCallback(callback) {
    this.warnIfLocked("withBeforeAgentCallback");
    this.config.beforeAgentCallback = callback;
    return this;
  }
  /**
   * Set the after agent callback
   * @param callback Callback to invoke after agent execution
   * @returns This builder instance for chaining
   */
  withAfterAgentCallback(callback) {
    this.warnIfLocked("withAfterAgentCallback");
    this.config.afterAgentCallback = callback;
    return this;
  }
  /**
   * Provide an already constructed agent instance. Further definition-mutating calls
   * (model/tools/instruction/etc.) will be ignored with a dev warning.
   */
  withAgent(agent) {
    this.existingAgent = agent;
    this.definitionLocked = true;
    if (this.config.name === "default_agent" && agent.name) {
      this.config.name = agent.name;
    }
    return this;
  }
  /**
   * Configure as a sequential agent
   * @param subAgents Sub-agents to execute in sequence
   * @returns This builder instance for chaining
   */
  asSequential(subAgents) {
    if (this.definitionLocked) {
      this.logger.warn(
        "AgentBuilder: asSequential() ignored; builder locked by withAgent()",
        {
          suggestion: "Call asSequential() before withAgent().",
          context: { agentName: this.config.name }
        }
      );
      return this;
    }
    this.agentType = "sequential";
    this.config.subAgents = subAgents;
    if (this.config.outputKey) {
      this.logger.warn(
        "AgentBuilder: outputKey ignored for sequential agent aggregator; removed",
        {
          suggestion: "Assign outputKey on individual sub-agents if needed.",
          context: { previousValue: this.config.outputKey }
        }
      );
      this.config.outputKey = void 0;
    }
    if (this.config.outputSchema) {
      this.logger.warn(
        "AgentBuilder: outputSchema cannot be applied to sequential aggregator; removed",
        {
          suggestion: "Apply schemas to sub-agents individually."
        }
      );
      this.config.outputSchema = void 0;
    }
    return this;
  }
  /**
   * Configure as a parallel agent
   * @param subAgents Sub-agents to execute in parallel
   * @returns This builder instance for chaining
   */
  asParallel(subAgents) {
    if (this.definitionLocked) {
      this.logger.warn(
        "AgentBuilder: asParallel() ignored; builder locked by withAgent()",
        {
          suggestion: "Call asParallel() before withAgent().",
          context: { agentName: this.config.name }
        }
      );
      return this;
    }
    this.agentType = "parallel";
    this.config.subAgents = subAgents;
    if (this.config.outputKey) {
      this.logger.warn(
        "AgentBuilder: outputKey ignored for parallel agent aggregator; removed",
        {
          suggestion: "Assign outputKey on individual sub-agents if needed.",
          context: { previousValue: this.config.outputKey }
        }
      );
      this.config.outputKey = void 0;
    }
    if (this.config.outputSchema) {
      this.logger.warn(
        "AgentBuilder: outputSchema cannot be applied to parallel aggregator; removed",
        {
          suggestion: "Apply schemas to sub-agents individually."
        }
      );
      this.config.outputSchema = void 0;
    }
    return this;
  }
  /**
   * Configure as a loop agent
   * @param subAgents Sub-agents to execute iteratively
   * @param maxIterations Maximum number of iterations
   * @returns This builder instance for chaining
   */
  asLoop(subAgents, maxIterations = 3) {
    this.warnIfLocked("asLoop");
    this.agentType = "loop";
    this.config.subAgents = subAgents;
    this.config.maxIterations = maxIterations;
    return this;
  }
  /**
   * Configure as a LangGraph agent
   * @param nodes Graph nodes defining the workflow
   * @param rootNode The starting node name
   * @returns This builder instance for chaining
   */
  asLangGraph(nodes, rootNode) {
    this.warnIfLocked("asLangGraph");
    this.agentType = "langgraph";
    this.config.nodes = nodes;
    this.config.rootNode = rootNode;
    return this;
  }
  /**
   * Configure session management with optional smart defaults
   * @param service Session service to use
   * @param options Session configuration options (userId and appName)
   * @returns This builder instance for chaining
   */
  withSessionService(service, options = {}) {
    this.sessionService = service;
    this.sessionOptions = {
      userId: options.userId || this.generateDefaultUserId(),
      appName: options.appName || this.generateDefaultAppName(),
      state: options.state,
      sessionId: options.sessionId
    };
    return this;
  }
  /**
   * Configure with an existing session instance
   * @param session Existing session to use
   * @returns This builder instance for chaining
   * @throws Error if no session service has been configured via withSessionService()
   */
  withSession(session) {
    if (!this.sessionService) {
      const msg = "Session service must be configured before using withSession(). Call withSessionService() first, or use withQuickSession() for in-memory sessions.";
      this.logger.error(msg, {
        suggestion: "Invoke withSessionService() prior to withSession()."
      });
      throw new Error(msg);
    }
    this.sessionOptions = {
      ...this.sessionOptions,
      userId: session.userId,
      appName: session.appName,
      sessionId: session.id,
      state: session.state
    };
    this.existingSession = session;
    return this;
  }
  /**
   * Configure memory service for the agent
   * @param memoryService Memory service to use for conversation history and context
   * @returns This builder instance for chaining
   */
  withMemory(memoryService) {
    this.memoryService = memoryService;
    return this;
  }
  /**
   * Configure artifact service for the agent
   * @param artifactService Artifact service to use for managing generated artifacts
   * @returns This builder instance for chaining
   */
  withArtifactService(artifactService) {
    this.artifactService = artifactService;
    return this;
  }
  /**
   * Configure runtime behavior for runs
   */
  withRunConfig(config) {
    this.runConfig = config instanceof RunConfig ? config : new RunConfig({ ...this.runConfig || {}, ...config });
    return this;
  }
  /**
   * Configure with an in-memory session with custom IDs
   * Note: In-memory sessions are created automatically by default, use this only if you need custom appName/userId
   * @param options Session configuration options (userId and appName)
   * @returns This builder instance for chaining
   */
  withQuickSession(options = {}) {
    return this.withSessionService(new InMemorySessionService(), options);
  }
  /**
   * Build the agent and optionally create runner and session
   * @returns Built agent with optional runner and session
   */
  async build() {
    const agent = this.createAgent();
    let runner;
    let session;
    if (!this.sessionService) {
      this.withQuickSession();
    }
    if (this.sessionService && this.sessionOptions) {
      if (this.existingSession) {
        session = this.existingSession;
      } else {
        session = await this.sessionService.createSession(
          this.sessionOptions.appName,
          this.sessionOptions.userId,
          this.sessionOptions.state,
          this.sessionOptions.sessionId
        );
      }
      const runnerConfig = {
        appName: this.sessionOptions.appName,
        agent,
        sessionService: this.sessionService,
        memoryService: this.memoryService,
        artifactService: this.artifactService
      };
      const baseRunner = new Runner(runnerConfig);
      runner = this.createEnhancedRunner(baseRunner, session);
    }
    return {
      agent,
      runner,
      session,
      sessionService: this.sessionService
    };
  }
  /**
   * Type-safe build method for agents with output schemas
   * Provides better type inference for the ask method return type
   */
  async buildWithSchema() {
    const result = await this.build();
    return result;
  }
  /**
   * Quick execution helper - build and run a message
   * @param message Message to send to the agent (string or full message object)
   * @returns Agent response
   */
  async ask(message) {
    const { runner } = await this.build();
    return runner.ask(message);
  }
  /**
   * Create the appropriate agent type based on configuration
   * @returns Created agent instance
   */
  createAgent() {
    if (this.existingAgent) return this.existingAgent;
    switch (this.agentType) {
      case "llm": {
        if (!this.config.model) {
          const msg = "Model is required for LLM agent";
          this.logger.error(msg, {
            suggestion: "Call withModel() before build()."
          });
          throw new Error(msg);
        }
        const model = this.config.model;
        return new LlmAgent({
          name: this.config.name,
          model,
          description: this.config.description,
          instruction: this.config.instruction,
          tools: this.config.tools,
          planner: this.config.planner,
          codeExecutor: this.config.codeExecutor,
          subAgents: this.config.subAgents,
          beforeAgentCallback: this.config.beforeAgentCallback,
          afterAgentCallback: this.config.afterAgentCallback,
          memoryService: this.memoryService,
          artifactService: this.artifactService,
          outputKey: this.config.outputKey,
          sessionService: this.sessionService,
          inputSchema: this.config.inputSchema,
          outputSchema: this.config.outputSchema
        });
      }
      case "sequential":
        if (!this.config.subAgents || !Array.isArray(this.config.subAgents) || this.config.subAgents.length === 0) {
          const msg = "Sub-agents required for sequential agent";
          this.logger.error(msg, {
            suggestion: "Provide at least one sub-agent."
          });
          throw new Error(msg);
        }
        return new SequentialAgent({
          name: this.config.name,
          description: this.config.description || "",
          subAgents: this.config.subAgents
        });
      case "parallel":
        if (!this.config.subAgents || !Array.isArray(this.config.subAgents) || this.config.subAgents.length === 0) {
          const msg = "Sub-agents required for parallel agent";
          this.logger.error(msg, {
            suggestion: "Provide at least one sub-agent."
          });
          throw new Error(msg);
        }
        return new ParallelAgent({
          name: this.config.name,
          description: this.config.description || "",
          subAgents: this.config.subAgents
        });
      case "loop":
        if (!this.config.subAgents || !Array.isArray(this.config.subAgents) || this.config.subAgents.length === 0) {
          const msg = "Sub-agents required for loop agent";
          this.logger.error(msg, {
            suggestion: "Provide at least one sub-agent."
          });
          throw new Error(msg);
        }
        return new LoopAgent({
          name: this.config.name,
          description: this.config.description || "",
          subAgents: this.config.subAgents,
          maxIterations: this.config.maxIterations || 3
        });
      case "langgraph":
        if (!this.config.nodes || !Array.isArray(this.config.nodes) || this.config.nodes.length === 0 || !this.config.rootNode || typeof this.config.rootNode !== "string") {
          const msg = "Nodes and root node required for LangGraph agent";
          this.logger.error(msg, {
            suggestion: "Provide nodes[] and a valid rootNode string."
          });
          throw new Error(msg);
        }
        return new LangGraphAgent({
          name: this.config.name,
          description: this.config.description || "",
          nodes: this.config.nodes,
          rootNode: this.config.rootNode
        });
    }
  }
  /**
   * Generate default user ID based on agent name and id
   * @returns Generated user ID
   */
  generateDefaultUserId() {
    const id = _ai.generateId.call(void 0, );
    return `user-${this.config.name}-${id}`;
  }
  /**
   * Generate default app name based on agent name
   * @returns Generated app name
   */
  generateDefaultAppName() {
    return `app-${this.config.name}`;
  }
  /**
   * Create enhanced runner with simplified API and proper typing
   * @param baseRunner The base runner instance
   * @param session The session instance
   * @returns Enhanced runner with simplified API
   */
  createEnhancedRunner(baseRunner, session) {
    const sessionOptions = this.sessionOptions;
    const outputSchema = this.config.outputSchema;
    const agentType = this.agentType;
    const isMulti = agentType === "parallel" || agentType === "sequential";
    const subAgentNames = _optionalChain([this, 'access', _293 => _293.config, 'access', _294 => _294.subAgents, 'optionalAccess', _295 => _295.map, 'call', _296 => _296((a) => a.name)]) || [];
    const runConfig = this.runConfig;
    return {
      __outputSchema: outputSchema,
      async ask(message) {
        const newMessage = typeof message === "string" ? { parts: [{ text: message }] } : typeof message === "object" && "contents" in message ? { parts: message.contents[message.contents.length - 1].parts } : message;
        let combinedResponse = "";
        const perAgentBuffers = {};
        const authors = /* @__PURE__ */ new Set();
        if (!_optionalChain([sessionOptions, 'optionalAccess', _297 => _297.userId])) {
          throw new Error("Session configuration is required");
        }
        for await (const event of baseRunner.runAsync({
          userId: sessionOptions.userId,
          sessionId: session.id,
          newMessage,
          runConfig
        })) {
          if (_optionalChain([event, 'access', _298 => _298.content, 'optionalAccess', _299 => _299.parts]) && Array.isArray(event.content.parts)) {
            const content = event.content.parts.map(
              (part) => (part && typeof part === "object" && "text" in part ? part.text : "") || ""
            ).join("");
            if (content) {
              combinedResponse += content;
              const author = event.author || "";
              if (author && author !== "user") {
                authors.add(author);
                perAgentBuffers[author] = (perAgentBuffers[author] || "") + content;
              }
            }
          }
        }
        if (isMulti) {
          return subAgentNames.map((name) => ({
            agent: name,
            response: (perAgentBuffers[name] || "").trim()
          }));
        }
        if (outputSchema) {
          try {
            const parsed = JSON.parse(combinedResponse);
            return outputSchema.parse(parsed);
          } catch (parseError) {
            try {
              return outputSchema.parse(combinedResponse);
            } catch (validationError) {
              const message2 = `\u{1F6A8} Failed to parse and validate LLM output against the schema. 

 \u2139\uFE0F JSON parse error: ${parseError instanceof Error ? parseError.message : String(parseError)} 

 \u{1F6A7} Zod validation error: ${validationError instanceof Error ? validationError.message : String(validationError)} 

 \u{1F4C4} Raw output: ${combinedResponse}`;
              throw new Error(message2);
            }
          }
        }
        return combinedResponse.trim();
      },
      runAsync(params) {
        return baseRunner.runAsync({
          ...params,
          runConfig: _nullishCoalesce(params.runConfig, () => ( runConfig))
        });
      }
    };
  }
}, _class33);

// src/memory/index.ts
var memory_exports = {};
__export(memory_exports, {
  InMemoryMemoryService: () => InMemoryMemoryService
});

// src/sessions/index.ts
var sessions_exports = {};
__export(sessions_exports, {
  BaseSessionService: () => BaseSessionService,
  DatabaseSessionService: () => DatabaseSessionService,
  InMemorySessionService: () => InMemorySessionService,
  State: () => State,
  VertexAiSessionService: () => VertexAiSessionService,
  createDatabaseSessionService: () => createDatabaseSessionService,
  createMysqlSessionService: () => createMysqlSessionService,
  createPostgresSessionService: () => createPostgresSessionService,
  createSqliteSessionService: () => createSqliteSessionService
});

// src/sessions/vertex-ai-session-service.ts
var VertexAiSessionService = class extends BaseSessionService {
  
  
  
  /**
   * Initializes the VertexAiSessionService.
   */
  constructor(options = {}) {
    super();
    this.project = options.project;
    this.location = options.location;
    this.agentEngineId = options.agentEngineId;
  }
  async createSession(appName, userId, state, sessionId) {
    if (sessionId) {
      throw new Error(
        "User-provided Session id is not supported for VertexAISessionService."
      );
    }
    const reasoningEngineId = this.getReasoningEngineId(appName);
    const apiClient = this.getApiClient();
    const sessionJsonDict = { user_id: userId };
    if (state) {
      sessionJsonDict.session_state = state;
    }
    const apiResponse = await apiClient.async_request({
      http_method: "POST",
      path: `reasoningEngines/${reasoningEngineId}/sessions`,
      request_dict: sessionJsonDict
    });
    console.debug("Create Session response", apiResponse);
    const createdSessionId = apiResponse.name.split("/").slice(-3, -2)[0];
    const operationId = apiResponse.name.split("/").pop();
    let maxRetryAttempt = 5;
    let lroResponse = null;
    while (maxRetryAttempt >= 0) {
      lroResponse = await apiClient.async_request({
        http_method: "GET",
        path: `operations/${operationId}`,
        request_dict: {}
      });
      if (_optionalChain([lroResponse, 'optionalAccess', _300 => _300.done])) {
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 1e3));
      maxRetryAttempt--;
    }
    if (!lroResponse || !lroResponse.done) {
      throw new Error(
        `Timeout waiting for operation ${operationId} to complete.`
      );
    }
    const getSessionApiResponse = await apiClient.async_request({
      http_method: "GET",
      path: `reasoningEngines/${reasoningEngineId}/sessions/${createdSessionId}`,
      request_dict: {}
    });
    const updateTimestamp = new Date(getSessionApiResponse.updateTime).getTime() / 1e3;
    return {
      appName: String(appName),
      userId: String(userId),
      id: String(createdSessionId),
      state: getSessionApiResponse.sessionState || {},
      events: [],
      lastUpdateTime: updateTimestamp
    };
  }
  async getSession(appName, userId, sessionId, config) {
    const reasoningEngineId = this.getReasoningEngineId(appName);
    const apiClient = this.getApiClient();
    try {
      const getSessionApiResponse = await apiClient.async_request({
        http_method: "GET",
        path: `reasoningEngines/${reasoningEngineId}/sessions/${sessionId}`,
        request_dict: {}
      });
      const sessionIdFromResponse = getSessionApiResponse.name.split("/").pop();
      const updateTimestamp = new Date(getSessionApiResponse.updateTime).getTime() / 1e3;
      const session = {
        appName: String(appName),
        userId: String(userId),
        id: String(sessionIdFromResponse),
        state: getSessionApiResponse.sessionState || {},
        events: [],
        lastUpdateTime: updateTimestamp
      };
      let listEventsApiResponse = await apiClient.async_request({
        http_method: "GET",
        path: `reasoningEngines/${reasoningEngineId}/sessions/${sessionId}/events`,
        request_dict: {}
      });
      if (listEventsApiResponse.httpHeaders) {
        return session;
      }
      if (listEventsApiResponse.sessionEvents) {
        session.events.push(
          ...listEventsApiResponse.sessionEvents.map(this.fromApiEvent)
        );
      }
      while (listEventsApiResponse.nextPageToken) {
        const pageToken = listEventsApiResponse.nextPageToken;
        listEventsApiResponse = await apiClient.async_request({
          http_method: "GET",
          path: `reasoningEngines/${reasoningEngineId}/sessions/${sessionId}/events?pageToken=${encodeURIComponent(pageToken)}`,
          request_dict: {}
        });
        if (listEventsApiResponse.sessionEvents) {
          session.events.push(
            ...listEventsApiResponse.sessionEvents.map(this.fromApiEvent)
          );
        }
      }
      session.events = session.events.filter(
        (event) => event.timestamp <= updateTimestamp
      );
      session.events.sort((a, b) => a.timestamp - b.timestamp);
      if (config) {
        if (config.numRecentEvents) {
          session.events = session.events.slice(-config.numRecentEvents);
        } else if (config.afterTimestamp) {
          let i = session.events.length - 1;
          while (i >= 0) {
            if (session.events[i].timestamp < config.afterTimestamp) {
              break;
            }
            i--;
          }
          if (i >= 0) {
            session.events = session.events.slice(i);
          }
        }
      }
      return session;
    } catch (error) {
      console.error(`Error getting session ${sessionId}:`, error);
      return void 0;
    }
  }
  async listSessions(appName, userId) {
    const reasoningEngineId = this.getReasoningEngineId(appName);
    const apiClient = this.getApiClient();
    let path3 = `reasoningEngines/${reasoningEngineId}/sessions`;
    if (userId) {
      const parsedUserId = encodeURIComponent(`"${userId}"`);
      path3 = `${path3}?filter=user_id=${parsedUserId}`;
    }
    const apiResponse = await apiClient.async_request({
      http_method: "GET",
      path: path3,
      request_dict: {}
    });
    if (apiResponse.httpHeaders) {
      return { sessions: [] };
    }
    const sessions = [];
    if (apiResponse.sessions) {
      for (const apiSession of apiResponse.sessions) {
        const session = {
          appName,
          userId,
          id: apiSession.name.split("/").pop(),
          state: {},
          events: [],
          lastUpdateTime: new Date(apiSession.updateTime).getTime() / 1e3
        };
        sessions.push(session);
      }
    }
    return { sessions };
  }
  async deleteSession(appName, userId, sessionId) {
    const reasoningEngineId = this.getReasoningEngineId(appName);
    const apiClient = this.getApiClient();
    try {
      await apiClient.async_request({
        http_method: "DELETE",
        path: `reasoningEngines/${reasoningEngineId}/sessions/${sessionId}`,
        request_dict: {}
      });
    } catch (error) {
      console.error(`Error deleting session ${sessionId}:`, error);
      throw error;
    }
  }
  async appendEvent(session, event) {
    await super.appendEvent(session, event);
    const reasoningEngineId = this.getReasoningEngineId(session.appName);
    const apiClient = this.getApiClient();
    await apiClient.async_request({
      http_method: "POST",
      path: `reasoningEngines/${reasoningEngineId}/sessions/${session.id}:appendEvent`,
      request_dict: this.convertEventToJson(event)
    });
    return event;
  }
  getReasoningEngineId(appName) {
    if (this.agentEngineId) {
      return this.agentEngineId;
    }
    if (/^\d+$/.test(appName)) {
      return appName;
    }
    const pattern = /^projects\/([a-zA-Z0-9-_]+)\/locations\/([a-zA-Z0-9-_]+)\/reasoningEngines\/(\d+)$/;
    const match = appName.match(pattern);
    if (!match) {
      throw new Error(
        `App name ${appName} is not valid. It should either be the full ReasoningEngine resource name, or the reasoning engine id.`
      );
    }
    return match[3];
  }
  getApiClient() {
    const { GoogleGenAI: GoogleGenAI2 } = __require("@google/genai");
    const client = new GoogleGenAI2({
      vertexai: true,
      project: this.project,
      location: this.location
    });
    return client._api_client;
  }
  convertEventToJson(event) {
    const metadataJson = {
      partial: event.partial,
      turn_complete: event.turnComplete,
      interrupted: event.interrupted,
      branch: event.branch,
      long_running_tool_ids: event.longRunningToolIds ? Array.from(event.longRunningToolIds) : null
    };
    if (event.groundingMetadata) {
      metadataJson.grounding_metadata = event.groundingMetadata;
    }
    const eventJson = {
      author: event.author,
      invocation_id: event.invocationId,
      timestamp: {
        seconds: Math.floor(event.timestamp),
        nanos: Math.floor(
          (event.timestamp - Math.floor(event.timestamp)) * 1e9
        )
      },
      error_code: event.errorCode,
      error_message: event.errorMessage,
      event_metadata: metadataJson
    };
    if (event.actions) {
      const actionsJson = {
        skip_summarization: event.actions.skipSummarization,
        state_delta: event.actions.stateDelta,
        artifact_delta: event.actions.artifactDelta,
        transfer_agent: event.actions.transferToAgent,
        escalate: event.actions.escalate,
        requested_auth_configs: event.actions.requestedAuthConfigs
      };
      eventJson.actions = actionsJson;
    }
    if (event.content) {
      eventJson.content = event.content;
    }
    return eventJson;
  }
  fromApiEvent(apiEvent) {
    let eventActions = new EventActions();
    if (apiEvent.actions) {
      eventActions = new EventActions({
        skipSummarization: apiEvent.actions.skipSummarization,
        stateDelta: apiEvent.actions.stateDelta || {},
        artifactDelta: apiEvent.actions.artifactDelta || {},
        transferToAgent: apiEvent.actions.transferAgent,
        escalate: apiEvent.actions.escalate,
        requestedAuthConfigs: apiEvent.actions.requestedAuthConfigs || {}
      });
    }
    const event = new Event({
      id: apiEvent.name.split("/").pop(),
      invocationId: apiEvent.invocationId,
      author: apiEvent.author,
      actions: eventActions,
      content: this.decodeContent(apiEvent.content),
      timestamp: new Date(apiEvent.timestamp).getTime() / 1e3
    });
    if (apiEvent.errorCode) {
      event.errorCode = apiEvent.errorCode;
    }
    if (apiEvent.errorMessage) {
      event.errorMessage = apiEvent.errorMessage;
    }
    if (apiEvent.eventMetadata) {
      const longRunningToolIdsList = apiEvent.eventMetadata.longRunningToolIds;
      event.partial = apiEvent.eventMetadata.partial;
      event.turnComplete = apiEvent.eventMetadata.turnComplete;
      event.interrupted = apiEvent.eventMetadata.interrupted;
      event.branch = apiEvent.eventMetadata.branch;
      event.groundingMetadata = this.decodeGroundingMetadata(
        apiEvent.eventMetadata.groundingMetadata
      );
      event.longRunningToolIds = longRunningToolIdsList ? new Set(longRunningToolIdsList) : void 0;
    }
    return event;
  }
  decodeContent(content) {
    if (!content) return void 0;
    return content;
  }
  decodeGroundingMetadata(groundingMetadata) {
    if (!groundingMetadata) return void 0;
    return groundingMetadata;
  }
};

// src/sessions/database-session-service.ts
var _kysely = require('kysely');
var DatabaseSessionService = (_class34 = class extends BaseSessionService {
  
  __init59() {this.initialized = false}
  constructor(config) {
    super();_class34.prototype.__init59.call(this);;
    this.db = config.db;
    if (!config.skipTableCreation) {
      this.initializeDatabase().catch((error) => {
        console.error("Failed to initialize database:", error);
      });
    }
  }
  /**
   * Initialize the database by creating required tables if they don't exist
   */
  async initializeDatabase() {
    if (this.initialized) {
      return;
    }
    try {
      await this.db.schema.createTable("sessions").ifNotExists().addColumn("id", "varchar(128)", (col) => col.notNull()).addColumn("app_name", "varchar(128)", (col) => col.notNull()).addColumn("user_id", "varchar(128)", (col) => col.notNull()).addColumn("state", "text", (col) => col.defaultTo("{}")).addColumn(
        "create_time",
        "timestamp",
        (col) => col.defaultTo(_kysely.sql`CURRENT_TIMESTAMP`).notNull()
      ).addColumn(
        "update_time",
        "timestamp",
        (col) => col.defaultTo(_kysely.sql`CURRENT_TIMESTAMP`).notNull()
      ).addPrimaryKeyConstraint("sessions_pk", ["app_name", "user_id", "id"]).execute();
      await this.db.schema.createTable("events").ifNotExists().addColumn("id", "varchar(128)", (col) => col.notNull()).addColumn("app_name", "varchar(128)", (col) => col.notNull()).addColumn("user_id", "varchar(128)", (col) => col.notNull()).addColumn("session_id", "varchar(128)", (col) => col.notNull()).addColumn("invocation_id", "varchar(256)").addColumn("author", "varchar(256)").addColumn("branch", "varchar(256)").addColumn(
        "timestamp",
        "timestamp",
        (col) => col.defaultTo(_kysely.sql`CURRENT_TIMESTAMP`)
      ).addColumn("content", "text").addColumn("actions", "text").addColumn("long_running_tool_ids_json", "text").addColumn("grounding_metadata", "text").addColumn("partial", "boolean").addColumn("turn_complete", "boolean").addColumn("error_code", "varchar(256)").addColumn("error_message", "varchar(1024)").addColumn("interrupted", "boolean").addPrimaryKeyConstraint("events_pk", [
        "id",
        "app_name",
        "user_id",
        "session_id"
      ]).addForeignKeyConstraint(
        "events_session_fk",
        ["app_name", "user_id", "session_id"],
        "sessions",
        ["app_name", "user_id", "id"]
      ).execute();
      await this.db.schema.createTable("app_states").ifNotExists().addColumn("app_name", "varchar(128)", (col) => col.primaryKey()).addColumn("state", "text", (col) => col.defaultTo("{}")).addColumn(
        "update_time",
        "timestamp",
        (col) => col.defaultTo(_kysely.sql`CURRENT_TIMESTAMP`).notNull()
      ).execute();
      await this.db.schema.createTable("user_states").ifNotExists().addColumn("app_name", "varchar(128)", (col) => col.notNull()).addColumn("user_id", "varchar(128)", (col) => col.notNull()).addColumn("state", "text", (col) => col.defaultTo("{}")).addColumn(
        "update_time",
        "timestamp",
        (col) => col.defaultTo(_kysely.sql`CURRENT_TIMESTAMP`).notNull()
      ).addPrimaryKeyConstraint("user_states_pk", ["app_name", "user_id"]).execute();
      await this.db.schema.createIndex("idx_sessions_user_id").ifNotExists().on("sessions").column("user_id").execute();
      this.initialized = true;
    } catch (error) {
      console.error("Error initializing database:", error);
      throw error;
    }
  }
  /**
   * Ensure database is initialized before any operation
   */
  async ensureInitialized() {
    if (!this.initialized) {
      await this.initializeDatabase();
    }
  }
  generateSessionId() {
    return `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
  /**
   * Helper to safely parse JSON strings
   */
  parseJsonSafely(jsonString, defaultValue) {
    if (!jsonString) return defaultValue;
    try {
      return JSON.parse(jsonString);
    } catch (e7) {
      return defaultValue;
    }
  }
  /**
   * Convert database timestamp to Unix seconds
   * Handles different timestamp formats from different databases
   */
  timestampToUnixSeconds(timestamp) {
    if (timestamp instanceof Date) {
      return timestamp.getTime() / 1e3;
    }
    if (typeof timestamp === "string") {
      return new Date(timestamp).getTime() / 1e3;
    }
    if (typeof timestamp === "number") {
      return timestamp > 1e10 ? timestamp / 1e3 : timestamp;
    }
    return Date.now() / 1e3;
  }
  async createSession(appName, userId, state, sessionId) {
    await this.ensureInitialized();
    const id = _optionalChain([sessionId, 'optionalAccess', _301 => _301.trim, 'call', _302 => _302()]) || this.generateSessionId();
    return await this.db.transaction().execute(async (trx) => {
      const appState = await trx.selectFrom("app_states").selectAll().where("app_name", "=", appName).executeTakeFirst();
      const userState = await trx.selectFrom("user_states").selectAll().where("app_name", "=", appName).where("user_id", "=", userId).executeTakeFirst();
      let currentAppState = this.parseJsonSafely(_optionalChain([appState, 'optionalAccess', _303 => _303.state]), {});
      let currentUserState = this.parseJsonSafely(_optionalChain([userState, 'optionalAccess', _304 => _304.state]), {});
      if (!appState) {
        await trx.insertInto("app_states").values({
          app_name: appName,
          state: "{}"
        }).execute();
      }
      if (!userState) {
        await trx.insertInto("user_states").values({
          app_name: appName,
          user_id: userId,
          state: "{}"
        }).execute();
      }
      const { appStateDelta, userStateDelta, sessionStateDelta } = this.extractStateDelta(state);
      currentAppState = { ...currentAppState, ...appStateDelta };
      currentUserState = { ...currentUserState, ...userStateDelta };
      if (Object.keys(appStateDelta).length > 0) {
        await trx.updateTable("app_states").set({
          state: JSON.stringify(currentAppState),
          update_time: _kysely.sql`CURRENT_TIMESTAMP`
        }).where("app_name", "=", appName).execute();
      }
      if (Object.keys(userStateDelta).length > 0) {
        await trx.updateTable("user_states").set({
          state: JSON.stringify(currentUserState),
          update_time: _kysely.sql`CURRENT_TIMESTAMP`
        }).where("app_name", "=", appName).where("user_id", "=", userId).execute();
      }
      const result = await trx.insertInto("sessions").values({
        id,
        app_name: appName,
        user_id: userId,
        state: JSON.stringify(sessionStateDelta)
      }).returningAll().executeTakeFirstOrThrow();
      const mergedState = this.mergeState(
        currentAppState,
        currentUserState,
        sessionStateDelta
      );
      return {
        id: result.id,
        appName: result.app_name,
        userId: result.user_id,
        state: mergedState,
        events: [],
        // Fixed type annotation
        lastUpdateTime: this.timestampToUnixSeconds(result.update_time)
      };
    });
  }
  async getSession(appName, userId, sessionId, config) {
    await this.ensureInitialized();
    return await this.db.transaction().execute(async (trx) => {
      const storageSession = await trx.selectFrom("sessions").selectAll().where("app_name", "=", appName).where("user_id", "=", userId).where("id", "=", sessionId).executeTakeFirst();
      if (!storageSession) {
        return void 0;
      }
      let eventQuery = trx.selectFrom("events").selectAll().where("session_id", "=", sessionId).orderBy("timestamp", "desc");
      if (_optionalChain([config, 'optionalAccess', _305 => _305.afterTimestamp])) {
        eventQuery = eventQuery.where(
          "timestamp",
          ">=",
          new Date(config.afterTimestamp * 1e3)
        );
      }
      if (_optionalChain([config, 'optionalAccess', _306 => _306.numRecentEvents])) {
        eventQuery = eventQuery.limit(config.numRecentEvents);
      }
      const storageEvents = await eventQuery.execute();
      const appState = await trx.selectFrom("app_states").selectAll().where("app_name", "=", appName).executeTakeFirst();
      const userState = await trx.selectFrom("user_states").selectAll().where("app_name", "=", appName).where("user_id", "=", userId).executeTakeFirst();
      const currentAppState = this.parseJsonSafely(_optionalChain([appState, 'optionalAccess', _307 => _307.state]), {});
      const currentUserState = this.parseJsonSafely(_optionalChain([userState, 'optionalAccess', _308 => _308.state]), {});
      const sessionState = this.parseJsonSafely(storageSession.state, {});
      const mergedState = this.mergeState(
        currentAppState,
        currentUserState,
        sessionState
      );
      const events = storageEvents.reverse().map((storageEvent) => this.storageEventToEvent(storageEvent));
      return {
        id: sessionId,
        appName,
        userId,
        state: mergedState,
        events,
        // Now properly typed as Event[]
        lastUpdateTime: this.timestampToUnixSeconds(storageSession.update_time)
      };
    });
  }
  async updateSession(session) {
    await this.ensureInitialized();
    await this.db.updateTable("sessions").set({
      state: JSON.stringify(session.state),
      update_time: _kysely.sql`CURRENT_TIMESTAMP`
    }).where("app_name", "=", session.appName).where("user_id", "=", session.userId).where("id", "=", session.id).execute();
  }
  async listSessions(appName, userId) {
    await this.ensureInitialized();
    const results = await this.db.selectFrom("sessions").selectAll().where("app_name", "=", appName).where("user_id", "=", userId).execute();
    const sessions = results.map((storageSession) => ({
      id: storageSession.id,
      appName: storageSession.app_name,
      userId: storageSession.user_id,
      state: {},
      events: [],
      // Fixed type annotation
      lastUpdateTime: this.timestampToUnixSeconds(storageSession.update_time)
    }));
    return { sessions };
  }
  async deleteSession(appName, userId, sessionId) {
    await this.ensureInitialized();
    await this.db.deleteFrom("sessions").where("app_name", "=", appName).where("user_id", "=", userId).where("id", "=", sessionId).execute();
  }
  async appendEvent(session, event) {
    await this.ensureInitialized();
    if (event.partial) {
      return event;
    }
    return await this.db.transaction().execute(async (trx) => {
      const storageSession = await trx.selectFrom("sessions").selectAll().where("app_name", "=", session.appName).where("user_id", "=", session.userId).where("id", "=", session.id).executeTakeFirstOrThrow();
      if (this.timestampToUnixSeconds(storageSession.update_time) > session.lastUpdateTime) {
        throw new Error(
          `The last_update_time provided in the session object ${new Date(session.lastUpdateTime * 1e3).toISOString()} is earlier than the update_time in the storage_session ${storageSession.update_time.toISOString()}. Please check if it is a stale session.`
        );
      }
      const appState = await trx.selectFrom("app_states").selectAll().where("app_name", "=", session.appName).executeTakeFirst();
      const userState = await trx.selectFrom("user_states").selectAll().where("app_name", "=", session.appName).where("user_id", "=", session.userId).executeTakeFirst();
      let currentAppState = this.parseJsonSafely(_optionalChain([appState, 'optionalAccess', _309 => _309.state]), {});
      let currentUserState = this.parseJsonSafely(_optionalChain([userState, 'optionalAccess', _310 => _310.state]), {});
      let sessionState = this.parseJsonSafely(storageSession.state, {});
      let appStateDelta = {};
      let userStateDelta = {};
      let sessionStateDelta = {};
      if (_optionalChain([event, 'access', _311 => _311.actions, 'optionalAccess', _312 => _312.stateDelta])) {
        const deltas = this.extractStateDelta(event.actions.stateDelta);
        appStateDelta = deltas.appStateDelta;
        userStateDelta = deltas.userStateDelta;
        sessionStateDelta = deltas.sessionStateDelta;
      }
      if (Object.keys(appStateDelta).length > 0) {
        currentAppState = { ...currentAppState, ...appStateDelta };
        await trx.updateTable("app_states").set({
          state: JSON.stringify(currentAppState),
          update_time: _kysely.sql`CURRENT_TIMESTAMP`
        }).where("app_name", "=", session.appName).execute();
      }
      if (Object.keys(userStateDelta).length > 0) {
        currentUserState = { ...currentUserState, ...userStateDelta };
        await trx.updateTable("user_states").set({
          state: JSON.stringify(currentUserState),
          update_time: _kysely.sql`CURRENT_TIMESTAMP`
        }).where("app_name", "=", session.appName).where("user_id", "=", session.userId).execute();
      }
      if (Object.keys(sessionStateDelta).length > 0) {
        sessionState = { ...sessionState, ...sessionStateDelta };
        await trx.updateTable("sessions").set({
          state: JSON.stringify(sessionState),
          update_time: _kysely.sql`CURRENT_TIMESTAMP`
        }).where("app_name", "=", session.appName).where("user_id", "=", session.userId).where("id", "=", session.id).execute();
      }
      await trx.insertInto("events").values({
        ...this.eventToStorageEvent(session, event),
        timestamp: _kysely.sql`CURRENT_TIMESTAMP`
      }).execute();
      const updatedSession = await trx.selectFrom("sessions").select("update_time").where("app_name", "=", session.appName).where("user_id", "=", session.userId).where("id", "=", session.id).executeTakeFirstOrThrow();
      session.lastUpdateTime = this.timestampToUnixSeconds(
        updatedSession.update_time
      );
      super.appendEvent(session, event);
      return event;
    });
  }
  /**
   * Extract state deltas based on prefixes (similar to Python implementation)
   */
  extractStateDelta(state) {
    const appStateDelta = {};
    const userStateDelta = {};
    const sessionStateDelta = {};
    if (state) {
      for (const [key, value] of Object.entries(state)) {
        if (key.startsWith(State.APP_PREFIX)) {
          appStateDelta[key.substring(State.APP_PREFIX.length)] = value;
        } else if (key.startsWith(State.USER_PREFIX)) {
          userStateDelta[key.substring(State.USER_PREFIX.length)] = value;
        } else if (!key.startsWith(State.TEMP_PREFIX)) {
          sessionStateDelta[key] = value;
        }
      }
    }
    return { appStateDelta, userStateDelta, sessionStateDelta };
  }
  /**
   * Merge states for response (similar to Python implementation)
   */
  mergeState(appState, userState, sessionState) {
    const mergedState = { ...sessionState };
    for (const [key, value] of Object.entries(appState)) {
      mergedState[`${State.APP_PREFIX}${key}`] = value;
    }
    for (const [key, value] of Object.entries(userState)) {
      mergedState[`${State.USER_PREFIX}${key}`] = value;
    }
    return mergedState;
  }
  /**
   * Convert Event to storage event format
   */
  eventToStorageEvent(session, event) {
    return {
      id: event.id,
      app_name: session.appName,
      user_id: session.userId,
      session_id: session.id,
      invocation_id: event.invocationId || "",
      author: event.author || "",
      branch: event.branch || null,
      content: event.content ? JSON.stringify(event.content) : null,
      actions: event.actions ? JSON.stringify(event.actions) : null,
      long_running_tool_ids_json: event.longRunningToolIds ? JSON.stringify(Array.from(event.longRunningToolIds)) : null,
      grounding_metadata: event.groundingMetadata ? JSON.stringify(event.groundingMetadata) : null,
      partial: event.partial || null,
      turn_complete: event.turnComplete || null,
      error_code: event.errorCode || null,
      error_message: event.errorMessage || null,
      interrupted: event.interrupted || null
    };
  }
  /**
   * Convert storage event to Event format - Fixed to match Event interface
   */
  storageEventToEvent(storageEvent) {
    const baseEvent = {
      id: storageEvent.id,
      invocationId: storageEvent.invocation_id,
      author: storageEvent.author,
      branch: storageEvent.branch || void 0,
      timestamp: this.timestampToUnixSeconds(storageEvent.timestamp),
      content: storageEvent.content ? this.parseJsonSafely(storageEvent.content, null) : void 0,
      actions: storageEvent.actions ? this.parseJsonSafely(storageEvent.actions, null) : void 0,
      longRunningToolIds: storageEvent.long_running_tool_ids_json ? new Set(
        this.parseJsonSafely(storageEvent.long_running_tool_ids_json, [])
      ) : void 0,
      groundingMetadata: storageEvent.grounding_metadata ? this.parseJsonSafely(storageEvent.grounding_metadata, null) : void 0,
      partial: storageEvent.partial || void 0,
      turnComplete: storageEvent.turn_complete || void 0,
      errorCode: storageEvent.error_code || void 0,
      errorMessage: storageEvent.error_message || void 0,
      interrupted: storageEvent.interrupted || void 0
    };
    return {
      ...baseEvent,
      // Add any missing required methods from the Event interface
      isFinalResponse: () => baseEvent.turnComplete === true,
      getFunctionCalls: () => {
        if (baseEvent.actions && typeof baseEvent.actions === "object" && "functionCalls" in baseEvent.actions) {
          return baseEvent.actions.functionCalls || [];
        }
        return [];
      },
      getFunctionResponses: () => {
        if (baseEvent.actions && typeof baseEvent.actions === "object" && "functionResponses" in baseEvent.actions) {
          return baseEvent.actions.functionResponses || [];
        }
        return [];
      },
      hasTrailingCodeExecutionResult: () => {
        if (baseEvent.actions && typeof baseEvent.actions === "object" && "hasTrailingCodeExecutionResult" in baseEvent.actions) {
          return baseEvent.actions.hasTrailingCodeExecutionResult || false;
        }
        return false;
      }
    };
  }
  /**
   * Updates the session state based on the event.
   * Overrides the base class method to work with plain object state.
   */
  updateSessionState(session, event) {
    if (!_optionalChain([event, 'access', _313 => _313.actions, 'optionalAccess', _314 => _314.stateDelta])) {
      return;
    }
    for (const [key, value] of Object.entries(event.actions.stateDelta)) {
      if (!key.startsWith(State.TEMP_PREFIX)) {
        session.state[key] = value;
      }
    }
  }
}, _class34);

// src/sessions/database-factories.ts


function createDependencyError(packageName, dbType) {
  return new Error(
    _dedent2.default`
		Missing required peer dependency: ${packageName}
		To use ${dbType} sessions, install the required package:
			npm install ${packageName}
			# or
			pnpm add ${packageName}
			# or
			yarn add ${packageName}`
  );
}
function createPostgresSessionService(connectionString, options) {
  let Pool;
  try {
    ({ Pool } = __require("pg"));
  } catch (error) {
    throw createDependencyError("pg", "PostgreSQL");
  }
  const db = new (0, _kysely.Kysely)({
    dialect: new (0, _kysely.PostgresDialect)({
      pool: new Pool({
        connectionString,
        ...options
      })
    })
  });
  return new DatabaseSessionService({ db });
}
function createMysqlSessionService(connectionString, options) {
  let createPool;
  try {
    ({ createPool } = __require("mysql2"));
  } catch (error) {
    throw createDependencyError("mysql2", "MySQL");
  }
  const db = new (0, _kysely.Kysely)({
    dialect: new (0, _kysely.MysqlDialect)({
      pool: createPool({
        uri: connectionString,
        ...options
      })
    })
  });
  return new DatabaseSessionService({ db });
}
function createSqliteSessionService(filename, options) {
  let Database;
  try {
    Database = __require("better-sqlite3");
  } catch (error) {
    throw createDependencyError("better-sqlite3", "SQLite");
  }
  const db = new (0, _kysely.Kysely)({
    dialect: new (0, _kysely.SqliteDialect)({
      database: new Database(filename, options)
    })
  });
  return new DatabaseSessionService({ db });
}
function createDatabaseSessionService(databaseUrl, options) {
  if (databaseUrl.startsWith("postgres://") || databaseUrl.startsWith("postgresql://")) {
    return createPostgresSessionService(databaseUrl, options);
  }
  if (databaseUrl.startsWith("mysql://")) {
    return createMysqlSessionService(databaseUrl, options);
  }
  if (databaseUrl.startsWith("sqlite://") || databaseUrl.includes(".db") || databaseUrl === ":memory:") {
    const filename = databaseUrl.startsWith("sqlite://") ? databaseUrl.substring(9) : databaseUrl;
    return createSqliteSessionService(filename, options);
  }
  throw new Error(`Unsupported database URL: ${databaseUrl}`);
}

// src/artifacts/gcs-artifact-service.ts


var _storage = require('@google-cloud/storage');
var GcsArtifactService = class {
  
  
  
  constructor(bucketName, options) {
    this.bucketName = bucketName;
    this.storageClient = new (0, _storage.Storage)(options);
    this.bucket = this.storageClient.bucket(this.bucketName);
  }
  fileHasUserNamespace(filename) {
    return filename.startsWith("user:");
  }
  getBlobName(appName, userId, sessionId, filename, version) {
    if (this.fileHasUserNamespace(filename)) {
      return `${appName}/${userId}/user/${filename}/${version}`;
    }
    return `${appName}/${userId}/${sessionId}/${filename}/${version}`;
  }
  async saveArtifact(args) {
    const { appName, userId, sessionId, filename, artifact } = args;
    const versions = await this.listVersions({
      appName,
      userId,
      sessionId,
      filename
    });
    const version = versions.length === 0 ? 0 : Math.max(...versions) + 1;
    const blobName = this.getBlobName(
      appName,
      userId,
      sessionId,
      filename,
      version
    );
    const blob = this.bucket.file(blobName);
    await blob.save(artifact.inlineData.data, {
      contentType: artifact.inlineData.mimeType,
      preconditionOpts: { ifGenerationMatch: 0 }
    });
    return version;
  }
  async loadArtifact(args) {
    let { version } = args;
    const { appName, userId, sessionId, filename } = args;
    if (version === void 0 || version === null) {
      const versions = await this.listVersions({
        appName,
        userId,
        sessionId,
        filename
      });
      if (versions.length === 0) {
        return null;
      }
      version = Math.max(...versions);
    }
    const blobName = this.getBlobName(
      appName,
      userId,
      sessionId,
      filename,
      version
    );
    const blob = this.bucket.file(blobName);
    try {
      const [metadata] = await blob.getMetadata();
      const [artifactBuffer] = await blob.download();
      if (!artifactBuffer) {
        return null;
      }
      const part = {
        inlineData: {
          data: artifactBuffer.toString(),
          mimeType: metadata.contentType || "application/octet-stream"
        }
      };
      return part;
    } catch (error) {
      if (_optionalChain([error, 'optionalAccess', _315 => _315.code]) === 404) {
        return null;
      }
      throw error;
    }
  }
  async listArtifactKeys(args) {
    const { appName, userId, sessionId } = args;
    const filenames = /* @__PURE__ */ new Set();
    const processBlobs = (blobNames) => {
      for (const name of blobNames) {
        const parts = name.split("/");
        if (parts.length === 5) {
          const filename = parts[3];
          filenames.add(filename);
        }
      }
    };
    const sessionPrefix = `${appName}/${userId}/${sessionId}/`;
    const [sessionBlobs] = await this.storageClient.bucket(this.bucketName).getFiles({ prefix: sessionPrefix });
    processBlobs(sessionBlobs.map((b) => b.name));
    const userNamespacePrefix = `${appName}/${userId}/user/`;
    const [userNamespaceBlobs] = await this.storageClient.bucket(this.bucketName).getFiles({ prefix: userNamespacePrefix });
    processBlobs(userNamespaceBlobs.map((b) => b.name));
    return Array.from(filenames).sort();
  }
  async deleteArtifact(args) {
    const { appName, userId, sessionId, filename } = args;
    const versions = await this.listVersions({
      appName,
      userId,
      sessionId,
      filename
    });
    const deletePromises = versions.map((version) => {
      const blobName = this.getBlobName(
        appName,
        userId,
        sessionId,
        filename,
        version
      );
      return this.bucket.file(blobName).delete();
    });
    await Promise.all(deletePromises);
  }
  async listVersions(args) {
    const { appName, userId, sessionId, filename } = args;
    const prefix = this.getBlobName(appName, userId, sessionId, filename, "");
    const [blobs] = await this.bucket.getFiles({ prefix });
    const versions = [];
    for (const blob of blobs) {
      const parts = blob.name.split("/");
      if (parts.length === 5) {
        const versionStr = parts[4];
        const versionNum = Number.parseInt(versionStr, 10);
        if (!Number.isNaN(versionNum)) {
          versions.push(versionNum);
        }
      }
    }
    return versions.sort((a, b) => a - b);
  }
};

// src/flows/index.ts
var flows_exports = {};
__export(flows_exports, {
  AF_FUNCTION_CALL_ID_PREFIX: () => AF_FUNCTION_CALL_ID_PREFIX,
  AutoFlow: () => AutoFlow,
  BaseLlmFlow: () => BaseLlmFlow,
  BaseLlmRequestProcessor: () => BaseLlmRequestProcessor,
  BaseLlmResponseProcessor: () => BaseLlmResponseProcessor,
  REQUEST_EUC_FUNCTION_CALL_NAME: () => REQUEST_EUC_FUNCTION_CALL_NAME,
  SingleFlow: () => SingleFlow,
  agentTransferRequestProcessor: () => requestProcessor8,
  basicRequestProcessor: () => requestProcessor2,
  codeExecutionRequestProcessor: () => requestProcessor3,
  codeExecutionResponseProcessor: () => responseProcessor,
  contentRequestProcessor: () => requestProcessor4,
  generateAuthEvent: () => generateAuthEvent,
  generateClientFunctionCallId: () => generateClientFunctionCallId,
  getLongRunningFunctionCalls: () => getLongRunningFunctionCalls,
  handleFunctionCallsAsync: () => handleFunctionCallsAsync,
  handleFunctionCallsLive: () => handleFunctionCallsLive,
  identityRequestProcessor: () => requestProcessor5,
  instructionsRequestProcessor: () => requestProcessor6,
  mergeParallelFunctionResponseEvents: () => mergeParallelFunctionResponseEvents,
  nlPlanningRequestProcessor: () => requestProcessor7,
  nlPlanningResponseProcessor: () => responseProcessor2,
  populateClientFunctionCallId: () => populateClientFunctionCallId,
  removeClientFunctionCallId: () => removeClientFunctionCallId
});

// src/evaluation/index.ts
var evaluation_exports = {};
__export(evaluation_exports, {
  AgentEvaluator: () => AgentEvaluator,
  EvalResult: () => EvalResult,
  EvalStatus: () => EvalStatus,
  Evaluator: () => Evaluator,
  FinalResponseMatchV2Evaluator: () => FinalResponseMatchV2Evaluator,
  LocalEvalService: () => LocalEvalService,
  PrebuiltMetrics: () => PrebuiltMetrics,
  RougeEvaluator: () => RougeEvaluator,
  SafetyEvaluatorV1: () => SafetyEvaluatorV1,
  TrajectoryEvaluator: () => TrajectoryEvaluator
});

// src/evaluation/evaluator.ts
var EvalStatus = /* @__PURE__ */ ((EvalStatus2) => {
  EvalStatus2[EvalStatus2["PASSED"] = 1] = "PASSED";
  EvalStatus2[EvalStatus2["FAILED"] = 2] = "FAILED";
  EvalStatus2[EvalStatus2["NOT_EVALUATED"] = 3] = "NOT_EVALUATED";
  return EvalStatus2;
})(EvalStatus || {});
var Evaluator = class {
  constructor(metric) {
    this.metric = metric;
  }
  static getMetricInfo(metricName) {
    throw new Error("getMetricInfo() must be implemented by subclass");
  }
};

// src/evaluation/eval-metrics.ts
var PrebuiltMetrics = /* @__PURE__ */ ((PrebuiltMetrics2) => {
  PrebuiltMetrics2["TOOL_TRAJECTORY_AVG_SCORE"] = "tool_trajectory_avg_score";
  PrebuiltMetrics2["RESPONSE_EVALUATION_SCORE"] = "response_evaluation_score";
  PrebuiltMetrics2["RESPONSE_MATCH_SCORE"] = "response_match_score";
  PrebuiltMetrics2["SAFETY_V1"] = "safety_v1";
  PrebuiltMetrics2["FINAL_RESPONSE_MATCH_V2"] = "final_response_match_v2";
  PrebuiltMetrics2["TOOL_TRAJECTORY_SCORE"] = "tool_trajectory_score";
  PrebuiltMetrics2["SAFETY"] = "safety";
  PrebuiltMetrics2["RESPONSE_MATCH"] = "response_match";
  return PrebuiltMetrics2;
})(PrebuiltMetrics || {});

// src/evaluation/eval-result.ts
var EvalResult = class {
  
  
  
  
  
  constructor(init) {
    this.evalSetResultId = init.evalSetResultId || "";
    this.evalSetResultName = init.evalSetResultName;
    this.evalSetId = init.evalSetId || "";
    this.evalCaseResults = init.evalCaseResults || [];
    this.creationTimestamp = init.creationTimestamp || Date.now() / 1e3;
  }
};

// src/evaluation/agent-evaluator.ts



// src/evaluation/base-eval-service.ts
var BaseEvalService = class {
  async *evaluateSession(session) {
    const inferenceResults = [];
    for await (const result of this.performInference({
      evalSetId: session.evalSetId,
      evalCases: session.evalCases
    })) {
      inferenceResults.push(result);
    }
    for await (const result of this.evaluate({
      inferenceResults,
      evaluateConfig: session.evaluateConfig
    })) {
      yield result;
    }
  }
};

// src/evaluation/vertex-ai-eval-facade.ts
var ERROR_MESSAGE_SUFFIX = `
You should specify both project id and location. This metric uses Vertex Gen AI
Eval SDK, and it requires google cloud credentials.

If using an .env file add the values there, or explicitly set in the code using
the template below:

process.env.GOOGLE_CLOUD_LOCATION = <LOCATION>
process.env.GOOGLE_CLOUD_PROJECT = <PROJECT ID>
`;
var VertexAiEvalFacade = class _VertexAiEvalFacade {
  
  
  constructor(config) {
    this.threshold = config.threshold;
    this.metricName = config.metricName;
  }
  async evaluateInvocations(actualInvocations, expectedInvocations) {
    let totalScore = 0;
    let numInvocations = 0;
    const perInvocationResults = [];
    for (let i = 0; i < actualInvocations.length; i++) {
      const actual = actualInvocations[i];
      const expected = expectedInvocations[i];
      const prompt = this._getText(expected.userContent);
      const reference = this._getText(expected.finalResponse);
      const response = this._getText(actual.finalResponse);
      const evalCase = {
        prompt,
        reference,
        response
      };
      try {
        const evalCaseResult = await _VertexAiEvalFacade._performEval(
          [evalCase],
          [this.metricName]
        );
        const score = this._getScore(evalCaseResult);
        perInvocationResults.push({
          actualInvocation: actual,
          expectedInvocation: expected,
          score,
          evalStatus: this._getEvalStatus(score)
        });
        if (score !== null && score !== void 0) {
          totalScore += score;
          numInvocations++;
        }
      } catch (error) {
        console.error("Error evaluating invocation:", error);
        perInvocationResults.push({
          actualInvocation: actual,
          expectedInvocation: expected,
          score: void 0,
          evalStatus: 3 /* NOT_EVALUATED */
        });
      }
    }
    if (perInvocationResults.length > 0) {
      const overallScore = numInvocations > 0 ? totalScore / numInvocations : void 0;
      return {
        overallScore,
        overallEvalStatus: this._getEvalStatus(overallScore),
        perInvocationResults
      };
    }
    return {
      overallScore: void 0,
      overallEvalStatus: 3 /* NOT_EVALUATED */,
      perInvocationResults: []
    };
  }
  _getText(content) {
    if (_optionalChain([content, 'optionalAccess', _316 => _316.parts])) {
      return content.parts.map((p) => p.text || "").filter((text) => text.length > 0).join("\n");
    }
    return "";
  }
  _getScore(evalResult) {
    if (_optionalChain([evalResult, 'optionalAccess', _317 => _317.summaryMetrics, 'optionalAccess', _318 => _318[0], 'optionalAccess', _319 => _319.meanScore]) !== void 0 && typeof evalResult.summaryMetrics[0].meanScore === "number" && !Number.isNaN(evalResult.summaryMetrics[0].meanScore)) {
      return evalResult.summaryMetrics[0].meanScore;
    }
    return void 0;
  }
  _getEvalStatus(score) {
    if (score !== null && score !== void 0) {
      return score >= this.threshold ? 1 /* PASSED */ : 2 /* FAILED */;
    }
    return 3 /* NOT_EVALUATED */;
  }
  static async _performEval(dataset, metrics) {
    const projectId = process.env.GOOGLE_CLOUD_PROJECT;
    const location = process.env.GOOGLE_CLOUD_LOCATION;
    if (!projectId) {
      throw new Error(`Missing project id. ${ERROR_MESSAGE_SUFFIX}`);
    }
    if (!location) {
      throw new Error(`Missing location. ${ERROR_MESSAGE_SUFFIX}`);
    }
    console.warn(
      "Vertex AI evaluation is not fully implemented. Using mock response."
    );
    return {
      summaryMetrics: [
        {
          meanScore: Math.random() * 0.5 + 0.5
        }
      ]
    };
  }
};

// src/evaluation/response-evaluator.ts
var ResponseEvaluator = class extends Evaluator {
  
  
  constructor(evalMetric) {
    super(evalMetric);
    if (evalMetric.metricName === "response_evaluation_score" /* RESPONSE_EVALUATION_SCORE */) {
      this.metricName = "response_evaluation_score" /* RESPONSE_EVALUATION_SCORE */;
    } else if (evalMetric.metricName === "response_match_score" /* RESPONSE_MATCH_SCORE */) {
      this.metricName = "response_match_score" /* RESPONSE_MATCH_SCORE */;
    } else {
      throw new Error(`Metric ${evalMetric.metricName} is not supported.`);
    }
    this.threshold = evalMetric.threshold;
  }
  static getMetricInfo(metricName) {
    if (metricName === "response_evaluation_score" /* RESPONSE_EVALUATION_SCORE */) {
      return {
        metricName: "response_evaluation_score" /* RESPONSE_EVALUATION_SCORE */,
        description: "This metric evaluates how coherent agent's response was. Value range of this metric is [1,5], with values closer to 5 more desirable.",
        metricValueInfo: {
          interval: {
            minValue: 1,
            maxValue: 5,
            openAtMin: false,
            openAtMax: false
          }
        }
      };
    }
    if (metricName === "response_match_score" /* RESPONSE_MATCH_SCORE */) {
      return {
        metricName: "response_match_score" /* RESPONSE_MATCH_SCORE */,
        description: "This metric evaluates if agent's final response matches a golden/expected final response using Rouge_1 metric. Value range for this metric is [0,1], with values closer to 1 more desirable.",
        metricValueInfo: {
          interval: {
            minValue: 0,
            maxValue: 1,
            openAtMin: false,
            openAtMax: false
          }
        }
      };
    }
    throw new Error(`Metric ${metricName} is not supported.`);
  }
  async evaluateInvocations(actualInvocations, expectedInvocations) {
    if (this.metricName === "response_match_score" /* RESPONSE_MATCH_SCORE */) {
      return this.evaluateRougeScore(actualInvocations, expectedInvocations);
    }
    const vertexAiFacade = new VertexAiEvalFacade({
      threshold: this.threshold,
      metricName: this.metricName
    });
    return vertexAiFacade.evaluateInvocations(
      actualInvocations,
      expectedInvocations
    );
  }
  async evaluateRougeScore(actualInvocations, expectedInvocations) {
    if (actualInvocations.length !== expectedInvocations.length) {
      throw new Error("Number of actual and expected invocations must match");
    }
    const results = [];
    for (let i = 0; i < actualInvocations.length; i++) {
      const actual = actualInvocations[i];
      const expected = expectedInvocations[i];
      const result = await this.evaluateInvocation(actual, expected);
      results.push(result);
    }
    const scores = results.map((r) => r.score).filter((s) => s !== void 0);
    const overallScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : void 0;
    const overallStatus = overallScore !== void 0 && overallScore >= this.threshold ? 1 /* PASSED */ : 2 /* FAILED */;
    return {
      overallScore,
      overallEvalStatus: overallStatus,
      perInvocationResults: results
    };
  }
  async evaluateInvocation(actual, expected) {
    if (!actual.finalResponse || !expected.finalResponse) {
      return {
        actualInvocation: actual,
        expectedInvocation: expected,
        evalStatus: 3 /* NOT_EVALUATED */
      };
    }
    const score = await this.computeRougeScore(
      actual.finalResponse,
      expected.finalResponse
    );
    return {
      actualInvocation: actual,
      expectedInvocation: expected,
      score,
      evalStatus: score >= this.threshold ? 1 /* PASSED */ : 2 /* FAILED */
    };
  }
  async computeRougeScore(actual, expected) {
    const actualText = this.extractText(actual);
    const expectedText = this.extractText(expected);
    if (!actualText.trim() || !expectedText.trim()) {
      return 0;
    }
    const actualTokens = this.tokenizeText(actualText);
    const expectedTokens = this.tokenizeText(expectedText);
    const actualUnigrams = new Set(actualTokens);
    const expectedUnigrams = new Set(expectedTokens);
    const commonUnigrams = new Set(
      [...actualUnigrams].filter((token) => expectedUnigrams.has(token))
    );
    const precision = actualUnigrams.size > 0 ? commonUnigrams.size / actualUnigrams.size : 0;
    const recall = expectedUnigrams.size > 0 ? commonUnigrams.size / expectedUnigrams.size : 0;
    const fmeasure = precision + recall > 0 ? 2 * precision * recall / (precision + recall) : 0;
    return fmeasure;
  }
  extractText(content) {
    if (_optionalChain([content, 'optionalAccess', _320 => _320.parts])) {
      return content.parts.map((p) => p.text || "").filter((text) => text.length > 0).join(" ");
    }
    return "";
  }
  tokenizeText(text) {
    return text.toLowerCase().replace(/[^\w\s]/g, " ").split(/\s+/).filter((token) => token.length > 0);
  }
};

// src/evaluation/trajectory-evaluator.ts
var TrajectoryEvaluator = class extends Evaluator {
  static getMetricInfo() {
    return {
      metricName: "tool_trajectory_avg_score" /* TOOL_TRAJECTORY_AVG_SCORE */,
      description: "This metric compares two tool call trajectories (expected vs. actual) for the same user interaction. It performs an exact match on the tool name and arguments for each step in the trajectory. A score of 1.0 indicates a perfect match, while 0.0 indicates a mismatch. Higher values are better.",
      metricValueInfo: {
        interval: {
          minValue: 0,
          maxValue: 1,
          openAtMin: false,
          openAtMax: false
        }
      }
    };
  }
  async evaluateInvocations(actualInvocations, expectedInvocations) {
    let totalToolUseAccuracy = 0;
    let numInvocations = 0;
    const perInvocationResults = [];
    for (let i = 0; i < actualInvocations.length; i++) {
      const actual = actualInvocations[i];
      const expected = expectedInvocations[i];
      if (!_optionalChain([actual, 'access', _321 => _321.intermediateData, 'optionalAccess', _322 => _322.toolUses]) || !_optionalChain([expected, 'access', _323 => _323.intermediateData, 'optionalAccess', _324 => _324.toolUses])) {
        perInvocationResults.push({
          actualInvocation: actual,
          expectedInvocation: expected,
          evalStatus: 3 /* NOT_EVALUATED */
        });
        continue;
      }
      const toolUseAccuracy = this.areToolCallsEqual(
        actual.intermediateData.toolUses,
        expected.intermediateData.toolUses
      ) ? 1 : 0;
      perInvocationResults.push({
        actualInvocation: actual,
        expectedInvocation: expected,
        score: toolUseAccuracy,
        evalStatus: toolUseAccuracy >= this.metric.threshold ? 1 /* PASSED */ : 2 /* FAILED */
      });
      totalToolUseAccuracy += toolUseAccuracy;
      numInvocations++;
    }
    const overallScore = numInvocations > 0 ? totalToolUseAccuracy / numInvocations : 0;
    return {
      overallScore,
      overallEvalStatus: overallScore >= this.metric.threshold ? 1 /* PASSED */ : 2 /* FAILED */,
      perInvocationResults
    };
  }
  areToolCallsEqual(actual, expected) {
    if (actual.length !== expected.length) {
      return false;
    }
    return actual.every((actualCall, index) => {
      const expectedCall = expected[index];
      return this.isToolCallEqual(actualCall, expectedCall);
    });
  }
  isToolCallEqual(actual, expected) {
    if (actual.name !== expected.name) {
      return false;
    }
    const actualArgs = actual.args || {};
    const expectedArgs = expected.args || {};
    const actualKeys = Object.keys(actualArgs).sort();
    const expectedKeys = Object.keys(expectedArgs).sort();
    if (actualKeys.length !== expectedKeys.length) {
      return false;
    }
    return actualKeys.every((key, index) => {
      const expectedKey = expectedKeys[index];
      if (key !== expectedKey) {
        return false;
      }
      return JSON.stringify(actualArgs[key]) === JSON.stringify(expectedArgs[key]);
    });
  }
};

// src/evaluation/safety-evaluator.ts
var SafetyEvaluatorV1 = class extends Evaluator {
  static getMetricInfo() {
    return {
      metricName: "safety_v1" /* SAFETY_V1 */,
      description: "This metric evaluates the safety (harmlessness) of an Agent's Response. Value range of the metric is [0, 1], with values closer to 1 to be more desirable (safe).",
      metricValueInfo: {
        interval: {
          minValue: 0,
          maxValue: 1,
          openAtMin: false,
          openAtMax: false
        }
      }
    };
  }
  async evaluateInvocations(actualInvocations, expectedInvocations) {
    const facade = new VertexAiEvalFacade({
      threshold: this.metric.threshold,
      metricName: "safety_v1" /* SAFETY_V1 */
    });
    return await facade.evaluateInvocations(
      actualInvocations,
      expectedInvocations
    );
  }
};

// src/evaluation/llm-as-judge-utils.ts
function getTextFromContent(content) {
  if (_optionalChain([content, 'optionalAccess', _325 => _325.parts])) {
    return content.parts.map((part) => part.text).filter(Boolean).join("\n");
  }
  return "";
}
function getEvalStatus(score, threshold) {
  return score >= threshold ? 1 /* PASSED */ : 2 /* FAILED */;
}

// src/evaluation/llm-as-judge.ts
var LlmAsJudge = class {
  async sampleJudge(prompt, numSamples, critiqueParser, judgeModelOptions) {
    const modelName = _optionalChain([judgeModelOptions, 'optionalAccess', _326 => _326.judgeModel]) || "gemini-2.5-flash";
    const model = LLMRegistry.getModelOrCreate(modelName);
    const config = _optionalChain([judgeModelOptions, 'optionalAccess', _327 => _327.judgeModelConfig]) || {};
    const samples = [];
    for (let i = 0; i < numSamples; i++) {
      try {
        const response = await model.generateContent({
          prompt,
          ...config
        });
        const label = critiqueParser(response.text);
        if (label !== "not_found" /* NOT_FOUND */) {
          samples.push(label);
        }
      } catch (error) {
        console.error("Error sampling judge model:", error);
      }
    }
    return samples;
  }
};

// src/evaluation/final-response-match-v2.ts
var FINAL_RESPONSE_MATCH_V2_PROMPT = `You are an expert rater for an AI agent. The AI agent is going to call an API to answer the user query and generate API tool use code based for the choice of the API and API arguments. The ideal model response should be a function call that fulfills user query, or a natural language response hedges or asks users for further clarification if a function call does not apply.
The primary focus of this rating task is to check correctness of the model responses.

The data consists of:
- A user query.
- A model generated response for the prompt. The responses can consist of:
  - Natural language, when the model is asking for clarification, or tells the user it does not possess the requested functionality / option.
  - Code, in the form of one or multiple python function calls, and additional code as needed, for when the model is fulfilling the user request.
You can use the help from a reference response annotated by a human rater. This reference response is of high quality. You can compare the agent's response with the reference response and decide if the agent's response is valid.
Note sometimes the reference response only contains the key entities of the correct answer and you need to be flexible to allow the agent response to contain more information than the reference response, or to present the key entities in a different format or structure or in shorter or longer format.
When the agent response is provided in the form of tables/dataframes or should be best provided in the form of tables/dataframes: focus on the key entities and main components requested in the user query and check whether you can retrieve those from the agent response. Likewise, if you have the reference response, then find out the key entities and main components in them and check whether you can retrieve those from the agent response. If the prompt does not specify any format instructions and the main items/components are included in the response then tolerate the differences in the formatting of those tables/dataframes.

You should follow the constitutions below very carefully to rate the model response:
- Allow flexibility of format even when reference code only uses one of the possible format, unless API spec or user prompt has explicit format requirement
  - e.g. For state name, allow both abbreviation and full name unless API spec has explicit requirement. e.g. both 'tx' and 'Texas' should be allowed in the agent response even when reference code only uses one of them.
  - e.g. If a reference response list outputs in a list format, the agent response is allowed to use sentence format and vice versa unless user prompt explicitly asks for a specific format.
  - e.g. For numbers, allow flexibility of formatting, e.g. 1000000 vs 1,000,000.
- The model shouldn't assume that it doesn't have access to according data or incapable of answering the question if reference response is able to find a legit answer.
- If the model response contains the correct final answer, rate it as valid even when the model response contains more information than the reference response.
- If the user prompt has csv or other table format data, don't read it yourself. Trust the reference response final answer instead.
- When the validation needs maths, date calculations, do not use your own calculator. Trust the reference response final answer instead.
- Be mindful about unit of numbers. For example, if the reference response says 100 miles, but the model response says 100 km, it is invalid.
- When the agent response or the reference response is provided in the form of tables/dataframes: focus on the key entities and main components requested in the user query and check whether you can retrieve those from the agent response and whether those match the reference response. If the user query does not specify any format instructions and the main items/components are included in the response then tolerate the differences in the formatting of those tables/dataframes.
- When the answer is in numeric format, check whether there are any format requirements in the numeric format, rounding, precision, number of decimals, etc. specified in the user query and the prompt. If there are no such instructions, then tolerate different numerical formats.
- When the answer is in numeric format and there are rounding or precision differences between the agent response and the reference response, if no further instructions are provided evaluate if the rounding strategy or precision in the agent response follows the standards for that entity. For instance, model accuracy scores must be reported with at least two decimal places (e.g., 0.798 \u2192 0.80 is acceptable,  but 0.7 is not).

Below are the inputs:
{{
  "User prompt": {prompt},
  "Agent response": {response},
  "Reference response": {golden_response},
}}

The answer should be a json alone which follows the json structure below:
{{
  "reasoning": [reasoning],
  "is_the_agent_response_valid": [valid or invalid],
}}
Answer with assertiveness:
`;
var DEFAULT_NUM_SAMPLES = 5;
function parseCritique(response) {
  const labelMatchIsResponseValid = response.match(
    /"is_the_agent_response_valid":\s*\[*[\n\s]*"*([^"^\]^\s]*)"*[\n\s]*\]*\s*[,\n\}]/
  );
  if (_optionalChain([labelMatchIsResponseValid, 'optionalAccess', _328 => _328[1]])) {
    const label = labelMatchIsResponseValid[1].toLowerCase();
    return label === "valid" ? "valid" /* VALID */ : "invalid" /* INVALID */;
  }
  return "not_found" /* NOT_FOUND */;
}
var FinalResponseMatchV2Evaluator = class extends Evaluator {
  constructor(evalMetric, llmAsJudge = new LlmAsJudge()) {
    super(evalMetric);
    this.llmAsJudge = llmAsJudge;
  }
  static getMetricInfo() {
    return {
      metricName: "final_response_match_v2" /* FINAL_RESPONSE_MATCH_V2 */,
      description: "This metric evaluates if the agent's final response matches a golden/expected final response using an LLM judge. Value range for this metric is [0,1], with values closer to 1 more desirable.",
      metricValueInfo: {
        interval: {
          minValue: 0,
          maxValue: 1,
          openAtMin: false,
          openAtMax: false
        }
      }
    };
  }
  async evaluateInvocations(actualInvocations, expectedInvocations) {
    const perInvocationResults = [];
    let totalScore = 0;
    let numInvocations = 0;
    if (!actualInvocations.length) {
      return {
        overallEvalStatus: 3 /* NOT_EVALUATED */,
        perInvocationResults: []
      };
    }
    for (let i = 0; i < actualInvocations.length; i++) {
      const actual = actualInvocations[i];
      const expected = expectedInvocations[i];
      const prompt = getTextFromContent(expected.userContent);
      const response = getTextFromContent(actual.finalResponse);
      const goldenResponse = getTextFromContent(expected.finalResponse);
      const formattedPrompt = FINAL_RESPONSE_MATCH_V2_PROMPT.replace(
        "{prompt}",
        prompt
      ).replace("{response}", response).replace("{golden_response}", goldenResponse);
      const numSamples = _nullishCoalesce(_optionalChain([this, 'access', _329 => _329.metric, 'access', _330 => _330.judgeModelOptions, 'optionalAccess', _331 => _331.numSamples]), () => ( DEFAULT_NUM_SAMPLES));
      const labels = await this.llmAsJudge.sampleJudge(
        formattedPrompt,
        numSamples,
        parseCritique,
        this.metric.judgeModelOptions
      );
      const score = labels.filter((l) => l === "valid" /* VALID */).length / labels.length;
      perInvocationResults.push({
        actualInvocation: actual,
        expectedInvocation: expected,
        score,
        evalStatus: getEvalStatus(score, this.metric.threshold)
      });
      totalScore += score;
      numInvocations++;
    }
    const overallScore = totalScore / numInvocations;
    return {
      overallScore,
      overallEvalStatus: getEvalStatus(overallScore, this.metric.threshold),
      perInvocationResults
    };
  }
};

// src/evaluation/metric-evaluator-registry.ts
var MetricEvaluatorRegistry = (_class35 = class {constructor() { _class35.prototype.__init60.call(this); }
  __init60() {this.registry = /* @__PURE__ */ new Map()}
  getEvaluator(evalMetric) {
    const entry = this.registry.get(evalMetric.metricName);
    if (!entry) {
      throw new Error(`${evalMetric.metricName} not found in registry.`);
    }
    return new entry.evaluator(evalMetric);
  }
  registerEvaluator(metricInfo, evaluator) {
    const metricName = metricInfo.metricName;
    if (this.registry.has(metricName)) {
      console.info(
        `Updating Evaluator class for ${metricName} from ${_optionalChain([this, 'access', _332 => _332.registry, 'access', _333 => _333.get, 'call', _334 => _334(metricName), 'optionalAccess', _335 => _335.evaluator, 'access', _336 => _336.name])} to ${evaluator.name}`
      );
    }
    this.registry.set(metricName, {
      evaluator,
      metricInfo: { ...metricInfo }
    });
  }
  getRegisteredMetrics() {
    return Array.from(this.registry.values()).map((entry) => ({
      ...entry.metricInfo
    }));
  }
}, _class35);
function getDefaultMetricEvaluatorRegistry() {
  const registry = new MetricEvaluatorRegistry();
  registry.registerEvaluator(
    TrajectoryEvaluator.getMetricInfo(),
    TrajectoryEvaluator
  );
  registry.registerEvaluator(
    ResponseEvaluator.getMetricInfo("response_evaluation_score" /* RESPONSE_EVALUATION_SCORE */),
    ResponseEvaluator
  );
  registry.registerEvaluator(
    ResponseEvaluator.getMetricInfo("response_match_score" /* RESPONSE_MATCH_SCORE */),
    ResponseEvaluator
  );
  registry.registerEvaluator(
    SafetyEvaluatorV1.getMetricInfo(),
    SafetyEvaluatorV1
  );
  registry.registerEvaluator(
    FinalResponseMatchV2Evaluator.getMetricInfo(),
    FinalResponseMatchV2Evaluator
  );
  return registry;
}
var DEFAULT_METRIC_EVALUATOR_REGISTRY = getDefaultMetricEvaluatorRegistry();

// src/evaluation/local-eval-service.ts
var LocalEvalService = class extends BaseEvalService {
  constructor(agent, parallelism = 4) {
    super();
    this.agent = agent;
    this.parallelism = parallelism;
    this.initializeRunner();
  }
  
  async initializeRunner() {
    if ("ask" in this.agent) {
      this.runner = this.agent;
    } else {
      try {
        const { runner } = await AgentBuilder.create("eval_agent").withModel("gemini-2.5-flash").withDescription("Agent for evaluation purposes").build();
        this.runner = {
          ask: async (message) => {
            return await runner.ask(message);
          }
        };
      } catch (error) {
        console.warn(
          "Failed to create AgentBuilder runner, falling back to mock:",
          error
        );
        this.runner = {
          ask: async (message) => {
            return `Mock response to: ${message}`;
          }
        };
      }
    }
  }
  async *performInference(request) {
    for (const evalSet of request.evalCases) {
      for (const evalCase of evalSet.evalCases) {
        const expected = [];
        for (const convo of evalCase.conversation) {
          if (convo.finalResponse) {
            expected.push({
              invocationId: `${evalCase.evalId}-expected-${expected.length}`,
              userContent: convo.userContent,
              finalResponse: convo.finalResponse,
              intermediateData: convo.intermediateData,
              creationTimestamp: convo.creationTimestamp
            });
          }
        }
        const actual = await this.runInference(evalCase);
        yield [...expected, ...actual];
      }
    }
  }
  async *evaluate(request) {
    const { inferenceResults, evaluateConfig } = request;
    const resultsByCase = /* @__PURE__ */ new Map();
    for (const result of inferenceResults) {
      const invocationId = result[0].invocationId;
      if (!invocationId) continue;
      const lastHyphenIndex = invocationId.lastIndexOf("-");
      const evalId = lastHyphenIndex !== -1 ? invocationId.substring(0, lastHyphenIndex) : invocationId;
      const existing = resultsByCase.get(evalId) || [];
      resultsByCase.set(evalId, [...existing, ...result]);
    }
    for (const [evalId, results] of resultsByCase) {
      const evalResult = {
        evalSetResultId: `${evalId}-result-${Date.now()}`,
        evalSetId: evalId,
        evalCaseResults: [],
        creationTimestamp: Date.now()
      };
      for (const evalMetric of evaluateConfig.evalMetrics) {
        const evaluator = DEFAULT_METRIC_EVALUATOR_REGISTRY.getEvaluator(evalMetric);
        const actual = results.filter(
          (r) => !_optionalChain([r, 'access', _337 => _337.invocationId, 'optionalAccess', _338 => _338.includes, 'call', _339 => _339("expected")])
        );
        const expected = results.filter(
          (r) => _optionalChain([r, 'access', _340 => _340.invocationId, 'optionalAccess', _341 => _341.includes, 'call', _342 => _342("expected")])
        );
        const result = await evaluator.evaluateInvocations(actual, expected);
        evalResult.evalCaseResults.push({
          evalSetId: evalId,
          evalId,
          finalEvalStatus: result.perInvocationResults.length > 0 ? result.perInvocationResults[0].evalStatus : 3 /* NOT_EVALUATED */,
          overallEvalMetricResults: [],
          sessionId: evalId,
          evalMetricResultPerInvocation: result.perInvocationResults.map(
            (r) => ({
              actualInvocation: r.actualInvocation,
              expectedInvocation: r.expectedInvocation,
              evalMetricResults: [
                {
                  metricName: evalMetric.metricName,
                  threshold: evalMetric.threshold,
                  score: r.score,
                  evalStatus: r.evalStatus
                }
              ]
            })
          )
        });
      }
      yield evalResult;
    }
  }
  async runInference(evalCase) {
    const results = [];
    if (!this.runner) {
      await this.initializeRunner();
    }
    if (evalCase.sessionInput) {
      try {
        if (this.runner.initializeSession) {
          await this.runner.initializeSession(evalCase.sessionInput);
        } else if (this.runner.setSessionState) {
          await this.runner.setSessionState(evalCase.sessionInput);
        } else {
          console.log(
            `Session input provided for ${evalCase.evalId}:`,
            evalCase.sessionInput
          );
        }
      } catch (error) {
        console.warn(
          `Failed to initialize session for ${evalCase.evalId}:`,
          error
        );
      }
    }
    for (const invocation of evalCase.conversation) {
      try {
        const response = await this.runner.ask(invocation.userContent);
        results.push({
          invocationId: `${evalCase.evalId}-${results.length}`,
          userContent: invocation.userContent,
          finalResponse: {
            role: "model",
            parts: [{ text: response || "" }]
          },
          intermediateData: {
            toolUses: [],
            intermediateResponses: []
          },
          creationTimestamp: Date.now()
        });
      } catch (error) {
        console.error(`Error running inference for ${evalCase.evalId}:`, error);
        results.push({
          invocationId: `${evalCase.evalId}-${results.length}`,
          userContent: invocation.userContent,
          finalResponse: {
            role: "model",
            parts: [
              {
                text: `Error: ${error instanceof Error ? error.message : "Unknown error"}`
              }
            ]
          },
          intermediateData: {
            toolUses: [],
            intermediateResponses: []
          },
          creationTimestamp: Date.now()
        });
      }
    }
    return results;
  }
};

// src/evaluation/agent-evaluator.ts
var NUM_RUNS = 2;
var TOOL_TRAJECTORY_SCORE_KEY = "tool_trajectory_avg_score" /* TOOL_TRAJECTORY_AVG_SCORE */;
var RESPONSE_EVALUATION_SCORE_KEY = "response_evaluation_score" /* RESPONSE_EVALUATION_SCORE */;
var RESPONSE_MATCH_SCORE_KEY = "response_match_score" /* RESPONSE_MATCH_SCORE */;
var SAFETY_V1_KEY = "safety_v1" /* SAFETY_V1 */;
var ALLOWED_CRITERIA = [
  TOOL_TRAJECTORY_SCORE_KEY,
  RESPONSE_EVALUATION_SCORE_KEY,
  RESPONSE_MATCH_SCORE_KEY,
  SAFETY_V1_KEY
];
var QUERY_COLUMN = "query";
var REFERENCE_COLUMN = "reference";
var EXPECTED_TOOL_USE_COLUMN = "expected_tool_use";
var DEFAULT_CRITERIA = {
  [TOOL_TRAJECTORY_SCORE_KEY]: 1,
  [RESPONSE_MATCH_SCORE_KEY]: 0.8
};
var loadJson = async (filePath) => {
  try {
    const fileContent = await fs2.readFile(filePath, "utf-8");
    return JSON.parse(fileContent);
  } catch (error) {
    throw new Error(`Failed to load JSON from ${filePath}: ${error}`);
  }
};
var AgentEvaluator = class _AgentEvaluator {
  static async findConfigForTestFile(testFile) {
    const testFolder = path2.dirname(testFile);
    const configPath = path2.join(testFolder, "test_config.json");
    try {
      await fs2.access(configPath);
      const configData = await loadJson(configPath);
      if ("criteria" in configData && typeof configData.criteria === "object") {
        return configData.criteria;
      }
      throw new Error(
        `Invalid format for test_config.json at ${configPath}. Expected a 'criteria' dictionary.`
      );
    } catch (error) {
      return DEFAULT_CRITERIA;
    }
  }
  static async evaluateEvalSet(agent, evalSet, criteria, numRuns = NUM_RUNS, printDetailedResults = false) {
    const evalMetrics = Object.entries(criteria).map(
      ([metricName, threshold]) => ({
        metricName,
        threshold
      })
    );
    const evalResultsByEvalId = await _AgentEvaluator._getEvalResultsByEvalId(
      agent,
      evalSet,
      evalMetrics,
      numRuns
    );
    const failures = [];
    for (const [_, evalResultsPerEvalId] of evalResultsByEvalId) {
      const evalMetricResults = _AgentEvaluator._getEvalMetricResultsWithInvocation(
        evalResultsPerEvalId
      );
      const failuresPerEvalCase = _AgentEvaluator._processMetricsAndGetFailures(
        evalMetricResults,
        printDetailedResults,
        agent.name || "Unknown Agent"
      );
      failures.push(...failuresPerEvalCase);
    }
    if (failures.length > 0) {
      throw new Error(
        `Following are all the test failures. If you looking to get more details on the failures, then please re-run this test with \`printDetailedResults\` set to \`true\`.
${failures.join(
          "\n"
        )}`
      );
    }
  }
  static async evaluate(agent, evalDatasetFilePathOrDir, numRuns = NUM_RUNS, initialSessionFile) {
    const testFiles = [];
    try {
      const stat2 = await fs2.stat(evalDatasetFilePathOrDir);
      if (stat2.isDirectory()) {
        const files = await this._findTestFilesRecursively(
          evalDatasetFilePathOrDir
        );
        testFiles.push(...files);
      } else {
        testFiles.push(evalDatasetFilePathOrDir);
      }
    } catch (error) {
      throw new Error(`Invalid path: ${evalDatasetFilePathOrDir}`);
    }
    const initialSession = await _AgentEvaluator._getInitialSession(initialSessionFile);
    for (const testFile of testFiles) {
      const criteria = await _AgentEvaluator.findConfigForTestFile(testFile);
      const evalSet = await _AgentEvaluator._loadEvalSetFromFile(
        testFile,
        criteria,
        initialSession
      );
      await _AgentEvaluator.evaluateEvalSet(agent, evalSet, criteria, numRuns);
    }
  }
  static async migrateEvalDataToNewSchema(oldEvalDataFile, newEvalDataFile, initialSessionFile) {
    if (!oldEvalDataFile || !newEvalDataFile) {
      throw new Error("One of oldEvalDataFile or newEvalDataFile is empty.");
    }
    const criteria = await _AgentEvaluator.findConfigForTestFile(oldEvalDataFile);
    const initialSession = await _AgentEvaluator._getInitialSession(initialSessionFile);
    const evalSet = await _AgentEvaluator._getEvalSetFromOldFormat(
      oldEvalDataFile,
      criteria,
      initialSession
    );
    await fs2.writeFile(newEvalDataFile, JSON.stringify(evalSet, null, 2));
  }
  static async _findTestFilesRecursively(dir) {
    const testFiles = [];
    async function walk(currentDir) {
      const entries = await fs2.readdir(currentDir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path2.join(currentDir, entry.name);
        if (entry.isDirectory()) {
          await walk(fullPath);
        } else if (entry.name.endsWith(".test.json")) {
          testFiles.push(fullPath);
        }
      }
    }
    await walk(dir);
    return testFiles;
  }
  static async _loadEvalSetFromFile(evalSetFile, criteria, initialSession) {
    try {
      const content = await fs2.readFile(evalSetFile, "utf-8");
      try {
        const evalSet = JSON.parse(content);
        if (evalSet.evalSetId && evalSet.evalCases) {
          if (Object.keys(initialSession).length > 0) {
            throw new Error(
              "Initial session should be specified as a part of EvalSet file. Explicit initial session is only needed, when specifying data in the older schema."
            );
          }
          return evalSet;
        }
      } catch (parseError) {
        throw new Error(`Failed to parse eval set data: ${parseError}`);
      }
    } catch (error) {
      throw new Error(`Failed to process eval set file: ${error}`);
    }
    console.warn(
      `Contents of ${evalSetFile} appear to be in older format. To avoid this warning, please update your test files to contain data in EvalSet schema. You can use 'migrateEvalDataToNewSchema' for migrating your old test files.`
    );
    return _AgentEvaluator._getEvalSetFromOldFormat(
      evalSetFile,
      criteria,
      initialSession
    );
  }
  static async _getEvalSetFromOldFormat(evalSetFile, criteria, initialSession) {
    const data = await _AgentEvaluator._loadDataset(evalSetFile);
    _AgentEvaluator._validateInput(data, criteria);
    return {
      evalSetId: `eval-set-${Date.now()}`,
      name: evalSetFile,
      evalCases: data[0].map(
        (item, index) => ({
          evalId: `eval-${index}`,
          conversation: [
            {
              invocationId: `invocation-${index}`,
              userContent: {
                role: "user",
                parts: [{ text: item[QUERY_COLUMN] || "" }]
              },
              finalResponse: item[REFERENCE_COLUMN] ? {
                role: "model",
                parts: [{ text: item[REFERENCE_COLUMN] }]
              } : void 0,
              intermediateData: item[EXPECTED_TOOL_USE_COLUMN] ? {
                toolUses: item[EXPECTED_TOOL_USE_COLUMN],
                intermediateResponses: []
              } : void 0,
              creationTimestamp: Date.now()
            }
          ],
          sessionInput: Object.keys(initialSession).length > 0 ? {
            appName: "test-app",
            userId: "test-user",
            state: initialSession
          } : void 0
        })
      ),
      creationTimestamp: Date.now()
    };
  }
  static async _getInitialSession(initialSessionFile) {
    if (!initialSessionFile) {
      return {};
    }
    try {
      const content = await fs2.readFile(initialSessionFile, "utf-8");
      return JSON.parse(content);
    } catch (error) {
      throw new Error(
        `Failed to load initial session from ${initialSessionFile}: ${error}`
      );
    }
  }
  static async _loadDataset(inputData) {
    const stat2 = await fs2.stat(inputData);
    if (stat2.isDirectory()) {
      const testFiles = await this._findTestFilesRecursively(inputData);
      const results = await Promise.all(testFiles.map((f) => loadJson(f)));
      return results.map((r) => Array.isArray(r) ? r : [r]);
    }
    if (stat2.isFile()) {
      const data = await loadJson(inputData);
      return [Array.isArray(data) ? data : [data]];
    }
    throw new Error(`Invalid input path: ${inputData}`);
  }
  static _validateInput(evalDataset, criteria) {
    if (!evalDataset || evalDataset.length === 0) {
      throw new Error("The evaluation dataset is None or empty.");
    }
    for (const key of Object.keys(criteria)) {
      if (!ALLOWED_CRITERIA.includes(key)) {
        throw new Error(
          `Invalid criteria key: ${key}. Expected one of ${ALLOWED_CRITERIA.join(
            ", "
          )}.`
        );
      }
    }
    const sample = evalDataset[0];
    if (!Array.isArray(sample) || sample.length === 0) {
      throw new Error("The evaluation dataset is empty.");
    }
    const firstQuery = sample[0];
    if (typeof firstQuery !== "object") {
      throw new Error(
        `Each evaluation dataset sample must be list of dictionary. But it's ${JSON.stringify(
          evalDataset
        )}`
      );
    }
    if (TOOL_TRAJECTORY_SCORE_KEY in criteria) {
      if (!(QUERY_COLUMN in firstQuery) || !(EXPECTED_TOOL_USE_COLUMN in firstQuery)) {
        throw new Error(
          `Samples for ${TOOL_TRAJECTORY_SCORE_KEY} must include '${QUERY_COLUMN}' and '${EXPECTED_TOOL_USE_COLUMN}' keys. The sample is ${JSON.stringify(sample)}.`
        );
      }
    }
    if (RESPONSE_EVALUATION_SCORE_KEY in criteria) {
      if (!(QUERY_COLUMN in firstQuery)) {
        throw new Error(
          `Samples for ${RESPONSE_EVALUATION_SCORE_KEY} must include '${QUERY_COLUMN}' key. The sample is ${JSON.stringify(sample)}.`
        );
      }
    }
    if (RESPONSE_MATCH_SCORE_KEY in criteria) {
      if (!(QUERY_COLUMN in firstQuery) || !(REFERENCE_COLUMN in firstQuery)) {
        throw new Error(
          `Samples for ${RESPONSE_MATCH_SCORE_KEY} must include '${QUERY_COLUMN}' and '${REFERENCE_COLUMN}' keys. The sample is ${JSON.stringify(sample)}.`
        );
      }
    }
  }
  static _printDetails(evalMetricResultWithInvocations, overallEvalStatus, overallScore, metricName = "", threshold = 0) {
    console.log(
      `Summary: \`${overallEvalStatus}\` for Metric: \`${metricName}\`. Expected threshold: \`${threshold}\`, actual value: \`${overallScore}\`.`
    );
    const data = evalMetricResultWithInvocations.map((per) => ({
      evalStatus: per.evalMetricResult.evalStatus,
      score: per.evalMetricResult.score,
      threshold,
      prompt: _AgentEvaluator._convertContentToText(
        per.expectedInvocation.userContent
      ),
      expectedResponse: _AgentEvaluator._convertContentToText(
        per.expectedInvocation.finalResponse
      ),
      actualResponse: _AgentEvaluator._convertContentToText(
        per.actualInvocation.finalResponse
      ),
      expectedToolCalls: _AgentEvaluator._convertToolCallsToText(
        per.expectedInvocation.intermediateData
      ),
      actualToolCalls: _AgentEvaluator._convertToolCallsToText(
        per.actualInvocation.intermediateData
      )
    }));
    console.table(data);
    console.log("\n\n");
  }
  static _convertContentToText(content) {
    if (_optionalChain([content, 'optionalAccess', _343 => _343.parts])) {
      return content.parts.map((p) => p.text || "").filter((text) => text.length > 0).join("\n");
    }
    return "";
  }
  static _convertToolCallsToText(intermediateData) {
    if (_optionalChain([intermediateData, 'optionalAccess', _344 => _344.toolUses])) {
      return intermediateData.toolUses.map((t) => JSON.stringify(t)).join("\n");
    }
    return "";
  }
  static async _getEvalResultsByEvalId(agent, evalSet, evalMetrics, numRuns) {
    const evalService = new LocalEvalService(agent);
    const inferenceResults = [];
    for (let run = 0; run < numRuns; run++) {
      for await (const result of evalService.performInference({
        evalSetId: evalSet.evalSetId,
        evalCases: [evalSet]
      })) {
        inferenceResults.push(result);
      }
    }
    const evalResultsByEvalId = /* @__PURE__ */ new Map();
    for await (const evalResult of evalService.evaluate({
      inferenceResults,
      evaluateConfig: { evalMetrics }
    })) {
      for (const caseResult of evalResult.evalCaseResults) {
        const evalId = caseResult.evalId;
        if (!evalResultsByEvalId.has(evalId)) {
          evalResultsByEvalId.set(evalId, []);
        }
        evalResultsByEvalId.get(evalId).push(caseResult);
      }
    }
    return evalResultsByEvalId;
  }
  static _getEvalMetricResultsWithInvocation(evalResultsPerEvalId) {
    const evalMetricResults = {};
    for (const evalCaseResult of evalResultsPerEvalId) {
      for (const evalMetricsPerInvocation of evalCaseResult.evalMetricResultPerInvocation) {
        for (const evalMetricResult of evalMetricsPerInvocation.evalMetricResults) {
          const metricName = evalMetricResult.metricName;
          if (!(metricName in evalMetricResults)) {
            evalMetricResults[metricName] = [];
          }
          evalMetricResults[metricName].push({
            actualInvocation: evalMetricsPerInvocation.actualInvocation,
            expectedInvocation: evalMetricsPerInvocation.expectedInvocation,
            evalMetricResult
          });
        }
      }
    }
    return evalMetricResults;
  }
  static _processMetricsAndGetFailures(evalMetricResults, printDetailedResults, agentModule) {
    const failures = [];
    for (const [metricName, evalMetricResultsWithInvocations] of Object.entries(
      evalMetricResults
    )) {
      const threshold = _optionalChain([evalMetricResultsWithInvocations, 'access', _345 => _345[0], 'optionalAccess', _346 => _346.evalMetricResult, 'access', _347 => _347.threshold]) || 0;
      const scores = evalMetricResultsWithInvocations.map((m) => m.evalMetricResult.score).filter((s) => s !== void 0);
      let overallScore;
      let overallEvalStatus;
      if (scores.length > 0) {
        overallScore = scores.reduce((a, b) => a + b, 0) / scores.length;
        overallEvalStatus = overallScore >= threshold ? 1 /* PASSED */ : 2 /* FAILED */;
      } else {
        overallScore = void 0;
        overallEvalStatus = 3 /* NOT_EVALUATED */;
      }
      if (overallEvalStatus !== 1 /* PASSED */) {
        if (printDetailedResults) {
          _AgentEvaluator._printDetails(
            evalMetricResultsWithInvocations,
            overallEvalStatus,
            overallScore,
            metricName,
            threshold
          );
        }
        failures.push(
          `${metricName} for ${agentModule} Failed. Expected ${threshold}, but got ${overallScore}.`
        );
      }
    }
    return failures;
  }
};

// src/evaluation/final-response-match-v1.ts
var RougeEvaluator = class extends Evaluator {
  
  constructor(evalMetric) {
    super(evalMetric);
    this.evalMetric = evalMetric;
  }
  static getMetricInfo() {
    return {
      metricName: "response_match_score" /* RESPONSE_MATCH_SCORE */,
      description: "This metric evaluates if the agent's final response matches a golden/expected final response using Rouge_1 metric. Value range for this metric is [0,1], with values closer to 1 more desirable.",
      metricValueInfo: {
        interval: {
          minValue: 0,
          maxValue: 1,
          openAtMin: false,
          openAtMax: false
        }
      }
    };
  }
  async evaluateInvocations(actualInvocations, expectedInvocations) {
    let totalScore = 0;
    let numInvocations = 0;
    const perInvocationResults = [];
    for (let i = 0; i < actualInvocations.length; i++) {
      const actual = actualInvocations[i];
      const expected = expectedInvocations[i];
      const reference = getTextFromContent2(expected.finalResponse);
      const response = getTextFromContent2(actual.finalResponse);
      const rouge1Scores = await calculateRouge1Scores(response, reference);
      const score = rouge1Scores.fmeasure;
      perInvocationResults.push({
        actualInvocation: actual,
        expectedInvocation: expected,
        score,
        evalStatus: getEvalStatus2(score, this.evalMetric.threshold)
      });
      totalScore += score;
      numInvocations++;
    }
    if (perInvocationResults.length > 0) {
      const overallScore = totalScore / numInvocations;
      return {
        overallScore,
        overallEvalStatus: getEvalStatus2(
          overallScore,
          this.evalMetric.threshold
        ),
        perInvocationResults
      };
    }
    return {
      overallEvalStatus: 3 /* NOT_EVALUATED */,
      perInvocationResults: []
    };
  }
};
function getTextFromContent2(content) {
  if (_optionalChain([content, 'optionalAccess', _348 => _348.parts])) {
    return content.parts.map((part) => part.text).filter(Boolean).join("\n");
  }
  return "";
}
function getEvalStatus2(score, threshold) {
  return score >= threshold ? 1 /* PASSED */ : 2 /* FAILED */;
}
function calculateRouge1Scores(response, reference) {
  if (!response.trim() || !reference.trim()) {
    return { precision: 0, recall: 0, fmeasure: 0 };
  }
  const responseTokens = tokenizeText(response);
  const referenceTokens = tokenizeText(reference);
  const responseUnigrams = new Set(responseTokens);
  const referenceUnigrams = new Set(referenceTokens);
  const commonUnigrams = new Set(
    [...responseUnigrams].filter((token) => referenceUnigrams.has(token))
  );
  const precision = responseUnigrams.size > 0 ? commonUnigrams.size / responseUnigrams.size : 0;
  const recall = referenceUnigrams.size > 0 ? commonUnigrams.size / referenceUnigrams.size : 0;
  const fmeasure = precision + recall > 0 ? 2 * precision * recall / (precision + recall) : 0;
  return { precision, recall, fmeasure };
}
function tokenizeText(text) {
  return text.toLowerCase().replace(/[^\w\s]/g, " ").split(/\s+/).filter((token) => token.length > 0);
}

// src/version.ts
var VERSION = "0.1.0";




































































































































































exports.AF_FUNCTION_CALL_ID_PREFIX = AF_FUNCTION_CALL_ID_PREFIX; exports.Agent = LlmAgent; exports.AgentBuilder = AgentBuilder; exports.AgentEvaluator = AgentEvaluator; exports.AgentTool = AgentTool; exports.Agents = agents_exports; exports.AiSdkLlm = AiSdkLlm; exports.AnthropicLlm = AnthropicLlm; exports.ApiKeyCredential = ApiKeyCredential; exports.ApiKeyScheme = ApiKeyScheme; exports.AuthConfig = AuthConfig; exports.AuthCredential = AuthCredential; exports.AuthCredentialType = AuthCredentialType; exports.AuthHandler = AuthHandler; exports.AuthScheme = AuthScheme; exports.AuthSchemeType = AuthSchemeType; exports.AuthTool = AuthTool; exports.AutoFlow = AutoFlow; exports.BaseAgent = BaseAgent; exports.BaseCodeExecutor = BaseCodeExecutor; exports.BaseLLMConnection = BaseLLMConnection; exports.BaseLlm = BaseLlm; exports.BaseLlmFlow = BaseLlmFlow; exports.BaseLlmRequestProcessor = BaseLlmRequestProcessor; exports.BaseLlmResponseProcessor = BaseLlmResponseProcessor; exports.BasePlanner = BasePlanner; exports.BaseSessionService = BaseSessionService; exports.BaseTool = BaseTool; exports.BasicAuthCredential = BasicAuthCredential; exports.BearerTokenCredential = BearerTokenCredential; exports.BuiltInCodeExecutor = BuiltInCodeExecutor; exports.BuiltInPlanner = BuiltInPlanner; exports.CallbackContext = CallbackContext; exports.CodeExecutionUtils = CodeExecutionUtils; exports.CodeExecutorContext = CodeExecutorContext; exports.DatabaseSessionService = DatabaseSessionService; exports.EnhancedAuthConfig = EnhancedAuthConfig; exports.EvalResult = EvalResult; exports.EvalStatus = EvalStatus; exports.Evaluation = evaluation_exports; exports.Evaluator = Evaluator; exports.Event = Event; exports.EventActions = EventActions; exports.Events = events_exports; exports.ExitLoopTool = ExitLoopTool; exports.FileOperationsTool = FileOperationsTool; exports.FinalResponseMatchV2Evaluator = FinalResponseMatchV2Evaluator; exports.Flows = flows_exports; exports.FunctionTool = FunctionTool; exports.GcsArtifactService = GcsArtifactService; exports.GetUserChoiceTool = GetUserChoiceTool; exports.GoogleLlm = GoogleLlm; exports.GoogleSearch = GoogleSearch; exports.HttpRequestTool = HttpRequestTool; exports.HttpScheme = HttpScheme; exports.InMemoryArtifactService = InMemoryArtifactService; exports.InMemoryMemoryService = InMemoryMemoryService; exports.InMemoryRunner = InMemoryRunner; exports.InMemorySessionService = InMemorySessionService; exports.InvocationContext = InvocationContext; exports.LLMRegistry = LLMRegistry; exports.LangGraphAgent = LangGraphAgent; exports.LlmAgent = LlmAgent; exports.LlmCallsLimitExceededError = LlmCallsLimitExceededError; exports.LlmRequest = LlmRequest; exports.LlmResponse = LlmResponse; exports.LoadArtifactsTool = LoadArtifactsTool; exports.LoadMemoryTool = LoadMemoryTool; exports.LocalEvalService = LocalEvalService; exports.LoopAgent = LoopAgent; exports.McpAbi = McpAbi; exports.McpAtp = McpAtp; exports.McpBamm = McpBamm; exports.McpCoinGecko = McpCoinGecko; exports.McpDiscord = McpDiscord; exports.McpError = McpError; exports.McpErrorType = McpErrorType; exports.McpFilesystem = McpFilesystem; exports.McpFraxlend = McpFraxlend; exports.McpGeneric = McpGeneric; exports.McpIqWiki = McpIqWiki; exports.McpMemory = McpMemory; exports.McpNearAgent = McpNearAgent; exports.McpNearIntents = McpNearIntents; exports.McpOdos = McpOdos; exports.McpSamplingHandler = McpSamplingHandler; exports.McpTelegram = McpTelegram; exports.McpToolset = McpToolset; exports.McpUpbit = McpUpbit; exports.Memory = memory_exports; exports.Models = models_exports; exports.OAuth2Credential = OAuth2Credential; exports.OAuth2Scheme = OAuth2Scheme; exports.OpenAiLlm = OpenAiLlm; exports.OpenIdConnectScheme = OpenIdConnectScheme; exports.ParallelAgent = ParallelAgent; exports.PlanReActPlanner = PlanReActPlanner; exports.PrebuiltMetrics = PrebuiltMetrics; exports.REQUEST_EUC_FUNCTION_CALL_NAME = REQUEST_EUC_FUNCTION_CALL_NAME; exports.ReadonlyContext = ReadonlyContext; exports.RougeEvaluator = RougeEvaluator; exports.RunConfig = RunConfig; exports.Runner = Runner; exports.SafetyEvaluatorV1 = SafetyEvaluatorV1; exports.SequentialAgent = SequentialAgent; exports.Sessions = sessions_exports; exports.SingleFlow = SingleFlow; exports.State = State; exports.StreamingMode = StreamingMode; exports.TelemetryService = TelemetryService; exports.ToolContext = ToolContext; exports.Tools = tools_exports; exports.TrajectoryEvaluator = TrajectoryEvaluator; exports.TransferToAgentTool = TransferToAgentTool; exports.UserInteractionTool = UserInteractionTool; exports.VERSION = VERSION; exports.VertexAiSessionService = VertexAiSessionService; exports._findFunctionCallEventIfLastEventIsFunctionResponse = _findFunctionCallEventIfLastEventIsFunctionResponse; exports.adkToMcpToolType = adkToMcpToolType; exports.agentTransferRequestProcessor = requestProcessor8; exports.basicRequestProcessor = requestProcessor2; exports.buildFunctionDeclaration = buildFunctionDeclaration; exports.codeExecutionRequestProcessor = requestProcessor3; exports.codeExecutionResponseProcessor = responseProcessor; exports.contentRequestProcessor = requestProcessor4; exports.convertMcpToolToBaseTool = convertMcpToolToBaseTool; exports.createAuthToolArguments = createAuthToolArguments; exports.createBranchContextForSubAgent = createBranchContextForSubAgent; exports.createDatabaseSessionService = createDatabaseSessionService; exports.createFunctionTool = createFunctionTool; exports.createMysqlSessionService = createMysqlSessionService; exports.createPostgresSessionService = createPostgresSessionService; exports.createSamplingHandler = createSamplingHandler; exports.createSqliteSessionService = createSqliteSessionService; exports.createTool = createTool; exports.generateAuthEvent = generateAuthEvent; exports.generateClientFunctionCallId = generateClientFunctionCallId; exports.getLongRunningFunctionCalls = getLongRunningFunctionCalls; exports.getMcpTools = getMcpTools; exports.handleFunctionCallsAsync = handleFunctionCallsAsync; exports.handleFunctionCallsLive = handleFunctionCallsLive; exports.identityRequestProcessor = requestProcessor5; exports.initializeTelemetry = initializeTelemetry; exports.injectSessionState = injectSessionState; exports.instructionsRequestProcessor = requestProcessor6; exports.isEnhancedAuthConfig = isEnhancedAuthConfig; exports.jsonSchemaToDeclaration = jsonSchemaToDeclaration; exports.mcpSchemaToParameters = mcpSchemaToParameters; exports.mergeAgentRun = mergeAgentRun; exports.mergeParallelFunctionResponseEvents = mergeParallelFunctionResponseEvents; exports.newInvocationContextId = newInvocationContextId; exports.nlPlanningRequestProcessor = requestProcessor7; exports.nlPlanningResponseProcessor = responseProcessor2; exports.normalizeJsonSchema = normalizeJsonSchema; exports.populateClientFunctionCallId = populateClientFunctionCallId; exports.registerProviders = registerProviders; exports.removeClientFunctionCallId = removeClientFunctionCallId; exports.requestProcessor = requestProcessor; exports.shutdownTelemetry = shutdownTelemetry; exports.telemetryService = telemetryService; exports.traceLlmCall = traceLlmCall; exports.traceToolCall = traceToolCall; exports.tracer = tracer;
