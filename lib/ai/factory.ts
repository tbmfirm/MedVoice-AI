import type { AIProvider } from './providers/base';
import { OpenAIProvider } from './providers/openai';

/**
 * Get the configured AI provider
 */
export function getAIProvider(): AIProvider {
  const provider = process.env.AI_PROVIDER || 'openai';

  switch (provider.toLowerCase()) {
    case 'openai':
      return new OpenAIProvider();
    // Future: Add other providers
    // case 'claude':
    //   return new ClaudeProvider();
    // case 'gemini':
    //   return new GeminiProvider();
    default:
      console.warn(`Unknown AI provider: ${provider}, defaulting to OpenAI`);
      return new OpenAIProvider();
  }
}
