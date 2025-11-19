import {
  pgTable,
  uuid,
  integer,
  text,
  boolean,
  timestamp,
} from 'drizzle-orm/pg-core';
import { posts } from './posts';

/**
 * Post Variations Table
 *
 * Stores alternative versions of posts for A/B testing.
 * Each post can have multiple variations with different approaches.
 */
export const postVariations = pgTable('post_variations', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Relationship to post
  postId: uuid('post_id')
    .references(() => posts.id, {
      onDelete: 'cascade', // Delete variations when post is deleted
    })
    .notNull(),

  // Variation metadata
  variationNumber: integer('variation_number').notNull(), // 1, 2, 3, etc.
  content: text('content').notNull(),
  reasoning: text('reasoning'), // Why this variation was created (AI explanation)

  // Selection tracking
  selected: boolean('selected').default(false), // Was this variation chosen?

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

/**
 * Type inference for PostVariation entity
 */
export type PostVariation = typeof postVariations.$inferSelect;

/**
 * Type inference for inserting a new PostVariation
 */
export type NewPostVariation = typeof postVariations.$inferInsert;
