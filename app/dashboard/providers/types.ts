export interface ConfiguredModel {
  id: string;
  name: string;
  is_active: boolean;
  has_vision?: boolean;
  has_audio?: boolean;
  has_tools?: boolean;
  has_reasoning?: boolean;
  reasoning_effort?: string;
  context_length?: string;
  temperature?: number;
  tier?: string;
  version?: string;
  output_tables_as_markdown?: boolean;
  compact_markdown_tables?: boolean;
  disable_cache?: boolean;
  page_ranges?: string;
  device?: string;
  normalize_embeddings?: boolean;
}

export interface ModelProvider {
  id: string;
  category: "chat" | "embedding" | "parser";
  provider_type: string;
  name: string;
  base_url: string | null;
  api_key: string | null;
  model_name: string;
  is_active: boolean;
  is_default: boolean;
  config: {
    timeout?: number;
    proxy?: string;
    custom_headers?: Record<string, string>;
    configured_models?: ConfiguredModel[];
    temperature?: number;
    max_tokens?: number;
    dimensions?: number;
    batch_size?: number;
    parser_mode?: string;
    device?: string;
    normalize_embeddings?: boolean;
    model_kwargs?: {
      device?: string;
      [key: string]: unknown;
    };
    encode_kwargs?: {
      normalize_embeddings?: boolean;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  } | null;
  created_at: string;
  updated_at: string;
}

export interface ProviderPreset {
  type: string;
  label: string;
  defaultBaseUrl: string;
  defaultModels: {
    chat: string;
    embedding: string;
    parser: string;
  };
}

export interface ProviderFormData {
  provider_id?: string;
  id: string;
  name: string;
  provider_type: string;
  base_url: string;
  api_key: string;
  model_name: string;
  is_active: boolean;
  is_default: boolean;
  timeout: number;
  proxy: string;
  custom_headers: Record<string, string>;
  configured_models: ConfiguredModel[];
  device: string;
  normalize_embeddings: boolean;
}

export interface TestResult {
  status: "success" | "error";
  message: string;
}

export interface DownloadProgressInfo {
  model_id: string;
  status: "starting" | "downloading" | "completed" | "error" | "not_found";
  progress: number;
  downloaded_bytes: number;
  total_bytes: number;
  files_downloaded?: number;
  total_files?: number;
  speed?: string;
  message?: string;
  error?: string | null;
  is_downloaded?: boolean;
}

export interface AvailableModelItem {
  id: string;
  name: string;
  is_downloaded?: boolean;
  is_downloading?: boolean;
  download_progress?: number;
  has_vision?: boolean;
  has_audio?: boolean;
  has_tools?: boolean;
  has_reasoning?: boolean;
  context_length?: string;
}

export interface ModelsDevModalities {
  readonly input: string[];
  readonly output: string[];
}

export interface ModelsDevLimit {
  readonly context?: number;
  readonly output?: number;
}

export interface ModelsDevCost {
  readonly input?: number;
  readonly output?: number;
}

export interface ModelsDevReasoningOption {
  readonly type: string;
  readonly values?: string[];
}

export interface ModelsDevBenchmark {
  readonly name: string;
  readonly score: number | string;
  readonly metric?: string;
}

export interface ModelsDevEntry {
  readonly id?: string;
  readonly name?: string;
  readonly providerName?: string;
  readonly providerId?: string;
  readonly family?: string;
  readonly description?: string;
  readonly attachment?: boolean;
  readonly tool_call?: boolean;
  readonly reasoning?: boolean;
  readonly structured_output?: boolean;
  readonly open_weights?: boolean;
  readonly temperature?: boolean;
  readonly knowledge?: string;
  readonly release_date?: string;
  readonly license?: string;
  readonly modalities: ModelsDevModalities;
  readonly limit?: ModelsDevLimit;
  readonly cost?: ModelsDevCost;
  readonly reasoning_options?: readonly ModelsDevReasoningOption[];
  readonly benchmarks?: readonly ModelsDevBenchmark[];
  readonly [key: string]: unknown;
}

export const PROVIDER_PRESETS: ProviderPreset[] = [
  {
    type: "llamaindex",
    label: "LlamaIndex",
    defaultBaseUrl: "https://api.cloud.llamaindex.ai",
    defaultModels: { chat: "", embedding: "", parser: "llama-parse" }
  },
  {
    type: "openai",
    label: "OpenAI Compatible",
    defaultBaseUrl: "https://api.openai.com/v1",
    defaultModels: { chat: "gpt-4o-mini", embedding: "text-embedding-3-small", parser: "gpt-4o-mini" }
  },
  {
    type: "anthropic",
    label: "Anthropic",
    defaultBaseUrl: "https://api.anthropic.com/v1",
    defaultModels: { chat: "claude-3-5-sonnet-20241022", embedding: "claude-3-haiku-20240307", parser: "claude-3-5-sonnet-20241022" }
  },
  {
    type: "gemini",
    label: "Google Gemini",
    defaultBaseUrl: "https://generativelanguage.googleapis.com/v1beta",
    defaultModels: { chat: "gemini-1.5-flash", embedding: "text-embedding-004", parser: "gemini-1.5-flash" }
  },
  {
    type: "huggingface",
    label: "Hugging Face",
    defaultBaseUrl: "https://api-inference.huggingface.co/models",
    defaultModels: { chat: "meta-llama/Meta-Llama-3-8B-Instruct", embedding: "BAAI/bge-large-en-v1.5", parser: "meta-llama/Meta-Llama-3-8B-Instruct" }
  },
  {
    type: "deepseek",
    label: "Deepseek",
    defaultBaseUrl: "https://api.deepseek.com/v1",
    defaultModels: { chat: "deepseek-chat", embedding: "text-embedding-3-small", parser: "deepseek-chat" }
  },
  {
    type: "ollama",
    label: "Ollama",
    defaultBaseUrl: "http://localhost:11434/v1",
    defaultModels: { chat: "llama3:latest", embedding: "nomic-embed-text", parser: "llama3:latest" }
  },
  {
    type: "openrouter",
    label: "OpenRouter",
    defaultBaseUrl: "https://openrouter.ai/api/v1",
    defaultModels: { chat: "openai/gpt-4o-mini", embedding: "text-embedding-3-small", parser: "openai/gpt-4o-mini" }
  }
];
