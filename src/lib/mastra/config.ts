import { z } from 'zod';

/**
 * Environment variable schema with validation
 */
const envSchema = z.object({
  OPENAI_API_KEY: z.string().min(1, 'OpenAI API key is required'),
  ANTHROPIC_API_KEY: z.string().min(1, 'Anthropic API key is required'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

/**
 * Validate and parse environment variables
 */
function validateEnv() {
  try {
    return envSchema.parse({
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
      NODE_ENV: process.env.NODE_ENV,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.issues.map((e: any) => e.path.join('.')).join(', ');
      throw new Error(
        `Missing required environment variables: ${missingVars}. ` +
          `Please check your .env.local file.`
      );
    }
    throw error;
  }
}

/**
 * Mastra Configuration Interface
 */
export interface MastraConfig {
  llm: {
    openai: {
      apiKey: string;
      model: string;
      temperature?: number;
      maxTokens?: number;
    };
    anthropic: {
      apiKey: string;
      model: string;
      temperature?: number;
      maxTokens?: number;
    };
  };
  workflows: {
    trendDiscovery: {
      enabled: boolean;
      schedule: string; // cron format
      minScore: number;
    };
    contentGeneration: {
      enabled: boolean;
      defaultPlatforms: string[];
    };
    optimization: {
      enabled: boolean;
      schedule: string; // cron format
    };
  };
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    pretty: boolean;
  };
  retry: {
    maxRetries: number;
    backoffMs: number[];
  };
}

/**
 * Get Mastra configuration
 * Validates environment variables and returns configuration object
 */
export function getMastraConfig(): MastraConfig {
  const env = validateEnv();

  return {
    llm: {
      openai: {
        apiKey: env.OPENAI_API_KEY,
        model: 'gpt-4-turbo-preview',
        temperature: 0.7,
        maxTokens: 2000,
      },
      anthropic: {
        apiKey: env.ANTHROPIC_API_KEY,
        model: 'claude-3-5-sonnet-20241022',
        temperature: 0.7,
        maxTokens: 4000,
      },
    },
    workflows: {
      trendDiscovery: {
        enabled: true,
        schedule: '0 */6 * * *', // Every 6 hours
        minScore: 70,
      },
      contentGeneration: {
        enabled: true,
        defaultPlatforms: ['twitter', 'linkedin'],
      },
      optimization: {
        enabled: true,
        schedule: '0 0 * * *', // Daily at midnight
      },
    },
    logging: {
      level: env.NODE_ENV === 'production' ? 'info' : 'debug',
      pretty: env.NODE_ENV !== 'production',
    },
    retry: {
      maxRetries: 3,
      backoffMs: [2000, 4000, 8000], // Exponential backoff: 2s, 4s, 8s
    },
  };
}

/**
 * Mastra configuration singleton
 */
export const mastraConfig = getMastraConfig();
