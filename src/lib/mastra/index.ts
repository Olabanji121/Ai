/**
 * Mastra AI Integration
 *
 * This module provides AI agent orchestration and workflow management
 * for AutoMarketeer using the Mastra framework.
 *
 * @module mastra
 */

// Core exports
export { mastra, isMastraReady, getLLMConfig } from './client';
export { mastraConfig, getMastraConfig, type MastraConfig } from './config';

// Tools (will be implemented)
export * from './tools';

// Agents (will be implemented)
export * from './agents';

// Workflows (will be implemented)
export * from './workflows';

// Utilities
export * from './utils';
