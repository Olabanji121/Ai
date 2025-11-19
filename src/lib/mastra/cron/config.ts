/**
 * Cron Configuration
 *
 * Defines scheduled workflow execution times and settings.
 */

/**
 * Cron job configuration interface
 */
export interface CronJobConfig {
  /** Unique identifier for the cron job */
  id: string;
  /** Human-readable name */
  name: string;
  /** Cron expression (e.g., '0 *\/6 * * *' for every 6 hours) */
  schedule: string;
  /** Whether the cron job is enabled */
  enabled: boolean;
  /** Workflow to execute */
  workflowName: string;
  /** Default input for the workflow */
  defaultInput: Record<string, unknown>;
  /** Optional description */
  description?: string;
}

/**
 * Scheduled workflow configurations
 */
export const cronJobs: CronJobConfig[] = [
  {
    id: 'trend-discovery-scheduled',
    name: 'Trend Discovery',
    schedule: '0 */6 * * *', // Every 6 hours
    enabled: true,
    workflowName: 'trend-discovery',
    defaultInput: {
      sources: ['reddit', 'twitter', 'google_trends'],
      minScore: 70,
      maxTrends: 20,
    },
    description: 'Automatically discover and score viral trends every 6 hours',
  },
  {
    id: 'optimization-scheduled',
    name: 'Content Optimization',
    schedule: '0 0 * * *', // Daily at midnight
    enabled: true,
    workflowName: 'optimization',
    defaultInput: {
      analysisType: 'platform-overview',
      minPostsRequired: 5,
    },
    description: 'Analyze post performance and generate optimization insights daily',
  },
];

/**
 * Get cron configuration by ID
 */
export function getCronJob(id: string): CronJobConfig | undefined {
  return cronJobs.find((job) => job.id === id);
}

/**
 * Get all enabled cron jobs
 */
export function getEnabledCronJobs(): CronJobConfig[] {
  return cronJobs.filter((job) => job.enabled);
}

/**
 * Parse cron expression to human-readable format
 */
export function describeCronSchedule(schedule: string): string {
  const parts = schedule.split(' ');
  if (parts.length !== 5) return schedule;

  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

  // Simple descriptions for common patterns
  if (hour.includes('*/')) {
    const hours = parseInt(hour.replace('*/', ''));
    return `Every ${hours} hours`;
  }

  if (minute === '0' && hour === '0' && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
    return 'Daily at midnight';
  }

  if (minute === '0' && hour === '*' && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
    return 'Every hour';
  }

  return schedule;
}
