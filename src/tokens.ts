import { WETH, cbETH, USDbC, wstETH, USDC, weETH, cbBTC, ezETH, GHO, wrsETH, LBTC, EURC } from "ponder:schema";

// Token list last reviewed: 07 Apr 2025

/**
 * Configuration interface for token data
 *
 * Contains essential information about each token including:
 * - Contract address
 * - Database table reference
 * - Price feed information
 * - Token metadata (decimals, symbol)
 */
export interface TokenConfig {
  /** Blockchain address of the token (0x format) */
  address: `0x${string}`;
  /** Reference to the database table for this token */
  table: typeof WETH | typeof cbETH | typeof USDbC | typeof wstETH | typeof USDC | 
         typeof weETH | typeof cbBTC | typeof ezETH | typeof GHO | typeof wrsETH | 
         typeof LBTC | typeof EURC;
  /** Number of decimal places for the token */
  decimals: number;
  /** Token symbol */
  symbol: string;
  /** Price feed oracle address (optional) */
  priceFeed?: `0x${string}`;
  /** LTV ratio (Loan-to-Value) as percentage, e.g., 75 means 75% */
  ltv?: number;
}

/**
 * Configuration for all supported tokens
 */
export const TOKENS: readonly TokenConfig[] = [
  {
    address: "0x4200000000000000000000000000000000000006",
    table: WETH,
    decimals: 18,
    symbol: "WETH",
    priceFeed: "0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70",
    ltv: 80
  },
  {
    address: "0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22",
    table: cbETH,
    decimals: 18,
    symbol: "cbETH",
    priceFeed: "0x14d2d33a9671C7051c0032baB802c705F5B3B018",
    ltv: 73
  },
  {
    address: "0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA",
    table: USDbC,
    decimals: 6,
    symbol: "USDbC",
    priceFeed: "0x7e860098F58bBFC8648a4311b374B1D669a2D10f",
    ltv: 87
  },
  {
    address: "0xc1CBa3fCea344f92D9239c08C0568f6F2F0ee452",
    table: wstETH,
    decimals: 18,
    symbol: "wstETH",
    priceFeed: "0xB88BAc61a4Ca37C43a3725912B1f472c9A5bc061",
    ltv: 71
  },
  {
    address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bda02913",
    table: USDC,
    decimals: 6,
    symbol: "USDC",
    priceFeed: "0x7e860098F58bBFC8648a4311b374B1D669a2D10f",
    ltv: 87
  },
  {
    address: "0x04C0599Ae5A44757c0af6F9eC3b93da8976c150A",
    table: weETH,
    decimals: 18,
    symbol: "weETH",
    priceFeed: "0x2Fe5E5D341cFFa606a5d9DA1B6B646a381B0f7ec",
    ltv: 67
  },
  {
    address: "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf",
    table: cbBTC,
    decimals: 8,
    symbol: "cbBTC",
    priceFeed: "0x0a9823C5cD3D61548496466Cf1cA0217C989Eda6",
    ltv: 70
  },
  {
    address: "0x2416092f143378750bb29b79eD961ab195CcEea5",
    table: ezETH,
    decimals: 18,
    symbol: "ezETH",
    priceFeed: "0x887311EAaE8442134A1f13F517a871A9952dACF1",
    ltv: 65
  },
  {
    address: "0x6Bb7a212910682DCFdbd5BCBb3e28FB4E8da10Ee",
    table: GHO,
    decimals: 18,
    symbol: "GHO",
    priceFeed: "0x3f12643D3f6f874d39C2a4c9f2Cd6f2DbAC877fC",
    ltv: 0  // Not used as collateral
  },
  {
    address: "0xEDfa23602D0EC14714057867A78d01e94176BEA0",
    table: wrsETH,
    decimals: 18,
    symbol: "wrsETH",
    priceFeed: "0xA736eAe8805dDeFFba40cAB8c99bCB309dEaBd9B",
    ltv: 69
  },
  {
    address: "0xecAc9C5F704e954931349Da37F60E39f515c11c1",
    table: LBTC,
    decimals: 8,
    symbol: "LBTC",
    priceFeed: "0xF198B4a5728ebb70fAC8673D8c646B3Dd624646d",
    ltv: 63
  },
  {
    address: "0x60a3E35Cc302bfA44Cb288Bc5a4F316Fdb1adb42",
    table: EURC,
    decimals: 6,
    symbol: "EURC",
    priceFeed: "0x12BA9f5EFD3ff397C45edb25f590F91BCCB549b0",
    ltv: 80
  }
]; 