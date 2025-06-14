/**
 * Service for handling token price operations
 */

import { createPublicClient, http, getAddress } from 'viem';
import { base } from 'viem/chains';
import { CONTRACT_ADDRESSES, DECIMAL_PRECISION, STABLE_COIN_FALLBACK_PRICES } from '../constants/addresses';
import { AAVE_ORACLE_ABI } from '../constants/abis';
import { logger } from '../utils/logger';
import type { Address } from '../types/events';
import type { TokenPrice, TokenInfo } from '../types/tokens';

export class PriceService {
    private publicClient;

    constructor(rpcUrl?: string) {
        this.publicClient = createPublicClient({
            chain: base,
            transport: http(rpcUrl || process.env.PONDER_RPC_URL_8453),
        });
    }

    /**
     * Gets token price from the AAVE oracle
     */
    async getTokenPriceFromAave(tokenAddress: string): Promise<number | null> {
        try {
            const checksumAddress = getAddress(tokenAddress);

            const priceData = await this.publicClient.readContract({
                address: CONTRACT_ADDRESSES.BASE.AAVE_ORACLE,
                abi: AAVE_ORACLE_ABI,
                functionName: 'getAssetPrice',
                args: [checksumAddress],
            });

            // AAVE Oracle returns prices with 8 decimals of precision
            return Number(priceData) / 10 ** DECIMAL_PRECISION.PRICE_ORACLE;
        } catch (error) {
            logger.error(`Error getting AAVE price for token ${tokenAddress}`, error as Error);
            return null;
        }
    }

    /**
     * Gets multiple token prices from AAVE oracle in a single call
     */
    async getMultipleTokenPricesFromAave(tokenAddresses: Address[]): Promise<TokenPrice[]> {
        try {
            const checksumAddresses = tokenAddresses.map(addr => getAddress(addr));

            const allPrices = await this.publicClient.readContract({
                address: CONTRACT_ADDRESSES.BASE.AAVE_ORACLE,
                abi: AAVE_ORACLE_ABI,
                functionName: 'getAssetsPrices',
                args: [checksumAddresses],
            });

            const timestamp = Date.now();

            return checksumAddresses.map((address, index) => ({
                address: address.toLowerCase(),
                symbol: '', // Will be filled by caller
                priceUsd: Number(allPrices[index]) / 10 ** DECIMAL_PRECISION.PRICE_ORACLE,
                timestamp,
            }));
        } catch (error) {
            logger.error('Error getting multiple AAVE prices', error as Error);
            return [];
        }
    }

    /**
     * Gets fallback price for stablecoins
     */
    getFallbackPrice(tokenSymbol: string): number | null {
        const fallbackPrices = STABLE_COIN_FALLBACK_PRICES as Record<string, number>;
        return fallbackPrices[tokenSymbol] || null;
    }

    /**
     * Fetches and logs all token prices
     */
    async fetchAndLogTokenPrices(tokens: TokenInfo[]): Promise<Record<string, number>> {
        const prices: Record<string, number> = {};
        const tokenAddresses = tokens.map(token => getAddress(token.address));

        try {
            // Try to get all prices in a single batch call
            const batchPrices = await this.getMultipleTokenPricesFromAave(tokenAddresses);

            // Process batch results
            batchPrices.forEach((priceData, index) => {
                const token = tokens[index];
                if (token && priceData.priceUsd > 0) {
                    prices[token.address.toLowerCase()] = priceData.priceUsd;
                    // eslint-disable-next-line no-console
                    console.log(`${token.symbol}: $${priceData.priceUsd.toFixed(4)}`);
                }
            });

            // Fill in missing prices with individual calls or fallbacks
            for (const token of tokens) {
                const lowerAddress = token.address.toLowerCase();

                if (!prices[lowerAddress]) {
                    try {
                        const price = await this.getTokenPriceFromAave(token.address);

                        if (price !== null && price > 0) {
                            prices[lowerAddress] = price;
                            // eslint-disable-next-line no-console
                            console.log(`${token.symbol}: $${price.toFixed(4)}`);
                        } else {
                            // Try fallback price for stablecoins
                            const fallbackPrice = this.getFallbackPrice(token.symbol);
                            if (fallbackPrice) {
                                prices[lowerAddress] = fallbackPrice;
                                // eslint-disable-next-line no-console
                                console.log(`${token.symbol}: $${fallbackPrice.toFixed(4)} (Fallback)`);
                            }
                        }
                    } catch (error) {
                        logger.error(`Error fetching price for ${token.symbol}`, error as Error);
                    }
                }
            }

            // Log prices to file
            const priceData = Object.entries(prices).reduce((acc, [address, price]) => {
                const token = tokens.find(t => t.address.toLowerCase() === address);
                if (token) {
                    acc[address] = {
                        symbol: token.symbol,
                        address: token.address,
                        price,
                    };
                }
                return acc;
            }, {} as Record<string, { symbol: string; address: string; price: number }>);

            logger.logTokenPrices(priceData);

            return prices;
        } catch (error) {
            logger.error('Error fetching token prices', error as Error);
            return {};
        }
    }
} 