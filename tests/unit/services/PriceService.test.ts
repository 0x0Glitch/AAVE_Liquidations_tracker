/**
 * Unit tests for PriceService
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PriceService } from '../../../src/services/PriceService';
import type { TokenInfo } from '../../../src/types/tokens';

// Mock viem modules
vi.mock('viem', () => ({
    createPublicClient: vi.fn(() => ({
        readContract: vi.fn(),
    })),
    http: vi.fn(),
    getAddress: vi.fn((addr: string) => addr),
}));

vi.mock('viem/chains', () => ({
    base: {
        id: 8453,
        name: 'Base',
    },
}));

// Mock logger
vi.mock('../../../src/utils/logger', () => ({
    logger: {
        error: vi.fn(),
        logTokenPrices: vi.fn(),
    },
}));

describe('PriceService', () => {
    let priceService: PriceService;
    let mockPublicClient: any;

    beforeEach(() => {
        vi.clearAllMocks();
        priceService = new PriceService();

        // Get the mocked client
        const { createPublicClient } = require('viem');
        mockPublicClient = createPublicClient();
    });

    describe('getTokenPriceFromAave', () => {
        it('should return price from AAVE oracle', async () => {
            const mockPrice = 100000000n; // 1 USD with 8 decimals
            mockPublicClient.readContract.mockResolvedValue(mockPrice);

            const result = await priceService.getTokenPriceFromAave('0x1234567890123456789012345678901234567890');

            expect(result).toBe(1); // 100000000 / 10^8 = 1
            expect(mockPublicClient.readContract).toHaveBeenCalledWith({
                address: '0x2Cc0Fc26eD4563A5ce5e8bdcfe1A2878676Ae156',
                abi: expect.any(Array),
                functionName: 'getAssetPrice',
                args: ['0x1234567890123456789012345678901234567890'],
            });
        });

        it('should return null on error', async () => {
            mockPublicClient.readContract.mockRejectedValue(new Error('Network error'));

            const result = await priceService.getTokenPriceFromAave('0x1234567890123456789012345678901234567890');

            expect(result).toBeNull();
        });
    });

    describe('getMultipleTokenPricesFromAave', () => {
        it('should return multiple prices from AAVE oracle', async () => {
            const mockPrices = [100000000n, 200000000n]; // 1 USD and 2 USD
            mockPublicClient.readContract.mockResolvedValue(mockPrices);

            const addresses = [
                '0x1234567890123456789012345678901234567890',
                '0x0987654321098765432109876543210987654321',
            ] as `0x${string}`[];

            const result = await priceService.getMultipleTokenPricesFromAave(addresses);

            expect(result).toHaveLength(2);
            expect(result[0]).toEqual({
                address: '0x1234567890123456789012345678901234567890',
                symbol: '',
                priceUsd: 1,
                timestamp: expect.any(Number),
            });
            expect(result[1]).toEqual({
                address: '0x0987654321098765432109876543210987654321',
                symbol: '',
                priceUsd: 2,
                timestamp: expect.any(Number),
            });
        });

        it('should return empty array on error', async () => {
            mockPublicClient.readContract.mockRejectedValue(new Error('Network error'));

            const addresses = ['0x1234567890123456789012345678901234567890'] as `0x${string}`[];
            const result = await priceService.getMultipleTokenPricesFromAave(addresses);

            expect(result).toEqual([]);
        });
    });

    // Comptroller tests removed since we no longer support comptroller oracle

    describe('getFallbackPrice', () => {
        it('should return fallback price for supported stablecoins', () => {
            expect(priceService.getFallbackPrice('USDC')).toBe(1.0);
            expect(priceService.getFallbackPrice('USDbC')).toBe(1.0);
            expect(priceService.getFallbackPrice('GHO')).toBe(1.0);
            expect(priceService.getFallbackPrice('EURC')).toBe(1.1);
        });

        it('should return null for unsupported tokens', () => {
            expect(priceService.getFallbackPrice('UNKNOWN')).toBeNull();
        });
    });

    describe('fetchAndLogTokenPrices', () => {
        const mockTokens: TokenInfo[] = [
            {
                address: '0x1234567890123456789012345678901234567890',
                symbol: 'WETH',
                decimals: 18,
            },
            {
                address: '0x0987654321098765432109876543210987654321',
                symbol: 'USDC',
                decimals: 6,
            },
        ];

        it('should fetch prices for all tokens', async () => {
            const mockPrices = [300000000000n, 100000000n]; // 3000 USD and 1 USD
            mockPublicClient.readContract.mockResolvedValue(mockPrices);

            const result = await priceService.fetchAndLogTokenPrices(mockTokens);

            expect(result).toEqual({
                '0x1234567890123456789012345678901234567890': 3000,
                '0x0987654321098765432109876543210987654321': 1,
            });
        });

        it('should use fallback prices when oracle fails', async () => {
            // Mock batch call failure
            mockPublicClient.readContract
                .mockRejectedValueOnce(new Error('Batch failed'))
                // Mock individual calls
                .mockResolvedValue(null) // WETH fails
                .mockResolvedValue(null); // USDC fails, will use fallback

            const result = await priceService.fetchAndLogTokenPrices(mockTokens);

            // USDC should have fallback price, WETH should be missing
            expect(result).toEqual({
                '0x0987654321098765432109876543210987654321': 1.0,
            });
        });

        it('should handle empty token list', async () => {
            const result = await priceService.fetchAndLogTokenPrices([]);

            expect(result).toEqual({});
        });
    });
}); 