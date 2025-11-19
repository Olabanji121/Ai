import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getRecentWorkflowRuns } from '@/lib/mastra/utils';

/**
 * GET /api/workflows/runs
 *
 * Get workflow run history with optional filtering and pagination.
 */

const querySchema = z.object({
  workflowName: z.string().optional(),
  status: z.enum(['running', 'completed', 'failed']).optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const query = querySchema.parse({
      workflowName: searchParams.get('workflowName') || undefined,
      status: searchParams.get('status') || undefined,
      limit: searchParams.get('limit') || 50,
      offset: searchParams.get('offset') || 0,
    });

    const runs = await getRecentWorkflowRuns({
      workflowName: query.workflowName,
      status: query.status,
      limit: query.limit,
      offset: query.offset,
    });

    return NextResponse.json({
      success: true,
      data: {
        runs: runs.map((run) => ({
          id: run.id,
          workflowName: run.workflowName,
          status: run.status,
          startedAt: run.startedAt,
          completedAt: run.completedAt,
          error: run.error,
        })),
        pagination: {
          limit: query.limit,
          offset: query.offset,
          total: runs.length,
        },
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation Error', details: error.issues },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { success: false, error: 'Failed to get workflow runs', message },
      { status: 500 }
    );
  }
}
