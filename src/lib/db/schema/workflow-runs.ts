import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  jsonb,
} from 'drizzle-orm/pg-core';

/**
 * Workflow Runs Table
 *
 * Tracks execution of Mastra AI workflows.
 * Used for monitoring, debugging, and analytics.
 */
export const workflowRuns = pgTable('workflow_runs', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Workflow identification
  workflowName: text('workflow_name').notNull(), // 'trend-discovery', 'content-generation', etc.
  status: text('status').notNull(), // 'running', 'completed', 'failed', 'suspended'

  // Timing
  startedAt: timestamp('started_at', { withTimezone: true }).defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  duration: integer('duration'), // Duration in milliseconds

  // Input/Output
  input: jsonb('input').$type<Record<string, any>>(), // Workflow input parameters
  output: jsonb('output').$type<Record<string, any>>(), // Workflow result

  // Error tracking
  error: text('error'), // Error message if failed

  // Additional metadata
  metadata: jsonb('metadata').$type<{
    triggeredBy?: 'manual' | 'scheduled' | 'event';
    userId?: string;
    steps?: Array<{
      name: string;
      status: string;
      duration?: number;
    }>;
    retryCount?: number;
  }>(),
});

/**
 * Type inference for WorkflowRun entity
 */
export type WorkflowRun = typeof workflowRuns.$inferSelect;

/**
 * Type inference for inserting new WorkflowRun
 */
export type NewWorkflowRun = typeof workflowRuns.$inferInsert;

/**
 * Workflow run with computed fields
 */
export type WorkflowRunWithStats = WorkflowRun & {
  isCompleted: boolean;
  isFailed: boolean;
  isRunning: boolean;
};

/**
 * Workflow run filter options
 */
export type WorkflowRunFilters = {
  workflowName?: string;
  status?: string;
  fromDate?: Date;
  toDate?: Date;
  limit?: number;
  offset?: number;
};
