import { Part, Content, Blob, SpeechConfig, AudioTranscriptionConfig, RealtimeInputConfig, ProactivityConfig, FunctionDeclaration, GroundingMetadata, GenerateContentResponseUsageMetadata, GenerateContentConfig, Schema, LiveConnectConfig, GoogleGenAI, FunctionCall } from '@google/genai';
export { Blob, Content, FunctionDeclaration, Schema as JSONSchema } from '@google/genai';
import { LanguageModel } from 'ai';
import * as z from 'zod';
import { z as z$1, ZodSchema, ZodType } from 'zod';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { CreateMessageRequest, CreateMessageResult, Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { Kysely, Generated } from 'kysely';
import { StorageOptions } from '@google-cloud/storage';
import { Tracer } from '@opentelemetry/api';

interface LoggerOpts {
    name: string;
}
declare class Logger {
    name: string;
    isDebugEnabled: boolean;
    constructor({ name }: LoggerOpts);
    debug(message: string, ...args: any[]): void;
    info(message: string, ...args: any[]): void;
    warn(message: string, ...args: any[]): void;
    error(message: string, ...args: any[]): void;
    private log;
    private extractMeta;
    private formatArgs;
    private parseStackFrames;
    private stringify;
    private capitalize;
    formatBox(params: {
        title: string;
        description: string;
        lines?: string[];
        width?: number;
        maxWidthPct?: number;
        color?: (txt: string) => string;
        pad?: number;
        borderChar?: string;
        wrap?: boolean;
    }): string;
    /**
     * Structured warning with code, suggestion, context.
     */
    warnStructured(warning: {
        code: string;
        message: string;
        suggestion?: string;
        context?: Record<string, any>;
        severity?: "warn" | "info" | "error";
        timestamp?: string;
    }, opts?: {
        format?: "pretty" | "json" | "text";
        verbose?: boolean;
    }): void;
    debugStructured(title: string, data: Record<string, any>): void;
    debugArray(title: string, items: Array<Record<string, any>>): void;
    private objectToLines;
    private arrayToLines;
}

/**
 * Represents the actions attached to an event.
 */
declare class EventActions {
    /**
     * If true, it won't call model to summarize function response.
     * Only used for function_response event.
     */
    skipSummarization?: boolean;
    /**
     * Indicates that the event is updating the state with the given delta.
     */
    stateDelta: Record<string, any>;
    /**
     * Indicates that the event is updating an artifact. key is the filename,
     * value is the version.
     */
    artifactDelta: Record<string, number>;
    /**
     * If set, the event transfers to the specified agent.
     */
    transferToAgent?: string;
    /**
     * The agent is escalating to a higher level agent.
     */
    escalate?: boolean;
    /**
     * Requested authentication configurations.
     */
    requestedAuthConfigs?: Record<string, any>;
    /**
     * Constructor for EventActions
     */
    constructor(options?: {
        skipSummarization?: boolean;
        stateDelta?: Record<string, any>;
        artifactDelta?: Record<string, number>;
        transferToAgent?: string;
        escalate?: boolean;
        requestedAuthConfigs?: Record<string, any>;
    });
}

/**
 * A state dict that maintain the current value and the pending-commit delta.
 */
declare class State {
    static readonly APP_PREFIX = "app:";
    static readonly USER_PREFIX = "user:";
    static readonly TEMP_PREFIX = "temp:";
    private readonly _value;
    private readonly _delta;
    /**
     * Constructor for State
     *
     * @param value - The current value of the state dict.
     * @param delta - The delta change to the current value that hasn't been committed.
     */
    constructor(value: Record<string, any>, delta: Record<string, any>);
    /**
     * Returns the value of the state dict for the given key.
     */
    get(key: string, defaultValue?: any): any;
    /**
     * Sets the value of the state dict for the given key.
     */
    set(key: string, value: any): void;
    /**
     * Whether the state dict contains the given key.
     */
    has(key: string): boolean;
    /**
     * Whether the state has pending delta.
     */
    hasDelta(): boolean;
    /**
     * Updates the state dict with the given delta.
     */
    update(delta: Record<string, any>): void;
    /**
     * Returns the state dict.
     */
    toDict(): Record<string, any>;
    /**
     * Array-like access for getting values.
     * Returns the value of the state dict for the given key.
     */
    [key: string]: any;
    /**
     * Proxy handler for array-like access
     */
    private static createProxy;
    /**
     * Factory method to create a proxied State instance
     */
    static create(value: Record<string, any>, delta: Record<string, any>): State;
}

interface BaseArtifactService {
    saveArtifact(args: {
        appName: string;
        userId: string;
        sessionId: string;
        filename: string;
        artifact: Part;
    }): Promise<number>;
    loadArtifact(args: {
        appName: string;
        userId: string;
        sessionId: string;
        filename: string;
        version?: number;
    }): Promise<Part | null>;
    listArtifactKeys(args: {
        appName: string;
        userId: string;
        sessionId: string;
    }): Promise<string[]>;
    deleteArtifact(args: {
        appName: string;
        userId: string;
        sessionId: string;
        filename: string;
    }): Promise<void>;
    listVersions(args: {
        appName: string;
        userId: string;
        sessionId: string;
        filename: string;
    }): Promise<number[]>;
}

/**
 * Represent one memory entry
 */
interface MemoryEntry {
    /**
     * The main content of the memory
     */
    content: Content;
    /**
     * The author of the memory
     */
    author?: string;
    /**
     * The timestamp when the original content of this memory happened.
     *
     * This string will be forwarded to LLM. Preferred format is ISO 8601 format.
     */
    timestamp?: string;
}

/**
 * Represents the response from a memory search
 */
interface SearchMemoryResponse {
    /**
     * A list of memory entries that relate to the search query
     */
    memories: MemoryEntry[];
}
/**
 * Base interface for memory services
 *
 * The service provides functionalities to ingest sessions into memory so that
 * the memory can be used for user queries.
 */
interface BaseMemoryService {
    /**
     * Adds a session to the memory service
     *
     * A session may be added multiple times during its lifetime.
     *
     * @param session The session to add
     */
    addSessionToMemory(session: Session): Promise<void>;
    /**
     * Searches for sessions that match the query
     *
     * @param params Search parameters
     * @param params.appName The name of the application
     * @param params.userId The id of the user
     * @param params.query The query to search for
     * @returns A SearchMemoryResponse containing the matching memories
     */
    searchMemory(params: {
        appName: string;
        userId: string;
        query: string;
    }): Promise<SearchMemoryResponse>;
}

/**
 * Represents a series of interactions between a user and agents.
 */
interface Session {
    /**
     * The unique identifier of the session.
     */
    id: string;
    /**
     * The name of the app.
     */
    appName: string;
    /**
     * The id of the user.
     */
    userId: string;
    /**
     * The state of the session.
     */
    state: Record<string, any>;
    /**
     * The events of the session, e.g. user input, model response, function
     * call/response, etc.
     */
    events: Event[];
    /**
     * The last update time of the session.
     */
    lastUpdateTime: number;
}

/**
 * Configuration for getting a session.
 */
interface GetSessionConfig {
    /** Number of recent events to include. */
    numRecentEvents?: number;
    /** Only include events after this timestamp (seconds since epoch). */
    afterTimestamp?: number;
}
/**
 * Response for listing sessions.
 * The events and states are not set within each Session object.
 */
interface ListSessionsResponse {
    /** The list of sessions. */
    sessions: Session[];
}
/**
 * Base class for session services.
 * The service provides a set of methods for managing sessions and events.
 */
declare abstract class BaseSessionService {
    /**
     * Creates a new session.
     * @param appName The name of the app.
     * @param userId The id of the user.
     * @param state The initial state of the session.
     * @param sessionId The client-provided id of the session. If not provided, a generated ID will be used.
     * @returns The newly created session instance.
     */
    abstract createSession(appName: string, userId: string, state?: Record<string, any>, sessionId?: string): Promise<Session>;
    /**
     * Gets a session.
     * @param appName The name of the app.
     * @param userId The id of the user.
     * @param sessionId The id of the session.
     * @param config Optional config for getting the session.
     * @returns The session or undefined if not found.
     */
    abstract getSession(appName: string, userId: string, sessionId: string, config?: GetSessionConfig): Promise<Session | undefined>;
    /**
     * Lists all the sessions.
     * @param appName The name of the app.
     * @param userId The id of the user.
     * @returns The response containing the list of sessions.
     */
    abstract listSessions(appName: string, userId: string): Promise<ListSessionsResponse>;
    /**
     * Deletes a session.
     * @param appName The name of the app.
     * @param userId The id of the user.
     * @param sessionId The id of the session.
     */
    abstract deleteSession(appName: string, userId: string, sessionId: string): Promise<void>;
    /**
     * Appends an event to a session object.
     * @param session The session to append the event to.
     * @param event The event to append.
     * @returns The appended event.
     */
    appendEvent(session: Session, event: Event): Promise<Event>;
    /**
     * Updates the session state based on the event.
     * @param session The session to update.
     * @param event The event containing state changes.
     */
    protected updateSessionState(session: Session, event: Event): void;
}

/**
 * Request send to live agents.
 */
declare class LiveRequest {
    /**
     * If set, send the content to the model in turn-by-turn mode.
     */
    content?: Content;
    /**
     * If set, send the blob to the model in realtime mode.
     */
    blob?: Blob;
    /**
     * If set, close the queue.
     */
    close: boolean;
    constructor(options?: {
        content?: Content;
        blob?: Blob;
        close?: boolean;
    });
}
/**
 * Queue used to send LiveRequest in a live(bidirectional streaming) way.
 */
declare class LiveRequestQueue {
    private _queue;
    private _waiters;
    private _closed;
    /**
     * Close the queue.
     */
    close(): void;
    /**
     * Send content to the queue.
     */
    sendContent(content: Content): void;
    /**
     * Send realtime blob to the queue.
     */
    sendRealtime(blob: Blob): void;
    /**
     * Send a LiveRequest to the queue.
     */
    send(req: LiveRequest): void;
    /**
     * Get the next LiveRequest from the queue.
     */
    get(): Promise<LiveRequest>;
}

/**
 * Manages streaming tool related resources during invocation.
 */
declare class ActiveStreamingTool {
    /**
     * The active task of this streaming tool.
     */
    task?: Promise<any>;
    /**
     * The active (input) streams of this streaming tool.
     */
    stream?: LiveRequestQueue;
    constructor(options?: {
        task?: Promise<any>;
        stream?: LiveRequestQueue;
    });
}

/**
 * Streaming mode options for agent execution
 */
declare enum StreamingMode {
    NONE = "NONE",
    SSE = "sse",
    BIDI = "bidi"
}
/**
 * Configs for runtime behavior of agents
 */
declare class RunConfig {
    /**
     * Speech configuration for the live agent
     */
    speechConfig?: SpeechConfig;
    /**
     * The output modalities. If not set, it's default to AUDIO.
     */
    responseModalities?: string[];
    /**
     * Whether or not to save the input blobs as artifacts.
     */
    saveInputBlobsAsArtifacts: boolean;
    /**
     * Whether to support CFC (Compositional Function Calling). Only applicable for
     * StreamingMode.SSE. If it's true. the LIVE API will be invoked. Since only LIVE
     * API supports CFC
     *
     * @warning This feature is **experimental** and its API or behavior may change
     * in future releases.
     */
    supportCFC: boolean;
    /**
     * Streaming mode, None or StreamingMode.SSE or StreamingMode.BIDI.
     */
    streamingMode: StreamingMode;
    /**
     * Output transcription for live agents with audio response.
     */
    outputAudioTranscription?: AudioTranscriptionConfig;
    /**
     * Input transcription for live agents with audio input from user.
     */
    inputAudioTranscription?: AudioTranscriptionConfig;
    /**
     * Realtime input config for live agents with audio input from user.
     */
    realtimeInputConfig?: RealtimeInputConfig;
    /**
     * If enabled, the model will detect emotions and adapt its responses accordingly.
     */
    enableAffectiveDialog?: boolean;
    /**
     * Configures the proactivity of the model. This allows the model to respond
     * proactively to the input and to ignore irrelevant input.
     */
    proactivity?: ProactivityConfig;
    /**
     * A limit on the total number of llm calls for a given run.
     *
     * Valid Values:
     *   - More than 0 and less than Number.MAX_SAFE_INTEGER: The bound on the number of llm
     *     calls is enforced, if the value is set in this range.
     *   - Less than or equal to 0: This allows for unbounded number of llm calls.
     */
    maxLlmCalls: number;
    constructor(config?: Partial<RunConfig>);
    /**
     * Validates the maxLlmCalls value
     */
    private validateMaxLlmCalls;
}

/**
 * Store the data that can be used for transcription.
 */
declare class TranscriptionEntry {
    /**
     * The role that created this data, typically "user" or "model". For function
     * call, this is None.
     */
    role?: string;
    /**
     * The data that can be used for transcription
     */
    data: Blob | Content;
    constructor(options: {
        role?: string;
        data: Blob | Content;
    });
}

/**
 * Error thrown when the number of LLM calls exceed the limit.
 */
declare class LlmCallsLimitExceededError extends Error {
    constructor(message: string);
}
/**
 * Generates a new invocation context ID
 */
declare function newInvocationContextId(): string;
/**
 * An invocation context represents the data of a single invocation of an agent.
 *
 * An invocation:
 *   1. Starts with a user message and ends with a final response.
 *   2. Can contain one or multiple agent calls.
 *   3. Is handled by runner.run_async().
 *
 * An invocation runs an agent until it does not request to transfer to another
 * agent.
 *
 * An agent call:
 *   1. Is handled by agent.run().
 *   2. Ends when agent.run() ends.
 *
 * An LLM agent call is an agent with a BaseLLMFlow.
 * An LLM agent call can contain one or multiple steps.
 *
 * An LLM agent runs steps in a loop until:
 *   1. A final response is generated.
 *   2. The agent transfers to another agent.
 *   3. The end_invocation is set to true by any callbacks or tools.
 *
 * A step:
 *   1. Calls the LLM only once and yields its response.
 *   2. Calls the tools and yields their responses if requested.
 *
 * The summarization of the function response is considered another step, since
 * it is another llm call.
 *
 * A step ends when it's done calling llm and tools, or if the end_invocation
 * is set to true at any time.
 *
 *
 *     ┌─────────────────────── invocation ──────────────────────────┐
 *     ┌──────────── llm_agent_call_1 ────────────┐ ┌─ agent_call_2 ─┐
 *     ┌──── step_1 ────────┐ ┌───── step_2 ──────┐
 *     [call_llm] [call_tool] [call_llm] [transfer]
 *
 */
declare class InvocationContext {
    readonly artifactService?: BaseArtifactService;
    readonly sessionService: BaseSessionService;
    readonly memoryService?: BaseMemoryService;
    /**
     * The id of this invocation context. Readonly.
     */
    readonly invocationId: string;
    /**
     * The branch of the invocation context.
     *
     * The format is like agent_1.agent_2.agent_3, where agent_1 is the parent of
     * agent_2, and agent_2 is the parent of agent_3.
     *
     * Branch is used when multiple sub-agents shouldn't see their peer agents'
     * conversation history.
     */
    readonly branch?: string;
    /**
     * The current agent of this invocation context. Readonly.
     */
    agent: BaseAgent;
    /**
     * The user content that started this invocation. Readonly.
     */
    readonly userContent?: Content;
    /**
     * The current session of this invocation context. Readonly.
     */
    readonly session: Session;
    /**
     * Whether to end this invocation.
     *
     * Set to True in callbacks or tools to terminate this invocation.
     */
    endInvocation: boolean;
    /**
     * The queue to receive live requests.
     */
    liveRequestQueue?: LiveRequestQueue;
    /**
     * The running streaming tools of this invocation.
     */
    activeStreamingTools?: Record<string, ActiveStreamingTool>;
    /**
     * Caches necessary, data audio or contents, that are needed by transcription.
     */
    transcriptionCache?: TranscriptionEntry[];
    /**
     * Configurations for live agents under this invocation.
     */
    runConfig?: RunConfig;
    /**
     * A container to keep track of different kinds of costs incurred as a part
     * of this invocation.
     */
    private readonly _invocationCostManager;
    /**
     * Constructor for InvocationContext
     */
    constructor(options: {
        artifactService?: BaseArtifactService;
        sessionService: BaseSessionService;
        memoryService?: BaseMemoryService;
        invocationId?: string;
        branch?: string;
        agent: BaseAgent;
        userContent?: Content;
        session: Session;
        endInvocation?: boolean;
        liveRequestQueue?: LiveRequestQueue;
        activeStreamingTools?: Record<string, ActiveStreamingTool>;
        transcriptionCache?: TranscriptionEntry[];
        runConfig?: RunConfig;
    });
    /**
     * App name from the session
     */
    get appName(): string;
    /**
     * User ID from the session
     */
    get userId(): string;
    /**
     * Tracks number of llm calls made.
     *
     * @throws {LlmCallsLimitExceededError} If number of llm calls made exceed the set threshold.
     */
    incrementLlmCallCount(): void;
    /**
     * Creates a child invocation context for a sub-agent
     */
    createChildContext(agent: BaseAgent): InvocationContext;
}

/**
 * Base readonly context class.
 */
declare class ReadonlyContext {
    protected readonly _invocationContext: InvocationContext;
    constructor(invocationContext: InvocationContext);
    /**
     * The user content that started this invocation. READONLY field.
     */
    get userContent(): Content | undefined;
    /**
     * The current invocation id.
     */
    get invocationId(): string;
    /**
     * The name of the agent that is currently running.
     */
    get agentName(): string;
    /**
     * The state of the current session. READONLY field.
     */
    get state(): Readonly<Record<string, any>>;
}

/**
 * The context of various callbacks within an agent run.
 */
declare class CallbackContext extends ReadonlyContext {
    /**
     * TODO: make this public for Agent Development Kit, but private for users.
     */
    readonly _eventActions: EventActions;
    private readonly _state;
    constructor(invocationContext: InvocationContext, options?: {
        eventActions?: EventActions;
    });
    /**
     * The delta-aware state of the current session.
     * For any state change, you can mutate this object directly,
     * e.g. `ctx.state['foo'] = 'bar'`
     */
    get state(): State;
    /**
     * Loads an artifact attached to the current session.
     *
     * @param filename - The filename of the artifact.
     * @param version - The version of the artifact. If undefined, the latest version will be returned.
     * @returns The artifact.
     */
    loadArtifact(filename: string, version?: number): Promise<Part | undefined>;
    /**
     * Saves an artifact and records it as delta for the current session.
     *
     * @param filename - The filename of the artifact.
     * @param artifact - The artifact to save.
     * @returns The version of the artifact.
     */
    saveArtifact(filename: string, artifact: Part): Promise<number>;
    /**
     * Gets the event actions associated with this context.
     */
    get eventActions(): EventActions;
}

/**
 * The context of the tool.
 *
 * This class provides the context for a tool invocation, including access to
 * the invocation context, function call ID, event actions, and authentication
 * response. It also provides methods for requesting credentials, retrieving
 * authentication responses, listing artifacts, and searching memory.
 */
declare class ToolContext extends CallbackContext {
    /**
     * The function call id of the current tool call. This id was
     * returned in the function call event from LLM to identify a function call.
     * If LLM didn't return this id, ADK will assign one to it. This id is used
     * to map function call response to the original function call.
     */
    functionCallId?: string;
    /**
     * Constructor for ToolContext
     */
    constructor(invocationContext: InvocationContext, options?: {
        functionCallId?: string;
        eventActions?: EventActions;
    });
    /**
     * Gets the event actions of the current tool call
     */
    get actions(): EventActions;
    /**
     * Lists the filenames of the artifacts attached to the current session
     */
    listArtifacts(): Promise<string[]>;
    /**
     * Searches the memory of the current user
     */
    searchMemory(query: string): Promise<SearchMemoryResponse>;
}

/**
 * Configuration for tool initialization
 */
interface ToolConfig {
    /**
     * Name of the tool
     */
    name: string;
    /**
     * Description of the tool
     */
    description: string;
    /**
     * Whether the tool is a long running operation, which typically returns a
     * resource id first and finishes the operation later.
     */
    isLongRunning?: boolean;
    /**
     * Whether the tool execution should be retried on failure
     */
    shouldRetryOnFailure?: boolean;
    /**
     * Maximum retry attempts
     */
    maxRetryAttempts?: number;
}
/**
 * API variant types
 */
type ApiVariant = "google" | "openai" | "anthropic";
/**
 * The base class for all tools
 */
declare abstract class BaseTool {
    /**
     * Name of the tool
     */
    name: string;
    /**
     * Description of the tool
     */
    description: string;
    /**
     * Whether the tool is a long running operation, which typically returns a
     * resource id first and finishes the operation later.
     */
    isLongRunning: boolean;
    /**
     * Whether the tool execution should be retried on failure
     */
    shouldRetryOnFailure: boolean;
    /**
     * Maximum retry attempts
     */
    maxRetryAttempts: number;
    /**
     * Base delay for retry in ms (will be used with exponential backoff)
     */
    baseRetryDelay: number;
    /**
     * Maximum delay for retry in ms
     */
    maxRetryDelay: number;
    protected logger: Logger;
    /**
     * Constructor for BaseTool
     */
    constructor(config: ToolConfig);
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
    getDeclaration(): FunctionDeclaration | null;
    /**
     * Validates the arguments against the schema in the function declaration
     * @param args Arguments to validate
     * @returns True if arguments are valid
     */
    validateArguments(args: Record<string, any>): boolean;
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
    runAsync(args: Record<string, any>, context: ToolContext): Promise<any>;
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
    processLlmRequest(_toolContext: ToolContext, llmRequest: LlmRequest): Promise<void>;
    /**
     * Gets the API variant for this tool
     */
    protected get apiVariant(): ApiVariant;
    /**
     * Executes the tool with error handling and retries
     *
     * @param args Arguments for the tool
     * @param context Tool execution context
     * @returns Result of the tool execution or error information
     */
    safeExecute(args: Record<string, any>, context: ToolContext): Promise<any>;
    /**
     * Helper method to find a tool with function declarations in the LLM request
     */
    private findToolWithFunctionDeclarations;
}

/**
 * Configuration for creating a tool
 */
interface CreateToolConfig<T extends Record<string, any> = Record<string, never>> {
    /** The name of the tool */
    name: string;
    /** A description of what the tool does */
    description: string;
    /** Zod schema for validating tool arguments (optional) */
    schema?: z.ZodSchema<T>;
    /** The function to execute (can be sync or async) */
    fn: (args: T, context: ToolContext) => any;
    /** Whether the tool is a long running operation */
    isLongRunning?: boolean;
    /** Whether the tool execution should be retried on failure */
    shouldRetryOnFailure?: boolean;
    /** Maximum retry attempts */
    maxRetryAttempts?: number;
}
/**
 * Configuration for creating a tool with schema
 */
interface CreateToolConfigWithSchema<T extends Record<string, any>> {
    /** The name of the tool */
    name: string;
    /** A description of what the tool does */
    description: string;
    /** Zod schema for validating tool arguments */
    schema: z.ZodSchema<T>;
    /** The function to execute (can be sync or async) */
    fn: (args: T, context: ToolContext) => any;
    /** Whether the tool is a long running operation */
    isLongRunning?: boolean;
    /** Whether the tool execution should be retried on failure */
    shouldRetryOnFailure?: boolean;
    /** Maximum retry attempts */
    maxRetryAttempts?: number;
}
/**
 * Configuration for creating a tool without schema (no parameters)
 */
interface CreateToolConfigWithoutSchema {
    /** The name of the tool */
    name: string;
    /** A description of what the tool does */
    description: string;
    /** The function to execute (can be sync or async) */
    fn: (args: Record<string, never>, context: ToolContext) => any;
    /** Whether the tool is a long running operation */
    isLongRunning?: boolean;
    /** Whether the tool execution should be retried on failure */
    shouldRetryOnFailure?: boolean;
    /** Maximum retry attempts */
    maxRetryAttempts?: number;
}
/**
 * Creates a tool from a configuration object.
 *
 * This is a more user-friendly alternative to FunctionTool that provides:
 * - Automatic argument validation using Zod schemas
 * - Clear error messages for invalid inputs
 * - Automatic JSON Schema generation for LLM function declarations
 * - Support for both sync and async functions
 * - Optional ToolContext parameter support
 *
 * @param config The tool configuration object
 * @returns A BaseTool instance ready for use with agents
 *
 * @example
 * ```typescript
 * import { createTool } from '@iqai/adk';
 * import { z } from 'zod';
 *
 * // Tool with parameters
 * const calculatorTool = createTool({
 *   name: 'calculator',
 *   description: 'Performs basic arithmetic operations',
 *   schema: z.object({
 *     operation: z.enum(['add', 'subtract', 'multiply', 'divide']),
 *     a: z.number().describe('First number'),
 *     b: z.number().describe('Second number')
 *   }),
 *   fn: ({ operation, a, b }) => {
 *     switch (operation) {
 *       case 'add': return { result: a + b };
 *       case 'subtract': return { result: a - b };
 *       case 'multiply': return { result: a * b };
 *       case 'divide': return { result: b !== 0 ? a / b : 'Cannot divide by zero' };
 *       default: return { error: 'Unknown operation' };
 *     }
 *   }
 * });
 *
 * // Tool without parameters (schema is optional)
 * const timestampTool = createTool({
 *   name: 'timestamp',
 *   description: 'Gets the current timestamp',
 *   fn: () => ({ timestamp: Date.now() })
 * });
 * ```
 */
declare function createTool<T extends Record<string, any>>(config: CreateToolConfigWithSchema<T>): BaseTool;
declare function createTool(config: CreateToolConfigWithoutSchema): BaseTool;

interface File {
    /** The name of the file with file extension (e.g., "file.csv") */
    name: string;
    /** The base64-encoded bytes of the file content */
    content: string;
    /** The mime type of the file (e.g., "image/png") */
    mimeType: string;
}
interface CodeExecutionInput {
    /** The code to execute */
    code: string;
    /** The input files available to the code */
    inputFiles: File[];
    /** The execution ID for the stateful code execution */
    executionId?: string;
}
interface CodeExecutionResult {
    /** The standard output of the code execution */
    stdout: string;
    /** The standard error of the code execution */
    stderr: string;
    /** The output files from the code execution */
    outputFiles: File[];
}
declare class CodeExecutionUtils {
    /**
     * Gets the file content as a base64-encoded string
     */
    static getEncodedFileContent(data: string | ArrayBuffer): string;
    private static isBase64Encoded;
    /**
     * Extracts the first code block from the content and truncates everything after it
     */
    static extractCodeAndTruncateContent(content: Content, codeBlockDelimiters: Array<[string, string]>): string | null;
    private static escapeRegex;
    /**
     * Builds an executable code part with code string
     */
    static buildExecutableCodePart(code: string): Part;
    /**
     * Builds the code execution result part from the code execution result
     */
    static buildCodeExecutionResultPart(codeExecutionResult: CodeExecutionResult): Part;
    /**
     * Converts the code execution parts to text parts in a Content
     */
    static convertCodeExecutionParts(content: Content, codeBlockDelimiter: [string, string], executionResultDelimiters: [string, string]): void;
}

interface BaseCodeExecutorConfig {
    /**
     * If true, extract and process data files from the model request
     * and attach them to the code executor.
     * Supported data file MimeTypes are [text/csv].
     * Default to false.
     */
    optimizeDataFile?: boolean;
    /**
     * Whether the code executor is stateful. Default to false.
     */
    stateful?: boolean;
    /**
     * The number of attempts to retry on consecutive code execution errors.
     * Default to 2.
     */
    errorRetryAttempts?: number;
    /**
     * The list of the enclosing delimiters to identify the code blocks.
     * For example, the delimiter ['```python\n', '\n```'] can be
     * used to identify code blocks with the following format:
     *
     * ```python
     * print("hello")
     * ```
     */
    codeBlockDelimiters?: Array<[string, string]>;
    /**
     * The delimiters to format the code execution result.
     */
    executionResultDelimiters?: [string, string];
}
declare abstract class BaseCodeExecutor {
    protected readonly config: Required<BaseCodeExecutorConfig>;
    constructor(config?: BaseCodeExecutorConfig);
    /**
     * Executes code and returns the code execution result.
     */
    abstract executeCode(invocationContext: InvocationContext, codeExecutionInput: CodeExecutionInput): Promise<CodeExecutionResult>;
    get optimizeDataFile(): boolean;
    get stateful(): boolean;
    get errorRetryAttempts(): number;
    get codeBlockDelimiters(): Array<[string, string]>;
    get executionResultDelimiters(): [string, string];
}

interface Candidate {
    content?: Content;
    groundingMetadata?: GroundingMetadata;
    finishReason?: string;
    finishMessage?: string;
}
interface PromptFeedback {
    blockReason?: string;
    blockReasonMessage?: string;
}
interface GenerateContentResponse {
    candidates?: Candidate[];
    usageMetadata?: GenerateContentResponseUsageMetadata;
    promptFeedback?: PromptFeedback;
}
declare class LlmResponse {
    id?: string;
    text?: string;
    content?: Content;
    groundingMetadata?: GroundingMetadata;
    partial?: boolean;
    turnComplete?: boolean;
    errorCode?: string;
    errorMessage?: string;
    interrupted?: boolean;
    customMetadata?: Record<string, any>;
    usageMetadata?: GenerateContentResponseUsageMetadata;
    candidateIndex?: number;
    finishReason?: string;
    error?: Error;
    constructor(data?: Partial<LlmResponse>);
    static create(generateContentResponse: GenerateContentResponse): LlmResponse;
    static fromError(error: unknown, options?: {
        errorCode?: string;
        model?: string;
    }): LlmResponse;
}

/**
 * The base class for a live model connection.
 */
declare abstract class BaseLLMConnection {
    /**
     * Sends the conversation history to the model.
     *
     * You call this method right after setting up the model connection.
     * The model will respond if the last content is from user, otherwise it will
     * wait for new user input before responding.
     *
     * @param history The conversation history to send to the model.
     */
    abstract sendHistory(history: Content[]): Promise<void>;
    /**
     * Sends a user content to the model.
     *
     * The model will respond immediately upon receiving the content.
     * If you send function responses, all parts in the content should be function
     * responses.
     *
     * @param content The content to send to the model.
     */
    abstract sendContent(content: Content): Promise<void>;
    /**
     * Sends a chunk of audio or a frame of video to the model in realtime.
     *
     * The model may not respond immediately upon receiving the blob. It will do
     * voice activity detection and decide when to respond.
     *
     * @param blob The blob to send to the model.
     */
    abstract sendRealtime(blob: Blob): Promise<void>;
    /**
     * Receives the model response using the llm server connection.
     *
     * @returns LlmResponse: The model response.
     */
    abstract receive(): AsyncGenerator<LlmResponse, void, unknown>;
    /**
     * Closes the llm server connection.
     */
    abstract close(): Promise<void>;
}

/**
 * The BaseLlm class.
 */
declare abstract class BaseLlm {
    /**
     * The name of the LLM, e.g. gemini-2.5-flash or gemini-2.5-flash-001.
     */
    model: string;
    protected logger: Logger;
    /**
     * Constructor for BaseLlm
     */
    constructor(model: string);
    /**
     * Returns a list of supported models in regex for LLMRegistry
     */
    static supportedModels(): string[];
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
    generateContentAsync(llmRequest: LlmRequest, stream?: boolean): AsyncGenerator<LlmResponse, void, unknown>;
    /**
     * Implementation method to be overridden by subclasses.
     * This replaces the abstract generateContentAsync method.
     */
    protected abstract generateContentAsyncImpl(llmRequest: LlmRequest, stream?: boolean): AsyncGenerator<LlmResponse, void, unknown>;
    /**
     * Appends a user content, so that model can continue to output.
     *
     * @param llmRequest LlmRequest, the request to send to the LLM.
     */
    protected maybeAppendUserContent(llmRequest: LlmRequest): void;
    /**
     * Creates a live connection to the LLM.
     *
     * @param llmRequest LlmRequest, the request to send to the LLM.
     * @returns BaseLLMConnection, the connection to the LLM.
     */
    connect(_llmRequest: LlmRequest): BaseLLMConnection;
}

/**
 * Abstract base class for all planners.
 *
 * The planner allows the agent to generate plans for the queries to guide its action.
 */
declare abstract class BasePlanner {
    /**
     * Builds the system instruction to be appended to the LLM request for planning.
     *
     * @param readonlyContext The readonly context of the invocation
     * @param llmRequest The LLM request. Readonly.
     * @returns The planning system instruction, or undefined if no instruction is needed
     */
    abstract buildPlanningInstruction(readonlyContext: ReadonlyContext, llmRequest: LlmRequest): string | undefined;
    /**
     * Processes the LLM response for planning.
     *
     * @param callbackContext The callback context of the invocation
     * @param responseParts The LLM response parts. Readonly.
     * @returns The processed response parts, or undefined if no processing is needed
     */
    abstract processPlanningResponse(callbackContext: CallbackContext, responseParts: Part[]): Part[] | undefined;
}

/**
 * Type for instruction providers that can be functions
 */
type InstructionProvider = (ctx: ReadonlyContext) => string | Promise<string>;
/**
 * Union type for tools (supporting functions, tools, and toolsets)
 */
type ToolUnion = BaseTool | ((...args: any[]) => any);
/**
 * Single before model callback type
 */
type SingleBeforeModelCallback = (callbackContext: CallbackContext, llmRequest: LlmRequest) => LlmResponse | null | Promise<LlmResponse | null>;
/**
 * Before model callback type (single or array)
 */
type BeforeModelCallback = SingleBeforeModelCallback | SingleBeforeModelCallback[];
/**
 * Single after model callback type
 */
type SingleAfterModelCallback = (callbackContext: CallbackContext, llmResponse: LlmResponse) => LlmResponse | null | Promise<LlmResponse | null>;
/**
 * After model callback type (single or array)
 */
type AfterModelCallback = SingleAfterModelCallback | SingleAfterModelCallback[];
/**
 * Single before tool callback type
 */
type SingleBeforeToolCallback = (tool: BaseTool, args: Record<string, any>, toolContext: ToolContext) => Record<string, any> | null | Promise<Record<string, any> | null>;
/**
 * Before tool callback type (single or array)
 */
type BeforeToolCallback = SingleBeforeToolCallback | SingleBeforeToolCallback[];
/**
 * Single after tool callback type
 */
type SingleAfterToolCallback = (tool: BaseTool, args: Record<string, any>, toolContext: ToolContext, toolResponse: Record<string, any>) => Record<string, any> | null | Promise<Record<string, any> | null>;
/**
 * After tool callback type (single or array)
 */
type AfterToolCallback = SingleAfterToolCallback | SingleAfterToolCallback[];
/**
 * Configuration for LlmAgent
 */
interface LlmAgentConfig<T extends BaseLlm = BaseLlm> {
    /**
     * Name of the agent
     */
    name: string;
    /**
     * Description of the agent
     */
    description: string;
    /**
     * Sub-agents that this agent can delegate to
     */
    subAgents?: BaseAgent[];
    /**
     * Callback or list of callbacks to be invoked before the agent run
     */
    beforeAgentCallback?: BeforeAgentCallback;
    /**
     * Callback or list of callbacks to be invoked after the agent run
     */
    afterAgentCallback?: AfterAgentCallback;
    /**
     * The LLM model to use
     * When not set, the agent will inherit the model from its ancestor
     */
    model?: string | T | LanguageModel;
    /**
     * Instructions for the LLM model, guiding the agent's behavior
     */
    instruction?: string | InstructionProvider;
    /**
     * Instructions for all the agents in the entire agent tree
     * ONLY the global_instruction in root agent will take effect
     */
    globalInstruction?: string | InstructionProvider;
    /**
     * Tools available to this agent
     */
    tools?: ToolUnion[];
    /**
     * Code executor for this agent
     */
    codeExecutor?: BaseCodeExecutor;
    /**
     * Disallows LLM-controlled transferring to the parent agent
     */
    disallowTransferToParent?: boolean;
    /**
     * Disallows LLM-controlled transferring to the peer agents
     */
    disallowTransferToPeers?: boolean;
    /**
     * Whether to include contents in the model request
     */
    includeContents?: "default" | "none";
    /**
     * The output key in session state to store the output of the agent
     */
    outputKey?: string;
    /**
     * Instructs the agent to make a plan and execute it step by step
     */
    planner?: BasePlanner;
    /**
     * Memory service for long-term storage and retrieval
     */
    memoryService?: BaseMemoryService;
    /**
     * Session service for managing conversations
     */
    sessionService?: BaseSessionService;
    /**
     * Artifact service for file storage and management
     */
    artifactService?: BaseArtifactService;
    /**
     * User ID for the session
     */
    userId?: string;
    /**
     * Application name
     */
    appName?: string;
    /**
     * Additional content generation configurations
     * NOTE: not all fields are usable, e.g. tools must be configured via `tools`,
     * thinking_config must be configured via `planner` in LlmAgent.
     */
    generateContentConfig?: GenerateContentConfig;
    /**
     * The input schema when agent is used as a tool
     */
    inputSchema?: z$1.ZodSchema;
    /**
     * The output schema when agent replies
     * NOTE: when this is set, agent can ONLY reply and CANNOT use any tools
     */
    outputSchema?: z$1.ZodSchema;
    /**
     * Callback or list of callbacks to be called before calling the LLM
     */
    beforeModelCallback?: BeforeModelCallback;
    /**
     * Callback or list of callbacks to be called after calling the LLM
     */
    afterModelCallback?: AfterModelCallback;
    /**
     * Callback or list of callbacks to be called before calling a tool
     */
    beforeToolCallback?: BeforeToolCallback;
    /**
     * Callback or list of callbacks to be called after calling a tool
     */
    afterToolCallback?: AfterToolCallback;
}
/**
 * LLM-based Agent
 */
declare class LlmAgent<T extends BaseLlm = BaseLlm> extends BaseAgent {
    /**
     * The model to use for the agent
     * When not set, the agent will inherit the model from its ancestor
     */
    model: string | T | LanguageModel;
    /**
     * Instructions for the LLM model, guiding the agent's behavior
     */
    instruction: string | InstructionProvider;
    /**
     * Instructions for all the agents in the entire agent tree
     * ONLY the global_instruction in root agent will take effect
     */
    globalInstruction: string | InstructionProvider;
    /**
     * Tools available to this agent
     */
    tools: ToolUnion[];
    /**
     * Code executor for this agent
     */
    codeExecutor?: BaseCodeExecutor;
    /**
     * Disallows LLM-controlled transferring to the parent agent
     */
    disallowTransferToParent: boolean;
    /**
     * Disallows LLM-controlled transferring to the peer agents
     */
    disallowTransferToPeers: boolean;
    /**
     * Whether to include contents in the model request
     */
    includeContents: "default" | "none";
    /**
     * The output key in session state to store the output of the agent
     */
    outputKey?: string;
    /**
     * Instructs the agent to make a plan and execute it step by step
     */
    planner?: BasePlanner;
    /**
     * Memory service for long-term storage and retrieval
     */
    private memoryService?;
    /**
     * Session service for managing conversations
     */
    private sessionService?;
    /**
     * Artifact service for file storage and management
     */
    private artifactService?;
    /**
     * User ID for the session
     */
    private userId?;
    /**
     * Application name
     */
    private appName?;
    /**
     * Additional content generation configurations
     */
    generateContentConfig?: GenerateContentConfig;
    /**
     * The input schema when agent is used as a tool
     */
    inputSchema?: z$1.ZodSchema;
    /**
     * The output schema when agent replies
     */
    outputSchema?: z$1.ZodSchema;
    /**
     * Callback or list of callbacks to be called before calling the LLM
     */
    beforeModelCallback?: BeforeModelCallback;
    /**
     * Callback or list of callbacks to be called after calling the LLM
     */
    afterModelCallback?: AfterModelCallback;
    /**
     * Callback or list of callbacks to be called before calling a tool
     */
    beforeToolCallback?: BeforeToolCallback;
    /**
     * Callback or list of callbacks to be called after calling a tool
     */
    afterToolCallback?: AfterToolCallback;
    protected logger: Logger;
    /**
     * Constructor for LlmAgent
     */
    constructor(config: LlmAgentConfig<T>);
    /**
     * The resolved model field as BaseLLM
     * This method is only for use by Agent Development Kit
     */
    get canonicalModel(): BaseLlm;
    /**
     * The resolved instruction field to construct instruction for this agent
     * This method is only for use by Agent Development Kit
     */
    canonicalInstruction(ctx: ReadonlyContext): Promise<[string, boolean]>;
    /**
     * The resolved global_instruction field to construct global instruction
     * This method is only for use by Agent Development Kit
     */
    canonicalGlobalInstruction(ctx: ReadonlyContext): Promise<[string, boolean]>;
    /**
     * The resolved tools field as a list of BaseTool based on the context
     * This method is only for use by Agent Development Kit
     */
    canonicalTools(ctx?: ReadonlyContext): Promise<BaseTool[]>;
    /**
     * Gets the canonical before model callbacks as an array
     */
    get canonicalBeforeModelCallbacks(): SingleBeforeModelCallback[];
    /**
     * Gets the canonical after model callbacks as an array
     */
    get canonicalAfterModelCallbacks(): SingleAfterModelCallback[];
    /**
     * Gets the canonical before tool callbacks as an array
     */
    get canonicalBeforeToolCallbacks(): SingleBeforeToolCallback[];
    /**
     * Gets the canonical after tool callbacks as an array
     */
    get canonicalAfterToolCallbacks(): SingleAfterToolCallback[];
    /**
     * Validates output schema configuration
     * This matches the Python implementation's __check_output_schema
     */
    private validateOutputSchemaConfig;
    /**
     * Gets the appropriate LLM flow for this agent
     * This matches the Python implementation's _llm_flow property
     */
    private get llmFlow();
    /**
     * Saves the model output to state if needed
     * This matches the Python implementation's __maybe_save_output_to_state
     */
    private maybeSaveOutputToState;
    /**
     * Core logic to run this agent via text-based conversation
     * This matches the Python implementation's _run_async_impl
     */
    protected runAsyncImpl(context: InvocationContext): AsyncGenerator<Event, void, unknown>;
}

/**
 * Type for agents that can be used as tools
 */
type BaseAgentType = LlmAgent;
/**
 * Configuration for AgentTool
 */
interface AgentToolConfig {
    /**
     * Name of the tool
     */
    name: string;
    /**
     * Description of the tool
     */
    description?: string;
    /**
     * The agent that will be used as a tool
     */
    agent: BaseAgentType;
    /**
     * Optional function declaration schema override
     */
    functionDeclaration?: FunctionDeclaration;
    /**
     * Optional key to store the tool output in the state
     */
    outputKey?: string;
    /**
     * Optional flag to skip summarization of the agent's response
     */
    skipSummarization?: boolean;
    /**
     * Whether the tool is a long running operation
     */
    isLongRunning?: boolean;
    /**
     * Whether the tool execution should be retried on failure
     */
    shouldRetryOnFailure?: boolean;
    /**
     * Maximum retry attempts
     */
    maxRetryAttempts?: number;
}
/**
 * A tool that uses an agent to perform a task.
 *
 * This tool allows specialized agents to be used as reusable tools
 * within other agents, enabling modular agent composition and
 * domain-specific expertise as services.
 */
declare class AgentTool extends BaseTool {
    /**
     * The agent used by this tool
     */
    private agent;
    /**
     * The function declaration schema
     */
    private functionDeclaration?;
    /**
     * The key to store the tool output in the state
     */
    outputKey?: string;
    /**
     * Whether to skip summarization of the agent's response
     */
    private skipSummarization;
    protected logger: Logger;
    /**
     * Create a new agent tool
     */
    constructor(config: AgentToolConfig);
    /**
     * Get the function declaration for the tool
     */
    getDeclaration(): FunctionDeclaration;
    /**
     * Execute the tool by running the agent with the provided input
     */
    runAsync(params: Record<string, any>, context: ToolContext): Promise<any>;
}

/**
 * A tool that wraps a user-defined TypeScript function.
 *
 * This tool automatically generates a function declaration from the function's
 * signature and documentation, making it easy to expose functions to agents.
 */
declare class FunctionTool<T extends Record<string, any>> extends BaseTool {
    private func;
    private mandatoryArgs;
    private parameterTypes;
    /**
     * Creates a new FunctionTool wrapping the provided function.
     *
     * @param func The function to wrap
     * @param options Optional configuration for the tool
     */
    constructor(func: (...args: any[]) => any, options?: {
        name?: string;
        description?: string;
        isLongRunning?: boolean;
        shouldRetryOnFailure?: boolean;
        maxRetryAttempts?: number;
        parameterTypes?: Record<string, string>;
    });
    /**
     * Executes the wrapped function with the provided arguments.
     */
    runAsync(args: T, context: ToolContext): Promise<any>;
    /**
     * Returns the function declaration for this tool.
     */
    getDeclaration(): FunctionDeclaration;
    /**
     * Checks if the wrapped function accepts a toolContext parameter.
     */
    private functionAcceptsToolContext;
    /**
     * Checks if the wrapped function is async.
     */
    private isAsyncFunction;
    /**
     * Extracts the mandatory arguments from a function.
     * In TypeScript, we can't easily inspect parameter defaults at runtime,
     * so this is a best-effort approach.
     */
    private getMandatoryArgs;
    /**
     * Checks which mandatory arguments are missing from the provided args.
     */
    private getMissingMandatoryArgs;
    /**
     * Extracts the function parameters from the function's signature.
     */
    private getFunctionParameters;
    /**
     * Converts an argument to the proper type based on the function signature.
     */
    private convertArgumentType;
    /**
     * Extracts the type of a specific parameter from the function signature.
     */
    private getParameterType;
}

/**
 * Options for building a function declaration
 */
interface BuildFunctionDeclarationOptions {
    name?: string;
    description?: string;
    ignoreParams?: string[];
}
/**
 * Builds a function declaration from a TypeScript function.
 *
 * This utility analyzes the function signature and JSDoc comments to create
 * a FunctionDeclaration object that can be used with LLMs.
 *
 * @param func The function to analyze
 * @param options Options for customizing the declaration
 * @returns A FunctionDeclaration representing the function
 */
declare function buildFunctionDeclaration(func: (...args: any[]) => any, options?: BuildFunctionDeclarationOptions): FunctionDeclaration;

/**
 * Creates a new FunctionTool that wraps a function.
 * This is a convenience function for creating a new FunctionTool.
 *
 * @param func The function to wrap
 * @param options Optional configuration for the tool
 * @returns A new FunctionTool wrapping the function
 */
declare function createFunctionTool(func: (...args: any[]) => any, options?: {
    name?: string;
    description?: string;
    isLongRunning?: boolean;
    shouldRetryOnFailure?: boolean;
    maxRetryAttempts?: number;
}): any;

/**
 * Simple GoogleSearch tool implementation
 */
declare class GoogleSearch extends BaseTool {
    protected logger: Logger;
    /**
     * Constructor for GoogleSearch
     */
    constructor();
    /**
     * Get the function declaration for the tool
     */
    getDeclaration(): FunctionDeclaration;
    /**
     * Execute the search
     * This is a simplified implementation that doesn't actually search, just returns mock results
     */
    runAsync(args: {
        query: string;
        num_results?: number;
    }, _context: ToolContext): Promise<any>;
}

interface HttpRequestResult {
    statusCode: number;
    headers: Record<string, string>;
    body: string;
    error?: string;
}
/**
 * Tool for making HTTP requests to external APIs and web services
 */
declare class HttpRequestTool extends BaseTool {
    constructor();
    /**
     * Get the function declaration for the tool
     */
    getDeclaration(): FunctionDeclaration;
    /**
     * Execute the HTTP request
     */
    runAsync(args: {
        url: string;
        method?: string;
        headers?: Record<string, string>;
        body?: string;
        params?: Record<string, string>;
        timeout?: number;
    }, _context: ToolContext): Promise<HttpRequestResult>;
    /**
     * Check if a string is valid JSON
     */
    private isValidJson;
}

interface FileOperationResult {
    success: boolean;
    data?: any;
    error?: string;
}
/**
 * Tool for performing file system operations
 */
declare class FileOperationsTool extends BaseTool {
    private basePath;
    constructor(options?: {
        basePath?: string;
    });
    /**
     * Get the function declaration for the tool
     */
    getDeclaration(): FunctionDeclaration;
    /**
     * Execute the file operation
     */
    runAsync(args: {
        operation: "read" | "write" | "append" | "delete" | "exists" | "list" | "mkdir";
        filepath: string;
        content?: string;
        encoding?: BufferEncoding;
    }, _context: ToolContext): Promise<FileOperationResult>;
    /**
     * Resolve a file path relative to the base path
     */
    private resolvePath;
    /**
     * Validate that a path is within the base path for security
     */
    private validatePath;
    /**
     * Read a file
     */
    private readFile;
    /**
     * Write to a file
     */
    private writeFile;
    /**
     * Append to a file
     */
    private appendFile;
    /**
     * Delete a file
     */
    private deleteFile;
    /**
     * Check if a file exists
     */
    private fileExists;
    /**
     * List directory contents
     */
    private listDirectory;
    /**
     * Create a directory
     */
    private makeDirectory;
}

interface UserInteractionResult {
    success: boolean;
    userInput?: string;
    error?: string;
}
/**
 * Tool for prompting the user for input
 */
declare class UserInteractionTool extends BaseTool {
    constructor();
    /**
     * Get the function declaration for the tool
     */
    getDeclaration(): FunctionDeclaration;
    /**
     * Execute the user interaction
     */
    runAsync(args: {
        prompt: string;
        options?: string[];
        defaultValue?: string;
    }, context: ToolContext): Promise<UserInteractionResult>;
}

/**
 * Tool that allows an agent to exit the current execution loop
 */
declare class ExitLoopTool extends BaseTool {
    protected logger: Logger;
    /**
     * Constructor for ExitLoopTool
     */
    constructor();
    /**
     * Execute the exit loop action
     */
    runAsync(_args: Record<string, any>, context: ToolContext): Promise<any>;
}

/**
 * Tool that allows an agent to get a choice from the user
 */
declare class GetUserChoiceTool extends BaseTool {
    protected logger: Logger;
    /**
     * Constructor for GetUserChoiceTool
     */
    constructor();
    /**
     * Get the function declaration for the tool
     */
    getDeclaration(): FunctionDeclaration;
    /**
     * Execute the user choice action
     * This is a long running operation that will return null initially
     * and the actual choice will be provided asynchronously
     */
    runAsync(args: {
        options: string[];
        question?: string;
    }, context: ToolContext): Promise<any>;
}

/**
 * Tool that allows an agent to transfer control to another agent
 */
declare class TransferToAgentTool extends BaseTool {
    protected logger: Logger;
    /**
     * Constructor for TransferToAgentTool
     */
    constructor();
    /**
     * Get the function declaration for the tool
     */
    getDeclaration(): FunctionDeclaration;
    /**
     * Execute the transfer to agent action
     */
    runAsync(args: {
        agent_name: string;
    }, context: ToolContext): Promise<any>;
}

/**
 * Tool that allows an agent to load memories relevant to a query
 */
declare class LoadMemoryTool extends BaseTool {
    protected logger: Logger;
    /**
     * Constructor for LoadMemoryTool
     */
    constructor();
    /**
     * Get the function declaration for the tool
     */
    getDeclaration(): FunctionDeclaration;
    /**
     * Execute the memory loading action
     */
    runAsync(args: {
        query: string;
    }, context: ToolContext): Promise<any>;
}

/**
 * A tool that loads the artifacts and adds them to the session.
 */
declare class LoadArtifactsTool extends BaseTool {
    constructor();
    /**
     * Get the function declaration for the tool
     */
    getDeclaration(): FunctionDeclaration;
    /**
     * Execute the load artifacts operation
     */
    runAsync(args: {
        artifact_names?: string[];
    }, context: ToolContext): Promise<{
        artifact_names: string[];
    }>;
    /**
     * Processes the outgoing LLM request for this tool.
     */
    processLlmRequest(toolContext: ToolContext, llmRequest: LlmRequest): Promise<void>;
    /**
     * Appends artifacts information to the LLM request
     */
    private appendArtifactsToLlmRequest;
    /**
     * Extracts function response from a part if it exists
     */
    private extractFunctionResponse;
}

type McpConfig = {
    name: string;
    description: string;
    transport: McpTransportType;
    timeout?: number;
    retryOptions?: {
        maxRetries?: number;
        initialDelay?: number;
        maxDelay?: number;
    };
    headers?: Record<string, string>;
    cacheConfig?: {
        enabled?: boolean;
        maxAge?: number;
        maxSize?: number;
    };
    debug?: boolean;
    /**
     * Sampling handler for processing MCP sampling requests.
     * This allows MCP servers to request LLM completions through your ADK agent.
     */
    samplingHandler?: SamplingHandler;
};
type McpTransportType = {
    mode: "stdio";
    command: string;
    args: string[];
    env?: Record<string, string>;
} | {
    mode: "sse";
    serverUrl: string;
    headers?: HeadersInit;
};
/**
 * Error types specific to the MCP client
 */
declare enum McpErrorType {
    CONNECTION_ERROR = "connection_error",
    TOOL_EXECUTION_ERROR = "tool_execution_error",
    RESOURCE_CLOSED_ERROR = "resource_closed_error",
    TIMEOUT_ERROR = "timeout_error",
    INVALID_SCHEMA_ERROR = "invalid_schema_error",
    SAMPLING_ERROR = "SAMPLING_ERROR",
    INVALID_REQUEST_ERROR = "INVALID_REQUEST_ERROR"
}
/**
 * Custom error class for MCP-related errors
 */
declare class McpError extends Error {
    type: McpErrorType;
    originalError?: Error;
    constructor(message: string, type: McpErrorType, originalError?: Error);
}
type McpSamplingRequest = CreateMessageRequest;
type McpSamplingResponse = CreateMessageResult;
type SamplingHandler = (request: LlmRequest) => Promise<string | LlmResponse>;

declare class McpClientService {
    private config;
    private client;
    private transport;
    private isClosing;
    private mcpSamplingHandler;
    protected logger: Logger;
    constructor(config: McpConfig);
    /**
     * Initializes and returns an MCP client based on configuration.
     * Will create a new client if one doesn't exist yet.
     */
    initialize(): Promise<Client>;
    /**
     * Creates a transport based on the configuration.
     */
    private createTransport;
    /**
     * Re-initializes the MCP client when a session is closed.
     * Used by the retry mechanism.
     */
    reinitialize(): Promise<void>;
    /**
     * Cleans up resources associated with this client service.
     * Similar to Python's AsyncExitStack.aclose() functionality.
     */
    private cleanupResources;
    /**
     * Call an MCP tool with retry capability if the session is closed.
     */
    callTool(name: string, args: Record<string, any>): Promise<any>;
    /**
     * Closes and cleans up all resources.
     * Should be called when the service is no longer needed.
     * Similar to Python's close() method.
     */
    close(): Promise<void>;
    /**
     * Checks if the client is currently connected
     */
    isConnected(): boolean;
    private setupSamplingHandler;
    /**
     * Set a new ADK sampling handler
     */
    setSamplingHandler(handler: SamplingHandler): void;
    /**
     * Remove the sampling handler
     */
    removeSamplingHandler(): void;
}

type ConvertMcpToolTooBaseToolParams = {
    mcpTool: Tool;
    client?: Client;
    toolHandler?: (name: string, args: unknown) => Promise<CallToolResult>;
};
declare function convertMcpToolToBaseTool(params: ConvertMcpToolTooBaseToolParams): Promise<BaseTool>;

/**
 * Converts an ADK-style BaseTool to an MCP tool format
 * Similar to Python's adk_to_mcp_tool_type function
 */
declare function adkToMcpToolType(tool: BaseTool): Tool;
/**
 * Converts MCP JSONSchema to ADK's FunctionDeclaration format
 * Similar to handling in McpToolAdapter's getDeclaration
 */
declare function jsonSchemaToDeclaration(name: string, description: string, schema: Record<string, any> | undefined): FunctionDeclaration;
/**
 * Normalizes a JSON Schema to ensure it's properly formatted
 * Handles edge cases and ensures consistency
 */
declare function normalizeJsonSchema(schema: Record<string, any>): Schema;
/**
 * Converts MCP tool inputSchema to parameters format expected by BaseTool
 */
declare function mcpSchemaToParameters(mcpTool: Tool): Schema;

/**
 * MCP Sampling Handler class that handles message format conversion
 * between MCP format and ADK format
 */
declare class McpSamplingHandler {
    protected logger: Logger;
    private samplingHandler;
    constructor(samplingHandler: SamplingHandler);
    /**
     * Handle MCP sampling request and convert between formats
     */
    handleSamplingRequest(request: McpSamplingRequest): Promise<McpSamplingResponse>;
    /**
     * Convert MCP messages to ADK Content format
     */
    private convertMcpMessagesToADK;
    /**
     * Convert a single MCP message to ADK Content format
     */
    private convertSingleMcpMessageToADK;
    /**
     * Convert MCP message content to ADK parts format
     */
    private convertMcpContentToADKParts;
    /**
     * Convert ADK response to MCP response format
     */
    private convertADKResponseToMcp;
    /**
     * Update the ADK handler
     */
    updateHandler(handler: SamplingHandler): void;
}
/**
 * Helper function to create a sampling handler with proper TypeScript types.
 *
 * @param handler - Function that handles sampling requests
 * @returns Properly typed ADK sampling handler
 *
 * @example
 * ```typescript
 * import { createSamplingHandler, Gemini } from "@iqai/adk";
 *
 * const llm = new Gemini("gemini-2.0-flash-exp");
 *
 * // Example 1: Return full LlmResponse
 * const samplingHandler1 = createSamplingHandler(async (request) => {
 *   const responses = [];
 *   for await (const response of llm.generateContentAsync(request)) {
 *     responses.push(response);
 *   }
 *   return responses[responses.length - 1];
 * });
 *
 * // Example 2: Return simple string
 * const samplingHandler2 = createSamplingHandler(async (request) => {
 *   const lastMessage = request.contents[request.contents.length - 1].parts[0].text;
 *   return await runner.ask(lastMessage);
 * });
 *
 * // Example 3: Direct function reference
 * const samplingHandler3 = createSamplingHandler(runner.ask);
 * ```
 */
declare function createSamplingHandler(handler: SamplingHandler): SamplingHandler;

/**
 * Simplified MCP Server Wrappers
 *
 * This module provides simplified wrapper functions for IQAI MCP servers and popular third-party MCP servers.
 * Instead of manually configuring McpToolset with verbose configuration objects, you can use these
 * convenience functions with flexible configuration objects.
 *
 * @example
 * ```typescript
 * // Old verbose way:
 * const toolset = new McpToolset({
 *   name: "Near Intents Swaps MCP Client",
 *   description: "Client for Near Intents Swaps",
 *   debug: env.DEBUG,
 *   retryOptions: { maxRetries: 2, initialDelay: 200 },
 *   transport: {
 *     mode: "stdio",
 *     command: "npx",
 *     args: ["-y", "@iqai/mcp-near"],
 *     env: {
 *       ACCOUNT_ID: env.ACCOUNT_ID,
 *       ACCOUNT_KEY: env.ACCOUNT_KEY,
 *       NEAR_NETWORK_ID: "testnet",
 *       PATH: env.PATH
 *     },
 *   },
 * });
 *
 * // New simplified way:
 * const toolset = McpNearAgent({
 *   env: {
 *     ACCOUNT_ID: env.ACCOUNT_ID,
 *     ACCOUNT_KEY: env.ACCOUNT_KEY,
 *     NEAR_NETWORK_ID: "testnet",
 *     PATH: env.PATH
 *   }
 * });
 *
 * // Usage with LLM Agent:
 * const nearTools = await toolset.getTools();
 * const agent = new LlmAgent({
 *   name: "near_assistant",
 *   model: "gemini-2.5-flash",
 *   tools: nearTools,
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Multiple MCP servers:
 * const atpTools = await McpAtp({
 *   env: {
 *     ATP_WALLET_PRIVATE_KEY: env.WALLET_PRIVATE_KEY,
 *     ATP_API_KEY: env.ATP_API_KEY
 *   }
 * }).getTools();
 *
 * const fraxlendTools = await McpFraxlend({
 *   env: {
 *     WALLET_PRIVATE_KEY: env.WALLET_PRIVATE_KEY
 *   }
 * }).getTools();
 *
 * const agent = new LlmAgent({
 *   name: "defi_assistant",
 *   model: "gemini-2.5-flash",
 *   tools: [...atpTools, ...fraxlendTools],
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Using MCP servers with sampling handlers:
 * import { createSamplingHandler, LlmResponse } from "@iqai/adk";
 *
 * const samplingHandler = createSamplingHandler(async (request) => {
 *   // Handle MCP sampling requests
 *   return new LlmResponse({
 *     content: {
 *       role: "model",
 *       parts: [{ text: "Response from sampling handler" }],
 *     },
 *   });
 * });
 *
 * const nearTools = await McpNearAgent({
 *   env: {
 *     ACCOUNT_ID: env.ACCOUNT_ID,
 *     ACCOUNT_KEY: env.ACCOUNT_KEY,
 *     NEAR_NETWORK_ID: "testnet",
 *     PATH: env.PATH
 *   },
 *   samplingHandler
 * }).getTools();
 *
 * const agent = new LlmAgent({
 *   name: "near_assistant",
 *   model: "gemini-2.5-flash",
 *   tools: nearTools,
 * });
 * ```
 */
/**
 * Base configuration interface for MCP servers
 */
interface McpServerConfig {
    /** Environment variables to pass to the MCP server */
    env?: Record<string, any>;
    /** Enable debug logging */
    debug?: boolean;
    /** Custom description for the MCP server */
    description?: string;
    /** Retry configuration */
    retryOptions?: {
        maxRetries?: number;
        initialDelay?: number;
    };
    /** Sampling handler for processing MCP sampling requests */
    samplingHandler?: SamplingHandler;
}
/**
 * MCP ABI - Smart contract ABI interactions for Ethereum-compatible blockchains
 *
 * Required env vars: CONTRACT_ABI, CONTRACT_ADDRESS
 * Optional env vars: CONTRACT_NAME, CHAIN_ID, RPC_URL, WALLET_PRIVATE_KEY
 */
declare function McpAbi(config?: McpServerConfig): McpToolset;
/**
 * MCP ATP - Interact with the IQ AI Agent Tokenization Platform
 *
 * Required env vars: ATP_WALLET_PRIVATE_KEY, ATP_API_KEY
 */
declare function McpAtp(config?: McpServerConfig): McpToolset;
/**
 * MCP BAMM - Borrow Automated Market Maker operations on Fraxtal
 *
 * Required env vars: WALLET_PRIVATE_KEY
 */
declare function McpBamm(config?: McpServerConfig): McpToolset;
/**
 * MCP FRAXLEND - Interact with the Fraxlend lending platform
 *
 * Required env vars: WALLET_PRIVATE_KEY
 */
declare function McpFraxlend(config?: McpServerConfig): McpToolset;
/**
 * MCP IQWiki - Access and manage IQ.wiki data and user activities
 *
 * No required env vars
 */
declare function McpIqWiki(config?: McpServerConfig): McpToolset;
/**
 * MCP NEAR Agent - NEAR Protocol blockchain integration with AI-driven event processing
 *
 * Required env vars: ACCOUNT_ID, ACCOUNT_KEY
 * Optional env vars: NEAR_NETWORK_ID, NEAR_NODE_URL, NEAR_GAS_LIMIT
 */
declare function McpNearAgent(config?: McpServerConfig): McpToolset;
/**
 * MCP Near Intents Swaps - NEAR Protocol intent swaps functionality
 *
 * Required env vars: ACCOUNT_ID, ACCOUNT_KEY
 * Optional env vars: NEAR_NETWORK_ID, NEAR_NODE_URL, NEAR_GAS_LIMIT
 */
declare function McpNearIntents(config?: McpServerConfig): McpToolset;
/**
 * MCP ODOS - Interact with decentralized exchanges through ODOS aggregation
 *
 * Required env vars: WALLET_PRIVATE_KEY
 */
declare function McpOdos(config?: McpServerConfig): McpToolset;
/**
 * MCP Telegram - Interact with Telegram bots and channels
 *
 * Required env vars: TELEGRAM_BOT_TOKEN
 */
declare function McpTelegram(config?: McpServerConfig): McpToolset;
/**
 * MCP Discord - Interact with Discord via MCP protocol
 *
 * Required env vars: DISCORD_TOKEN
 * Optional env vars: PATH
 */
declare function McpDiscord(config?: McpServerConfig): McpToolset;
/**
 * MCP CoinGecko - Access cryptocurrency market data and analytics
 *
 * Optional env vars: COINGECKO_PRO_API_KEY, COINGECKO_DEMO_API_KEY, COINGECKO_ENVIRONMENT
 */
declare function McpCoinGecko(config?: McpServerConfig): McpToolset;
/**
 * MCP Upbit - Interact with the Upbit cryptocurrency exchange
 *
 * Public tools require no auth.
 * Private trading tools require:
 *  - UPBIT_ACCESS_KEY
 *  - UPBIT_SECRET_KEY
 *  - UPBIT_ENABLE_TRADING=true
 */
declare function McpUpbit(config?: McpServerConfig): McpToolset;
/**
 * Popular third-party MCP servers
 * These can be added as we expand support for community MCP servers
 */
/**
 * MCP Filesystem - File system operations (third-party)
 *
 * Optional env vars: ALLOWED_DIRECTORIES (comma-separated list)
 */
declare function McpFilesystem(config?: McpServerConfig): McpToolset;
/**
 * MCP Memory - Memory and note-taking capabilities (third-party)
 *
 * No required env vars
 */
declare function McpMemory(config?: McpServerConfig): McpToolset;
/**
 * Generic MCP server function for any package
 *
 * @param packageName The npm package name of the MCP server
 * @param config Configuration object with environment variables and optional sampling handler
 * @param name Optional custom name for the client
 */
declare function McpGeneric(packageName: string, config?: McpServerConfig, name?: string): McpToolset;

/**
 * A class for managing MCP tools similar to Python's MCPToolset.
 * Provides functionality to retrieve and use tools from an MCP server.
 */
declare class McpToolset {
    private config;
    private clientService;
    private toolFilter;
    private tools;
    private isClosing;
    constructor(config: McpConfig, toolFilter?: string[] | ((tool: any, context?: ToolContext) => boolean) | null);
    /**
     * Checks if a tool should be included based on the tool filter.
     * Similar to Python's _is_selected method.
     */
    private isSelected;
    /**
     * Initializes the client service and establishes a connection.
     */
    initialize(): Promise<McpClientService>;
    /**
     * Set a sampling handler for this MCP toolset.
     * This allows MCP servers to request LLM completions through your ADK agent.
     *
     * @param handler - ADK sampling handler that receives ADK-formatted messages
     */
    setSamplingHandler(handler: SamplingHandler): void;
    /**
     * Remove the sampling handler
     */
    removeSamplingHandler(): void;
    /**
     * Retrieves tools from the MCP server and converts them to BaseTool instances.
     * Similar to Python's get_tools method.
     */
    getTools(context?: ToolContext): Promise<BaseTool[]>;
    /**
     * Converts ADK tools to MCP tool format for bidirectional support
     */
    convertADKToolsToMCP(tools: BaseTool[]): any[];
    /**
     * Refreshes the tool cache by clearing it and fetching tools again
     */
    refreshTools(context?: ToolContext): Promise<BaseTool[]>;
    /**
     * Closes the connection to the MCP server.
     * Similar to Python's close method.
     */
    close(): Promise<void>;
    /**
     * Disposes of all resources. This method should be called when the toolset is no longer needed.
     * Provides alignment with disposal patterns common in TypeScript.
     */
    dispose(): Promise<void>;
}
/**
 * Retrieves and converts tools from an MCP server.
 *
 * This function:
 * 1. Connects to the MCP server (local or sse).
 * 2. Retrieves all available tools.
 * 3. Converts them into BaseTool instances.
 * 4. Returns them as a BaseTool array.
 */
declare function getMcpTools(config: McpConfig, toolFilter?: string[] | ((tool: any, context?: ToolContext) => boolean)): Promise<BaseTool[]>;

/**
 * Tools module exports
 */

type index$7_AgentTool = AgentTool;
declare const index$7_AgentTool: typeof AgentTool;
type index$7_AgentToolConfig = AgentToolConfig;
type index$7_BaseAgentType = BaseAgentType;
type index$7_BaseTool = BaseTool;
declare const index$7_BaseTool: typeof BaseTool;
type index$7_BuildFunctionDeclarationOptions = BuildFunctionDeclarationOptions;
type index$7_CreateToolConfig<T extends Record<string, any> = Record<string, never>> = CreateToolConfig<T>;
type index$7_CreateToolConfigWithSchema<T extends Record<string, any>> = CreateToolConfigWithSchema<T>;
type index$7_CreateToolConfigWithoutSchema = CreateToolConfigWithoutSchema;
type index$7_ExitLoopTool = ExitLoopTool;
declare const index$7_ExitLoopTool: typeof ExitLoopTool;
type index$7_FileOperationsTool = FileOperationsTool;
declare const index$7_FileOperationsTool: typeof FileOperationsTool;
type index$7_FunctionTool<T extends Record<string, any>> = FunctionTool<T>;
declare const index$7_FunctionTool: typeof FunctionTool;
type index$7_GetUserChoiceTool = GetUserChoiceTool;
declare const index$7_GetUserChoiceTool: typeof GetUserChoiceTool;
type index$7_GoogleSearch = GoogleSearch;
declare const index$7_GoogleSearch: typeof GoogleSearch;
type index$7_HttpRequestTool = HttpRequestTool;
declare const index$7_HttpRequestTool: typeof HttpRequestTool;
type index$7_LoadArtifactsTool = LoadArtifactsTool;
declare const index$7_LoadArtifactsTool: typeof LoadArtifactsTool;
type index$7_LoadMemoryTool = LoadMemoryTool;
declare const index$7_LoadMemoryTool: typeof LoadMemoryTool;
declare const index$7_McpAbi: typeof McpAbi;
declare const index$7_McpAtp: typeof McpAtp;
declare const index$7_McpBamm: typeof McpBamm;
declare const index$7_McpCoinGecko: typeof McpCoinGecko;
type index$7_McpConfig = McpConfig;
declare const index$7_McpDiscord: typeof McpDiscord;
type index$7_McpError = McpError;
declare const index$7_McpError: typeof McpError;
type index$7_McpErrorType = McpErrorType;
declare const index$7_McpErrorType: typeof McpErrorType;
declare const index$7_McpFilesystem: typeof McpFilesystem;
declare const index$7_McpFraxlend: typeof McpFraxlend;
declare const index$7_McpGeneric: typeof McpGeneric;
declare const index$7_McpIqWiki: typeof McpIqWiki;
declare const index$7_McpMemory: typeof McpMemory;
declare const index$7_McpNearAgent: typeof McpNearAgent;
declare const index$7_McpNearIntents: typeof McpNearIntents;
declare const index$7_McpOdos: typeof McpOdos;
type index$7_McpSamplingHandler = McpSamplingHandler;
declare const index$7_McpSamplingHandler: typeof McpSamplingHandler;
type index$7_McpSamplingRequest = McpSamplingRequest;
type index$7_McpSamplingResponse = McpSamplingResponse;
type index$7_McpServerConfig = McpServerConfig;
declare const index$7_McpTelegram: typeof McpTelegram;
type index$7_McpToolset = McpToolset;
declare const index$7_McpToolset: typeof McpToolset;
type index$7_McpTransportType = McpTransportType;
declare const index$7_McpUpbit: typeof McpUpbit;
type index$7_SamplingHandler = SamplingHandler;
type index$7_ToolConfig = ToolConfig;
type index$7_ToolContext = ToolContext;
declare const index$7_ToolContext: typeof ToolContext;
type index$7_TransferToAgentTool = TransferToAgentTool;
declare const index$7_TransferToAgentTool: typeof TransferToAgentTool;
type index$7_UserInteractionTool = UserInteractionTool;
declare const index$7_UserInteractionTool: typeof UserInteractionTool;
declare const index$7_adkToMcpToolType: typeof adkToMcpToolType;
declare const index$7_buildFunctionDeclaration: typeof buildFunctionDeclaration;
declare const index$7_convertMcpToolToBaseTool: typeof convertMcpToolToBaseTool;
declare const index$7_createFunctionTool: typeof createFunctionTool;
declare const index$7_createSamplingHandler: typeof createSamplingHandler;
declare const index$7_createTool: typeof createTool;
declare const index$7_getMcpTools: typeof getMcpTools;
declare const index$7_jsonSchemaToDeclaration: typeof jsonSchemaToDeclaration;
declare const index$7_mcpSchemaToParameters: typeof mcpSchemaToParameters;
declare const index$7_normalizeJsonSchema: typeof normalizeJsonSchema;
declare namespace index$7 {
  export { index$7_AgentTool as AgentTool, type index$7_AgentToolConfig as AgentToolConfig, type index$7_BaseAgentType as BaseAgentType, index$7_BaseTool as BaseTool, type index$7_BuildFunctionDeclarationOptions as BuildFunctionDeclarationOptions, type index$7_CreateToolConfig as CreateToolConfig, type index$7_CreateToolConfigWithSchema as CreateToolConfigWithSchema, type index$7_CreateToolConfigWithoutSchema as CreateToolConfigWithoutSchema, index$7_ExitLoopTool as ExitLoopTool, index$7_FileOperationsTool as FileOperationsTool, index$7_FunctionTool as FunctionTool, index$7_GetUserChoiceTool as GetUserChoiceTool, index$7_GoogleSearch as GoogleSearch, index$7_HttpRequestTool as HttpRequestTool, index$7_LoadArtifactsTool as LoadArtifactsTool, index$7_LoadMemoryTool as LoadMemoryTool, index$7_McpAbi as McpAbi, index$7_McpAtp as McpAtp, index$7_McpBamm as McpBamm, index$7_McpCoinGecko as McpCoinGecko, type index$7_McpConfig as McpConfig, index$7_McpDiscord as McpDiscord, index$7_McpError as McpError, index$7_McpErrorType as McpErrorType, index$7_McpFilesystem as McpFilesystem, index$7_McpFraxlend as McpFraxlend, index$7_McpGeneric as McpGeneric, index$7_McpIqWiki as McpIqWiki, index$7_McpMemory as McpMemory, index$7_McpNearAgent as McpNearAgent, index$7_McpNearIntents as McpNearIntents, index$7_McpOdos as McpOdos, index$7_McpSamplingHandler as McpSamplingHandler, type index$7_McpSamplingRequest as McpSamplingRequest, type index$7_McpSamplingResponse as McpSamplingResponse, type index$7_McpServerConfig as McpServerConfig, index$7_McpTelegram as McpTelegram, index$7_McpToolset as McpToolset, type index$7_McpTransportType as McpTransportType, index$7_McpUpbit as McpUpbit, type index$7_SamplingHandler as SamplingHandler, type index$7_ToolConfig as ToolConfig, index$7_ToolContext as ToolContext, index$7_TransferToAgentTool as TransferToAgentTool, index$7_UserInteractionTool as UserInteractionTool, index$7_adkToMcpToolType as adkToMcpToolType, index$7_buildFunctionDeclaration as buildFunctionDeclaration, index$7_convertMcpToolToBaseTool as convertMcpToolToBaseTool, index$7_createFunctionTool as createFunctionTool, index$7_createSamplingHandler as createSamplingHandler, index$7_createTool as createTool, index$7_getMcpTools as getMcpTools, index$7_jsonSchemaToDeclaration as jsonSchemaToDeclaration, index$7_mcpSchemaToParameters as mcpSchemaToParameters, index$7_normalizeJsonSchema as normalizeJsonSchema };
}

/**
 * LLM request class that allows passing in tools, output schema and system
 * instructions to the model.
 *
 * Attributes:
 *   model: The model name.
 *   contents: The contents to send to the model.
 *   config: Additional config for the generate content request.
 *   toolsDict: The tools dictionary.
 */
declare class LlmRequest {
    /**
     * The model name.
     */
    model?: string;
    /**
     * The contents to send to the model.
     */
    contents: Content[];
    /**
     * Additional config for the generate content request.
     * Tools in generate_content_config should not be set.
     */
    config?: GenerateContentConfig;
    /**
     * Live connect config for the request.
     */
    liveConnectConfig: LiveConnectConfig;
    /**
     * The tools dictionary.
     */
    toolsDict: Record<string, BaseTool>;
    constructor(data?: {
        model?: string;
        contents?: Content[];
        config?: GenerateContentConfig;
        liveConnectConfig?: LiveConnectConfig;
        toolsDict?: Record<string, BaseTool>;
    });
    /**
     * Appends instructions to the system instruction.
     * @param instructions The instructions to append.
     */
    appendInstructions(instructions: string[]): void;
    /**
     * Appends tools to the request.
     * @param tools The tools to append.
     */
    appendTools(tools: BaseTool[]): void;
    /**
     * Sets the output schema for the request.
     * @param baseModel The base model to set as the output schema.
     */
    setOutputSchema(baseModel: any): void;
    /**
     * Extracts the system instruction as plain text from Content or string.
     * System instructions can be either string or Content type.
     * @returns The system instruction as a string, or undefined if not set.
     */
    getSystemInstructionText(): string | undefined;
    /**
     * Extracts text content from a Content object.
     * Used for extracting text from message contents.
     * @param content The Content object to extract text from.
     * @returns The extracted text as a string.
     */
    static extractTextFromContent(content: any): string;
}

/**
 * AI SDK integration that accepts a pre-configured LanguageModel.
 * Enables ADK to work with any provider supported by Vercel's AI SDK.
 */
declare class AiSdkLlm extends BaseLlm {
    private modelInstance;
    protected logger: Logger;
    /**
     * Constructor accepts a pre-configured LanguageModel instance
     * @param model - Pre-configured LanguageModel from provider(modelName)
     */
    constructor(modelInstance: LanguageModel);
    /**
     * Returns empty array - following Python ADK pattern
     */
    static supportedModels(): string[];
    protected generateContentAsyncImpl(request: LlmRequest, stream?: boolean): AsyncGenerator<LlmResponse, void, unknown>;
    /**
     * Convert ADK LlmRequest to AI SDK CoreMessage format
     */
    private convertToAiSdkMessages;
    /**
     * Transform JSON schema to use lowercase types for AI SDK compatibility
     */
    private transformSchemaForAiSdk;
    /**
     * Convert ADK tools to AI SDK tools format
     */
    private convertToAiSdkTools;
    /**
     * Convert ADK Content to AI SDK CoreMessage
     */
    private contentToAiSdkMessage;
    /**
     * Map ADK role to AI SDK role
     */
    private mapRole;
    /**
     * Map AI SDK finish reason to ADK finish reason
     */
    private mapFinishReason;
}

/**
 * Anthropic LLM implementation using Claude models
 */
declare class AnthropicLlm extends BaseLlm {
    private _client?;
    protected logger: Logger;
    /**
     * Constructor for Anthropic LLM
     */
    constructor(model?: string);
    /**
     * Provides the list of supported models
     */
    static supportedModels(): string[];
    /**
     * Main content generation method - handles both streaming and non-streaming
     */
    protected generateContentAsyncImpl(llmRequest: LlmRequest, stream?: boolean): AsyncGenerator<LlmResponse, void, unknown>;
    /**
     * Live connection is not supported for Anthropic models
     */
    connect(_llmRequest: LlmRequest): BaseLLMConnection;
    /**
     * Convert Anthropic Message to ADK LlmResponse
     */
    private anthropicMessageToLlmResponse;
    /**
     * Convert ADK Content to Anthropic MessageParam
     */
    private contentToAnthropicMessage;
    /**
     * Convert ADK Part to Anthropic content block
     */
    private partToAnthropicBlock;
    /**
     * Convert Anthropic content block to ADK Part
     */
    private anthropicBlockToPart;
    /**
     * Convert ADK function declaration to Anthropic tool param
     */
    private functionDeclarationToAnthropicTool;
    /**
     * Convert ADK role to Anthropic role format
     */
    private toAnthropicRole;
    /**
     * Convert Anthropic stop reason to ADK finish reason
     */
    private toAdkFinishReason;
    /**
     * Update type strings in schema to lowercase for Anthropic compatibility
     */
    private updateTypeString;
    /**
     * Gets the Anthropic client
     */
    private get client();
}

/**
 * Google LLM Variant enum
 */
declare enum GoogleLLMVariant {
    VERTEX_AI = "VERTEX_AI",
    GEMINI_API = "GEMINI_API"
}
/**
 * Integration for Gemini models.
 */
declare class GoogleLlm extends BaseLlm {
    private _apiClient?;
    private _liveApiClient?;
    private _apiBackend?;
    private _trackingHeaders?;
    /**
     * Constructor for Gemini
     */
    constructor(model?: string);
    /**
     * Provides the list of supported models.
     */
    static supportedModels(): string[];
    /**
     * Main content generation method - handles both streaming and non-streaming
     */
    protected generateContentAsyncImpl(llmRequest: LlmRequest, stream?: boolean): AsyncGenerator<LlmResponse, void, unknown>;
    /**
     * Connects to the Gemini model and returns an llm connection.
     */
    connect(_llmRequest: LlmRequest): BaseLLMConnection;
    /**
     * Check if response has inline data
     */
    private hasInlineData;
    /**
     * Convert LlmRequest contents to GoogleGenAI format
     */
    private convertContents;
    /**
     * Preprocesses the request based on the API backend.
     */
    private preprocessRequest;
    /**
     * Sets display_name to null for the Gemini API (non-Vertex) backend.
     */
    private removeDisplayNameIfPresent;
    /**
     * Provides the api client.
     */
    get apiClient(): GoogleGenAI;
    /**
     * Gets the API backend type.
     */
    get apiBackend(): GoogleLLMVariant;
    /**
     * Gets the tracking headers.
     */
    get trackingHeaders(): Record<string, string>;
    /**
     * Gets the live API version.
     */
    get liveApiVersion(): string;
    /**
     * Gets the live API client.
     */
    get liveApiClient(): GoogleGenAI;
}

/**
 * Configuration options for OpenAI LLM
 */
interface OpenAILLMConfig {
    /**
     * Custom base URL for OpenAI API (e.g., for proxy or alternative endpoints)
     */
    baseURL?: string;
    /**
     * API key for authentication
     */
    apiKey?: string;
}
/**
 * OpenAI LLM implementation using GPT models
 * Enhanced with comprehensive debug logging similar to Google LLM
 */
declare class OpenAiLlm extends BaseLlm {
    private _client?;
    private _config?;
    /**
     * Constructor for OpenAI LLM
     */
    constructor(model?: string, config?: OpenAILLMConfig);
    /**
     * Provides the list of supported models
     */
    static supportedModels(): string[];
    /**
     * Main content generation method - handles both streaming and non-streaming
     */
    protected generateContentAsyncImpl(llmRequest: LlmRequest, stream?: boolean): AsyncGenerator<LlmResponse, void, unknown>;
    /**
     * Live connection is not supported for OpenAI models
     */
    connect(_llmRequest: LlmRequest): BaseLLMConnection;
    /**
     * Create LlmResponse from streaming chunk - similar to Google's LlmResponse.create
     */
    private createChunkResponse;
    /**
     * Convert OpenAI message to ADK LlmResponse
     */
    private openAiMessageToLlmResponse;
    /**
     * Convert ADK Content to OpenAI ChatCompletionMessage
     */
    private contentToOpenAiMessage;
    /**
     * Convert ADK Part to OpenAI message content
     */
    private partToOpenAiContent;
    /**
     * Transform JSON schema to use lowercase types for OpenAI compatibility
     */
    private transformSchemaForOpenAi;
    /**
     * Convert ADK function declaration to OpenAI tool
     */
    private functionDeclarationToOpenAiTool;
    /**
     * Convert ADK role to OpenAI role format
     */
    private toOpenAiRole;
    /**
     * Convert OpenAI finish reason to ADK finish reason
     */
    private toAdkFinishReason;
    /**
     * Preprocess request similar to Google LLM
     */
    private preprocessRequest;
    /**
     * Preprocess individual parts for OpenAI compatibility
     */
    private preprocessPart;
    /**
     * Detect content type for flow control
     * This is a simplified implementation - you may need to adjust based on your specific requirements
     */
    private getContentType;
    /**
     * Check if response has inline data (similar to Google LLM)
     */
    private hasInlineData;
    /**
     * Gets the OpenAI client
     */
    private get client();
}

interface LLMClass {
    new (model: string): BaseLlm;
    supportedModels(): string[];
}
interface LlmModelConfig {
    temperature?: number;
    maxOutputTokens?: number;
    topP?: number;
    topK?: number;
}
interface LlmModel {
    generateContent(options: {
        prompt: string;
    } & LlmModelConfig): Promise<LlmResponse>;
}
declare class LLMRegistry {
    private static llmRegistry;
    private static modelInstances;
    /**
     * Default provider to use when model doesn't match any pattern
     * Can be set via environment variable ADK_DEFAULT_LLM_PROVIDER
     */
    private static defaultProvider?;
    private static logger;
    static newLLM(model: string): BaseLlm;
    static resolve(model: string): LLMClass | null;
    /**
     * Detect provider based on model name patterns or environment configuration
     */
    private static detectProviderFallback;
    /**
     * Set the default provider to use for models that don't match any pattern
     * @param providerName - 'openai', 'anthropic', or 'google'
     */
    static setDefaultProvider(providerName: 'openai' | 'anthropic' | 'google'): void;
    /**
     * Clear the default provider
     */
    static clearDefaultProvider(): void;
    static register(modelNameRegex: string, llmClass: LLMClass): void;
    static registerLLM(llmClass: LLMClass): void;
    static registerModel(name: string, model: LlmModel): void;
    static getModel(name: string): LlmModel;
    static hasModel(name: string): boolean;
    static unregisterModel(name: string): void;
    static getModelOrCreate(name: string): LlmModel | BaseLlm;
    static clear(): void;
    static clearModels(): void;
    static clearClasses(): void;
    static logRegisteredModels(): void;
    /**
     * Get list of available provider names based on registered LLM classes
     */
    private static getAvailableProviders;
}

/**
 * Register all LLM providers
 */
declare function registerProviders(): void;

/**
 * Configuration for model built-in thinking features
 * Compatible with google.genai.types.ThinkingConfig
 */
interface ThinkingConfig {
    /**
     * Whether to include the thinking process in the response
     */
    includeThinking?: boolean;
    /**
     * Additional thinking configuration options
     */
    [key: string]: any;
}

/**
 * Authentication scheme types
 */
declare enum AuthSchemeType {
    APIKEY = "apiKey",
    HTTP = "http",
    OAUTH2 = "oauth2",
    OPENID_CONNECT = "openIdConnect"
}
/**
 * Base class for authentication schemes
 */
declare abstract class AuthScheme {
    /**
     * The type of authentication scheme
     */
    type: AuthSchemeType;
    constructor(type: AuthSchemeType);
}
/**
 * API Key authentication scheme
 */
declare class ApiKeyScheme extends AuthScheme {
    /**
     * Where the API key is sent
     */
    in: "query" | "header" | "cookie";
    /**
     * Name of the parameter
     */
    name: string;
    /**
     * Description of the API key
     */
    description?: string;
    /**
     * Constructor for ApiKeyScheme
     */
    constructor(config: {
        in: "query" | "header" | "cookie";
        name: string;
        description?: string;
    });
}
/**
 * HTTP authentication scheme
 */
declare class HttpScheme extends AuthScheme {
    /**
     * The HTTP authentication scheme
     */
    scheme: "basic" | "bearer" | "digest" | "other";
    /**
     * Bearer format when scheme is 'bearer'
     */
    bearerFormat?: string;
    /**
     * Description of the scheme
     */
    description?: string;
    /**
     * Constructor for HttpScheme
     */
    constructor(config: {
        scheme: "basic" | "bearer" | "digest" | "other";
        bearerFormat?: string;
        description?: string;
    });
}
/**
 * OAuth flow configuration
 */
interface OAuthFlow {
    authorizationUrl?: string;
    tokenUrl?: string;
    refreshUrl?: string;
    scopes: Record<string, string>;
}
/**
 * OAuth flows configuration
 */
interface OAuthFlows {
    implicit?: OAuthFlow;
    password?: OAuthFlow;
    clientCredentials?: OAuthFlow;
    authorizationCode?: OAuthFlow;
}
/**
 * OAuth2 authentication scheme
 */
declare class OAuth2Scheme extends AuthScheme {
    /**
     * OAuth flows
     */
    flows: OAuthFlows;
    /**
     * Description of the scheme
     */
    description?: string;
    /**
     * Constructor for OAuth2Scheme
     */
    constructor(config: {
        flows: OAuthFlows;
        description?: string;
    });
}
/**
 * OpenID Connect authentication scheme
 */
declare class OpenIdConnectScheme extends AuthScheme {
    /**
     * OpenID Connect URL
     */
    openIdConnectUrl: string;
    /**
     * Description of the scheme
     */
    description?: string;
    /**
     * Constructor for OpenIdConnectScheme
     */
    constructor(config: {
        openIdConnectUrl: string;
        description?: string;
    });
}

/**
 * Authentication configuration for tools
 */
declare class AuthConfig {
    /**
     * The authentication scheme
     */
    authScheme: AuthScheme;
    /**
     * Additional context properties
     */
    context?: Record<string, any>;
    /**
     * Constructor for AuthConfig
     */
    constructor(config: {
        authScheme: AuthScheme;
        context?: Record<string, any>;
    });
}

/**
 * Handler for authentication in tools
 */
declare class AuthHandler {
    /**
     * The authentication configuration
     */
    authConfig: AuthConfig;
    /**
     * The authentication credential
     */
    credential?: AuthCredential;
    /**
     * Constructor for AuthHandler
     */
    constructor(config: {
        authConfig: AuthConfig;
        credential?: AuthCredential;
    });
    /**
     * Gets the authentication token
     */
    getToken(): string | undefined;
    /**
     * Gets headers for HTTP requests
     */
    getHeaders(): Record<string, string>;
    /**
     * Refreshes the token if necessary
     */
    refreshToken(): Promise<void>;
}

/**
 * Base class for LLM request processors.
 */
declare abstract class BaseLlmRequestProcessor {
    /**
     * Runs the processor on the given invocation context and LLM request.
     * @param invocationContext The invocation context
     * @param llmRequest The LLM request to process
     * @returns An async generator yielding events
     */
    abstract runAsync(invocationContext: InvocationContext, llmRequest: LlmRequest): AsyncGenerator<Event, void, unknown>;
}
/**
 * Base class for LLM response processors.
 */
declare abstract class BaseLlmResponseProcessor {
    /**
     * Processes the LLM response.
     * @param invocationContext The invocation context
     * @param llmResponse The LLM response to process
     * @returns An async generator yielding events
     */
    abstract runAsync(invocationContext: InvocationContext, llmResponse: LlmResponse): AsyncGenerator<Event, void, unknown>;
}

/**
 * Auth LLM request processor that handles authentication information
 * to build the LLM request with credential processing
 */
declare class AuthLlmRequestProcessor extends BaseLlmRequestProcessor {
    /**
     * Processes authentication information from session events
     * and resumes function calls that required authentication
     */
    runAsync(invocationContext: InvocationContext, llmRequest: LlmRequest): AsyncGenerator<Event>;
    /**
     * Parses and stores authentication response in session state
     */
    private parseAndStoreAuthResponse;
}
/**
 * Exported request processor instance for use in flow configurations
 */
declare const requestProcessor$7: AuthLlmRequestProcessor;

/**
 * Enhanced auth configuration with credential handling
 * This extends the basic AuthConfig with raw and exchanged credentials
 */
declare class EnhancedAuthConfig {
    /**
     * The authentication scheme
     */
    authScheme: AuthScheme;
    /**
     * Raw auth credential used to collect credentials
     * Used in auth schemes that need to exchange credentials (e.g. OAuth2, OIDC)
     */
    rawAuthCredential?: AuthCredential;
    /**
     * Exchanged auth credential after processing
     * Filled by ADK and client working together
     */
    exchangedAuthCredential?: AuthCredential;
    /**
     * User-specified key for credential storage and retrieval
     */
    credentialKey?: string;
    /**
     * Additional context properties
     */
    context?: Record<string, any>;
    /**
     * Constructor for EnhancedAuthConfig
     */
    constructor(config: {
        authScheme: AuthScheme;
        rawAuthCredential?: AuthCredential;
        exchangedAuthCredential?: AuthCredential;
        credentialKey?: string;
        context?: Record<string, any>;
    });
    /**
     * Generates a credential key based on auth scheme and raw credential
     * Used for saving/loading credentials from credential service
     */
    private generateCredentialKey;
    /**
     * Gets the credential key for storage
     */
    getCredentialKey(): string;
}
/**
 * Arguments for the special long-running function tool used to request
 * end-user credentials
 */
interface AuthToolArguments extends Record<string, unknown> {
    /**
     * The ID of the function call that requires authentication
     */
    function_call_id: string;
    /**
     * The authentication configuration
     */
    auth_config: AuthConfig | EnhancedAuthConfig;
}
/**
 * Auth tool for handling credential requests
 */
declare class AuthTool {
    /**
     * Processes auth tool arguments and returns appropriate response
     */
    static processAuthRequest(args: AuthToolArguments): Promise<{
        status: string;
        authConfig?: AuthConfig | EnhancedAuthConfig;
        credentialKey?: string;
    }>;
    /**
     * Validates auth tool arguments
     */
    static validateAuthArguments(args: any): args is AuthToolArguments;
}
/**
 * Creates an AuthToolArguments object with proper typing
 */
declare function createAuthToolArguments(functionCallId: string, authConfig: AuthConfig | EnhancedAuthConfig): AuthToolArguments;
/**
 * Type guard to check if an auth config is enhanced
 */
declare function isEnhancedAuthConfig(config: AuthConfig | EnhancedAuthConfig): config is EnhancedAuthConfig;

/**
 * Types of authentication credentials
 */
declare enum AuthCredentialType {
    API_KEY = "api_key",
    BASIC = "basic",
    BEARER = "bearer",
    OAUTH2 = "oauth2",
    CUSTOM = "custom"
}
/**
 * Base class for authentication credentials
 */
declare abstract class AuthCredential {
    /**
     * Type of credential
     */
    type: AuthCredentialType;
    /**
     * Constructor for AuthCredential
     */
    constructor(type: AuthCredentialType);
    /**
     * Gets the authentication token
     */
    abstract getToken(): string | undefined;
    /**
     * Gets headers for HTTP requests
     */
    abstract getHeaders(config: AuthConfig): Record<string, string>;
    /**
     * Whether the token can be refreshed
     */
    canRefresh(): boolean;
    /**
     * Refreshes the token
     */
    refresh(): Promise<void>;
}
/**
 * API Key credential
 */
declare class ApiKeyCredential extends AuthCredential {
    /**
     * The API key
     */
    apiKey: string;
    /**
     * Constructor for ApiKeyCredential
     */
    constructor(apiKey: string);
    /**
     * Gets the API key as the token
     */
    getToken(): string;
    /**
     * Gets headers for HTTP requests
     */
    getHeaders(config: AuthConfig): Record<string, string>;
}
/**
 * Basic authentication credential
 */
declare class BasicAuthCredential extends AuthCredential {
    /**
     * The username
     */
    username: string;
    /**
     * The password
     */
    password: string;
    /**
     * Constructor for BasicAuthCredential
     */
    constructor(username: string, password: string);
    /**
     * Gets the encoded basic auth token
     */
    getToken(): string;
    /**
     * Gets headers for HTTP requests
     */
    getHeaders(): Record<string, string>;
}
/**
 * Bearer token credential
 */
declare class BearerTokenCredential extends AuthCredential {
    /**
     * The bearer token
     */
    token: string;
    /**
     * Constructor for BearerTokenCredential
     */
    constructor(token: string);
    /**
     * Gets the bearer token
     */
    getToken(): string;
    /**
     * Gets headers for HTTP requests
     */
    getHeaders(): Record<string, string>;
}
/**
 * OAuth2 token credential with refresh capability
 */
declare class OAuth2Credential extends AuthCredential {
    /**
     * The access token
     */
    accessToken: string;
    /**
     * The refresh token
     */
    refreshToken?: string;
    /**
     * When the token expires
     */
    expiresAt?: Date;
    /**
     * Function to refresh the token
     */
    private refreshFunction?;
    /**
     * Constructor for OAuth2Credential
     */
    constructor(config: {
        accessToken: string;
        refreshToken?: string;
        expiresIn?: number;
        refreshFunction?: (refreshToken: string) => Promise<{
            accessToken: string;
            refreshToken?: string;
            expiresIn?: number;
        }>;
    });
    /**
     * Gets the access token
     */
    getToken(): string;
    /**
     * Gets headers for HTTP requests
     */
    getHeaders(): Record<string, string>;
    /**
     * Whether the token can be refreshed
     */
    canRefresh(): boolean;
    /**
     * Whether the token is expired
     */
    isExpired(): boolean;
    /**
     * Refreshes the token
     */
    refresh(): Promise<void>;
}

/**
 * Models module exports - consolidated to match Python structure
 */

type index$6_AiSdkLlm = AiSdkLlm;
declare const index$6_AiSdkLlm: typeof AiSdkLlm;
type index$6_AnthropicLlm = AnthropicLlm;
declare const index$6_AnthropicLlm: typeof AnthropicLlm;
type index$6_ApiKeyCredential = ApiKeyCredential;
declare const index$6_ApiKeyCredential: typeof ApiKeyCredential;
type index$6_ApiKeyScheme = ApiKeyScheme;
declare const index$6_ApiKeyScheme: typeof ApiKeyScheme;
type index$6_AuthConfig = AuthConfig;
declare const index$6_AuthConfig: typeof AuthConfig;
type index$6_AuthCredential = AuthCredential;
declare const index$6_AuthCredential: typeof AuthCredential;
type index$6_AuthCredentialType = AuthCredentialType;
declare const index$6_AuthCredentialType: typeof AuthCredentialType;
type index$6_AuthHandler = AuthHandler;
declare const index$6_AuthHandler: typeof AuthHandler;
type index$6_AuthScheme = AuthScheme;
declare const index$6_AuthScheme: typeof AuthScheme;
type index$6_AuthSchemeType = AuthSchemeType;
declare const index$6_AuthSchemeType: typeof AuthSchemeType;
type index$6_BaseLLMConnection = BaseLLMConnection;
declare const index$6_BaseLLMConnection: typeof BaseLLMConnection;
type index$6_BaseLlm = BaseLlm;
declare const index$6_BaseLlm: typeof BaseLlm;
type index$6_BaseMemoryService = BaseMemoryService;
type index$6_BasicAuthCredential = BasicAuthCredential;
declare const index$6_BasicAuthCredential: typeof BasicAuthCredential;
type index$6_BearerTokenCredential = BearerTokenCredential;
declare const index$6_BearerTokenCredential: typeof BearerTokenCredential;
declare const index$6_Blob: typeof Blob;
declare const index$6_Content: typeof Content;
declare const index$6_FunctionDeclaration: typeof FunctionDeclaration;
type index$6_GoogleLlm = GoogleLlm;
declare const index$6_GoogleLlm: typeof GoogleLlm;
type index$6_HttpScheme = HttpScheme;
declare const index$6_HttpScheme: typeof HttpScheme;
type index$6_LLMRegistry = LLMRegistry;
declare const index$6_LLMRegistry: typeof LLMRegistry;
type index$6_LlmModel = LlmModel;
type index$6_LlmModelConfig = LlmModelConfig;
type index$6_LlmRequest = LlmRequest;
declare const index$6_LlmRequest: typeof LlmRequest;
type index$6_LlmResponse = LlmResponse;
declare const index$6_LlmResponse: typeof LlmResponse;
type index$6_OAuth2Credential = OAuth2Credential;
declare const index$6_OAuth2Credential: typeof OAuth2Credential;
type index$6_OAuth2Scheme = OAuth2Scheme;
declare const index$6_OAuth2Scheme: typeof OAuth2Scheme;
type index$6_OAuthFlow = OAuthFlow;
type index$6_OAuthFlows = OAuthFlows;
type index$6_OpenAILLMConfig = OpenAILLMConfig;
type index$6_OpenAiLlm = OpenAiLlm;
declare const index$6_OpenAiLlm: typeof OpenAiLlm;
type index$6_OpenIdConnectScheme = OpenIdConnectScheme;
declare const index$6_OpenIdConnectScheme: typeof OpenIdConnectScheme;
type index$6_SearchMemoryResponse = SearchMemoryResponse;
type index$6_Session = Session;
type index$6_State = State;
declare const index$6_State: typeof State;
type index$6_ThinkingConfig = ThinkingConfig;
declare const index$6_registerProviders: typeof registerProviders;
declare namespace index$6 {
  export { index$6_AiSdkLlm as AiSdkLlm, index$6_AnthropicLlm as AnthropicLlm, index$6_ApiKeyCredential as ApiKeyCredential, index$6_ApiKeyScheme as ApiKeyScheme, index$6_AuthConfig as AuthConfig, index$6_AuthCredential as AuthCredential, index$6_AuthCredentialType as AuthCredentialType, index$6_AuthHandler as AuthHandler, index$6_AuthScheme as AuthScheme, index$6_AuthSchemeType as AuthSchemeType, index$6_BaseLLMConnection as BaseLLMConnection, index$6_BaseLlm as BaseLlm, type index$6_BaseMemoryService as BaseMemoryService, index$6_BasicAuthCredential as BasicAuthCredential, index$6_BearerTokenCredential as BearerTokenCredential, index$6_Blob as Blob, index$6_Content as Content, index$6_FunctionDeclaration as FunctionDeclaration, index$6_GoogleLlm as GoogleLlm, index$6_HttpScheme as HttpScheme, Schema as JSONSchema, index$6_LLMRegistry as LLMRegistry, type index$6_LlmModel as LlmModel, type index$6_LlmModelConfig as LlmModelConfig, index$6_LlmRequest as LlmRequest, index$6_LlmResponse as LlmResponse, index$6_OAuth2Credential as OAuth2Credential, index$6_OAuth2Scheme as OAuth2Scheme, type index$6_OAuthFlow as OAuthFlow, type index$6_OAuthFlows as OAuthFlows, type index$6_OpenAILLMConfig as OpenAILLMConfig, index$6_OpenAiLlm as OpenAiLlm, index$6_OpenIdConnectScheme as OpenIdConnectScheme, type index$6_SearchMemoryResponse as SearchMemoryResponse, type index$6_Session as Session, index$6_State as State, type index$6_ThinkingConfig as ThinkingConfig, index$6_registerProviders as registerProviders };
}

/**
 * Options for creating an Event.
 */
interface EventOpts {
    invocationId?: string;
    author: string;
    actions?: EventActions;
    longRunningToolIds?: Set<string>;
    branch?: string;
    id?: string;
    timestamp?: number;
    content?: any;
    partial?: boolean;
}
/**
 * Represents an event in a conversation between agents and users.
 * It is used to store the content of the conversation, as well as the actions
 * taken by the agents like function calls, etc.
 */
declare class Event extends LlmResponse {
    /** The invocation ID of the event. */
    invocationId: string;
    /** 'user' or the name of the agent, indicating who appended the event to the session. */
    author: string;
    /** The actions taken by the agent. */
    actions: EventActions;
    /**
     * Set of ids of the long running function calls.
     * Agent client will know from this field about which function call is long running.
     * Only valid for function call event.
     */
    longRunningToolIds?: Set<string>;
    /**
     * The branch of the event.
     * The format is like agent_1.agent_2.agent_3, where agent_1 is the parent of
     * agent_2, and agent_2 is the parent of agent_3. Branch is used when multiple
     * sub-agents shouldn't see their peer agents' conversation history.
     */
    branch?: string;
    /** The unique identifier of the event. */
    id: string;
    /** The timestamp of the event (seconds since epoch). */
    timestamp: number;
    /**
     * Constructor for Event.
     */
    constructor(opts: EventOpts);
    /**
     * Returns whether the event is the final response of the agent.
     */
    isFinalResponse(): boolean;
    /**
     * Returns the function calls in the event.
     */
    getFunctionCalls(): any[];
    /**
     * Returns the function responses in the event.
     */
    getFunctionResponses(): any[];
    /**
     * Returns whether the event has a trailing code execution result.
     */
    hasTrailingCodeExecutionResult(): boolean;
    /**
     * Generates a new random ID for an event.
     */
    static newId(): string;
}

/**
 * Single agent callback type
 */
type SingleAgentCallback = (callbackContext: CallbackContext) => Promise<Content | undefined> | Content | undefined;
/**
 * Before agent callback type
 */
type BeforeAgentCallback = SingleAgentCallback | SingleAgentCallback[];
/**
 * After agent callback type
 */
type AfterAgentCallback = SingleAgentCallback | SingleAgentCallback[];
/**
 * Base class for all agents in Agent Development Kit.
 */
declare abstract class BaseAgent {
    /**
     * The agent's name.
     * Agent name must be a valid identifier and unique within the agent tree.
     * Agent name cannot be "user", since it's reserved for end-user's input.
     */
    name: string;
    /**
     * Description about the agent's capability.
     * The model uses this to determine whether to delegate control to the agent.
     * One-line description is enough and preferred.
     */
    description: string;
    /**
     * The parent agent of this agent.
     * Note that an agent can ONLY be added as sub-agent once.
     * If you want to add one agent twice as sub-agent, consider to create two agent
     * instances with identical config, but with different name and add them to the
     * agent tree.
     */
    parentAgent?: BaseAgent;
    /**
     * The sub-agents of this agent.
     */
    subAgents: BaseAgent[];
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
    beforeAgentCallback?: BeforeAgentCallback;
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
    afterAgentCallback?: AfterAgentCallback;
    /**
     * Constructor for BaseAgent
     */
    constructor(config: {
        name: string;
        description?: string;
        subAgents?: BaseAgent[];
        beforeAgentCallback?: BeforeAgentCallback;
        afterAgentCallback?: AfterAgentCallback;
    });
    /**
     * Entry method to run an agent via text-based conversation.
     */
    runAsync(parentContext: InvocationContext): AsyncGenerator<Event, void, unknown>;
    /**
     * Entry method to run an agent via video/audio-based conversation.
     */
    runLive(parentContext: InvocationContext): AsyncGenerator<Event, void, unknown>;
    /**
     * Internal implementation for runAsync
     */
    private runAsyncInternal;
    /**
     * Internal implementation for runLive
     */
    private runLiveInternal;
    /**
     * Core logic to run this agent via text-based conversation.
     *
     * @param ctx - The invocation context for this agent.
     * @yields Event - The events generated by the agent.
     */
    protected runAsyncImpl(_ctx: InvocationContext): AsyncGenerator<Event, void, unknown>;
    /**
     * Core logic to run this agent via video/audio-based conversation.
     *
     * @param ctx - The invocation context for this agent.
     * @yields Event - The events generated by the agent.
     */
    protected runLiveImpl(_ctx: InvocationContext): AsyncGenerator<Event, void, unknown>;
    /**
     * Gets the root agent of this agent.
     */
    get rootAgent(): BaseAgent;
    /**
     * Finds the agent with the given name in this agent and its descendants.
     *
     * @param name - The name of the agent to find.
     * @returns The agent with the matching name, or undefined if no such agent is found.
     */
    findAgent(name: string): BaseAgent | undefined;
    /**
     * Finds the agent with the given name in this agent's descendants.
     *
     * @param name - The name of the agent to find.
     * @returns The agent with the matching name, or undefined if no such agent is found.
     */
    findSubAgent(name: string): BaseAgent | undefined;
    /**
     * Creates a new invocation context for this agent.
     */
    private createInvocationContext;
    /**
     * The resolved beforeAgentCallback field as a list of SingleAgentCallback.
     * This method is only for use by Agent Development Kit.
     */
    get canonicalBeforeAgentCallbacks(): SingleAgentCallback[];
    /**
     * The resolved afterAgentCallback field as a list of SingleAgentCallback.
     * This method is only for use by Agent Development Kit.
     */
    get canonicalAfterAgentCallbacks(): SingleAgentCallback[];
    /**
     * Runs the beforeAgentCallback if it exists.
     *
     * @returns An event if callback provides content or changed state.
     */
    private handleBeforeAgentCallback;
    /**
     * Runs the afterAgentCallback if it exists.
     *
     * @returns An event if callback provides content or changed state.
     */
    private handleAfterAgentCallback;
    /**
     * Validates the agent name.
     */
    private validateName;
    /**
     * Sets parent agent for sub-agents.
     */
    private setParentAgentForSubAgents;
}

/**
 * Configuration for SequentialAgent
 */
interface SequentialAgentConfig {
    /**
     * Name of the agent
     */
    name: string;
    /**
     * Description of the agent
     */
    description: string;
    /**
     * Sub-agents to execute in sequence
     */
    subAgents?: BaseAgent[];
}
/**
 * A shell agent that runs its sub-agents in sequence.
 */
declare class SequentialAgent extends BaseAgent {
    /**
     * Constructor for SequentialAgent
     */
    constructor(config: SequentialAgentConfig);
    /**
     * Core logic to run this agent via text-based conversation
     */
    protected runAsyncImpl(ctx: InvocationContext): AsyncGenerator<Event, void, unknown>;
    /**
     * Core logic to run this agent via video/audio-based conversation
     *
     * Compared to the non-live case, live agents process a continuous stream of audio
     * or video, so there is no way to tell if it's finished and should pass
     * to the next agent or not. So we introduce a task_completed() function so the
     * model can call this function to signal that it's finished the task and we
     * can move on to the next agent.
     */
    protected runLiveImpl(ctx: InvocationContext): AsyncGenerator<Event, void, unknown>;
}

/**
 * Create isolated branch for every sub-agent.
 */
declare function createBranchContextForSubAgent(agent: BaseAgent, subAgent: BaseAgent, invocationContext: InvocationContext): InvocationContext;
/**
 * Merges the agent run event generator.
 *
 * This implementation guarantees for each agent, it won't move on until the
 * generated event is processed by upstream runner.
 */
declare function mergeAgentRun(agentRuns: AsyncGenerator<Event, void, unknown>[]): AsyncGenerator<Event, void, unknown>;
/**
 * Configuration for ParallelAgent
 */
interface ParallelAgentConfig {
    /**
     * Name of the agent
     */
    name: string;
    /**
     * Description of the agent
     */
    description: string;
    /**
     * Sub-agents to execute in parallel
     */
    subAgents?: BaseAgent[];
}
/**
 * A shell agent that run its sub-agents in parallel in isolated manner.
 *
 * This approach is beneficial for scenarios requiring multiple perspectives or
 * attempts on a single task, such as:
 *
 * - Running different algorithms simultaneously.
 * - Generating multiple responses for review by a subsequent evaluation agent.
 */
declare class ParallelAgent extends BaseAgent {
    /**
     * Constructor for ParallelAgent
     */
    constructor(config: ParallelAgentConfig);
    /**
     * Core logic to run this agent via text-based conversation
     */
    protected runAsyncImpl(ctx: InvocationContext): AsyncGenerator<Event, void, unknown>;
    /**
     * Core logic to run this agent via video/audio-based conversation
     */
    protected runLiveImpl(_ctx: InvocationContext): AsyncGenerator<Event, void, unknown>;
}

/**
 * Configuration for LoopAgent
 */
interface LoopAgentConfig {
    /**
     * Name of the agent
     */
    name: string;
    /**
     * Description of the agent
     */
    description: string;
    /**
     * Sub-agents to execute in a loop
     */
    subAgents?: BaseAgent[];
    /**
     * The maximum number of iterations to run the loop agent.
     * If not set, the loop agent will run indefinitely until a sub-agent escalates.
     */
    maxIterations?: number;
}
/**
 * A shell agent that run its sub-agents in a loop.
 *
 * When sub-agent generates an event with escalate or max_iterations are
 * reached, the loop agent will stop.
 */
declare class LoopAgent extends BaseAgent {
    /**
     * The maximum number of iterations to run the loop agent.
     * If not set, the loop agent will run indefinitely until a sub-agent escalates.
     */
    maxIterations?: number;
    /**
     * Constructor for LoopAgent
     */
    constructor(config: LoopAgentConfig);
    /**
     * Core logic to run this agent via text-based conversation
     */
    protected runAsyncImpl(ctx: InvocationContext): AsyncGenerator<Event, void, unknown>;
    /**
     * Core logic to run this agent via video/audio-based conversation
     */
    protected runLiveImpl(_ctx: InvocationContext): AsyncGenerator<Event, void, unknown>;
}

/**
 * Represents a node in a LangGraph workflow
 */
interface LangGraphNode {
    /**
     * Name of the node
     */
    name: string;
    /**
     * Agent associated with this node
     */
    agent: BaseAgent;
    /**
     * Target nodes to execute after this node
     */
    targets?: string[];
    /**
     * Condition function to determine if this node should execute
     */
    condition?: (lastEvent: Event, context: InvocationContext) => boolean | Promise<boolean>;
}
/**
 * Configuration for LangGraphAgent
 */
interface LangGraphAgentConfig {
    /**
     * Name of the agent
     */
    name: string;
    /**
     * Description of the agent
     */
    description: string;
    /**
     * Graph nodes (agents and their connections)
     */
    nodes: LangGraphNode[];
    /**
     * Root node to start execution from
     */
    rootNode: string;
    /**
     * Maximum number of steps to prevent infinite loops
     */
    maxSteps?: number;
}
/**
 * LangGraphAgent that implements a directed graph of agents
 * Allows complex workflows with conditional branching
 */
declare class LangGraphAgent extends BaseAgent {
    /**
     * Graph nodes (agents and their connections)
     */
    private nodes;
    /**
     * Root node to start execution from
     */
    private rootNode;
    /**
     * Maximum number of steps to prevent infinite loops
     */
    private maxSteps;
    /**
     * Results from node executions
     */
    private results;
    protected logger: Logger;
    /**
     * Constructor for LangGraphAgent
     */
    constructor(config: LangGraphAgentConfig);
    /**
     * Validates the graph for potential issues
     */
    private validateGraph;
    /**
     * Gets the next nodes to execute based on the current node and its result
     */
    private getNextNodes;
    /**
     * Core logic to run this agent via text-based conversation.
     */
    protected runAsyncImpl(context: InvocationContext): AsyncGenerator<Event, void, unknown>;
    /**
     * Core logic to run this agent via video/audio-based conversation.
     * For LangGraph, this follows the same execution pattern as text-based.
     */
    protected runLiveImpl(context: InvocationContext): AsyncGenerator<Event, void, unknown>;
    /**
     * Gets the execution results from the last run
     */
    getExecutionResults(): Array<{
        node: string;
        events: Event[];
    }>;
    /**
     * Clears the execution history
     */
    clearExecutionHistory(): void;
    /**
     * Gets all nodes in the graph
     */
    getNodes(): LangGraphNode[];
    /**
     * Gets a specific node by name
     */
    getNode(name: string): LangGraphNode | undefined;
    /**
     * Gets the root node name
     */
    getRootNodeName(): string;
    /**
     * Gets the maximum steps configuration
     */
    getMaxSteps(): number;
    /**
     * Updates the maximum steps configuration
     */
    setMaxSteps(maxSteps: number): void;
}

/**
 * Configuration options for the AgentBuilder
 */
interface AgentBuilderConfig {
    name: string;
    model?: string | BaseLlm | LanguageModel;
    description?: string;
    instruction?: string;
    tools?: BaseTool[];
    planner?: BasePlanner;
    codeExecutor?: BaseCodeExecutor;
    subAgents?: BaseAgent[];
    beforeAgentCallback?: BeforeAgentCallback;
    afterAgentCallback?: AfterAgentCallback;
    maxIterations?: number;
    nodes?: LangGraphNode[];
    rootNode?: string;
    outputKey?: string;
    inputSchema?: ZodSchema;
    outputSchema?: ZodSchema;
}
/**
 * Message part interface for flexible message input
 */
interface MessagePart extends Part {
    image?: string;
}
/**
 * Full message interface for advanced usage
 */
interface FullMessage extends Content {
    parts?: MessagePart[];
}
/**
 * Session configuration options
 */
interface SessionOptions {
    userId?: string;
    appName?: string;
    state?: Record<string, any>;
    sessionId?: string;
}
/**
 * Multi-agent standardized response type
 */
type MultiAgentResponse = {
    agent: string;
    response: string;
}[];
/** Helper conditional type for ask() return */
type RunnerAskReturn<T, M extends boolean> = M extends true ? MultiAgentResponse : T;
/**
 * Enhanced runner interface with simplified API and conditional typing.
 * M (multi) flag determines if ask() returns a multi-agent response array.
 */
interface EnhancedRunner<T = string, M extends boolean = false> {
    ask(message: string | FullMessage | LlmRequest): Promise<RunnerAskReturn<T, M>>;
    runAsync(params: {
        userId: string;
        sessionId: string;
        newMessage: FullMessage;
        runConfig?: RunConfig;
    }): AsyncIterable<Event>;
    __outputSchema?: ZodSchema;
}
/**
 * Built agent result containing the agent and runner/session
 */
interface BuiltAgent<T = string, M extends boolean = false> {
    agent: BaseAgent;
    runner: EnhancedRunner<T, M>;
    session: Session;
    sessionService: BaseSessionService;
}
/**
 * Agent types that can be built
 */
type AgentType = "llm" | "sequential" | "parallel" | "loop" | "langgraph";
/**
 * AgentBuilder with typed output schema
 */
interface AgentBuilderWithSchema<T, M extends boolean = false> extends Omit<AgentBuilder<any, any>, "build" | "ask" | "withOutputSchema"> {
    build(): Promise<BuiltAgent<T, M>>;
    buildWithSchema<U = T>(): Promise<BuiltAgent<U, M>>;
    ask(message: string | FullMessage): Promise<RunnerAskReturn<T, M>>;
}
/**
 * AgentBuilder - A fluent interface for creating AI agents with automatic session management
 *
 * Provides a simple, chainable API for building different types of agents (LLM, Sequential,
 * Parallel, Loop, LangGraph) with tools, custom instructions, and multi-agent workflows.
 * Sessions are automatically created using in-memory storage by default.
 *
 * @example
 * ```typescript
 * // Simple usage
 * const response = await AgentBuilder.withModel("gemini-2.5-flash").ask("Hello");
 *
 * // With tools and instructions
 * const { runner } = await AgentBuilder
 *   .create("research-agent")
 *   .withModel("gemini-2.5-flash")
 *   .withTools(new GoogleSearch())
 *   .withInstruction("You are a research assistant")
 *   .build();
 *
 * // With code executor for running code
 * const { runner } = await AgentBuilder
 *   .create("code-agent")
 *   .withModel("gemini-2.5-flash")
 *   .withCodeExecutor(new ContainerCodeExecutor())
 *   .withInstruction("You can execute code to solve problems")
 *   .build();
 *
 * // With memory and artifact services
 * const { runner } = await AgentBuilder
 *   .create("persistent-agent")
 *   .withModel("gemini-2.5-flash")
 *   .withMemory(new RedisMemoryService())
 *   .withArtifactService(new S3ArtifactService())
 *   .withSessionService(new DatabaseSessionService(), { userId: "user123", appName: "myapp" })
 *   .build();
 *
 * // Multi-agent workflow
 * const { runner } = await AgentBuilder
 *   .create("workflow")
 *   .asSequential([agent1, agent2])
 *   .build();
 * ```
 */
declare class AgentBuilder<TOut = string, TMulti extends boolean = false> {
    private config;
    private sessionService?;
    private sessionOptions?;
    private memoryService?;
    private artifactService?;
    private agentType;
    private existingSession?;
    private existingAgent?;
    private definitionLocked;
    private logger;
    private runConfig?;
    /**
     * Warn (once per method) if the definition has been locked by withAgent().
     */
    private warnIfLocked;
    /**
     * Private constructor - use static create() method
     */
    private constructor();
    /**
     * Create a new AgentBuilder instance
     * @param name The name of the agent (defaults to "default_agent")
     * @returns New AgentBuilder instance
     */
    static create(name?: string): AgentBuilder<string, false>;
    /**
     * Convenience method to start building with a model directly
     * @param model The model identifier (e.g., "gemini-2.5-flash")
     * @returns New AgentBuilder instance with model set
     */
    static withModel(model: string | BaseLlm | LanguageModel): AgentBuilder<string, false>;
    /**
     * Set the model for the agent
     * @param model The model identifier (e.g., "gemini-2.5-flash")
     * @returns This builder instance for chaining
     */
    withModel(model: string | BaseLlm | LanguageModel): this;
    /**
     * Set the description for the agent
     * @param description Agent description
     * @returns This builder instance for chaining
     */
    withDescription(description: string): this;
    /**
     * Set the instruction for the agent
     * @param instruction System instruction for the agent
     * @returns This builder instance for chaining
     */
    withInstruction(instruction: string): this;
    withInputSchema(schema: ZodSchema): this;
    withOutputSchema<T>(schema: ZodType<T>): AgentBuilderWithSchema<T, TMulti>;
    /**
     * Add tools to the agent
     * @param tools Tools to add to the agent
     * @returns This builder instance for chaining
     */
    withTools(...tools: BaseTool[]): this;
    /**
     * Set the planner for the agent
     * @param planner The planner to use
     * @returns This builder instance for chaining
     */
    withPlanner(planner: BasePlanner): this;
    /**
     * Set the code executor for the agent
     * @param codeExecutor The code executor to use for running code
     * @returns This builder instance for chaining
     */
    withCodeExecutor(codeExecutor: BaseCodeExecutor): this;
    /**
     * Set the output key for the agent
     * @param outputKey The output key in session state to store the output of the agent
     * @returns This builder instance for chaining
     */
    withOutputKey(outputKey: string): this;
    /**
     * Add sub-agents to the agent
     * @param subAgents Sub-agents to add to the agent
     * @returns This builder instance for chaining
     */
    withSubAgents(subAgents: BaseAgent[]): this;
    /**
     * Set the before agent callback
     * @param callback Callback to invoke before agent execution
     * @returns This builder instance for chaining
     */
    withBeforeAgentCallback(callback: BeforeAgentCallback): this;
    /**
     * Set the after agent callback
     * @param callback Callback to invoke after agent execution
     * @returns This builder instance for chaining
     */
    withAfterAgentCallback(callback: AfterAgentCallback): this;
    /**
     * Provide an already constructed agent instance. Further definition-mutating calls
     * (model/tools/instruction/etc.) will be ignored with a dev warning.
     */
    withAgent(agent: BaseAgent): this;
    /**
     * Configure as a sequential agent
     * @param subAgents Sub-agents to execute in sequence
     * @returns This builder instance for chaining
     */
    asSequential(subAgents: BaseAgent[]): AgentBuilder<TOut, true>;
    /**
     * Configure as a parallel agent
     * @param subAgents Sub-agents to execute in parallel
     * @returns This builder instance for chaining
     */
    asParallel(subAgents: BaseAgent[]): AgentBuilder<TOut, true>;
    /**
     * Configure as a loop agent
     * @param subAgents Sub-agents to execute iteratively
     * @param maxIterations Maximum number of iterations
     * @returns This builder instance for chaining
     */
    asLoop(subAgents: BaseAgent[], maxIterations?: number): this;
    /**
     * Configure as a LangGraph agent
     * @param nodes Graph nodes defining the workflow
     * @param rootNode The starting node name
     * @returns This builder instance for chaining
     */
    asLangGraph(nodes: LangGraphNode[], rootNode: string): this;
    /**
     * Configure session management with optional smart defaults
     * @param service Session service to use
     * @param options Session configuration options (userId and appName)
     * @returns This builder instance for chaining
     */
    withSessionService(service: BaseSessionService, options?: SessionOptions): this;
    /**
     * Configure with an existing session instance
     * @param session Existing session to use
     * @returns This builder instance for chaining
     * @throws Error if no session service has been configured via withSessionService()
     */
    withSession(session: Session): this;
    /**
     * Configure memory service for the agent
     * @param memoryService Memory service to use for conversation history and context
     * @returns This builder instance for chaining
     */
    withMemory(memoryService: BaseMemoryService): this;
    /**
     * Configure artifact service for the agent
     * @param artifactService Artifact service to use for managing generated artifacts
     * @returns This builder instance for chaining
     */
    withArtifactService(artifactService: BaseArtifactService): this;
    /**
     * Configure runtime behavior for runs
     */
    withRunConfig(config: RunConfig | Partial<RunConfig>): this;
    /**
     * Configure with an in-memory session with custom IDs
     * Note: In-memory sessions are created automatically by default, use this only if you need custom appName/userId
     * @param options Session configuration options (userId and appName)
     * @returns This builder instance for chaining
     */
    withQuickSession(options?: SessionOptions): this;
    /**
     * Build the agent and optionally create runner and session
     * @returns Built agent with optional runner and session
     */
    build<T = TOut>(): Promise<BuiltAgent<T, TMulti>>;
    /**
     * Type-safe build method for agents with output schemas
     * Provides better type inference for the ask method return type
     */
    buildWithSchema<T>(): Promise<BuiltAgent<T, TMulti>>;
    /**
     * Quick execution helper - build and run a message
     * @param message Message to send to the agent (string or full message object)
     * @returns Agent response
     */
    ask(message: string | FullMessage): Promise<RunnerAskReturn<TOut, TMulti>>;
    /**
     * Create the appropriate agent type based on configuration
     * @returns Created agent instance
     */
    private createAgent;
    /**
     * Generate default user ID based on agent name and id
     * @returns Generated user ID
     */
    private generateDefaultUserId;
    /**
     * Generate default app name based on agent name
     * @returns Generated app name
     */
    private generateDefaultAppName;
    /**
     * Create enhanced runner with simplified API and proper typing
     * @param baseRunner The base runner instance
     * @param session The session instance
     * @returns Enhanced runner with simplified API
     */
    private createEnhancedRunner;
}

type index$5_AfterAgentCallback = AfterAgentCallback;
type index$5_AfterModelCallback = AfterModelCallback;
type index$5_AfterToolCallback = AfterToolCallback;
type index$5_AgentBuilder<TOut = string, TMulti extends boolean = false> = AgentBuilder<TOut, TMulti>;
declare const index$5_AgentBuilder: typeof AgentBuilder;
type index$5_AgentBuilderConfig = AgentBuilderConfig;
type index$5_AgentBuilderWithSchema<T, M extends boolean = false> = AgentBuilderWithSchema<T, M>;
type index$5_AgentType = AgentType;
type index$5_BaseAgent = BaseAgent;
declare const index$5_BaseAgent: typeof BaseAgent;
type index$5_BeforeAgentCallback = BeforeAgentCallback;
type index$5_BeforeModelCallback = BeforeModelCallback;
type index$5_BeforeToolCallback = BeforeToolCallback;
type index$5_BuiltAgent<T = string, M extends boolean = false> = BuiltAgent<T, M>;
type index$5_CallbackContext = CallbackContext;
declare const index$5_CallbackContext: typeof CallbackContext;
type index$5_EnhancedRunner<T = string, M extends boolean = false> = EnhancedRunner<T, M>;
type index$5_FullMessage = FullMessage;
type index$5_InstructionProvider = InstructionProvider;
type index$5_InvocationContext = InvocationContext;
declare const index$5_InvocationContext: typeof InvocationContext;
type index$5_LangGraphAgent = LangGraphAgent;
declare const index$5_LangGraphAgent: typeof LangGraphAgent;
type index$5_LangGraphAgentConfig = LangGraphAgentConfig;
type index$5_LangGraphNode = LangGraphNode;
type index$5_LlmAgent<T extends BaseLlm = BaseLlm> = LlmAgent<T>;
declare const index$5_LlmAgent: typeof LlmAgent;
type index$5_LlmAgentConfig<T extends BaseLlm = BaseLlm> = LlmAgentConfig<T>;
type index$5_LlmCallsLimitExceededError = LlmCallsLimitExceededError;
declare const index$5_LlmCallsLimitExceededError: typeof LlmCallsLimitExceededError;
type index$5_LoopAgent = LoopAgent;
declare const index$5_LoopAgent: typeof LoopAgent;
type index$5_LoopAgentConfig = LoopAgentConfig;
type index$5_MessagePart = MessagePart;
type index$5_MultiAgentResponse = MultiAgentResponse;
type index$5_ParallelAgent = ParallelAgent;
declare const index$5_ParallelAgent: typeof ParallelAgent;
type index$5_ParallelAgentConfig = ParallelAgentConfig;
type index$5_ReadonlyContext = ReadonlyContext;
declare const index$5_ReadonlyContext: typeof ReadonlyContext;
type index$5_RunConfig = RunConfig;
declare const index$5_RunConfig: typeof RunConfig;
type index$5_RunnerAskReturn<T, M extends boolean> = RunnerAskReturn<T, M>;
type index$5_SequentialAgent = SequentialAgent;
declare const index$5_SequentialAgent: typeof SequentialAgent;
type index$5_SequentialAgentConfig = SequentialAgentConfig;
type index$5_SessionOptions = SessionOptions;
type index$5_SingleAfterModelCallback = SingleAfterModelCallback;
type index$5_SingleAfterToolCallback = SingleAfterToolCallback;
type index$5_SingleAgentCallback = SingleAgentCallback;
type index$5_SingleBeforeModelCallback = SingleBeforeModelCallback;
type index$5_SingleBeforeToolCallback = SingleBeforeToolCallback;
type index$5_StreamingMode = StreamingMode;
declare const index$5_StreamingMode: typeof StreamingMode;
type index$5_ToolUnion = ToolUnion;
declare const index$5_createBranchContextForSubAgent: typeof createBranchContextForSubAgent;
declare const index$5_mergeAgentRun: typeof mergeAgentRun;
declare const index$5_newInvocationContextId: typeof newInvocationContextId;
declare namespace index$5 {
  export { type index$5_AfterAgentCallback as AfterAgentCallback, type index$5_AfterModelCallback as AfterModelCallback, type index$5_AfterToolCallback as AfterToolCallback, LlmAgent as Agent, index$5_AgentBuilder as AgentBuilder, type index$5_AgentBuilderConfig as AgentBuilderConfig, type index$5_AgentBuilderWithSchema as AgentBuilderWithSchema, type index$5_AgentType as AgentType, index$5_BaseAgent as BaseAgent, type index$5_BeforeAgentCallback as BeforeAgentCallback, type index$5_BeforeModelCallback as BeforeModelCallback, type index$5_BeforeToolCallback as BeforeToolCallback, type index$5_BuiltAgent as BuiltAgent, index$5_CallbackContext as CallbackContext, type index$5_EnhancedRunner as EnhancedRunner, type index$5_FullMessage as FullMessage, type index$5_InstructionProvider as InstructionProvider, index$5_InvocationContext as InvocationContext, index$5_LangGraphAgent as LangGraphAgent, type index$5_LangGraphAgentConfig as LangGraphAgentConfig, type index$5_LangGraphNode as LangGraphNode, index$5_LlmAgent as LlmAgent, type index$5_LlmAgentConfig as LlmAgentConfig, index$5_LlmCallsLimitExceededError as LlmCallsLimitExceededError, index$5_LoopAgent as LoopAgent, type index$5_LoopAgentConfig as LoopAgentConfig, type index$5_MessagePart as MessagePart, type index$5_MultiAgentResponse as MultiAgentResponse, index$5_ParallelAgent as ParallelAgent, type index$5_ParallelAgentConfig as ParallelAgentConfig, index$5_ReadonlyContext as ReadonlyContext, index$5_RunConfig as RunConfig, type index$5_RunnerAskReturn as RunnerAskReturn, index$5_SequentialAgent as SequentialAgent, type index$5_SequentialAgentConfig as SequentialAgentConfig, type index$5_SessionOptions as SessionOptions, type index$5_SingleAfterModelCallback as SingleAfterModelCallback, type index$5_SingleAfterToolCallback as SingleAfterToolCallback, type index$5_SingleAgentCallback as SingleAgentCallback, type index$5_SingleBeforeModelCallback as SingleBeforeModelCallback, type index$5_SingleBeforeToolCallback as SingleBeforeToolCallback, index$5_StreamingMode as StreamingMode, type index$5_ToolUnion as ToolUnion, index$5_createBranchContextForSubAgent as createBranchContextForSubAgent, index$5_mergeAgentRun as mergeAgentRun, index$5_newInvocationContextId as newInvocationContextId };
}

/**
 * An in-memory memory service for prototyping purpose only.
 * Uses keyword matching instead of semantic search.
 */
declare class InMemoryMemoryService implements BaseMemoryService {
    /**
     * Keys are app_name/user_id, session_id. Values are session event lists.
     */
    private _sessionEvents;
    /**
     * Constructor for InMemoryMemoryService
     */
    constructor();
    /**
     * Adds a session to the memory service
     * @param session The session to add
     */
    addSessionToMemory(session: Session): Promise<void>;
    /**
     * Searches memory for relevant information
     * @param options Search options containing app_name, user_id, and query
     * @returns Search results
     */
    searchMemory(options: {
        appName: string;
        userId: string;
        query: string;
    }): Promise<SearchMemoryResponse>;
    /**
     * Gets all sessions in the memory service (for backward compatibility)
     * @returns All sessions - Note: This method may not be fully compatible with the new structure
     */
    getAllSessions(): Session[];
    /**
     * Gets a session by ID (for backward compatibility)
     * @param sessionId The session ID
     * @returns The session or undefined if not found
     */
    getSession(sessionId: string): Session | undefined;
    /**
     * Clears all sessions from memory
     */
    clear(): void;
}

/**
 * Memory Services for the Agent Development Kit
 */

type index$4_InMemoryMemoryService = InMemoryMemoryService;
declare const index$4_InMemoryMemoryService: typeof InMemoryMemoryService;
declare namespace index$4 {
  export { index$4_InMemoryMemoryService as InMemoryMemoryService };
}

/**
 * An in-memory implementation of the session service.
 */
declare class InMemorySessionService extends BaseSessionService {
    /**
     * A map from app name to a map from user ID to a map from session ID to session.
     */
    private sessions;
    /**
     * A map from app name to a map from user ID to a map from key to the value.
     */
    private userState;
    /**
     * A map from app name to a map from key to the value.
     */
    private appState;
    /**
     * Creates a new session.
     */
    createSession(appName: string, userId: string, state?: Record<string, any>, sessionId?: string): Promise<Session>;
    /**
     * @deprecated Please migrate to the async method.
     */
    createSessionSync(appName: string, userId: string, state?: Record<string, any>, sessionId?: string): Session;
    private createSessionImpl;
    /**
     * Gets a session.
     */
    getSession(appName: string, userId: string, sessionId: string, config?: GetSessionConfig): Promise<Session | undefined>;
    /**
     * @deprecated Please migrate to the async method.
     */
    getSessionSync(appName: string, userId: string, sessionId: string, config?: GetSessionConfig): Session | undefined;
    private getSessionImpl;
    private mergeState;
    /**
     * Lists all the sessions for a user.
     */
    listSessions(appName: string, userId: string): Promise<ListSessionsResponse>;
    /**
     * @deprecated Please migrate to the async method.
     */
    listSessionsSync(appName: string, userId: string): ListSessionsResponse;
    private listSessionsImpl;
    /**
     * Deletes a session.
     */
    deleteSession(appName: string, userId: string, sessionId: string): Promise<void>;
    /**
     * @deprecated Please migrate to the async method.
     */
    deleteSessionSync(appName: string, userId: string, sessionId: string): void;
    private deleteSessionImpl;
    /**
     * Appends an event to a session object.
     */
    appendEvent(session: Session, event: Event): Promise<Event>;
}

/**
 * Connects to the Vertex AI Agent Engine Session Service using GenAI API client.
 *
 * https://cloud.google.com/vertex-ai/generative-ai/docs/agent-engine/sessions/overview
 */
declare class VertexAiSessionService extends BaseSessionService {
    private readonly project?;
    private readonly location?;
    private readonly agentEngineId?;
    /**
     * Initializes the VertexAiSessionService.
     */
    constructor(options?: {
        project?: string;
        location?: string;
        agentEngineId?: string;
    });
    createSession(appName: string, userId: string, state?: Record<string, any>, sessionId?: string): Promise<Session>;
    getSession(appName: string, userId: string, sessionId: string, config?: GetSessionConfig): Promise<Session | undefined>;
    listSessions(appName: string, userId: string): Promise<ListSessionsResponse>;
    deleteSession(appName: string, userId: string, sessionId: string): Promise<void>;
    appendEvent(session: Session, event: Event): Promise<Event>;
    private getReasoningEngineId;
    private getApiClient;
    private convertEventToJson;
    private fromApiEvent;
    private decodeContent;
    private decodeGroundingMetadata;
}

interface Database {
    sessions: SessionsTable;
    events: EventsTable;
    app_states: AppStatesTable;
    user_states: UserStatesTable;
}
interface SessionsTable {
    id: string;
    app_name: string;
    user_id: string;
    state: string;
    create_time: Generated<Date>;
    update_time: Generated<Date>;
}
interface EventsTable {
    id: string;
    app_name: string;
    user_id: string;
    session_id: string;
    invocation_id: string;
    author: string;
    branch: string | null;
    timestamp: Generated<Date>;
    content: string | null;
    actions: string | null;
    long_running_tool_ids_json: string | null;
    grounding_metadata: string | null;
    partial: boolean | null;
    turn_complete: boolean | null;
    error_code: string | null;
    error_message: string | null;
    interrupted: boolean | null;
}
interface AppStatesTable {
    app_name: string;
    state: string;
    update_time: Generated<Date>;
}
interface UserStatesTable {
    app_name: string;
    user_id: string;
    state: string;
    update_time: Generated<Date>;
}
/**
 * Configuration for DatabaseSessionService
 */
interface DatabaseSessionServiceConfig {
    /**
     * An initialized Kysely database instance
     */
    db: Kysely<Database>;
    /**
     * Optional: Skip automatic table creation if you handle migrations externally
     */
    skipTableCreation?: boolean;
}
declare class DatabaseSessionService extends BaseSessionService {
    private db;
    private initialized;
    constructor(config: DatabaseSessionServiceConfig);
    /**
     * Initialize the database by creating required tables if they don't exist
     */
    private initializeDatabase;
    /**
     * Ensure database is initialized before any operation
     */
    private ensureInitialized;
    private generateSessionId;
    /**
     * Helper to safely parse JSON strings
     */
    private parseJsonSafely;
    /**
     * Convert database timestamp to Unix seconds
     * Handles different timestamp formats from different databases
     */
    private timestampToUnixSeconds;
    createSession(appName: string, userId: string, state?: Record<string, any>, sessionId?: string): Promise<Session>;
    getSession(appName: string, userId: string, sessionId: string, config?: GetSessionConfig): Promise<Session | undefined>;
    updateSession(session: Session): Promise<void>;
    listSessions(appName: string, userId: string): Promise<ListSessionsResponse>;
    deleteSession(appName: string, userId: string, sessionId: string): Promise<void>;
    appendEvent(session: Session, event: Event): Promise<Event>;
    /**
     * Extract state deltas based on prefixes (similar to Python implementation)
     */
    private extractStateDelta;
    /**
     * Merge states for response (similar to Python implementation)
     */
    private mergeState;
    /**
     * Convert Event to storage event format
     */
    private eventToStorageEvent;
    /**
     * Convert storage event to Event format - Fixed to match Event interface
     */
    private storageEventToEvent;
    /**
     * Updates the session state based on the event.
     * Overrides the base class method to work with plain object state.
     */
    protected updateSessionState(session: Session, event: Event): void;
}

declare function createPostgresSessionService(connectionString: string, options?: any): DatabaseSessionService;
declare function createMysqlSessionService(connectionString: string, options?: any): DatabaseSessionService;
declare function createSqliteSessionService(filename: string, options?: any): DatabaseSessionService;
declare function createDatabaseSessionService(databaseUrl: string, options?: any): DatabaseSessionService;

/**
 * Sessions module exports
 */

type index$3_BaseSessionService = BaseSessionService;
declare const index$3_BaseSessionService: typeof BaseSessionService;
type index$3_DatabaseSessionService = DatabaseSessionService;
declare const index$3_DatabaseSessionService: typeof DatabaseSessionService;
type index$3_GetSessionConfig = GetSessionConfig;
type index$3_InMemorySessionService = InMemorySessionService;
declare const index$3_InMemorySessionService: typeof InMemorySessionService;
type index$3_ListSessionsResponse = ListSessionsResponse;
type index$3_Session = Session;
type index$3_State = State;
declare const index$3_State: typeof State;
type index$3_VertexAiSessionService = VertexAiSessionService;
declare const index$3_VertexAiSessionService: typeof VertexAiSessionService;
declare const index$3_createDatabaseSessionService: typeof createDatabaseSessionService;
declare const index$3_createMysqlSessionService: typeof createMysqlSessionService;
declare const index$3_createPostgresSessionService: typeof createPostgresSessionService;
declare const index$3_createSqliteSessionService: typeof createSqliteSessionService;
declare namespace index$3 {
  export { index$3_BaseSessionService as BaseSessionService, index$3_DatabaseSessionService as DatabaseSessionService, type index$3_GetSessionConfig as GetSessionConfig, index$3_InMemorySessionService as InMemorySessionService, type index$3_ListSessionsResponse as ListSessionsResponse, type index$3_Session as Session, index$3_State as State, index$3_VertexAiSessionService as VertexAiSessionService, index$3_createDatabaseSessionService as createDatabaseSessionService, index$3_createMysqlSessionService as createMysqlSessionService, index$3_createPostgresSessionService as createPostgresSessionService, index$3_createSqliteSessionService as createSqliteSessionService };
}

declare class GcsArtifactService implements BaseArtifactService {
    private readonly bucketName;
    private readonly storageClient;
    private readonly bucket;
    constructor(bucketName: string, options?: StorageOptions);
    private fileHasUserNamespace;
    private getBlobName;
    saveArtifact(args: {
        appName: string;
        userId: string;
        sessionId: string;
        filename: string;
        artifact: Part;
    }): Promise<number>;
    loadArtifact(args: {
        appName: string;
        userId: string;
        sessionId: string;
        filename: string;
        version?: number;
    }): Promise<Part | null>;
    listArtifactKeys(args: {
        appName: string;
        userId: string;
        sessionId: string;
    }): Promise<string[]>;
    deleteArtifact(args: {
        appName: string;
        userId: string;
        sessionId: string;
        filename: string;
    }): Promise<void>;
    listVersions(args: {
        appName: string;
        userId: string;
        sessionId: string;
        filename: string;
    }): Promise<number[]>;
}

declare class InMemoryArtifactService implements BaseArtifactService {
    private readonly artifacts;
    private fileHasUserNamespace;
    private getArtifactPath;
    saveArtifact(args: {
        appName: string;
        userId: string;
        sessionId: string;
        filename: string;
        artifact: Part;
    }): Promise<number>;
    loadArtifact(args: {
        appName: string;
        userId: string;
        sessionId: string;
        filename: string;
        version?: number;
    }): Promise<Part | null>;
    listArtifactKeys(args: {
        appName: string;
        userId: string;
        sessionId: string;
    }): Promise<string[]>;
    deleteArtifact(args: {
        appName: string;
        userId: string;
        sessionId: string;
        filename: string;
    }): Promise<void>;
    listVersions(args: {
        appName: string;
        userId: string;
        sessionId: string;
        filename: string;
    }): Promise<number[]>;
}

type index$2_Event = Event;
declare const index$2_Event: typeof Event;
type index$2_EventActions = EventActions;
declare const index$2_EventActions: typeof EventActions;
declare namespace index$2 {
  export { index$2_Event as Event, index$2_EventActions as EventActions };
}

declare abstract class BaseLlmFlow {
    requestProcessors: Array<any>;
    responseProcessors: Array<any>;
    protected logger: Logger;
    runAsync(invocationContext: InvocationContext): AsyncGenerator<Event>;
    runLive(invocationContext: InvocationContext): AsyncGenerator<Event>;
    _runOneStepAsync(invocationContext: InvocationContext): AsyncGenerator<Event>;
    _preprocessAsync(invocationContext: InvocationContext, llmRequest: LlmRequest): AsyncGenerator<Event>;
    _postprocessAsync(invocationContext: InvocationContext, llmRequest: LlmRequest, llmResponse: LlmResponse, modelResponseEvent: Event): AsyncGenerator<Event>;
    _postprocessLive(invocationContext: InvocationContext, llmRequest: LlmRequest, llmResponse: LlmResponse, modelResponseEvent: Event): AsyncGenerator<Event>;
    _postprocessRunProcessorsAsync(invocationContext: InvocationContext, llmResponse: LlmResponse): AsyncGenerator<Event>;
    _postprocessHandleFunctionCallsAsync(invocationContext: InvocationContext, functionCallEvent: Event, llmRequest: LlmRequest): AsyncGenerator<Event>;
    _getAgentToRun(invocationContext: InvocationContext, agentName: string): BaseAgent;
    _callLlmAsync(invocationContext: InvocationContext, llmRequest: LlmRequest, modelResponseEvent: Event): AsyncGenerator<LlmResponse>;
    _handleBeforeModelCallback(invocationContext: InvocationContext, llmRequest: LlmRequest, modelResponseEvent: Event): Promise<LlmResponse | undefined>;
    _handleAfterModelCallback(invocationContext: InvocationContext, llmResponse: LlmResponse, modelResponseEvent: Event): Promise<LlmResponse | undefined>;
    _finalizeModelResponseEvent(llmRequest: LlmRequest, llmResponse: LlmResponse, modelResponseEvent: Event): Event;
    __getLlm(invocationContext: InvocationContext): BaseLlm;
}

/**
 * SingleFlow is the LLM flow that handles tool calls.
 *
 * A single flow only considers an agent itself and tools.
 * No sub-agents are allowed for single flow.
 *
 * This matches the Python implementation's SingleFlow class.
 */
declare class SingleFlow extends BaseLlmFlow {
    /**
     * Constructor for SingleFlow
     */
    constructor();
}

/**
 * AutoFlow is SingleFlow with agent transfer capability.
 *
 * Agent transfer is allowed in the following directions:
 * 1. from parent to sub-agent;
 * 2. from sub-agent to parent;
 * 3. from sub-agent to its peer agents;
 *
 * For peer-agent transfers, it's only enabled when all below conditions are met:
 * - The parent agent is also of AutoFlow;
 * - `disallow_transfer_to_peer` option of this agent is False (default).
 *
 * This matches the Python implementation's AutoFlow class.
 */
declare class AutoFlow extends SingleFlow {
    /**
     * Constructor for AutoFlow
     */
    constructor();
}

/**
 * Basic LLM request processor that handles fundamental request setup.
 * This processor sets up model configuration, output schema, and live connect settings.
 */
declare class BasicLlmRequestProcessor extends BaseLlmRequestProcessor {
    runAsync(invocationContext: InvocationContext, llmRequest: LlmRequest): AsyncGenerator<Event, void, unknown>;
    /**
     * Type guard to check if agent is an LlmAgent
     */
    private isLlmAgent;
}
/**
 * Exported instance of the basic request processor
 */
declare const requestProcessor$6: BasicLlmRequestProcessor;

/**
 * Identity LLM request processor that gives the agent identity from the framework.
 * This processor adds the agent's name and description to the system instructions.
 */
declare class IdentityLlmRequestProcessor extends BaseLlmRequestProcessor {
    runAsync(invocationContext: InvocationContext, llmRequest: LlmRequest): AsyncGenerator<Event, void, unknown>;
}
/**
 * Exported instance of the identity request processor
 */
declare const requestProcessor$5: IdentityLlmRequestProcessor;

/**
 * Instructions LLM request processor that handles instructions and global instructions.
 * This processor adds both global instructions (from root agent) and agent-specific instructions.
 */
declare class InstructionsLlmRequestProcessor extends BaseLlmRequestProcessor {
    runAsync(invocationContext: InvocationContext, llmRequest: LlmRequest): AsyncGenerator<Event, void, unknown>;
    /**
     * Type guard to check if agent is an LlmAgent
     */
    private isLlmAgent;
}
/**
 * Exported instance of the instructions request processor
 */
declare const requestProcessor$4: InstructionsLlmRequestProcessor;

/**
 * Content LLM request processor that builds the contents for the LLM request.
 * This processor handles event filtering, rearrangement, and content building.
 */
declare class ContentLlmRequestProcessor extends BaseLlmRequestProcessor {
    runAsync(invocationContext: InvocationContext, llmRequest: LlmRequest): AsyncGenerator<Event, void, unknown>;
    /**
     * Type guard to check if agent is an LlmAgent
     */
    private isLlmAgent;
}
/**
 * Exported instance of the content request processor
 */
declare const requestProcessor$3: ContentLlmRequestProcessor;

/**
 * Agent transfer request processor that enables agent transfer functionality
 * for AutoFlow by adding transfer instructions and tools to the LLM request
 */
declare class AgentTransferLlmRequestProcessor extends BaseLlmRequestProcessor {
    /**
     * Processes agent transfer by adding transfer instructions and tools
     * if the agent has transfer targets available
     */
    runAsync(invocationContext: InvocationContext, llmRequest: LlmRequest): AsyncGenerator<Event>;
}
/**
 * Exported request processor instance for use in AutoFlow
 */
declare const requestProcessor$2: AgentTransferLlmRequestProcessor;

/**
 * Request processor for Natural Language Planning
 * Applies planning instructions and configurations to LLM requests
 */
declare class NlPlanningRequestProcessor extends BaseLlmRequestProcessor {
    runAsync(invocationContext: InvocationContext, llmRequest: LlmRequest): AsyncGenerator<Event>;
}
/**
 * Response processor for Natural Language Planning
 * Processes LLM responses to handle planning content and state updates
 */
declare class NlPlanningResponseProcessor extends BaseLlmResponseProcessor {
    runAsync(invocationContext: InvocationContext, llmResponse: LlmResponse): AsyncGenerator<Event>;
}
/**
 * Exported request processor instance for use in flow configurations
 */
declare const requestProcessor$1: NlPlanningRequestProcessor;
/**
 * Exported response processor instance for use in flow configurations
 */
declare const responseProcessor$1: NlPlanningResponseProcessor;

/**
 * The persistent context used to configure the code executor.
 */
declare class CodeExecutorContext {
    private readonly context;
    private readonly sessionState;
    constructor(sessionState: State);
    /**
     * Gets the state delta to update in the persistent session state.
     */
    getStateDelta(): Record<string, any>;
    /**
     * Gets the session ID for the code executor.
     */
    getExecutionId(): string | null;
    /**
     * Sets the session ID for the code executor.
     */
    setExecutionId(sessionId: string): void;
    /**
     * Gets the processed file names from the session state.
     */
    getProcessedFileNames(): string[];
    /**
     * Adds the processed file names to the session state.
     */
    addProcessedFileNames(fileNames: string[]): void;
    /**
     * Gets the code executor input files from the session state.
     */
    getInputFiles(): File[];
    /**
     * Adds the input files to the code executor context.
     */
    addInputFiles(inputFiles: File[]): void;
    /**
     * Removes the input files and processed file names from the code executor context.
     */
    clearInputFiles(): void;
    /**
     * Gets the error count from the session state.
     */
    getErrorCount(invocationId: string): number;
    /**
     * Increments the error count for the given invocation ID.
     */
    incrementErrorCount(invocationId: string): void;
    /**
     * Resets the error count for the given invocation ID.
     */
    resetErrorCount(invocationId: string): void;
    /**
     * Updates the code execution result.
     */
    updateCodeExecutionResult(invocationId: string, code: string, resultStdout: string, resultStderr: string): void;
    /**
     * Gets the code executor context from the session state.
     */
    private getCodeExecutorContext;
}

/**
 * Request processor for code execution
 */
declare class CodeExecutionRequestProcessor extends BaseLlmRequestProcessor {
    runAsync(invocationContext: InvocationContext, llmRequest: LlmRequest): AsyncGenerator<Event>;
}
/**
 * Response processor for code execution
 */
declare class CodeExecutionResponseProcessor extends BaseLlmResponseProcessor {
    runAsync(invocationContext: InvocationContext, llmResponse: LlmResponse): AsyncGenerator<Event>;
}
/**
 * Exported processor instances
 */
declare const requestProcessor: CodeExecutionRequestProcessor;
declare const responseProcessor: CodeExecutionResponseProcessor;

declare const AF_FUNCTION_CALL_ID_PREFIX = "adk-";
declare const REQUEST_EUC_FUNCTION_CALL_NAME = "adk_request_credential";
/**
 * Generates a client function call ID
 */
declare function generateClientFunctionCallId(): string;
/**
 * Populates function calls with client function call IDs if missing
 */
declare function populateClientFunctionCallId(modelResponseEvent: Event): void;
/**
 * Removes client function call IDs from content
 */
declare function removeClientFunctionCallId(content: Content): void;
/**
 * Gets long running function call IDs from a list of function calls
 */
declare function getLongRunningFunctionCalls(functionCalls: FunctionCall[], toolsDict: Record<string, BaseTool>): Set<string>;
/**
 * Generates an auth event for credential requests
 */
declare function generateAuthEvent(invocationContext: InvocationContext, functionResponseEvent: Event): Event | null;
/**
 * Handles function calls asynchronously
 */
declare function handleFunctionCallsAsync(invocationContext: InvocationContext, functionCallEvent: Event, toolsDict: Record<string, BaseTool>, filters?: Set<string>): Promise<Event | null>;
/**
 * Handles function calls in live mode
 */
declare function handleFunctionCallsLive(invocationContext: InvocationContext, functionCallEvent: Event, toolsDict: Record<string, BaseTool>): Promise<Event | null>;
/**
 * Merges parallel function response events
 */
declare function mergeParallelFunctionResponseEvents(functionResponseEvents: Event[]): Event;

declare const index$1_AF_FUNCTION_CALL_ID_PREFIX: typeof AF_FUNCTION_CALL_ID_PREFIX;
type index$1_AutoFlow = AutoFlow;
declare const index$1_AutoFlow: typeof AutoFlow;
type index$1_BaseLlmFlow = BaseLlmFlow;
declare const index$1_BaseLlmFlow: typeof BaseLlmFlow;
type index$1_BaseLlmRequestProcessor = BaseLlmRequestProcessor;
declare const index$1_BaseLlmRequestProcessor: typeof BaseLlmRequestProcessor;
type index$1_BaseLlmResponseProcessor = BaseLlmResponseProcessor;
declare const index$1_BaseLlmResponseProcessor: typeof BaseLlmResponseProcessor;
declare const index$1_REQUEST_EUC_FUNCTION_CALL_NAME: typeof REQUEST_EUC_FUNCTION_CALL_NAME;
type index$1_SingleFlow = SingleFlow;
declare const index$1_SingleFlow: typeof SingleFlow;
declare const index$1_generateAuthEvent: typeof generateAuthEvent;
declare const index$1_generateClientFunctionCallId: typeof generateClientFunctionCallId;
declare const index$1_getLongRunningFunctionCalls: typeof getLongRunningFunctionCalls;
declare const index$1_handleFunctionCallsAsync: typeof handleFunctionCallsAsync;
declare const index$1_handleFunctionCallsLive: typeof handleFunctionCallsLive;
declare const index$1_mergeParallelFunctionResponseEvents: typeof mergeParallelFunctionResponseEvents;
declare const index$1_populateClientFunctionCallId: typeof populateClientFunctionCallId;
declare const index$1_removeClientFunctionCallId: typeof removeClientFunctionCallId;
declare namespace index$1 {
  export { index$1_AF_FUNCTION_CALL_ID_PREFIX as AF_FUNCTION_CALL_ID_PREFIX, index$1_AutoFlow as AutoFlow, index$1_BaseLlmFlow as BaseLlmFlow, index$1_BaseLlmRequestProcessor as BaseLlmRequestProcessor, index$1_BaseLlmResponseProcessor as BaseLlmResponseProcessor, index$1_REQUEST_EUC_FUNCTION_CALL_NAME as REQUEST_EUC_FUNCTION_CALL_NAME, index$1_SingleFlow as SingleFlow, requestProcessor$2 as agentTransferRequestProcessor, requestProcessor$6 as basicRequestProcessor, requestProcessor as codeExecutionRequestProcessor, responseProcessor as codeExecutionResponseProcessor, requestProcessor$3 as contentRequestProcessor, index$1_generateAuthEvent as generateAuthEvent, index$1_generateClientFunctionCallId as generateClientFunctionCallId, index$1_getLongRunningFunctionCalls as getLongRunningFunctionCalls, index$1_handleFunctionCallsAsync as handleFunctionCallsAsync, index$1_handleFunctionCallsLive as handleFunctionCallsLive, requestProcessor$5 as identityRequestProcessor, requestProcessor$4 as instructionsRequestProcessor, index$1_mergeParallelFunctionResponseEvents as mergeParallelFunctionResponseEvents, requestProcessor$1 as nlPlanningRequestProcessor, responseProcessor$1 as nlPlanningResponseProcessor, index$1_populateClientFunctionCallId as populateClientFunctionCallId, index$1_removeClientFunctionCallId as removeClientFunctionCallId };
}

/**
 * Injects session state values into an instruction template.
 *
 * This method is intended to be used in InstructionProvider based instruction
 * and global_instruction which are called with readonly_context.
 *
 * Example:
 * ```typescript
 * import { injectSessionState } from './utils/instructions-utils';
 *
 * async function buildInstruction(readonlyContext: ReadonlyContext): Promise<string> {
 *   return await injectSessionState(
 *     'You can inject a state variable like {var_name} or an artifact ' +
 *     '{artifact.file_name} into the instruction template.',
 *     readonlyContext
 *   );
 * }
 *
 * const agent = new LlmAgent({
 *   model: "gemini-2.0-flash",
 *   name: "agent",
 *   instruction: buildInstruction,
 * });
 * ```
 *
 * @param template The instruction template with {variable} placeholders
 * @param readonlyContext The read-only context containing session data
 * @returns The instruction template with values populated
 */
declare function injectSessionState(template: string, readonlyContext: ReadonlyContext): Promise<string>;

/**
 * A code executor that uses the Model's built-in code executor.
 *
 * Currently only supports Gemini 2.0+ models, but will be expanded to
 * other models.
 */
declare class BuiltInCodeExecutor extends BaseCodeExecutor {
    constructor(config?: BaseCodeExecutorConfig);
    executeCode(invocationContext: InvocationContext, codeExecutionInput: CodeExecutionInput): Promise<CodeExecutionResult>;
    /**
     * Pre-process the LLM request for Gemini 2.0+ models to use the code execution tool
     */
    processLlmRequest(llmRequest: LlmRequest): void;
}

/**
 * The built-in planner that uses model's built-in thinking features.
 */
declare class BuiltInPlanner extends BasePlanner {
    /**
     * Config for model built-in thinking features. An error will be returned if this
     * field is set for models that don't support thinking.
     */
    thinkingConfig: ThinkingConfig;
    /**
     * Initializes the built-in planner.
     *
     * @param options Configuration options
     */
    constructor(options: {
        thinkingConfig: ThinkingConfig;
    });
    /**
     * Applies the thinking config to the LLM request.
     *
     * @param llmRequest The LLM request to apply the thinking config to
     */
    applyThinkingConfig(llmRequest: LlmRequest): void;
    /**
     * Builds the planning instruction (returns undefined for built-in planner)
     */
    buildPlanningInstruction(readonlyContext: ReadonlyContext, llmRequest: LlmRequest): string | undefined;
    /**
     * Processes the planning response (returns undefined for built-in planner)
     */
    processPlanningResponse(callbackContext: CallbackContext, responseParts: Part[]): Part[] | undefined;
}

/**
 * Plan-Re-Act planner that constrains the LLM response to generate a plan before any action/observation.
 *
 * Note: this planner does not require the model to support built-in thinking
 * features or setting the thinking config.
 */
declare class PlanReActPlanner extends BasePlanner {
    /**
     * Builds the planning instruction for the Plan-Re-Act planner
     */
    buildPlanningInstruction(readonlyContext: ReadonlyContext, llmRequest: LlmRequest): string;
    /**
     * Processes the LLM response for planning
     */
    processPlanningResponse(callbackContext: CallbackContext, responseParts: Part[]): Part[] | undefined;
    /**
     * Splits the text by the last occurrence of the separator
     */
    private _splitByLastPattern;
    /**
     * Handles non-function-call parts of the response
     */
    private _handleNonFunctionCallParts;
    /**
     * Marks the response part as thought
     */
    private _markAsThought;
    /**
     * Builds the NL planner instruction for the Plan-Re-Act planner
     */
    private _buildNlPlannerInstruction;
}

interface IntermediateData {
    toolUses: FunctionCall[];
    intermediateResponses: Array<[string, Part[]]>;
}
interface Invocation {
    invocationId?: string;
    userContent: Content;
    finalResponse?: Content;
    intermediateData?: IntermediateData;
    creationTimestamp: number;
}
interface SessionInput {
    appName: string;
    userId: string;
    state: Record<string, any>;
}
interface EvalCase {
    evalId: string;
    conversation: Invocation[];
    sessionInput?: SessionInput;
}

declare enum PrebuiltMetrics {
    TOOL_TRAJECTORY_AVG_SCORE = "tool_trajectory_avg_score",
    RESPONSE_EVALUATION_SCORE = "response_evaluation_score",
    RESPONSE_MATCH_SCORE = "response_match_score",
    SAFETY_V1 = "safety_v1",
    FINAL_RESPONSE_MATCH_V2 = "final_response_match_v2",
    TOOL_TRAJECTORY_SCORE = "tool_trajectory_score",
    SAFETY = "safety",
    RESPONSE_MATCH = "response_match"
}
interface JudgeModelOptions {
    judgeModel: string;
    judgeModelConfig?: GenerateContentConfig;
    numSamples?: number;
}
interface EvalMetric {
    metricName: string;
    threshold: number;
    judgeModelOptions?: JudgeModelOptions;
}
interface EvalMetricResult extends EvalMetric {
    score?: number;
    evalStatus: EvalStatus;
}
interface EvalMetricResultPerInvocation {
    actualInvocation: Invocation;
    expectedInvocation: Invocation;
    evalMetricResults: EvalMetricResult[];
}
interface Interval {
    minValue: number;
    openAtMin: boolean;
    maxValue: number;
    openAtMax: boolean;
}
interface MetricValueInfo {
    interval?: Interval;
}
interface MetricInfo {
    metricName?: string;
    description?: string;
    defaultThreshold?: number;
    experimental?: boolean;
    metricValueInfo?: MetricValueInfo;
}
interface EvaluateConfig {
    evalMetrics: EvalMetric[];
    parallelism?: number;
}

declare enum EvalStatus {
    PASSED = 1,
    FAILED = 2,
    NOT_EVALUATED = 3
}
interface PerInvocationResult {
    actualInvocation: Invocation;
    expectedInvocation: Invocation;
    score?: number;
    evalStatus: EvalStatus;
}
interface EvaluationResult {
    overallScore?: number;
    overallEvalStatus: EvalStatus;
    perInvocationResults: PerInvocationResult[];
}
declare abstract class Evaluator {
    protected readonly metric: EvalMetric;
    constructor(metric: EvalMetric);
    abstract evaluateInvocations(actualInvocations: Invocation[], expectedInvocations: Invocation[]): Promise<EvaluationResult>;
    static getMetricInfo(metricName?: string): MetricInfo;
}

interface EvalSet {
    evalSetId: string;
    name?: string;
    description?: string;
    evalCases: EvalCase[];
    creationTimestamp: number;
}

interface EvalCaseResult {
    evalSetId: string;
    evalId: string;
    finalEvalStatus: EvalStatus;
    overallEvalMetricResults: EvalMetricResult[];
    evalMetricResultPerInvocation: EvalMetricResultPerInvocation[];
    sessionId: string;
    sessionDetails?: Session;
    userId?: string;
}
interface EvalSetResult {
    evalSetResultId: string;
    evalSetResultName?: string;
    evalSetId: string;
    evalCaseResults: EvalCaseResult[];
    creationTimestamp: number;
}
declare class EvalResult implements EvalSetResult {
    evalSetResultId: string;
    evalSetResultName?: string;
    evalSetId: string;
    evalCaseResults: EvalCaseResult[];
    creationTimestamp: number;
    constructor(init: Partial<EvalSetResult>);
}

declare class AgentEvaluator {
    static findConfigForTestFile(testFile: string): Promise<Record<string, number>>;
    static evaluateEvalSet(agent: BaseAgent, evalSet: EvalSet, criteria: Record<string, number>, numRuns?: number, printDetailedResults?: boolean): Promise<void>;
    static evaluate(agent: BaseAgent, evalDatasetFilePathOrDir: string, numRuns?: number, initialSessionFile?: string): Promise<void>;
    static migrateEvalDataToNewSchema(oldEvalDataFile: string, newEvalDataFile: string, initialSessionFile?: string): Promise<void>;
    private static _findTestFilesRecursively;
    private static _loadEvalSetFromFile;
    private static _getEvalSetFromOldFormat;
    private static _getInitialSession;
    private static _loadDataset;
    private static _validateInput;
    private static _printDetails;
    private static _convertContentToText;
    private static _convertToolCallsToText;
    private static _getEvalResultsByEvalId;
    private static _getEvalMetricResultsWithInvocation;
    private static _processMetricsAndGetFailures;
}

declare abstract class BaseEvalService {
    abstract performInference(request: {
        evalSetId: string;
        evalCases: EvalSet[];
    }): AsyncGenerator<Invocation[], void>;
    abstract evaluate(request: {
        inferenceResults: Invocation[][];
        evaluateConfig: EvaluateConfig;
    }): AsyncGenerator<EvalSetResult, void>;
    evaluateSession(session: {
        evalSetId: string;
        evalCases: EvalSet[];
        evaluateConfig: EvaluateConfig;
    }): AsyncGenerator<EvalSetResult, void>;
}

declare class LocalEvalService extends BaseEvalService {
    private readonly agent;
    private readonly parallelism;
    private runner;
    constructor(agent: BaseAgent, parallelism?: number);
    private initializeRunner;
    performInference(request: {
        evalSetId: string;
        evalCases: EvalSet[];
    }): AsyncGenerator<Invocation[], void>;
    evaluate(request: {
        inferenceResults: Invocation[][];
        evaluateConfig: EvaluateConfig;
    }): AsyncGenerator<EvalResult, void>;
    private runInference;
}

declare class TrajectoryEvaluator extends Evaluator {
    static getMetricInfo(): MetricInfo;
    evaluateInvocations(actualInvocations: Invocation[], expectedInvocations: Invocation[]): Promise<EvaluationResult>;
    private areToolCallsEqual;
    private isToolCallEqual;
}

declare class RougeEvaluator extends Evaluator {
    private evalMetric;
    constructor(evalMetric: EvalMetric);
    static getMetricInfo(): MetricInfo;
    evaluateInvocations(actualInvocations: Invocation[], expectedInvocations: Invocation[]): Promise<EvaluationResult>;
}

declare enum Label {
    VALID = "valid",
    INVALID = "invalid",
    NOT_FOUND = "not_found"
}

type CritiqueParser = (response: string) => Label;
declare class LlmAsJudge {
    sampleJudge(prompt: string, numSamples: number, critiqueParser: CritiqueParser, judgeModelOptions?: JudgeModelOptions): Promise<Label[]>;
}

declare class FinalResponseMatchV2Evaluator extends Evaluator {
    private readonly llmAsJudge;
    constructor(evalMetric: EvalMetric, llmAsJudge?: LlmAsJudge);
    static getMetricInfo(): MetricInfo;
    evaluateInvocations(actualInvocations: Invocation[], expectedInvocations: Invocation[]): Promise<EvaluationResult>;
}

declare class SafetyEvaluatorV1 extends Evaluator {
    static getMetricInfo(): MetricInfo;
    evaluateInvocations(actualInvocations: Invocation[], expectedInvocations: Invocation[]): Promise<EvaluationResult>;
}

type index_AgentEvaluator = AgentEvaluator;
declare const index_AgentEvaluator: typeof AgentEvaluator;
type index_EvalCase = EvalCase;
type index_EvalCaseResult = EvalCaseResult;
type index_EvalMetric = EvalMetric;
type index_EvalMetricResult = EvalMetricResult;
type index_EvalMetricResultPerInvocation = EvalMetricResultPerInvocation;
type index_EvalResult = EvalResult;
declare const index_EvalResult: typeof EvalResult;
type index_EvalSet = EvalSet;
type index_EvalSetResult = EvalSetResult;
type index_EvalStatus = EvalStatus;
declare const index_EvalStatus: typeof EvalStatus;
type index_EvaluateConfig = EvaluateConfig;
type index_EvaluationResult = EvaluationResult;
type index_Evaluator = Evaluator;
declare const index_Evaluator: typeof Evaluator;
type index_FinalResponseMatchV2Evaluator = FinalResponseMatchV2Evaluator;
declare const index_FinalResponseMatchV2Evaluator: typeof FinalResponseMatchV2Evaluator;
type index_IntermediateData = IntermediateData;
type index_Interval = Interval;
type index_Invocation = Invocation;
type index_JudgeModelOptions = JudgeModelOptions;
type index_LocalEvalService = LocalEvalService;
declare const index_LocalEvalService: typeof LocalEvalService;
type index_MetricInfo = MetricInfo;
type index_MetricValueInfo = MetricValueInfo;
type index_PerInvocationResult = PerInvocationResult;
type index_PrebuiltMetrics = PrebuiltMetrics;
declare const index_PrebuiltMetrics: typeof PrebuiltMetrics;
type index_RougeEvaluator = RougeEvaluator;
declare const index_RougeEvaluator: typeof RougeEvaluator;
type index_SafetyEvaluatorV1 = SafetyEvaluatorV1;
declare const index_SafetyEvaluatorV1: typeof SafetyEvaluatorV1;
type index_SessionInput = SessionInput;
type index_TrajectoryEvaluator = TrajectoryEvaluator;
declare const index_TrajectoryEvaluator: typeof TrajectoryEvaluator;
declare namespace index {
  export { index_AgentEvaluator as AgentEvaluator, type index_EvalCase as EvalCase, type index_EvalCaseResult as EvalCaseResult, type index_EvalMetric as EvalMetric, type index_EvalMetricResult as EvalMetricResult, type index_EvalMetricResultPerInvocation as EvalMetricResultPerInvocation, index_EvalResult as EvalResult, type index_EvalSet as EvalSet, type index_EvalSetResult as EvalSetResult, index_EvalStatus as EvalStatus, type index_EvaluateConfig as EvaluateConfig, type index_EvaluationResult as EvaluationResult, index_Evaluator as Evaluator, index_FinalResponseMatchV2Evaluator as FinalResponseMatchV2Evaluator, type index_IntermediateData as IntermediateData, type index_Interval as Interval, type index_Invocation as Invocation, type index_JudgeModelOptions as JudgeModelOptions, index_LocalEvalService as LocalEvalService, type index_MetricInfo as MetricInfo, type index_MetricValueInfo as MetricValueInfo, type index_PerInvocationResult as PerInvocationResult, index_PrebuiltMetrics as PrebuiltMetrics, index_RougeEvaluator as RougeEvaluator, index_SafetyEvaluatorV1 as SafetyEvaluatorV1, type index_SessionInput as SessionInput, index_TrajectoryEvaluator as TrajectoryEvaluator };
}

/**
 * Find function call event if last event is function response.
 */
declare function _findFunctionCallEventIfLastEventIsFunctionResponse(session: Session): Event | null;
/**
 * The Runner class is used to run agents.
 * It manages the execution of an agent within a session, handling message
 * processing, event generation, and interaction with various services like
 * artifact storage, session management, and memory.
 */
declare class Runner<T extends BaseAgent = BaseAgent> {
    /**
     * The app name of the runner.
     */
    appName: string;
    /**
     * The root agent to run.
     */
    agent: T;
    /**
     * The artifact service for the runner.
     */
    artifactService?: BaseArtifactService;
    /**
     * The session service for the runner.
     */
    sessionService: BaseSessionService;
    /**
     * The memory service for the runner.
     */
    memoryService?: BaseMemoryService;
    protected logger: Logger;
    /**
     * Initializes the Runner.
     */
    constructor({ appName, agent, artifactService, sessionService, memoryService, }: {
        appName: string;
        agent: T;
        artifactService?: BaseArtifactService;
        sessionService: BaseSessionService;
        memoryService?: BaseMemoryService;
    });
    /**
     * Runs the agent synchronously.
     * NOTE: This sync interface is only for local testing and convenience purpose.
     * Consider using `runAsync` for production usage.
     */
    run({ userId, sessionId, newMessage, runConfig, }: {
        userId: string;
        sessionId: string;
        newMessage: Content;
        runConfig?: RunConfig;
    }): Generator<Event, void, unknown>;
    /**
     * Main entry method to run the agent in this runner.
     */
    runAsync({ userId, sessionId, newMessage, runConfig, }: {
        userId: string;
        sessionId: string;
        newMessage: Content;
        runConfig?: RunConfig;
    }): AsyncGenerator<Event, void, unknown>;
    /**
     * Appends a new message to the session.
     */
    private _appendNewMessageToSession;
    /**
     * Finds the agent to run to continue the session.
     */
    private _findAgentToRun;
    /**
     * Whether the agent to run can transfer to any other agent in the agent tree.
     */
    private _isTransferableAcrossAgentTree;
    /**
     * Creates a new invocation context.
     */
    private _newInvocationContext;
}
/**
 * An in-memory Runner for testing and development.
 */
declare class InMemoryRunner<T extends BaseAgent = BaseAgent> extends Runner<T> {
    /**
     * Deprecated. Please don't use. The in-memory session service for the runner.
     */
    private _inMemorySessionService;
    /**
     * Initializes the InMemoryRunner.
     */
    constructor(agent: T, { appName }?: {
        appName?: string;
    });
}

interface TelemetryConfig {
    appName: string;
    appVersion?: string;
    otlpEndpoint: string;
    otlpHeaders?: Record<string, string>;
    environment?: string;
}
/**
 * Telemetry service for the ADK
 * Handles OpenTelemetry initialization, tracing, and cleanup
 */
declare class TelemetryService {
    private sdk;
    private isInitialized;
    private tracer;
    private config;
    constructor();
    /**
     * Initialize telemetry with the provided configuration
     */
    initialize(config: TelemetryConfig): void;
    /**
     * Get the tracer instance
     */
    getTracer(): Tracer;
    /**
     * Check if telemetry is initialized
     */
    get initialized(): boolean;
    /**
     * Get the current configuration
     */
    getConfig(): TelemetryConfig | null;
    /**
     * Shutdown telemetry with optional timeout
     */
    shutdown(timeoutMs?: number): Promise<void>;
    /**
     * Traces a tool call by adding detailed attributes to the current span.
     */
    traceToolCall(tool: BaseTool, args: Record<string, any>, functionResponseEvent: Event, llmRequest?: LlmRequest, invocationContext?: InvocationContext): void;
    /**
     * Traces a call to the LLM by adding detailed attributes to the current span.
     */
    traceLlmCall(invocationContext: InvocationContext, eventId: string, llmRequest: LlmRequest, llmResponse: LlmResponse): void;
    /**
     * Wraps an async generator with tracing
     */
    traceAsyncGenerator<T>(spanName: string, generator: AsyncGenerator<T, void, unknown>): AsyncGenerator<T, void, unknown>;
    private _safeJsonStringify;
    /**
     * Builds a dictionary representation of the LLM request for tracing.
     *
     * This function prepares a dictionary representation of the LlmRequest
     * object, suitable for inclusion in a trace. It excludes fields that cannot
     * be serialized (e.g., function pointers) and avoids sending bytes data.
     */
    private _buildLlmRequestForTrace;
    /**
     * Excludes non-serializable fields from config, similar to Python's exclude logic
     */
    private _excludeNonSerializableFromConfig;
}
declare const telemetryService: TelemetryService;
declare const tracer: Tracer;
declare const initializeTelemetry: (config: TelemetryConfig) => void;
declare const shutdownTelemetry: (timeoutMs?: number) => Promise<void>;
declare const traceToolCall: (tool: BaseTool, args: Record<string, any>, functionResponseEvent: Event, llmRequest?: LlmRequest, invocationContext?: InvocationContext) => void;
declare const traceLlmCall: (invocationContext: InvocationContext, eventId: string, llmRequest: LlmRequest, llmResponse: LlmResponse) => void;

declare const VERSION = "0.1.0";

export { AF_FUNCTION_CALL_ID_PREFIX, type AfterAgentCallback, type AfterModelCallback, type AfterToolCallback, LlmAgent as Agent, AgentBuilder, type AgentBuilderConfig, type AgentBuilderWithSchema, AgentEvaluator, AgentTool, type AgentToolConfig, type AgentType, index$5 as Agents, AiSdkLlm, AnthropicLlm, ApiKeyCredential, ApiKeyScheme, AuthConfig, AuthCredential, AuthCredentialType, AuthHandler, AuthScheme, AuthSchemeType, AuthTool, type AuthToolArguments, AutoFlow, BaseAgent, type BaseAgentType, BaseCodeExecutor, type BaseCodeExecutorConfig, BaseLLMConnection, BaseLlm, BaseLlmFlow, BaseLlmRequestProcessor, BaseLlmResponseProcessor, type BaseMemoryService, BasePlanner, BaseSessionService, BaseTool, BasicAuthCredential, BearerTokenCredential, type BeforeAgentCallback, type BeforeModelCallback, type BeforeToolCallback, type BuildFunctionDeclarationOptions, type BuiltAgent, BuiltInCodeExecutor, BuiltInPlanner, CallbackContext, type CodeExecutionInput, type CodeExecutionResult, CodeExecutionUtils, CodeExecutorContext, type CreateToolConfig, type CreateToolConfigWithSchema, type CreateToolConfigWithoutSchema, DatabaseSessionService, EnhancedAuthConfig, type EnhancedRunner, type EvalCase, type EvalCaseResult, type EvalMetric, type EvalMetricResult, type EvalMetricResultPerInvocation, EvalResult, type EvalSet, type EvalSetResult, EvalStatus, type EvaluateConfig, index as Evaluation, type EvaluationResult, Evaluator, Event, EventActions, index$2 as Events, ExitLoopTool, type File, FileOperationsTool, FinalResponseMatchV2Evaluator, index$1 as Flows, type FullMessage, FunctionTool, GcsArtifactService, type GetSessionConfig, GetUserChoiceTool, GoogleLlm, GoogleSearch, HttpRequestTool, HttpScheme, InMemoryArtifactService, InMemoryMemoryService, InMemoryRunner, InMemorySessionService, type InstructionProvider, type IntermediateData, type Interval, type Invocation, InvocationContext, type JudgeModelOptions, LLMRegistry, LangGraphAgent, type LangGraphAgentConfig, type LangGraphNode, type ListSessionsResponse, LlmAgent, type LlmAgentConfig, LlmCallsLimitExceededError, type LlmModel, type LlmModelConfig, LlmRequest, LlmResponse, LoadArtifactsTool, LoadMemoryTool, LocalEvalService, LoopAgent, type LoopAgentConfig, McpAbi, McpAtp, McpBamm, McpCoinGecko, type McpConfig, McpDiscord, McpError, McpErrorType, McpFilesystem, McpFraxlend, McpGeneric, McpIqWiki, McpMemory, McpNearAgent, McpNearIntents, McpOdos, McpSamplingHandler, type McpSamplingRequest, type McpSamplingResponse, type McpServerConfig, McpTelegram, McpToolset, type McpTransportType, McpUpbit, index$4 as Memory, type MessagePart, type MetricInfo, type MetricValueInfo, index$6 as Models, type MultiAgentResponse, OAuth2Credential, OAuth2Scheme, type OAuthFlow, type OAuthFlows, type OpenAILLMConfig, OpenAiLlm, OpenIdConnectScheme, ParallelAgent, type ParallelAgentConfig, type PerInvocationResult, PlanReActPlanner, PrebuiltMetrics, REQUEST_EUC_FUNCTION_CALL_NAME, ReadonlyContext, RougeEvaluator, RunConfig, Runner, type RunnerAskReturn, SafetyEvaluatorV1, type SamplingHandler, type SearchMemoryResponse, SequentialAgent, type SequentialAgentConfig, type Session, type SessionInput, type SessionOptions, index$3 as Sessions, type SingleAfterModelCallback, type SingleAfterToolCallback, type SingleAgentCallback, type SingleBeforeModelCallback, type SingleBeforeToolCallback, SingleFlow, State, StreamingMode, type TelemetryConfig, TelemetryService, type ThinkingConfig, type ToolConfig, ToolContext, type ToolUnion, index$7 as Tools, TrajectoryEvaluator, TransferToAgentTool, UserInteractionTool, VERSION, VertexAiSessionService, _findFunctionCallEventIfLastEventIsFunctionResponse, adkToMcpToolType, requestProcessor$2 as agentTransferRequestProcessor, requestProcessor$6 as basicRequestProcessor, buildFunctionDeclaration, requestProcessor as codeExecutionRequestProcessor, responseProcessor as codeExecutionResponseProcessor, requestProcessor$3 as contentRequestProcessor, convertMcpToolToBaseTool, createAuthToolArguments, createBranchContextForSubAgent, createDatabaseSessionService, createFunctionTool, createMysqlSessionService, createPostgresSessionService, createSamplingHandler, createSqliteSessionService, createTool, generateAuthEvent, generateClientFunctionCallId, getLongRunningFunctionCalls, getMcpTools, handleFunctionCallsAsync, handleFunctionCallsLive, requestProcessor$5 as identityRequestProcessor, initializeTelemetry, injectSessionState, requestProcessor$4 as instructionsRequestProcessor, isEnhancedAuthConfig, jsonSchemaToDeclaration, mcpSchemaToParameters, mergeAgentRun, mergeParallelFunctionResponseEvents, newInvocationContextId, requestProcessor$1 as nlPlanningRequestProcessor, responseProcessor$1 as nlPlanningResponseProcessor, normalizeJsonSchema, populateClientFunctionCallId, registerProviders, removeClientFunctionCallId, requestProcessor$7 as requestProcessor, shutdownTelemetry, telemetryService, traceLlmCall, traceToolCall, tracer };
