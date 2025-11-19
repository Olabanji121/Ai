import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  jsonb,
} from 'drizzle-orm/pg-core';

/**
 * User Settings Table
 *
 * Stores user preferences and configuration for content generation and publishing.
 */
export const userSettings = pgTable('user_settings', {
  userId: uuid('user_id').primaryKey(),

  // Brand and voice
  brandVoice: text('brand_voice'), // Description of brand voice/personality
  targetAudience: text('target_audience'), // Target audience description

  // Platform configuration
  platforms: text('platforms').array(), // Enabled platforms: ['twitter', 'linkedin', 'reddit']

  // Publishing preferences
  autoPublish: boolean('auto_publish').default(false), // Auto-publish approved content
  postingSchedule: jsonb('posting_schedule').$type<{
    timezone?: string;
    preferredTimes?: {
      twitter?: string[];
      linkedin?: string[];
      reddit?: string[];
    };
  }>(),

  // Content preferences
  tonePreferences: jsonb('tone_preferences').$type<{
    twitter?: 'casual' | 'professional' | 'humorous';
    linkedin?: 'professional' | 'educational' | 'casual';
    reddit?: 'casual' | 'conversational';
  }>(),

  contentGuidelines: jsonb('content_guidelines').$type<{
    dos?: string[];
    donts?: string[];
    topics?: string[];
    avoidTopics?: string[];
  }>(),

  // Notification preferences
  notificationPreferences: jsonb('notification_preferences').$type<{
    email?: boolean;
    postPendingReview?: boolean;
    postPublished?: boolean;
    workflowFailed?: boolean;
    weeklyReport?: boolean;
  }>(),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date()),
});

/**
 * Type inference for UserSettings entity
 */
export type UserSettings = typeof userSettings.$inferSelect;

/**
 * Type inference for inserting new UserSettings
 */
export type NewUserSettings = typeof userSettings.$inferInsert;

/**
 * Partial user settings for updates
 */
export type UpdateUserSettings = Partial<Omit<NewUserSettings, 'userId' | 'createdAt'>>;
