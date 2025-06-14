// tests/e2e/liquidation-flow.test.ts
import { describe, it, expect, beforeAll, vi } from 'vitest';
import { ponder } from 'ponder:registry';
import { initializeEventIndexer } from '../../../src/index';
import { PriceService } from '../../../src/services/PriceService';
import { DatabaseService } from '../../../src/services/DatabaseService';

// Mock dependencies
vi.mock('ponder:registry', () => ({
    ponder: {
        on: vi.fn(),
    }
}));

vi.mock('../../src/services/PriceService', () => ({
    PriceService: vi.fn().mockImplementation(() => ({
        getTokenPriceFromAave: vi.fn().mockResolvedValue(3000),
    }))
}));

vi.mock('../../src/services/DatabaseService', () => ({
    DatabaseService: vi.fn().mockImplementation(() => ({
        healthCheck: vi.fn().mockResolvedValue(true),
        storeLiquidationEvent: vi.fn().mockResolvedValue(true),
    }))
}));

vi.mock('../../src/utils/logger', () => ({
    logger: {
        init: vi.fn(),
        error: vi.fn(),
        log: vi.fn(),
        logLiquidation: vi.fn(),
    }
}));

vi.mock('../../src/tokens', () => ({
    getTokenByAddress: vi.fn().mockImplementation((address) => {
        if (address === '0xCollateralToken') {
            return {
                address: '0xCollateralToken',
                symbol: 'WETH',
                decimals: 18,
            };
        } else if (address === '0xDebtToken') {
            return {
                address: '0xDebtToken',
                symbol: 'USDC',
                decimals: 6,
            };
        }
        return null;
    }),
}));

describe('Liquidation Flow End-to-End', () => {
    beforeAll(() => {
        vi.clearAllMocks();
    });

    it('should initialize event indexer and set up event handlers', () => {
        initializeEventIndexer();

        const { logger } = require('../../src/utils/logger');
        expect(logger.init).toHaveBeenCalledWith('Initializing event indexer');
        expect(ponder.on).toHaveBeenCalledWith('Aave:LiquidationCall', expect.any(Function));
    });

    it('should process liquidation events correctly', async () => {
        initializeEventIndexer();

        // Get the event handler callback
        const onEventCallback = vi.mocked(ponder.on).mock.calls[0][1] as EventHandler;

        // Create mock event data
        const mockEvent = {
            args: {
                collateralAsset: '0xCollateralToken',
                debtAsset: '0xDebtToken',
                user: '0xBorrower',
                debtToCover: 1000000000n, // 1000 USDC
                liquidatedCollateralAmount: 500000000000000000n, // 0.5 WETH
                liquidator: '0xLiquidator',
                receiveAToken: false,
            },
            block: {
                number: 123456n,
                timestamp: 1656789012n,
            },
            transaction: {
                hash: '0xTransactionHash',
            },
        };

        // Call the event handler with mock data
        await onEventCallback({ event: mockEvent, context: {} });

        // Verify that the correct services were called
        const databaseService = new DatabaseService();
        expect(databaseService.storeLiquidationEvent).toHaveBeenCalledWith(
            expect.objectContaining({
                borrowerAddress: '0xBorrower',
                tokenSymbol: 'WETH',
                seizedTokenAmount: 500000000000000000n,
            })
        );

        const { logger } = require('../../src/utils/logger');
        expect(logger.logLiquidation).toHaveBeenCalled();
    });

    it('should handle missing token information gracefully', async () => {
        initializeEventIndexer();

        const { getTokenByAddress } = require('../../src/tokens');
        vi.mocked(getTokenByAddress).mockReturnValueOnce(null);

        // Get the event handler callback
        const onEventCallback = vi.mocked(ponder.on).mock.calls[0][1];

        // Create mock event with invalid token
        const mockEvent = {
            args: {
                collateralAsset: '0xInvalidToken',
                debtAsset: '0xDebtToken',
                user: '0xBorrower',
                debtToCover: 1000000000n,
                liquidatedCollateralAmount: 500000000000000000n,
                liquidator: '0xLiquidator',
                receiveAToken: false,
            },
            block: {
                number: 123456n,
                timestamp: 1656789012n,
            },
            transaction: {
                hash: '0xTransactionHash',
            },
        };

        // Call the event handler with mock data
        await onEventCallback({ event: mockEvent, context: {} });

        // Verify error handling
        const { logger } = require('../../src/utils/logger');
        expect(logger.error).toHaveBeenCalledWith(
            expect.stringContaining('Token not found'),
            expect.any(String)
        );
    });

    it('should handle price service failures gracefully', async () => {
        initializeEventIndexer();

        const mockPriceService = new PriceService();
        vi.mocked(mockPriceService.getTokenPriceFromAave).mockResolvedValueOnce(null);

        // Get the event handler callback
        const onEventCallback = vi.mocked(ponder.on).mock.calls[0][1];

        // Create mock event
        const mockEvent = {
            args: {
                collateralAsset: '0xCollateralToken',
                debtAsset: '0xDebtToken',
                user: '0xBorrower',
                debtToCover: 1000000000n,
                liquidatedCollateralAmount: 500000000000000000n,
                liquidator: '0xLiquidator',
                receiveAToken: false,
            },
            block: {
                number: 123456n,
                timestamp: 1656789012n,
            },
            transaction: {
                hash: '0xTransactionHash',
            },
        };

        // Call the event handler with mock data
        await onEventCallback({ event: mockEvent, context: {} });

        // Verify error handling
        const { logger } = require('../../src/utils/logger');
        expect(logger.error).toHaveBeenCalledWith(
            expect.stringContaining('Failed to get price data'),
            expect.any(String)
        );
    });
});