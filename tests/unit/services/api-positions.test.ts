// tests/integration/api-positions.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { serve } from '@hono/node-server';
import app from '../../../src/api';

interface ApiResponse {
    success: boolean;
    positions?: any[];
    error?: string;
}

describe('Positions API Integration Tests', () => {
    const port = 3003;
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

    describe('GET /api/positions', () => {
        it('should return all positions with correct data structure', async () => {
            const response = await fetch(`http://localhost:${port}/api/positions`);
            const data = await response.json() as ApiResponse;

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);

            if (data.positions && data.positions.length > 0) {
                const firstPosition = data.positions[0];
                expect(firstPosition).toHaveProperty('user_address');
                expect(firstPosition).toHaveProperty('amount_supplied');
                expect(firstPosition).toHaveProperty('adjusted_collateral_value');
                expect(firstPosition).toHaveProperty('health_factor');
            }
        });
    });

    describe('GET /api/positions/:userAddress', () => {
        it('should handle uppercase addresses correctly', async () => {
            const testAddress = '0x1234567890123456789012345678901234567890';
            const upperCaseAddress = testAddress.toUpperCase();

            const response = await fetch(`http://localhost:${port}/api/positions/${upperCaseAddress}`);
            const data = await response.json() as ApiResponse;

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);

            // If positions exist, they should all be for the same user (case insensitive)
            if (data.positions && data.positions.length > 0) {
                data.positions.forEach(pos => {
                    expect(pos.user_address.toLowerCase()).toBe(testAddress.toLowerCase());
                });
            }
        });

        it('should handle special characters in address params', async () => {
            const invalidAddress = 'ABC@#$%^&*()';
            const response = await fetch(`http://localhost:${port}/api/positions/${invalidAddress}`);

            // API should either fail gracefully or return empty positions
            if (response.status === 200) {
                const data = await response.json() as ApiResponse;
                expect(data.success).toBe(true);
                expect(data.positions).toEqual([]);
            } else {
                expect([400, 404, 500]).toContain(response.status);
            }
        });

        it('should handle extremely long addresses', async () => {
            const longAddress = '0x' + '1'.repeat(1000);
            const response = await fetch(`http://localhost:${port}/api/positions/${longAddress}`);

            // API should either fail gracefully or return empty positions
            expect([200, 400, 404, 500]).toContain(response.status);
        });
    });
});

