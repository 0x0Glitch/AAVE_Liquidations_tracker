// tests/unit/utils/logger.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger } from '../../../src/utils/logger';
import fs from 'fs';
import path from 'path';

// Mock fs module
vi.mock('fs', () => ({
    existsSync: vi.fn(),
    mkdirSync: vi.fn(),
    appendFileSync: vi.fn(),
    readFileSync: vi.fn(),
    writeFileSync: vi.fn(),
}));

// Mock console
const originalConsole = global.console;
beforeEach(() => {
    global.console = {
        ...global.console,
        log: vi.fn(),
        error: vi.fn(),
    };
    vi.clearAllMocks();
});

afterEach(() => {
    global.console = originalConsole;
});

describe('Logger', () => {
    describe('init', () => {
        it('should log initialization message', () => {
            const message = 'Starting application';
            logger.init(message);

            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('[INIT]'));
            expect(console.log).toHaveBeenCalledWith(expect.stringContaining(message));
        });

        it('should create logs directory if it does not exist', () => {
            vi.mocked(fs.existsSync).mockReturnValue(false);

            logger.init('Test');

            expect(fs.mkdirSync).toHaveBeenCalledWith(expect.stringContaining('logs'), { recursive: true });
        });
    });

    describe('log', () => {
        it('should log message with the specified category', () => {
            const category = 'test';
            const message = 'Test message';

            logger.log(category, message);

            expect(console.log).toHaveBeenCalledWith(expect.stringContaining(`[${category.toUpperCase()}]`));
            expect(console.log).toHaveBeenCalledWith(expect.stringContaining(message));
            expect(fs.appendFileSync).toHaveBeenCalled();
        });
    });

    describe('error', () => {
        it('should log error message and error object', () => {
            const message = 'Test error';
            const error = new Error('Something went wrong');

            logger.error(message, error);

            expect(console.error).toHaveBeenCalledWith(expect.stringContaining('[ERROR]'));
            expect(console.error).toHaveBeenCalledWith(expect.stringContaining(message));
            expect(console.error).toHaveBeenCalledWith(expect.stringContaining(error.message));
            expect(fs.appendFileSync).toHaveBeenCalled();
        });
    });

    describe('logLiquidation', () => {
        it('should log liquidation event details', () => {
            const liquidationData = {
                borrower: '0x1234567890123456789012345678901234567890',
                liquidator: '0x0987654321098765432109876543210987654321',
                collateralSymbol: 'WETH',
                seizedAmount: 1.5,
                usdValue: 3000,
                blockNumber: 123456n,
                transactionHash: '0xabcdef1234567890',
            };

            logger.logLiquidation(liquidationData);

            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('[LIQUIDATION]'));
            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('WETH'));
            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('3000'));
            expect(fs.appendFileSync).toHaveBeenCalled();
        });
    });

    describe('logTokenPrices', () => {
        it('should log token prices to file', () => {
            const priceData = {
                '0x1234': { symbol: 'WETH', price: 3000, address: '0x1234' },
                '0x5678': { symbol: 'USDC', price: 1, address: '0x5678' },
            };

            logger.logTokenPrices(priceData);

            expect(fs.writeFileSync).toHaveBeenCalled();
        });
    });
});