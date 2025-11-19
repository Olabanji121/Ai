import { workflowRunRepository } from '@/lib/db/repositories';

/**
 * Workflow State Tracking Utilities
 *
 * Provides functions to track workflow execution state in the database.
 * All workflows should use these utilities to record their execution.
 */

/**
 * Workflow run status types
 */
export type WorkflowStatus = 'running' | 'completed' | 'failed';

/**
 * Start a new workflow run
 *
 * @param name - The name of the workflow
 * @param input - The input parameters for the workflow
 * @returns The created workflow run record
 *
 * @example
 * ```typescript
 * const run = await startWorkflowRun('trend-discovery', { sources: ['reddit'] });
 * console.log(`Started workflow: ${run.id}`);
 * ```
 */
export async function startWorkflowRun(
  name: string,
  input: Record<string, unknown>
): Promise<{ id: string; status: string; startedAt: Date }> {
  try {
    const run = await workflowRunRepository.create({
      workflowName: name,
      status: 'running',
      input,
      startedAt: new Date(),
    });

    return {
      id: run.id,
      status: run.status || 'running',
      startedAt: run.startedAt || new Date(),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to start workflow run: ${message}`);
  }
}

/**
 * Complete a workflow run successfully
 *
 * @param id - The workflow run ID
 * @param output - The output/result of the workflow
 * @returns The updated workflow run record
 *
 * @example
 * ```typescript
 * await completeWorkflowRun(runId, { trendsProcessed: 10, trendsStored: 8 });
 * ```
 */
export async function completeWorkflowRun(
  id: string,
  output: Record<string, unknown>
): Promise<{ id: string; status: string; completedAt: Date }> {
  try {
    // Use complete method from repository
    const run = await workflowRunRepository.markCompleted(id, output);

    return {
      id: run.id,
      status: run.status || 'completed',
      completedAt: run.completedAt || new Date(),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to complete workflow run: ${message}`);
  }
}

/**
 * Mark a workflow run as failed
 *
 * @param id - The workflow run ID
 * @param error - The error that caused the failure
 * @returns The updated workflow run record
 *
 * @example
 * ```typescript
 * await failWorkflowRun(runId, 'LLM API rate limit exceeded');
 * ```
 */
export async function failWorkflowRun(
  id: string,
  error: string | Error
): Promise<{ id: string; status: string; error: string; completedAt: Date }> {
  const errorMessage = error instanceof Error ? error.message : error;

  try {
    // Use fail method from repository
    const run = await workflowRunRepository.markFailed(id, errorMessage);

    return {
      id: run.id,
      status: run.status || 'failed',
      error: run.error || errorMessage,
      completedAt: run.completedAt || new Date(),
    };
  } catch (updateError) {
    const message = updateError instanceof Error ? updateError.message : String(updateError);
    throw new Error(`Failed to mark workflow run as failed: ${message}`);
  }
}

/**
 * Get a workflow run by ID
 *
 * @param id - The workflow run ID
 * @returns The workflow run record or null if not found
 *
 * @example
 * ```typescript
 * const run = await getWorkflowRun(runId);
 * if (run?.status === 'completed') {
 *   console.log('Workflow completed successfully');
 * }
 * ```
 */
export async function getWorkflowRun(id: string) {
  try {
    return await workflowRunRepository.findById(id);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to get workflow run: ${message}`);
  }
}

/**
 * Get recent workflow runs with optional filtering
 *
 * @param options - Filter options
 * @returns Array of workflow runs
 *
 * @example
 * ```typescript
 * const runs = await getRecentWorkflowRuns({
 *   workflowName: 'trend-discovery',
 *   status: 'completed',
 *   limit: 10
 * });
 * ```
 */
export async function getRecentWorkflowRuns(options?: {
  workflowName?: string;
  status?: WorkflowStatus;
  limit?: number;
  offset?: number;
}) {
  try {
    return await workflowRunRepository.findAll({
      workflowName: options?.workflowName,
      status: options?.status,
      limit: options?.limit || 50,
      offset: options?.offset || 0,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to get recent workflow runs: ${message}`);
  }
}

/**
 * Workflow execution wrapper with automatic state tracking
 *
 * Automatically tracks the workflow execution state - starts the run,
 * completes it on success, or fails it on error.
 *
 * @param name - The workflow name
 * @param input - The workflow input
 * @param executor - The workflow execution function
 * @returns The workflow output
 *
 * @example
 * ```typescript
 * const result = await executeWithTracking(
 *   'trend-discovery',
 *   { sources: ['reddit'] },
 *   async (runId) => {
 *     // Your workflow logic here
 *     return { trendsProcessed: 10 };
 *   }
 * );
 * ```
 */
export async function executeWithTracking<T extends Record<string, unknown>>(
  name: string,
  input: Record<string, unknown>,
  executor: (runId: string) => Promise<T>
): Promise<{ runId: string; output: T }> {
  const run = await startWorkflowRun(name, input);

  try {
    const output = await executor(run.id);
    await completeWorkflowRun(run.id, output);
    return { runId: run.id, output };
  } catch (error) {
    await failWorkflowRun(run.id, error instanceof Error ? error : String(error));
    throw error;
  }
}
