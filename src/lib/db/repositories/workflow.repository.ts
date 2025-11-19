import { eq, and, gte, lte, desc, count } from 'drizzle-orm';
import { db } from '../client';
import {
  workflowRuns,
  type WorkflowRun,
  type NewWorkflowRun,
  type WorkflowRunFilters,
  type WorkflowRunWithStats,
} from '../schema/workflow-runs';
import { QueryError } from '../errors';
import { applyPagination } from './base.repository';

/**
 * Workflow Run Repository
 *
 * Handles all database operations for Mastra workflow execution tracking.
 * Supports querying by status, workflow name, and date ranges.
 */
class WorkflowRunRepository {
  /**
   * Create a new workflow run record
   */
  async create(data: NewWorkflowRun): Promise<WorkflowRun> {
    try {
      const [run] = await db.insert(workflowRuns).values(data).returning();
      return run;
    } catch (error) {
      throw new QueryError(
        'Failed to create workflow run',
        undefined,
        undefined,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Find a workflow run by ID
   */
  async findById(id: string): Promise<WorkflowRun | null> {
    try {
      const [run] = await db
        .select()
        .from(workflowRuns)
        .where(eq(workflowRuns.id, id))
        .limit(1);

      return run || null;
    } catch (error) {
      throw new QueryError(
        `Failed to find workflow run with ID: ${id}`,
        undefined,
        undefined,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Find all workflow runs matching filters
   */
  async findAll(filters?: WorkflowRunFilters): Promise<WorkflowRun[]> {
    try {
      const conditions: any[] = [];

      if (filters?.workflowName) {
        conditions.push(eq(workflowRuns.workflowName, filters.workflowName));
      }

      if (filters?.status) {
        conditions.push(eq(workflowRuns.status, filters.status));
      }

      if (filters?.fromDate) {
        conditions.push(gte(workflowRuns.startedAt, filters.fromDate));
      }

      if (filters?.toDate) {
        conditions.push(lte(workflowRuns.startedAt, filters.toDate));
      }

      const { limit, offset } = applyPagination(filters);

      let query = db.select().from(workflowRuns);

      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }

      return await query
        .orderBy(desc(workflowRuns.startedAt))
        .limit(limit)
        .offset(offset);
    } catch (error) {
      throw new QueryError(
        'Failed to find workflow runs',
        undefined,
        undefined,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Find workflow runs by workflow name
   */
  async findByWorkflowName(workflowName: string, limit: number = 50): Promise<WorkflowRun[]> {
    return this.findAll({
      workflowName,
      limit: Math.min(limit, 100),
    });
  }

  /**
   * Find active (running) workflow runs
   */
  async findActive(): Promise<WorkflowRun[]> {
    return this.findAll({ status: 'running' });
  }

  /**
   * Find failed workflow runs
   */
  async findFailed(fromDate?: Date): Promise<WorkflowRun[]> {
    return this.findAll({
      status: 'failed',
      fromDate,
    });
  }

  /**
   * Update workflow run status
   */
  async updateStatus(
    id: string,
    status: 'running' | 'completed' | 'failed' | 'suspended',
    error?: string
  ): Promise<WorkflowRun> {
    try {
      const updateData: any = { status };

      if (status === 'completed' || status === 'failed') {
        updateData.completedAt = new Date();

        // Calculate duration
        const existing = await this.findById(id);
        if (existing?.startedAt) {
          updateData.duration = Date.now() - existing.startedAt.getTime();
        }
      }

      if (error) {
        updateData.error = error;
      }

      const [updated] = await db
        .update(workflowRuns)
        .set(updateData)
        .where(eq(workflowRuns.id, id))
        .returning();

      if (!updated) {
        throw new Error(`Workflow run with ID ${id} not found`);
      }

      return updated;
    } catch (error) {
      throw new QueryError(
        `Failed to update workflow run status for ID: ${id}`,
        undefined,
        undefined,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Update workflow run output
   */
  async updateOutput(id: string, output: Record<string, any>): Promise<WorkflowRun> {
    try {
      const [updated] = await db
        .update(workflowRuns)
        .set({ output })
        .where(eq(workflowRuns.id, id))
        .returning();

      if (!updated) {
        throw new Error(`Workflow run with ID ${id} not found`);
      }

      return updated;
    } catch (error) {
      throw new QueryError(
        `Failed to update workflow run output for ID: ${id}`,
        undefined,
        undefined,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Mark workflow as completed
   */
  async markCompleted(id: string, output?: Record<string, any>): Promise<WorkflowRun> {
    try {
      const existing = await this.findById(id);
      if (!existing) {
        throw new Error(`Workflow run with ID ${id} not found`);
      }

      const duration = existing.startedAt
        ? Date.now() - existing.startedAt.getTime()
        : null;

      const [updated] = await db
        .update(workflowRuns)
        .set({
          status: 'completed',
          completedAt: new Date(),
          duration,
          output: output || existing.output,
        })
        .where(eq(workflowRuns.id, id))
        .returning();

      return updated;
    } catch (error) {
      throw new QueryError(
        `Failed to mark workflow run as completed for ID: ${id}`,
        undefined,
        undefined,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Mark workflow as failed
   */
  async markFailed(id: string, error: string): Promise<WorkflowRun> {
    return this.updateStatus(id, 'failed', error);
  }

  /**
   * Delete a workflow run
   */
  async delete(id: string): Promise<void> {
    try {
      await db.delete(workflowRuns).where(eq(workflowRuns.id, id));
    } catch (error) {
      throw new QueryError(
        `Failed to delete workflow run with ID: ${id}`,
        undefined,
        undefined,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Count workflow runs matching filters
   */
  async count(filters?: WorkflowRunFilters): Promise<number> {
    try {
      const conditions: any[] = [];

      if (filters?.workflowName) {
        conditions.push(eq(workflowRuns.workflowName, filters.workflowName));
      }

      if (filters?.status) {
        conditions.push(eq(workflowRuns.status, filters.status));
      }

      if (filters?.fromDate) {
        conditions.push(gte(workflowRuns.startedAt, filters.fromDate));
      }

      if (filters?.toDate) {
        conditions.push(lte(workflowRuns.startedAt, filters.toDate));
      }

      let query = db.select({ count: count() }).from(workflowRuns);

      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }

      const [result] = await query;
      return result?.count || 0;
    } catch (error) {
      throw new QueryError(
        'Failed to count workflow runs',
        undefined,
        undefined,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Get workflow run with computed stats
   */
  async findByIdWithStats(id: string): Promise<WorkflowRunWithStats | null> {
    const run = await this.findById(id);
    if (!run) return null;

    return {
      ...run,
      isCompleted: run.status === 'completed',
      isFailed: run.status === 'failed',
      isRunning: run.status === 'running',
    };
  }

  /**
   * Get recent runs for a workflow
   */
  async getRecentRuns(workflowName: string, limit: number = 10): Promise<WorkflowRun[]> {
    return this.findAll({
      workflowName,
      limit: Math.min(limit, 100),
    });
  }

  /**
   * Get workflow statistics
   */
  async getWorkflowStats(workflowName: string): Promise<{
    totalRuns: number;
    completed: number;
    failed: number;
    running: number;
    avgDuration: number;
  }> {
    try {
      const allRuns = await this.findByWorkflowName(workflowName, 1000);

      const stats = {
        totalRuns: allRuns.length,
        completed: allRuns.filter(r => r.status === 'completed').length,
        failed: allRuns.filter(r => r.status === 'failed').length,
        running: allRuns.filter(r => r.status === 'running').length,
        avgDuration: 0,
      };

      const completedRuns = allRuns.filter(r => r.duration !== null);
      if (completedRuns.length > 0) {
        const totalDuration = completedRuns.reduce((sum, r) => sum + (r.duration || 0), 0);
        stats.avgDuration = Math.round(totalDuration / completedRuns.length);
      }

      return stats;
    } catch (error) {
      throw new QueryError(
        `Failed to get workflow stats for: ${workflowName}`,
        undefined,
        undefined,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }
}

// Export singleton instance
export const workflowRunRepository = new WorkflowRunRepository();
