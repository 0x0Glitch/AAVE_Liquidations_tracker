// tests/unit/services/DatabaseService.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DatabaseService } from '../../../src/services/DatabaseService';

// Mock the ponder:api db
vi.mock('ponder:api', () => ({
    db: {
        execute: vi.fn(),
    }
}));

// Mock logger
vi.mock('../../../src/utils/logger', () => ({
    logger: {
        error: vi.fn(),
        log: vi.fn(),
    },
}));

describe('DatabaseService', () => {
    let databaseService: DatabaseService;
    const { db } = require('ponder:api');

    beforeEach(() => {
        vi.clearAllMocks();
        databaseService = new DatabaseService();
    });

    describe('storeLiquidationEvent', () => {
        it('should store liquidation event in the database', async () => {
            // Mock successful database insert
            db.execute.mockResolvedValue({ rowCount: 1 });

            const eventData = {
                blockNumber: 123456n,
                borrowerAddress: '0x1234567890123456789012345678901234567890',
                seizedTokenAmount: 1500000000000000000n,
                tokenSymbol: 'WETH',
                usdValueSeized: 3000,
                transactionHash: '0xabcdef1234567890',
                blockTimestamp: 1656789012n,
            };

            await databaseService.storeLiquidationEvent(eventData);

            expect(db.execute).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO liquidation_events'),
                expect.any(Array)
            );
        });

        it('should handle database errors gracefully', async () => {
            // Mock database error
            const error = new Error('Database connection error');
            db.execute.mockRejectedValue(error);

            const eventData = {
                blockNumber: 123456n,
                borrowerAddress: '0x1234567890123456789012345678901234567890',
                seizedTokenAmount: 1500000000000000000n,
                tokenSymbol: 'WETH',
                usdValueSeized: 3000,
                transactionHash: '0xabcdef1234567890',
                blockTimestamp: 1656789012n,
            };

            await databaseService.storeLiquidationEvent(eventData);

            // Should log the error but not throw
            const { logger } = require('../../../src/utils/logger');
            expect(logger.error).toHaveBeenCalledWith(
                expect.stringContaining('Error storing liquidation event'),
                error
            );
        });
    });

    describe('healthCheck', () => {
        it('should return true when database is healthy', async () => {
            // Mock successful database query
            db.execute.mockResolvedValue({ rowCount: 1 });

            const result = await databaseService.healthCheck();

            expect(result).toBe(true);
            expect(db.execute).toHaveBeenCalledWith('SELECT 1');
        });

        it('should return false when database check fails', async () => {
            // Mock database error
            db.execute.mockRejectedValue(new Error('Database error'));

            const result = await databaseService.healthCheck();

            expect(result).toBe(false);
        });
    });
});