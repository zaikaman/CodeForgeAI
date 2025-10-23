import { Logger } from "@adk/logger";
import type { BaseLlm } from "./base-llm";
import type { LlmResponse } from "./llm-response";

interface LLMClass {
	new (model: string): BaseLlm;
	supportedModels(): string[];
}

export interface LlmModelConfig {
	temperature?: number;
	maxOutputTokens?: number;
	topP?: number;
	topK?: number;
}

export interface LlmModel {
	generateContent(
		options: { prompt: string } & LlmModelConfig,
	): Promise<LlmResponse>;
}

export class LLMRegistry {
	private static llmRegistry: Map<RegExp, LLMClass> = new Map();

	private static modelInstances: Map<string, LlmModel> = new Map();
	
	/**
	 * Default provider to use when model doesn't match any pattern
	 * Can be set via environment variable ADK_DEFAULT_LLM_PROVIDER
	 */
	private static defaultProvider?: LLMClass;

	private static logger = new Logger({ name: "LLMRegistry" });

	static newLLM(model: string): BaseLlm {
		const llmClass = LLMRegistry.resolve(model);
		if (!llmClass) {
			// Provide helpful error message with available providers
			const availableProviders = LLMRegistry.getAvailableProviders();
			throw new Error(
				`No LLM class found for model: ${model}\n` +
				`Available providers: ${availableProviders.join(', ')}\n` +
				`Set the appropriate API key environment variable (OPENAI_API_KEY, ANTHROPIC_API_KEY, or GOOGLE_API_KEY) to enable fallback detection.`
			);
		}
		return new llmClass(model);
	}

	static resolve(model: string): LLMClass | null {
		for (const [regex, llmClass] of LLMRegistry.llmRegistry.entries()) {
			if (regex.test(model)) {
				return llmClass;
			}
		}
		
		// Fallback: Try to detect provider from model name or environment
		const fallbackClass = LLMRegistry.detectProviderFallback(model);
		if (fallbackClass) {
			return fallbackClass;
		}
		
		return null;
	}
	
	/**
	 * Detect provider based on model name patterns or environment configuration
	 */
	private static detectProviderFallback(model: string): LLMClass | null {
		// First check if a default provider is set
		if (LLMRegistry.defaultProvider) {
			LLMRegistry.logger.debug(`Using default provider for model: ${model}`);
			return LLMRegistry.defaultProvider;
		}
		
		// Check environment variable for default provider
		const defaultProviderName = process.env.ADK_DEFAULT_LLM_PROVIDER?.toLowerCase();
		if (defaultProviderName) {
			for (const [, llmClass] of LLMRegistry.llmRegistry.entries()) {
				const patterns = llmClass.supportedModels();
				if (
					(defaultProviderName === 'openai' && patterns.some(p => p.includes('gpt'))) ||
					(defaultProviderName === 'anthropic' && patterns.some(p => p.includes('claude'))) ||
					(defaultProviderName === 'google' && patterns.some(p => p.includes('gemini')))
				) {
					LLMRegistry.logger.debug(`Using ${defaultProviderName} provider (from ADK_DEFAULT_LLM_PROVIDER) for model: ${model}`);
					return llmClass;
				}
			}
		}
		
		// Check if OPENAI_API_KEY is set - assume OpenAI for any unrecognized model
		if (process.env.OPENAI_API_KEY) {
			LLMRegistry.logger.debug(`Fallback: Using OpenAI provider for model: ${model}`);
			// Find OpenAI class in registry
			for (const [, llmClass] of LLMRegistry.llmRegistry.entries()) {
				const patterns = llmClass.supportedModels();
				// Check if this is OpenAI class by looking at its patterns
				if (patterns.some(p => p.includes('gpt') || p.includes('o1') || p.includes('o3'))) {
					return llmClass;
				}
			}
		}
		
		// Check if ANTHROPIC_API_KEY is set
		if (process.env.ANTHROPIC_API_KEY) {
			LLMRegistry.logger.debug(`Fallback: Using Anthropic provider for model: ${model}`);
			for (const [, llmClass] of LLMRegistry.llmRegistry.entries()) {
				const patterns = llmClass.supportedModels();
				if (patterns.some(p => p.includes('claude'))) {
					return llmClass;
				}
			}
		}
		
		// Check for Google/Gemini (GOOGLE_API_KEY or GOOGLE_GENAI_USE_VERTEXAI)
		if (process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENAI_USE_VERTEXAI === 'true') {
			LLMRegistry.logger.debug(`Fallback: Using Google provider for model: ${model}`);
			for (const [, llmClass] of LLMRegistry.llmRegistry.entries()) {
				const patterns = llmClass.supportedModels();
				if (patterns.some(p => p.includes('gemini'))) {
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
	static setDefaultProvider(providerName: 'openai' | 'anthropic' | 'google'): void {
		for (const [, llmClass] of LLMRegistry.llmRegistry.entries()) {
			const patterns = llmClass.supportedModels();
			if (
				(providerName === 'openai' && patterns.some(p => p.includes('gpt'))) ||
				(providerName === 'anthropic' && patterns.some(p => p.includes('claude'))) ||
				(providerName === 'google' && patterns.some(p => p.includes('gemini')))
			) {
				LLMRegistry.defaultProvider = llmClass;
				LLMRegistry.logger.debug(`Default provider set to: ${providerName}`);
				return;
			}
		}
		throw new Error(`Provider ${providerName} not found in registry`);
	}
	
	/**
	 * Clear the default provider
	 */
	static clearDefaultProvider(): void {
		LLMRegistry.defaultProvider = undefined;
	}

	static register(modelNameRegex: string, llmClass: LLMClass): void {
		LLMRegistry.llmRegistry.set(new RegExp(modelNameRegex), llmClass);
	}

	static registerLLM(llmClass: LLMClass): void {
		const modelPatterns = llmClass.supportedModels();
		for (const pattern of modelPatterns) {
			LLMRegistry.register(pattern, llmClass);
		}
	}

	static registerModel(name: string, model: LlmModel): void {
		LLMRegistry.modelInstances.set(name, model);
	}

	static getModel(name: string): LlmModel {
		const model = LLMRegistry.modelInstances.get(name);
		if (!model) {
			throw new Error(`Model '${name}' not found in registry`);
		}
		return model;
	}

	static hasModel(name: string): boolean {
		return LLMRegistry.modelInstances.has(name);
	}

	static unregisterModel(name: string): void {
		LLMRegistry.modelInstances.delete(name);
	}

	static getModelOrCreate(name: string): LlmModel | BaseLlm {
		if (LLMRegistry.hasModel(name)) {
			return LLMRegistry.getModel(name);
		}

		return LLMRegistry.newLLM(name);
	}

	static clear(): void {
		LLMRegistry.llmRegistry.clear();
		LLMRegistry.modelInstances.clear();
	}

	static clearModels(): void {
		LLMRegistry.modelInstances.clear();
	}

	static clearClasses(): void {
		LLMRegistry.llmRegistry.clear();
	}

	static logRegisteredModels(): void {
		const classPatterns = [...LLMRegistry.llmRegistry.entries()].map(
			([regex]) => regex.toString(),
		);
		const instanceNames = [...LLMRegistry.modelInstances.keys()];

		LLMRegistry.logger.debug("Registered LLM class patterns:", classPatterns);
		LLMRegistry.logger.debug("Registered LLM instances:", instanceNames);
	}
	
	/**
	 * Get list of available provider names based on registered LLM classes
	 */
	private static getAvailableProviders(): string[] {
		const providers: string[] = [];
		for (const [, llmClass] of LLMRegistry.llmRegistry.entries()) {
			const patterns = llmClass.supportedModels();
			// Detect provider from patterns
			if (patterns.some(p => p.includes('gpt') || p.includes('o1') || p.includes('o3'))) {
				if (!providers.includes('OpenAI')) providers.push('OpenAI');
			}
			if (patterns.some(p => p.includes('claude'))) {
				if (!providers.includes('Anthropic')) providers.push('Anthropic');
			}
			if (patterns.some(p => p.includes('gemini'))) {
				if (!providers.includes('Google')) providers.push('Google');
			}
		}
		return providers;
	}
}
