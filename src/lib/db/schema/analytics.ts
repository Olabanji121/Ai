import {
  pgTable,
  uuid,
  text,
  integer,
  real,
  timestamp,
  jsonb,
} from 'drizzle-orm/pg-core';
import { posts } from './posts';

/**
 * Analytics Table
 *
 * Stores performance metrics for published posts.
 * Metrics are fetched from Ayrshare or platform APIs.
 */
export const analytics = pgTable('analytics', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Relationship to post
  postId: uuid('post_id')
    .references(() => posts.id, {
      onDelete: 'cascade', // Delete analytics when post is deleted
    })
    .notNull(),

  // Platform
  platform: text('platform').notNull(), // 'twitter', 'linkedin', 'reddit'

  // Engagement metrics
  likes: integer('likes').default(0),
  comments: integer('comments').default(0),
  shares: integer('shares').default(0),
  impressions: integer('impressions').default(0),
  clicks: integer('clicks').default(0),

  // Calculated metrics
  ctr: real('ctr'), // Click-through rate: (clicks / impressions) * 100
  engagementRate: real('engagement_rate'), // ((likes + comments + shares) / impressions) * 100
  reachRate: real('reach_rate'), // Platform-specific reach metric

  // Metadata
  fetchedAt: timestamp('fetched_at', { withTimezone: true }).defaultNow(),
  rawData: jsonb('raw_data').$type<{
    platformResponse?: any;
    additionalMetrics?: Record<string, any>;
  }>(), // Full response from analytics API
});

/**
 * Type inference for Analytics entity
 */
export type Analytics = typeof analytics.$inferSelect;

/**
 * Type inference for inserting new Analytics
 */
export type NewAnalytics = typeof analytics.$inferInsert;

/**
 * Analytics with calculated metrics
 */
export type AnalyticsWithMetrics = Analytics & {
  totalEngagement: number; // likes + comments + shares
  performanceScore: number; // 0-100 score based on metrics
};

/**
 * Analytics filter options
 */
export type AnalyticsFilters = {
  postId?: string;
  platform?: string;
  fromDate?: Date;
  toDate?: Date;
  limit?: number;
  offset?: number;
};
