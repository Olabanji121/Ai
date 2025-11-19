import { Agent } from '@mastra/core';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';
import { postTools, trendTools, userSettingsTools } from '../tools';

/**
 * Content Generation Agent
 *
 * Specialized agent for creating platform-optimized social media content
 * from viral trends, matching user's brand voice and target audience.
 *
 * Uses Anthropic Claude 3.5 Sonnet for creative content generation.
 */

const systemPrompt = `You are an expert content generation agent specialized in creating engaging, platform-optimized social media posts.

Your responsibilities:
1. Transform viral trends into compelling social media content
2. Adapt tone and style to match user's brand voice
3. Optimize content for specific platforms (Twitter, LinkedIn, Reddit)
4. Include relevant hooks, CTAs, and hashtags
5. Ensure content aligns with target audience preferences

Platform-specific guidelines:
- Twitter: Concise, punchy, thread-worthy, hashtags strategic
- LinkedIn: Professional, value-driven, storytelling, industry insights
- Reddit: Authentic, community-focused, conversation-starting

You have access to:
- getTrends, getTopTrends: Access trend data
- getUserSettings: Get brand voice and preferences
- createPost: Store generated content
- getPlatforms: Check enabled platforms

Always match the user's brand voice while maximizing engagement potential.`;

/**
 * Content Generation Agent
 * Creates platform-optimized posts from trends
 */
export const contentGenerationAgent = new Agent({
  name: 'content-generation-agent',
  instructions: systemPrompt,
  model: anthropic('claude-3-5-sonnet-20241022'),
  tools: {
    ...postTools,
    ...trendTools,
    ...userSettingsTools,
  },
});

/**
 * Input schema for content generation
 */
export const contentGenerationInputSchema = z.object({
  trendId: z.string().uuid(),
  userId: z.string(),
  platforms: z.array(z.enum(['twitter', 'linkedin', 'reddit'])).optional(),
  customInstructions: z.string().optional(),
});

export type ContentGenerationInput = z.infer<typeof contentGenerationInputSchema>;

/**
 * Output schema for generated content
 */
export const contentGenerationOutputSchema = z.object({
  posts: z.array(
    z.object({
      id: z.string(),
      platform: z.string(),
      content: z.string(),
      hashtags: z.array(z.string()).optional(),
      cta: z.string().optional(),
      reasoning: z.string(),
    })
  ),
  trendContext: z.object({
    title: z.string(),
    hook: z.string(),
    score: z.number(),
  }),
  brandVoiceMatch: z.object({
    score: z.number().min(0).max(100),
    notes: z.string(),
  }),
});

export type ContentGenerationOutput = z.infer<typeof contentGenerationOutputSchema>;
