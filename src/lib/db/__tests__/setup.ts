/**
 * Test Setup for Database Module
 *
 * This file configures the test environment for database tests.
 * It provides utilities for mocking database connections and
 * setting up test data.
 */

import { vi, beforeEach } from 'vitest';
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });
dotenv.config({ path: '.env.local' });

// Mock environment variables for tests
process.env.DATABASE_URL =
  process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test_db';
process.env.NODE_ENV = 'test';

/**
 * Test data factories for creating mock records
 */
export const testFactories = {
  trend: (overrides = {}) => ({
    title: 'Test Trend',
    hook: 'This is a test hook',
    source: 'reddit',
    sourceUrl: 'https://reddit.com/r/test',
    score: 85.5,
    sentiment: 'positive',
    category: 'technology',
    metadata: { subreddit: 'test', upvotes: 1000 },
    status: 'new',
    usedForContent: false,
    discoveredAt: new Date(),
    ...overrides,
  }),

  post: (overrides = {}) => ({
    platform: 'twitter',
    content: 'Test post content',
    mediaUrls: [],
    hashtags: ['test', 'automation'],
    tone: 'professional',
    status: 'draft',
    qualityScore: 8.5,
    ...overrides,
  }),

  analytics: (overrides = {}) => ({
    postId: '00000000-0000-0000-0000-000000000000',
    platform: 'twitter',
    likes: 100,
    comments: 20,
    shares: 15,
    impressions: 1000,
    clicks: 50,
    fetchedAt: new Date(),
    rawData: { test: true },
    ...overrides,
  }),

  userSettings: (overrides = {}) => ({
    userId: '00000000-0000-0000-0000-000000000001',
    brandVoice: 'Professional and approachable',
    targetAudience: 'Tech professionals',
    platforms: ['twitter', 'linkedin'],
    autoPublish: false,
    postingSchedule: {
      twitter: { days: [1, 3, 5], time: '09:00' },
      linkedin: { days: [2, 4], time: '10:00' },
    },
    tonePreferences: { default: 'professional', twitter: 'casual' },
    contentGuidelines: { maxHashtags: 5, includeEmoji: true },
    notificationPreferences: { email: true, slack: false },
    ...overrides,
  }),

  workflowRun: (overrides = {}) => ({
    workflowName: 'test-workflow',
    status: 'running' as const,
    startedAt: new Date(),
    input: { test: true },
    metadata: {},
    ...overrides,
  }),
};

/**
 * Mock database client for unit tests
 */
export const mockDbClient: any = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  offset: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockReturnThis(),
  leftJoin: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  values: vi.fn().mockReturnThis(),
  returning: vi.fn().mockResolvedValue([]),
  update: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  transaction: vi.fn(),
};

/**
 * Clean up function for test isolation
 */
export const cleanupTestData = () => {
  // Reset all mocks between tests
  vi.clearAllMocks();
};

beforeEach(() => {
  cleanupTestData();
});

/**
 * Utility to wait for async operations in tests
 */
export const waitFor = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Generate a test UUID
 */
export const testUuid = (index: number = 0) => {
  return `00000000-0000-0000-0000-${String(index).padStart(12, '0')}`;
};

/**
 * Mock date for consistent testing
 */
export const mockDate = new Date('2025-01-15T12:00:00Z');

/**
 * Setup function for integration tests
 * This would connect to a real test database if DATABASE_URL is set
 */
export const setupIntegrationTests = async () => {
  if (!process.env.DATABASE_URL?.includes('test')) {
    console.warn(
      'WARNING: DATABASE_URL does not contain "test". Skipping integration tests.'
    );
    return false;
  }
  return true;
};

/**
 * Teardown function for integration tests
 */
export const teardownIntegrationTests = async () => {
  // Clean up test database if needed
};
