// tests/integration/api-market.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { serve } from '@hono/node-server';
import app from '../../../src/api';

interface ApiResponse {
    success: boolean;
    parameters?: any[];
    error?: string;
}

describe('Market API Integration Tests', () => {
    const port = 3005;
    let server: any;

    beforeAll(() => {
        server = serve({
            fetch: app.fetch,
            port
        });
    });

    afterAll(() => {
        server.close();
    });

    describe('GET /api/market/:mTokenAddress', () => {
        it('should return market parameters with correct data structure', async () => {
            const testAddress = '0x1234567890123456789012345678901234567890';
            const response = await fetch(`http://localhost:${port}/api/market/${testAddress}`);
            const data = await response.json() as ApiResponse;

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);

            if (data.parameters && data.parameters.length > 0) {
                const firstParam = data.parameters[0];
                expect(firstParam).toHaveProperty('m_token_address');
                expect(firstParam).toHaveProperty('block_number');
                expect(firstParam).toHaveProperty('liquidation_threshold');
                expect(firstParam).toHaveProperty('loan_to_value');
            }
        });

        it('should enforce the limit of 10 results', async () => {
            const testAddress = '0x1234567890123456789012345678901234567890';
            const response = await fetch(`http://localhost:${port}/api/market/${testAddress}`);
            const data = await response.json() as ApiResponse;

            if (data.parameters) {
                expect(data.parameters.length).toBeLessThanOrEqual(10);
            }
        });

        it('should handle non-existent token addresses', async () => {
            const nonExistentAddress = '0xdead000000000000000000000000000000000000';
            const response = await fetch(`http://localhost:${port}/api/market/${nonExistentAddress}`);
            const data = await response.json() as ApiResponse;

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);

            if (data.parameters) {
                expect(Array.isArray(data.parameters)).toBe(true);
            }
        });
    });
});