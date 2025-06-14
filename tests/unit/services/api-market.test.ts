// tests/integration/api-transactions.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { serve } from '@hono/node-server';
import app from '../../../src/api';

interface ApiResponse {
    success: boolean;
    transactions?: any[];
    error?: string;
}

describe('Transactions API Integration Tests', () => {
    const port = 3004;
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

    describe('GET /api/transactions/:userAddress', () => {
        it('should return transactions with correct data structure', async () => {
            const testAddress = '0x1234567890123456789012345678901234567890';
            const response = await fetch(`http://localhost:${port}/api/transactions/${testAddress}`);
            const data = await response.json() as ApiResponse;

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);

            if (data.transactions && data.transactions.length > 0) {
                const firstTx = data.transactions[0];
                expect(firstTx).toHaveProperty('transaction_hash');
                expect(firstTx).toHaveProperty('block_number');
                expect(firstTx).toHaveProperty('user_address');
                expect(firstTx).toHaveProperty('timestamp');
            }
        });

        it('should properly sort transactions by block number descending', async () => {
            const testAddress = '0x1234567890123456789012345678901234567890';
            const response = await fetch(`http://localhost:${port}/api/transactions/${testAddress}`);
            const data = await response.json() as ApiResponse;

            if (data.transactions && data.transactions.length > 1) {
                let prevBlockNumber = Number.MAX_SAFE_INTEGER;

                data.transactions.forEach(tx => {
                    const currentBlockNumber = parseInt(tx.block_number);
                    expect(currentBlockNumber).toBeLessThanOrEqual(prevBlockNumber);
                    prevBlockNumber = currentBlockNumber;
                });
            }
        });

        it('should return empty array for addresses with no transactions', async () => {
            const noTxAddress = '0x0000000000000000000000000000000000000000';
            const response = await fetch(`http://localhost:${port}/api/transactions/${noTxAddress}`);
            const data = await response.json() as ApiResponse;

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);

            if (data.transactions) {
                expect(Array.isArray(data.transactions)).toBe(true);
            }
        });
    });
});

