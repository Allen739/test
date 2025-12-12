export type ModelProvider = 'openai' | 'anthropic' | 'google' | 'mistral';

export interface ModelConfig {
  provider: ModelProvider;
  model: string;
  apiKey: string;
  maxTokens?: number;
  temperature?: number;
}

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
}

export interface AgentConfig {
  workingDirectory: string;
  maxContextFiles?: number;
  autoSave?: boolean;
  verbose?: boolean;
}

export interface FileOperation {
  type: 'read' | 'write' | 'delete' | 'list';
  path: string;
  content?: string;
}

export interface AgentResponse {
  message: string;
  operations?: FileOperation[];
  success: boolean;
  error?: string;
}

export interface ConversationHistory {
  messages: Message[];
  timestamp: Date;
  model: string;
}

export interface ModelInfo {
  id: string;
  name: string;
  provider: ModelProvider;
  maxTokens: number;
  supportsStreaming: boolean;
}

export const AVAILABLE_MODELS: ModelInfo[] = [
  // OpenAI Models
  { id: 'gpt-4', name: 'GPT-4', provider: 'openai', maxTokens: 8192, supportsStreaming: true },
  { id: 'gpt-4-turbo-preview', name: 'GPT-4 Turbo', provider: 'openai', maxTokens: 128000, supportsStreaming: true },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'openai', maxTokens: 16385, supportsStreaming: true },

  // Anthropic Models
  { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', provider: 'anthropic', maxTokens: 200000, supportsStreaming: true },
  { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet', provider: 'anthropic', maxTokens: 200000, supportsStreaming: true },
  { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', provider: 'anthropic', maxTokens: 200000, supportsStreaming: true },

  // Google Models (placeholder for future implementation)
  { id: 'gemini-pro', name: 'Gemini Pro', provider: 'google', maxTokens: 32000, supportsStreaming: true },

  // Mistral Models (placeholder for future implementation)
  { id: 'mistral-large', name: 'Mistral Large', provider: 'mistral', maxTokens: 32000, supportsStreaming: true },
];
