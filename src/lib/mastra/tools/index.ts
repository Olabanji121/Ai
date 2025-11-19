/**
 * Mastra Tools
 *
 * Tools that allow AI agents to interact with the database
 * through repository interfaces.
 */

export * from './trend.tools';
export * from './post.tools';
export * from './analytics.tools';
export * from './user-settings.tools';

import { trendTools } from './trend.tools';
import { postTools } from './post.tools';
import { analyticsTools } from './analytics.tools';
import { userSettingsTools } from './user-settings.tools';

/**
 * All tools combined for easy access
 */
export const allTools = {
  ...trendTools,
  ...postTools,
  ...analyticsTools,
  ...userSettingsTools,
};
