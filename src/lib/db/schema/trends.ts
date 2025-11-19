import {
  pgTable,
  uuid,
  text,
  real,
  timestamp,
  boolean,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

/**
 * Trends Table
 *
 * Stores trending topics discovered from various sources (Reddit, Twitter, Google Trends).
 * Each trend is analyzed by AI for content opportunity and assigned a virality score.
 */
export const trends = pgTable(
  'trends',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Core trend data
    title: text('title').notNull(),
    hook: text('hook').notNull(), // AI-generated hook for content

    // Source information
    source: text('source').notNull(), // 'reddit', 'twitter', 'google_trends'
    sourceUrl: text('source_url'),

    // Analysis results
    score: real('score').notNull(), // Virality score 0-100
    sentiment: text('sentiment'), // 'positive', 'negative', 'neutral'
    category: text('category'), // 'tech', 'business', 'entertainment', etc.

    // Additional metadata
    metadata: jsonb('metadata').$type<{
      reasoning?: string;
      contentOpportunity?: string;
      redditData?: {
        subreddit?: string;
        upvotes?: number;
        comments?: number;
        awards?: number;
      };
      twitterData?: {
        mentions?: number;
        retweets?: number;
      };
      googleData?: {
        traffic?: string;
        articles?: Array<{ title: string; source: string; url: string }>;
      };
    }>(),

    // Status tracking
    status: text('status').default('new'), // 'new', 'processing', 'completed', 'rejected'
    usedForContent: boolean('used_for_content').default(false),

    // AI embeddings for semantic search (OpenAI embeddings are 1536 dimensions)
    // Note: Requires pgvector extension
    embedding: text('embedding'), // Will be vector(1536) after pgvector is enabled

    // Timestamps
    discoveredAt: timestamp('discovered_at', { withTimezone: true }).defaultNow(),
    expiresAt: timestamp('expires_at', { withTimezone: true }), // Trend freshness
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    // Indexes for common queries
    scoreIdx: index('idx_trends_score').on(table.score),
    statusIdx: index('idx_trends_status').on(table.status),
    sourceIdx: index('idx_trends_source').on(table.source),
    discoveredAtIdx: index('idx_trends_discovered_at').on(table.discoveredAt),
  })
);

/**
 * Type inference for Trend entity
 * Use this type when selecting from the database
 */
export type Trend = typeof trends.$inferSelect;

/**
 * Type inference for inserting a new Trend
 * Use this type when creating new trends
 */
export type NewTrend = typeof trends.$inferInsert;

/**
 * Partial trend type for updates
 */
export type UpdateTrend = Partial<Omit<NewTrend, 'id' | 'createdAt'>>;

/**
 * Trend filter options
 */
export type TrendFilters = {
  status?: string;
  source?: string;
  category?: string;
  minScore?: number;
  maxScore?: number;
  usedForContent?: boolean;
  limit?: number;
  offset?: number;
};
