import { NextRequest, NextResponse } from 'next/server';
import { getWorkflowRun } from '@/lib/mastra/utils';

/**
 * GET /api/workflows/status/[id]
 *
 * Get the status of a workflow run by ID.
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Workflow run ID is required' },
        { status: 400 }
      );
    }

    const run = await getWorkflowRun(id);

    if (!run) {
      return NextResponse.json(
        { success: false, error: 'Workflow run not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: run.id,
        workflowName: run.workflowName,
        status: run.status,
        startedAt: run.startedAt,
        completedAt: run.completedAt,
        input: run.input,
        output: run.output,
        error: run.error,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { success: false, error: 'Failed to get workflow status', message },
      { status: 500 }
    );
  }
}
