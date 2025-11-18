import {
  pgTable,
  uuid,
  text,
  real,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { trends } from './trends';

/**
 * Posts Table
 *
 * Stores generated social media posts for various platforms.
 * Each post is linked to a trend and goes through a review workflow.
 */
export const posts = pgTable(
  'posts',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Relationship to trend
    trendId: uuid('trend_id').references(() => trends.id, {
      onDelete: 'set null', // Keep post if trend is deleted
    }),

    // Platform and content
    platform: text('platform').notNull(), // 'twitter', 'linkedin', 'reddit'
    content: text('content').notNull(),
    mediaUrls: text('media_urls').array(), // URLs to images/videos
    hashtags: text('hashtags').array(), // Platform hashtags

    // Content metadata
    tone: text('tone'), // 'professional', 'casual', 'educational', 'humorous'
    qualityScore: real('quality_score'), // AI-generated quality score 0-100

    // Workflow status
    status: text('status').default('draft'), // 'draft', 'pending_review', 'approved', 'published', 'rejected', 'failed'

    // Publishing info
    scheduledFor: timestamp('scheduled_for', { withTimezone: true }),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    externalPostId: text('external_post_id'), // ID from Ayrshare or platform

    // Failure tracking
    failureReason: text('failure_reason'),

    // User tracking
    createdBy: uuid('created_by'), // User who initiated generation
    reviewedBy: uuid('reviewed_by'), // User who reviewed
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),

    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    // Indexes for common queries
    statusIdx: index('idx_posts_status').on(table.status),
    platformIdx: index('idx_posts_platform').on(table.platform),
    scheduledForIdx: index('idx_posts_scheduled_for').on(table.scheduledFor),
    trendIdIdx: index('idx_posts_trend_id').on(table.trendId),
  })
);

/**
 * Type inference for Post entity
 */
export type Post = typeof posts.$inferSelect;

/**
 * Type inference for inserting a new Post
 */
export type NewPost = typeof posts.$inferInsert;

/**
 * Partial post type for updates
 */
export type UpdatePost = Partial<Omit<NewPost, 'id' | 'createdAt'>>;

/**
 * Post filter options
 */
export type PostFilters = {
  status?: string;
  platform?: string;
  trendId?: string;
  createdBy?: string;
  scheduledFrom?: Date;
  scheduledTo?: Date;
  limit?: number;
  offset?: number;
};

/**
 * Post with joined trend data
 */
export type PostWithTrend = Post & {
  trend: typeof trends.$inferSelect | null;
};
