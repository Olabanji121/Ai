/**
 * Workflow Scheduler
 *
 * Manages scheduled execution of workflows using cron expressions.
 * Uses the configured cron jobs to automatically trigger workflows.
 */

import { cronJobs, CronJobConfig, getEnabledCronJobs } from './config';
import { executeWithTracking } from '../utils';

/**
 * Scheduler state
 */
let isSchedulerRunning = false;
let scheduledIntervals: Map<string, NodeJS.Timeout> = new Map();

/**
 * Convert cron expression to interval milliseconds (simplified)
 * Note: This is a simplified implementation. For production,
 * use a proper cron library like node-cron.
 */
function cronToIntervalMs(schedule: string): number {
  const parts = schedule.split(' ');
  const [, hour] = parts;

  // Handle */N patterns for hours
  if (hour.includes('*/')) {
    const hours = parseInt(hour.replace('*/', ''));
    return hours * 60 * 60 * 1000;
  }

  // Default to daily (24 hours)
  return 24 * 60 * 60 * 1000;
}

/**
 * Execute a scheduled workflow
 */
async function executeScheduledWorkflow(job: CronJobConfig): Promise<void> {
  console.log(`[Scheduler] Executing scheduled workflow: ${job.name} (${job.workflowName})`);

  try {
    const { runId, output } = await executeWithTracking(
      job.workflowName,
      { ...job.defaultInput, _scheduled: true },
      async () => {
        // In production, this would call the actual workflow
        // For now, return a placeholder result
        return {
          scheduled: true,
          jobId: job.id,
          executedAt: new Date().toISOString(),
        };
      }
    );

    console.log(`[Scheduler] Workflow ${job.name} completed successfully. Run ID: ${runId}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[Scheduler] Workflow ${job.name} failed: ${message}`);
    // TODO: Add notification system for failed scheduled workflows
  }
}

/**
 * Start the scheduler
 *
 * Initializes all enabled cron jobs and starts their schedules.
 */
export function startScheduler(): void {
  if (isSchedulerRunning) {
    console.warn('[Scheduler] Scheduler is already running');
    return;
  }

  const enabledJobs = getEnabledCronJobs();
  console.log(`[Scheduler] Starting scheduler with ${enabledJobs.length} enabled jobs`);

  for (const job of enabledJobs) {
    const intervalMs = cronToIntervalMs(job.schedule);
    console.log(`[Scheduler] Scheduling ${job.name}: every ${intervalMs / 1000 / 60 / 60} hours`);

    const intervalId = setInterval(() => {
      executeScheduledWorkflow(job);
    }, intervalMs);

    scheduledIntervals.set(job.id, intervalId);
  }

  isSchedulerRunning = true;
  console.log('[Scheduler] Scheduler started successfully');
}

/**
 * Stop the scheduler
 *
 * Clears all scheduled intervals and stops the scheduler.
 */
export function stopScheduler(): void {
  if (!isSchedulerRunning) {
    console.warn('[Scheduler] Scheduler is not running');
    return;
  }

  console.log('[Scheduler] Stopping scheduler...');

  for (const [jobId, intervalId] of scheduledIntervals) {
    clearInterval(intervalId);
    console.log(`[Scheduler] Cleared interval for: ${jobId}`);
  }

  scheduledIntervals.clear();
  isSchedulerRunning = false;
  console.log('[Scheduler] Scheduler stopped successfully');
}

/**
 * Check if scheduler is running
 */
export function isSchedulerActive(): boolean {
  return isSchedulerRunning;
}

/**
 * Get scheduler status
 */
export function getSchedulerStatus(): {
  running: boolean;
  activeJobs: number;
  jobs: { id: string; name: string; schedule: string; enabled: boolean }[];
} {
  return {
    running: isSchedulerRunning,
    activeJobs: scheduledIntervals.size,
    jobs: cronJobs.map((job) => ({
      id: job.id,
      name: job.name,
      schedule: job.schedule,
      enabled: job.enabled,
    })),
  };
}

/**
 * Manually trigger a scheduled workflow
 *
 * Useful for testing or manual execution of scheduled jobs.
 */
export async function triggerScheduledJob(jobId: string): Promise<void> {
  const job = cronJobs.find((j) => j.id === jobId);
  if (!job) {
    throw new Error(`Cron job not found: ${jobId}`);
  }

  console.log(`[Scheduler] Manually triggering: ${job.name}`);
  await executeScheduledWorkflow(job);
}
