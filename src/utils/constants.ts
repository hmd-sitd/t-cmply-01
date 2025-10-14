import type { ChatSettings } from '../types';

export const DEFAULT_SETTINGS: ChatSettings = {
  model_name: 'moonshotai/kimi-k2-instruct',
  model_provider: 'groq',
  temperature: 0.7,
  max_tokens: 1000,
  system_prompt: 'You are a helpful AI assistant specialized in software testing. When provided with context from documents, use that information to give detailed, specific answers with examples. Always reference the document sources when available.',
  memory_max_tokens: 2000,
  memory_window_size: 10,
  fact_extraction_interval: 5,
  fact_extraction_context: 3,
};