/**
 * Unit tests for formatting utilities
 */

import { describe, it, expect } from 'vitest';
import {
    formatTokenAmount,
    formatTokenAmountWithInfo,
    calculateUsdValue,
    calculateUsdValueWithDynamicPrecision,
    formatTimestamp,
    formatAddress,
} from '../../../src/utils/format';
import type { TokenInfo } from '../../../src/types/tokens';

describe('Format Utils', () => {
    describe('formatTokenAmount', () => {
        it('should format token amount with 18 decimals', () => {
            const amount = 1000000000000000000n; // 1 token with 18 decimals
            const result = formatTokenAmount(amount, 18);

            expect(result).toBe(1);
        });

        it('should format token amount with 6 decimals', () => {
            const amount = 1000000n; // 1 token with 6 decimals
            const result = formatTokenAmount(amount, 6);

            expect(result).toBe(1);
        });

        it('should format token amount with 8 decimals', () => {
            const amount = 100000000n; // 1 token with 8 decimals
            const result = formatTokenAmount(amount, 8);

            expect(result).toBe(1);
        });

        it('should handle custom precision', () => {
            const amount = 1234567890123456789n; // 1.234567890123456789 tokens
            const result = formatTokenAmount(amount, 18, 4);

            expect(result).toBe(1.2346);
        });

        it('should handle zero amount', () => {
            const amount = 0n;
            const result = formatTokenAmount(amount, 18);

            expect(result).toBe(0);
        });
    });

    describe('formatTokenAmountWithInfo', () => {
        it('should format token amount with token info', () => {
            const amount = 1000000000000000000n;
            const tokenInfo: TokenInfo = {
                address: '0x1234567890123456789012345678901234567890',
                symbol: 'WETH',
                decimals: 18,
            };

            const result = formatTokenAmountWithInfo(amount, tokenInfo);

            expect(result).toEqual({
                raw: amount,
                formatted: 1,
                decimals: 18,
                symbol: 'WETH',
            });
        });
    });

    describe('calculateUsdValue', () => {
        it('should calculate USD value correctly', () => {
            const amount = 2000000000000000000n; // 2 tokens
            const decimals = 18;
            const priceUsd = 3000; // $3000 per token

            const result = calculateUsdValue(amount, decimals, priceUsd);

            expect(result).toBe(6000);
        });

        it('should handle precision correctly', () => {
            const amount = 1500000000000000000n; // 1.5 tokens
            const decimals = 18;
            const priceUsd = 2000.5; // $2000.5 per token

            const result = calculateUsdValue(amount, decimals, priceUsd, 2);

            expect(result).toBe(3000.75);
        });
    });

    describe('calculateUsdValueWithDynamicPrecision', () => {
        it('should calculate USD value for 6 decimal tokens', () => {
            const amount = 1000000n; // 1 token with 6 decimals
            const decimals = 6;
            const price = 100000000n; // Price in oracle format

            const result = calculateUsdValueWithDynamicPrecision(amount, decimals, price);

            expect(result).toBeCloseTo(1, 4);
        });

        it('should calculate USD value for 8 decimal tokens', () => {
            const amount = 100000000n; // 1 token with 8 decimals
            const decimals = 8;
            const price = 100000000n; // Price in oracle format

            const result = calculateUsdValueWithDynamicPrecision(amount, decimals, price);

            expect(result).toBeCloseTo(1, 4);
        });

        it('should calculate USD value for 18 decimal tokens', () => {
            const amount = 1000000000000000000n; // 1 token with 18 decimals
            const decimals = 18;
            const price = 100000000n; // Price in oracle format

            const result = calculateUsdValueWithDynamicPrecision(amount, decimals, price);

            expect(result).toBeCloseTo(1, 4);
        });
    });

    describe('formatTimestamp', () => {
        it('should format timestamp to ISO string', () => {
            const timestamp = 1640995200n; // 2022-01-01 00:00:00 UTC
            const result = formatTimestamp(timestamp);

            expect(result).toBe('2022-01-01T00:00:00.000Z');
        });

        it('should handle zero timestamp', () => {
            const timestamp = 0n;
            const result = formatTimestamp(timestamp);

            expect(result).toBe('1970-01-01T00:00:00.000Z');
        });
    });

    describe('formatAddress', () => {
        it('should format address correctly', () => {
            const address = '0x1234567890123456789012345678901234567890';
            const result = formatAddress(address);

            expect(result).toBe('0x1234...7890');
        });

        it('should handle short addresses', () => {
            const address = '0x1234567890';
            const result = formatAddress(address);

            expect(result).toBe('0x1234...7890');
        });
    });
}); 