/**
 * Token configurations for the AAVE Protocol liquidations tracker
 */

import { WETH, cbETH, USDbC, wstETH, USDC, weETH, cbBTC, ezETH, GHO, wrsETH, LBTC, EURC } from 'ponder:schema';
import type { TokenConfig } from './types/tokens';

export const TOKENS: TokenConfig[] = [
  {
    address: '0x4200000000000000000000000000000000000006',
    table: WETH,
    decimals: 18,
    symbol: 'WETH',
  },
  {
    address: '0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22',
    table: cbETH,
    decimals: 18,
    symbol: 'cbETH',
  },
  {
    address: '0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA',
    table: USDbC,
    decimals: 6,
    symbol: 'USDbC',
  },
  {
    address: '0xc1CBa3fCea344f92D9239c08C0568f6F2F0ee452',
    table: wstETH,
    decimals: 18,
    symbol: 'wstETH',
  },
  {
    address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bda02913',
    table: USDC,
    decimals: 6,
    symbol: 'USDC',
  },
  {
    address: '0x04C0599Ae5A44757c0af6F9eC3b93da8976c150A',
    table: weETH,
    decimals: 18,
    symbol: 'weETH',
  },
  {
    address: '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf',
    table: cbBTC,
    decimals: 8,
    symbol: 'cbBTC',
  },
  {
    address: '0x2416092f143378750bb29b79eD961ab195CcEea5',
    table: ezETH,
    decimals: 18,
    symbol: 'ezETH',
  },
  {
    address: '0x6Bb7a212910682DCFdbd5BCBb3e28FB4E8da10Ee',
    table: GHO,
    decimals: 18,
    symbol: 'GHO',
  },
  {
    address: '0xEDfa23602D0EC14714057867A78d01e94176BEA0',
    table: wrsETH,
    decimals: 18,
    symbol: 'wrsETH',
  },
  {
    address: '0xecAc9C5F704e954931349Da37F60E39f515c11c1',
    table: LBTC,
    decimals: 8,
    symbol: 'LBTC',
  },
  {
    address: '0x60a3E35Cc302bfA44Cb288Bc5a4F316Fdb1adb42',
    table: EURC,
    decimals: 6,
    symbol: 'EURC',
  },
];

/**
 * Create a map for fast token lookup by address (case-insensitive)
 */
export const TOKEN_MAP = TOKENS.reduce((acc, token) => {
  const lowerAddress = token.address.toLowerCase();
  acc[lowerAddress] = {
    address: token.address,
    symbol: token.symbol,
    decimals: token.decimals,
  };
  return acc;
}, {} as Record<string, { address: string; symbol: string; decimals: number }>);

/**
 * Get token info by address
 */
export function getTokenByAddress(address: string) {
  return TOKEN_MAP[address.toLowerCase()];
}

/**
 * Get token info by symbol
 */
export function getTokenBySymbol(symbol: string) {
  return TOKENS.find(token => token.symbol === symbol);
} 