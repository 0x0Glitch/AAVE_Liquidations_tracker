/**
 * Formatting utilities for token amounts and decimal conversions
 */

import { DECIMAL_PRECISION } from '../constants/addresses';
import type { TokenAmount, TokenInfo } from '../types/tokens';

/**
 * Formats a raw token amount to a human-readable number
 */
export function formatTokenAmount(
    amount: bigint,
    decimals: number,
    precision: number = DECIMAL_PRECISION.TOKEN_AMOUNT
): number {
    const divisor = 10n ** BigInt(decimals);
    const formattedAmount = Number(amount) / Number(divisor);
    return Number(formattedAmount.toFixed(precision));
}

/**
 * Formats a raw token amount with token information
 */
export function formatTokenAmountWithInfo(
    amount: bigint,
    tokenInfo: TokenInfo
): TokenAmount {
    return {
        raw: amount,
        formatted: formatTokenAmount(amount, tokenInfo.decimals),
        decimals: tokenInfo.decimals,
        symbol: tokenInfo.symbol,
    };
}

/**
 * Calculates USD value from token amount and price
 */
export function calculateUsdValue(
    amount: bigint,
    decimals: number,
    priceUsd: number,
    precision: number = DECIMAL_PRECISION.USD_VALUE
): number {
    const formattedAmount = formatTokenAmount(amount, decimals, 18); // Use max precision for calculation
    const usdValue = formattedAmount * priceUsd;
    return Number(usdValue.toFixed(precision));
}

/**
 * Handles different decimal precision calculations based on token decimals
 * This maintains compatibility with the existing price calculation logic
 */
export function calculateUsdValueWithDynamicPrecision(
    amount: bigint,
    decimals: number,
    price: bigint,
    precision: number = DECIMAL_PRECISION.USD_VALUE
): number {
    let usdValue: number;

    if (decimals === 6) {
        usdValue = Number((Number((amount * price) / (10n ** BigInt(decimals))) / 1e32).toFixed(precision));
    } else if (decimals === 8) {
        usdValue = Number((Number((amount * price) / (10n ** BigInt(decimals))) / 1e28).toFixed(precision));
    } else {
        usdValue = Number((Number((amount * price) / (10n ** BigInt(decimals))) / 1e8).toFixed(precision));
    }

    return usdValue;
}

/**
 * Formats a timestamp to ISO string
 */
export function formatTimestamp(timestamp: bigint): string {
    return new Date(Number(timestamp) * 1000).toISOString();
}

/**
 * Formats an address to a shortened version for display
 */
export function formatAddress(address: string): string {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
} 