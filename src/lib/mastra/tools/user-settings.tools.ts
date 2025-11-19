import { z } from 'zod';
import { createTool } from '@mastra/core';
import { userSettingsRepository } from '@/lib/db/repositories';

/**
 * User Settings Tools
 *
 * Tools for AI agents to access user preferences, brand voice,
 * and platform configurations.
 */

/**
 * Get user settings
 */
export const getUserSettings = createTool({
  id: 'get-user-settings',
  description: 'Get user settings including brand voice, platforms, and preferences',
  inputSchema: z.object({
    userId: z.string(),
  }),
  outputSchema: z.object({
    userId: z.string(),
    brandVoice: z.string().nullable(),
    targetAudience: z.string().nullable(),
    platforms: z.array(z.string()).nullable(),
    autoPublish: z.boolean().nullable(),
    postingSchedule: z.record(z.string(), z.any()).nullable(),
    tonePreferences: z.record(z.string(), z.any()).nullable(),
  }).nullable(),
  execute: async ({ context }: any) => {
    try {
      const settings = await userSettingsRepository.findByUserId(context.userId);

      if (!settings) {
        return null;
      }

      // Transform to match output schema
      return {
        userId: settings.userId,
        brandVoice: settings.brandVoice,
        targetAudience: settings.targetAudience,
        platforms: settings.platforms,
        autoPublish: settings.autoPublish,
        postingSchedule: settings.postingSchedule,
        tonePreferences: settings.tonePreferences,
      };
    } catch (error) {
      throw new Error(`Failed to get user settings: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
});

/**
 * Update brand voice
 */
export const updateBrandVoice = createTool({
  id: 'update-brand-voice',
  description: 'Update the user\'s brand voice description',
  inputSchema: z.object({
    userId: z.string(),
    brandVoice: z.string(),
  }),
  outputSchema: z.object({
    userId: z.string(),
    brandVoice: z.string().nullable(),
  }),
  execute: async ({ context }: any) => {
    try {
      const settings = await userSettingsRepository.updateBrandVoice(
        context.userId,
        context.brandVoice
      );
      return {
        userId: settings.userId,
        brandVoice: settings.brandVoice,
      };
    } catch (error) {
      throw new Error(`Failed to update brand voice: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
});

/**
 * Get enabled platforms for user
 */
export const getPlatforms = createTool({
  id: 'get-platforms',
  description: 'Get list of platforms enabled for the user',
  inputSchema: z.object({
    userId: z.string(),
  }),
  outputSchema: z.object({
    platforms: z.array(z.string()),
  }),
  execute: async ({ context }: any) => {
    try {
      const settings = await userSettingsRepository.findByUserId(context.userId);
      return {
        platforms: settings?.platforms || [],
      };
    } catch (error) {
      throw new Error(`Failed to get platforms: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
});

/**
 * Check if platform is enabled
 */
export const isPlatformEnabled = createTool({
  id: 'is-platform-enabled',
  description: 'Check if a specific platform is enabled for the user',
  inputSchema: z.object({
    userId: z.string(),
    platform: z.enum(['twitter', 'linkedin', 'reddit']),
  }),
  outputSchema: z.object({
    enabled: z.boolean(),
  }),
  execute: async ({ context }: any) => {
    try {
      const enabled = await userSettingsRepository.hasPlatformEnabled(
        context.userId,
        context.platform
      );
      return { enabled };
    } catch (error) {
      throw new Error(`Failed to check platform status: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
});

/**
 * All user settings tools combined
 */
export const userSettingsTools = {
  getUserSettings,
  updateBrandVoice,
  getPlatforms,
  isPlatformEnabled,
};
