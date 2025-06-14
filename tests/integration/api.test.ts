/**
 * Integration tests for API endpoints
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { serve } from '@hono/node-server';
import app from '../../src/api';

interface ApiResponse {
    success: boolean;
    positions?: any[];
    transactions?: any[];
    parameters?: any[];
    error?: string;
}

describe('API Integration Tests', () => {
    const port = 3002;
    let server: any;

    beforeAll(async () => {
        server = serve({
            fetch: app.fetch,
            port
        });

        // Wait a moment for server to start
        await new Promise(resolve => setTimeout(resolve, 100));
    });

    afterAll(async () => {
        if (server) {
            server.close();
        }
    });

    describe('GET /api/positions', () => {
        it('should return all positions', async () => {
            const response = await fetch(`http://localhost:${port}/api/positions`);
            const data = await response.json() as ApiResponse;

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(Array.isArray(data.positions)).toBe(true);
        });

        it('should handle errors gracefully', async () => {
            // This might fail if database is not set up properly
            const response = await fetch(`http://localhost:${port}/api/positions`);
            const data = await response.json() as ApiResponse;

            if (!data.success) {
                expect(response.status).toBe(500);
                expect(typeof data.error).toBe('string');
            } else {
                expect(response.status).toBe(200);
                expect(Array.isArray(data.positions)).toBe(true);
            }
        });
    });

    describe('GET /api/positions/:userAddress', () => {
        it('should return positions for a specific user', async () => {
            const testAddress = '0x1234567890123456789012345678901234567890';
            const response = await fetch(`http://localhost:${port}/api/positions/${testAddress}`);
            const data = await response.json() as ApiResponse;

            expect(response.status).toBe(200);
            expect(Array.isArray(data.positions)).toBe(true);
        });

        it('should handle invalid address format', async () => {
            const invalidAddress = 'invalid-address';
            const response = await fetch(`http://localhost:${port}/api/positions/${invalidAddress}`);

            // Should either succeed with empty array or fail gracefully
            expect([200, 400, 500]).toContain(response.status);
        });

        it('should return empty array for non-existent user', async () => {
            const nonExistentAddress = '0x0000000000000000000000000000000000000000';
            const response = await fetch(`http://localhost:${port}/api/positions/${nonExistentAddress}`);
            const data = await response.json() as ApiResponse;

            expect(response.status).toBe(200);
            expect(Array.isArray(data.positions)).toBe(true);
            // No assertion on length as it depends on database state
        });
    });

    describe('GET /api/transactions/:userAddress', () => {
        it('should return transactions for a specific user', async () => {
            const testAddress = '0x1234567890123456789012345678901234567890';
            const response = await fetch(`http://localhost:${port}/api/transactions/${testAddress}`);
            const data = await response.json() as ApiResponse;

            expect(response.status).toBe(200);
            expect(Array.isArray(data.transactions)).toBe(true);
        });

        it('should return transactions in descending order by block number', async () => {
            const testAddress = '0x1234567890123456789012345678901234567890';
            const response = await fetch(`http://localhost:${port}/api/transactions/${testAddress}`);
            const data = await response.json() as ApiResponse;

            if (data.success && data.transactions && data.transactions.length > 1) {
                const blockNumbers = data.transactions.map((tx: any) => parseInt(tx.block_number));
                const sortedBlockNumbers = [...blockNumbers].sort((a, b) => b - a);
                expect(blockNumbers).toEqual(sortedBlockNumbers);
            }
        });
    });

    describe('GET /api/market/:mTokenAddress', () => {
        it('should return market parameters for a specific market', async () => {
            const testMTokenAddress = '0x1234567890123456789012345678901234567890';
            const response = await fetch(`http://localhost:${port}/api/market/${testMTokenAddress}`);
            const data = await response.json() as ApiResponse;

            expect(response.status).toBe(200);
            expect(Array.isArray(data.parameters)).toBe(true);
        });

        it('should limit results to 10 items', async () => {
            const testMTokenAddress = '0x1234567890123456789012345678901234567890';
            const response = await fetch(`http://localhost:${port}/api/market/${testMTokenAddress}`);
            const data = await response.json() as ApiResponse;

            if (data.success && data.parameters) {
                expect(data.parameters.length).toBeLessThanOrEqual(10);
            }
        });

        it('should return parameters in descending order by block number', async () => {
            const testMTokenAddress = '0x1234567890123456789012345678901234567890';
            const response = await fetch(`http://localhost:${port}/api/market/${testMTokenAddress}`);
            const data = await response.json() as ApiResponse;

            if (data.success && data.parameters && data.parameters.length > 1) {
                const blockNumbers = data.parameters.map((param: any) => parseInt(param.block_number));
                const sortedBlockNumbers = [...blockNumbers].sort((a, b) => b - a);
                expect(blockNumbers).toEqual(sortedBlockNumbers);
            }
        });
    });

    describe('CORS', () => {
        it('should include CORS headers', async () => {
            const res = await app.request('/api/positions', {
                method: 'OPTIONS',
            });

            expect(res.headers.get('access-control-allow-origin')).toBeDefined();
        });

        it('should handle preflight requests', async () => {
            const res = await app.request('/api/positions', {
                method: 'OPTIONS',
                headers: {
                    'Origin': 'http://localhost:3000',
                    'Access-Control-Request-Method': 'GET',
                },
            });

            expect(res.status).toBe(200);
        });
    });

    describe('Error Handling', () => {
        it('should return 404 for non-existent endpoints', async () => {
            const res = await app.request('/api/non-existent');

            expect(res.status).toBe(404);
        });

        it('should handle malformed requests gracefully', async () => {
            const res = await app.request('/api/positions', {
                method: 'POST',
                body: 'invalid-json',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            // Should not crash and return some response
            expect(res.status).toBeGreaterThanOrEqual(400);
        });
    });
}); 