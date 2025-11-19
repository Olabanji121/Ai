import { eq } from 'drizzle-orm';
import { db } from '../client';
import {
  userSettings,
  type UserSettings,
  type NewUserSettings,
  type UpdateUserSettings,
} from '../schema/user-settings';
import { QueryError } from '../errors';

/**
 * User Settings Repository
 *
 * Handles all database operations for user settings and preferences.
 * Supports upsert operations for updating or creating settings.
 */
class UserSettingsRepository {
  /**
   * Create new user settings
   */
  async create(data: NewUserSettings): Promise<UserSettings> {
    try {
      const [settings] = await db.insert(userSettings).values(data).returning();
      return settings;
    } catch (error) {
      throw new QueryError(
        'Failed to create user settings',
        undefined,
        undefined,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Find user settings by user ID
   */
  async findByUserId(userId: string): Promise<UserSettings | null> {
    try {
      const [settings] = await db
        .select()
        .from(userSettings)
        .where(eq(userSettings.userId, userId))
        .limit(1);

      return settings || null;
    } catch (error) {
      throw new QueryError(
        `Failed to find user settings for user ID: ${userId}`,
        undefined,
        undefined,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Update user settings
   */
  async update(userId: string, data: UpdateUserSettings): Promise<UserSettings> {
    try {
      const [updated] = await db
        .update(userSettings)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(userSettings.userId, userId))
        .returning();

      if (!updated) {
        throw new Error(`User settings for user ID ${userId} not found`);
      }

      return updated;
    } catch (error) {
      throw new QueryError(
        `Failed to update user settings for user ID: ${userId}`,
        undefined,
        undefined,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Upsert user settings (create if not exists, update if exists)
   */
  async upsert(data: NewUserSettings): Promise<UserSettings> {
    try {
      const existing = await this.findByUserId(data.userId);

      if (existing) {
        // Update existing settings
        return await this.update(data.userId, data);
      } else {
        // Create new settings
        return await this.create(data);
      }
    } catch (error) {
      throw new QueryError(
        `Failed to upsert user settings for user ID: ${data.userId}`,
        undefined,
        undefined,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Delete user settings
   */
  async delete(userId: string): Promise<void> {
    try {
      await db.delete(userSettings).where(eq(userSettings.userId, userId));
    } catch (error) {
      throw new QueryError(
        `Failed to delete user settings for user ID: ${userId}`,
        undefined,
        undefined,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Update brand voice
   */
  async updateBrandVoice(userId: string, brandVoice: string): Promise<UserSettings> {
    return this.update(userId, { brandVoice });
  }

  /**
   * Update platform preferences
   */
  async updatePlatforms(userId: string, platforms: string[]): Promise<UserSettings> {
    return this.update(userId, { platforms });
  }

  /**
   * Enable or disable auto-publish
   */
  async setAutoPublish(userId: string, autoPublish: boolean): Promise<UserSettings> {
    return this.update(userId, { autoPublish });
  }

  /**
   * Update posting schedule
   */
  async updatePostingSchedule(
    userId: string,
    schedule: {
      timezone?: string;
      preferredTimes?: {
        twitter?: string[];
        linkedin?: string[];
        reddit?: string[];
      };
    }
  ): Promise<UserSettings> {
    return this.update(userId, { postingSchedule: schedule });
  }

  /**
   * Update tone preferences
   */
  async updateTonePreferences(
    userId: string,
    preferences: {
      twitter?: 'casual' | 'professional' | 'humorous';
      linkedin?: 'professional' | 'educational' | 'casual';
      reddit?: 'casual' | 'conversational';
    }
  ): Promise<UserSettings> {
    return this.update(userId, { tonePreferences: preferences });
  }

  /**
   * Update content guidelines
   */
  async updateContentGuidelines(
    userId: string,
    guidelines: {
      dos?: string[];
      donts?: string[];
      topics?: string[];
      avoidTopics?: string[];
    }
  ): Promise<UserSettings> {
    return this.update(userId, { contentGuidelines: guidelines });
  }

  /**
   * Update notification preferences
   */
  async updateNotificationPreferences(
    userId: string,
    preferences: {
      email?: boolean;
      postPendingReview?: boolean;
      postPublished?: boolean;
      workflowFailed?: boolean;
      weeklyReport?: boolean;
    }
  ): Promise<UserSettings> {
    return this.update(userId, { notificationPreferences: preferences });
  }

  /**
   * Check if user has specific platform enabled
   */
  async hasPlatformEnabled(userId: string, platform: string): Promise<boolean> {
    const settings = await this.findByUserId(userId);
    return settings?.platforms?.includes(platform) || false;
  }

  /**
   * Get enabled platforms for user
   */
  async getEnabledPlatforms(userId: string): Promise<string[]> {
    const settings = await this.findByUserId(userId);
    return settings?.platforms || [];
  }
}

// Export singleton instance
export const userSettingsRepository = new UserSettingsRepository();
