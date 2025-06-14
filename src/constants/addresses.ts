/**
 * Blockchain addresses and contract configurations
 */

import type { Address } from '../types/events';

export const CHAIN_IDS = {
    BASE: 8453,
} as const;

export const CONTRACT_ADDRESSES = {
    BASE: {
        AAVE_POOL: '0xA238Dd80C259a72e81d7e4664a9801593F98d1c5' as Address,
        AAVE_ORACLE: '0x2Cc0Fc26eD4563A5ce5e8bdcfe1A2878676Ae156' as Address,
    },
} as const;

export const BLOCK_CONFIGS = {
    BASE: {
        START_BLOCK: 28281660,
        MARKET_PARAMS_CHECK_INTERVAL: 60,
    },
} as const;

export const DECIMAL_PRECISION = {
    PRICE_ORACLE: 8,
    USD_VALUE: 4,
    TOKEN_AMOUNT: 8,
    WEI: 18,
} as const;

export const STABLE_COIN_FALLBACK_PRICES = {
    USDbC: 1.0,
    USDC: 1.0,
    GHO: 1.0,
    EURC: 1.1, // Approximate EUR to USD conversion
} as const; 