import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { executeWithTracking } from '@/lib/mastra/utils';
import { trendDiscoveryAgent } from '@/lib/mastra/agents';
// trendRepository will be used for actual trend discovery

/**
 * POST /api/workflows/trend-discovery
 *
 * Triggers the trend discovery workflow to analyze and score viral trends.
 */

const requestSchema = z.object({
  sources: z.array(z.enum(['reddit', 'twitter', 'google_trends'])).default(['reddit', 'twitter', 'google_trends']),
  minScore: z.number().min(0).max(100).default(70),
  maxTrends: z.number().min(1).max(100).default(20),
  categories: z.array(z.string()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const input = requestSchema.parse(body);

    const { runId, output } = await executeWithTracking(
      'trend-discovery',
      input,
      async () => {
        // Use the trend discovery agent to analyze trends
        const prompt = `Analyze current trends from the following sources: ${input.sources.join(', ')}.

Focus on:
- Viral content with high engagement potential
- Recent trends (last 24-48 hours)
- Content creation opportunities
- Minimum virality score: ${input.minScore}

Identify the top ${input.maxTrends} trends and provide analysis.`;

        await trendDiscoveryAgent.generate(prompt);

        // For now, return simulated results
        // In production, this would process the agent's response
        const storedTrends: { id: string; title: string; score: number; source: string }[] = [];

        return {
          processedTrends: input.maxTrends,
          storedTrends: storedTrends.length,
          topTrends: storedTrends.slice(0, 5),
          recommendations: [
            'Focus on trending topics in tech and business',
            'Monitor Reddit r/technology for emerging trends',
            'Leverage Twitter trending hashtags for viral potential',
          ],
        };
      }
    );

    return NextResponse.json({
      success: true,
      runId,
      data: output,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation Error',
          details: error.issues,
        },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        success: false,
        error: 'Workflow execution failed',
        message,
      },
      { status: 500 }
    );
  }
}
