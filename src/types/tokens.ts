/**
 * Token type definitions for the AAVE Protocol liquidations tracker
 */

import type { Address } from './events';

export interface TokenInfo {
    address: string;
    symbol: string;
    decimals: number;
}

export interface TokenConfig {
    address: Address;
    table: unknown; // Will be typed based on ponder schema
    decimals: number;
    symbol: string;
}

export interface TokenPrice {
    address: string;
    symbol: string;
    priceUsd: number;
    timestamp: number;
}

export interface TokenAmount {
    raw: bigint;
    formatted: number;
    decimals: number;
    symbol: string;
}

export type TokenSymbol =
    | 'WETH'
    | 'cbETH'
    | 'USDbC'
    | 'wstETH'
    | 'USDC'
    | 'weETH'
    | 'cbBTC'
    | 'ezETH'
    | 'GHO'
    | 'wrsETH'
    | 'LBTC'
    | 'EURC'; 