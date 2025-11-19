-- Migration: Initial Schema
-- Created: 2025-11-18
-- Description: Create all tables for AutoMarketeer database module

-- Enable pgvector extension for embeddings support
CREATE EXTENSION IF NOT EXISTS vector;

-- Create trends table
CREATE TABLE IF NOT EXISTS "trends" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"hook" text NOT NULL,
	"source" text NOT NULL,
	"source_url" text,
	"score" real NOT NULL,
	"sentiment" text,
	"category" text,
	"metadata" jsonb,
	"status" text DEFAULT 'new',
	"used_for_content" boolean DEFAULT false,
	"embedding" text,
	"discovered_at" timestamp with time zone DEFAULT now(),
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint

-- Create posts table
CREATE TABLE IF NOT EXISTS "posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trend_id" uuid,
	"platform" text NOT NULL,
	"content" text NOT NULL,
	"media_urls" text[],
	"hashtags" text[],
	"tone" text,
	"status" text DEFAULT 'draft',
	"quality_score" real,
	"scheduled_for" timestamp with time zone,
	"published_at" timestamp with time zone,
	"external_post_id" text,
	"failure_reason" text,
	"created_by" uuid,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint

-- Create post_variations table
CREATE TABLE IF NOT EXISTS "post_variations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" uuid NOT NULL,
	"variation_number" integer NOT NULL,
	"content" text NOT NULL,
	"reasoning" text,
	"selected" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint

-- Create analytics table
CREATE TABLE IF NOT EXISTS "analytics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" uuid NOT NULL,
	"platform" text NOT NULL,
	"likes" integer DEFAULT 0,
	"comments" integer DEFAULT 0,
	"shares" integer DEFAULT 0,
	"impressions" integer DEFAULT 0,
	"clicks" integer DEFAULT 0,
	"ctr" real,
	"engagement_rate" real,
	"reach_rate" real,
	"fetched_at" timestamp with time zone DEFAULT now(),
	"raw_data" jsonb
);
--> statement-breakpoint

-- Create user_settings table
CREATE TABLE IF NOT EXISTS "user_settings" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"brand_voice" text,
	"target_audience" text,
	"platforms" text[],
	"auto_publish" boolean DEFAULT false,
	"posting_schedule" jsonb,
	"tone_preferences" jsonb,
	"content_guidelines" jsonb,
	"notification_preferences" jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint

-- Create workflow_runs table
CREATE TABLE IF NOT EXISTS "workflow_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workflow_name" text NOT NULL,
	"status" text NOT NULL,
	"started_at" timestamp with time zone DEFAULT now(),
	"completed_at" timestamp with time zone,
	"duration" integer,
	"input" jsonb,
	"output" jsonb,
	"error" text,
	"metadata" jsonb
);
--> statement-breakpoint

-- Add foreign key constraints
DO $$ BEGIN
 ALTER TABLE "posts" ADD CONSTRAINT "posts_trend_id_trends_id_fk" FOREIGN KEY ("trend_id") REFERENCES "trends"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "post_variations" ADD CONSTRAINT "post_variations_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "analytics" ADD CONSTRAINT "analytics_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Create indexes for trends table
CREATE INDEX IF NOT EXISTS "idx_trends_score" ON "trends" ("score");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_trends_status" ON "trends" ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_trends_source" ON "trends" ("source");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_trends_discovered_at" ON "trends" ("discovered_at");
--> statement-breakpoint

-- Create indexes for posts table
CREATE INDEX IF NOT EXISTS "idx_posts_status" ON "posts" ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_posts_platform" ON "posts" ("platform");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_posts_scheduled_for" ON "posts" ("scheduled_for");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_posts_trend_id" ON "posts" ("trend_id");
