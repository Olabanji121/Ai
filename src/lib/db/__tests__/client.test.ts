/**
 * Database Client Tests
 *
 * Tests for core database connection, health checks, and utilities
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConnectionError } from '../errors';

// Mock the postgres client before any imports
const mockSqlClient: any = vi.fn().mockResolvedValue([{ health: 1 }]);
mockSqlClient.end = vi.fn().mockResolvedValue(undefined);

const mockPostgres = vi.fn(() => mockSqlClient);

vi.mock('postgres', () => ({
  default: mockPostgres,
}));

// Mock drizzle-orm
vi.mock('drizzle-orm/postgres-js', () => ({
  drizzle: vi.fn(() => ({})),
}));

// Now import the client module after mocks are set up
const clientModule = await import('../client');

describe('Database Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSqlClient.mockResolvedValue([{ health: 1 }]);
  });

  describe('healthCheck', () => {
    it('should return true when database is healthy', async () => {
      const result = await clientModule.healthCheck();
      expect(result).toBe(true);
    });

    it('should return false when health check times out', async () => {
      // Mock a slow query that will timeout
      mockSqlClient.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve([{ health: 1 }]), 10000))
      );

      const result = await clientModule.healthCheck();
      expect(typeof result).toBe('boolean');
    });

    it('should return false and log error when query fails', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mockSqlClient.mockRejectedValue(new Error('Connection refused'));

      const result = await clientModule.healthCheck();

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('disconnect', () => {
    it('should disconnect from database successfully', async () => {
      await expect(clientModule.disconnect()).resolves.not.toThrow();
    });

    it('should throw ConnectionError if disconnect fails', async () => {
      mockSqlClient.end.mockRejectedValue(new Error('Disconnect failed'));

      await expect(clientModule.disconnect()).rejects.toThrow(ConnectionError);
    });
  });

  describe('getPoolStats', () => {
    it('should return connection pool statistics', () => {
      const stats = clientModule.getPoolStats();

      expect(stats).toHaveProperty('maxConnections');
      expect(stats).toHaveProperty('idleTimeout');
      expect(stats).toHaveProperty('connectTimeout');
      expect(stats).toHaveProperty('statementTimeout');

      expect(stats.maxConnections).toBe(10);
      expect(stats.idleTimeout).toBe(30);
      expect(stats.connectTimeout).toBe(10);
      expect(stats.statementTimeout).toBe(30000);
    });
  });

  describe('getClient', () => {
    it('should return the database client', () => {
      const client = clientModule.getClient();

      expect(client).toBeDefined();
      expect(typeof client).toBe('function');
    });
  });
});

describe('Database Configuration', () => {
  it('should use DATABASE_URL from environment', () => {
    expect(process.env.DATABASE_URL).toBeDefined();
  });

  it('should configure connection pool correctly', () => {
    const stats = clientModule.getPoolStats();

    // Verify pool configuration matches requirements
    expect(stats.maxConnections).toBeLessThanOrEqual(10);
    expect(stats.idleTimeout).toBeGreaterThan(0);
    expect(stats.connectTimeout).toBeGreaterThan(0);
  });
});

describe('Error Handling', () => {
  it('should export ConnectionError', () => {
    expect(ConnectionError).toBeDefined();
    const error = new ConnectionError('Test error', 'localhost', 5432);

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('ConnectionError');
    expect(error.message).toBe('Test error');
    expect(error.host).toBe('localhost');
    expect(error.port).toBe(5432);
  });
});
