import { Mastra } from '@mastra/core';
import { mastraConfig } from './config';

/**
 * Initialize Mastra AI Framework
 *
 * Creates a singleton Mastra instance with configured LLM providers
 * and logging settings.
 *
 * @example
 * ```typescript
 * import { mastra } from '@/lib/mastra';
 *
 * // Use in agents, workflows, etc.
 * const response = await mastra.llm.generate({
 *   model: 'gpt-4',
 *   messages: [{ role: 'user', content: 'Hello!' }],
 * });
 * ```
 */
function initializeMastra(): Mastra {
  try {
    // Initialize Mastra without config - config is applied per agent/workflow
    const mastra = new Mastra();

    return mastra;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to initialize Mastra: ${message}`);
  }
}

/**
 * Mastra client singleton
 * Use this throughout the application for AI operations
 */
export const mastra = initializeMastra();

/**
 * Health check for Mastra client
 * @returns true if Mastra is initialized and ready
 */
export function isMastraReady(): boolean {
  try {
    return mastra !== null && mastra !== undefined;
  } catch {
    return false;
  }
}

/**
 * Get LLM configuration for a specific provider
 */
export function getLLMConfig(provider: 'openai' | 'anthropic') {
  return mastraConfig.llm[provider];
}
