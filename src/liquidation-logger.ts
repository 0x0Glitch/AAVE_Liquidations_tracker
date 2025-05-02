import { ponder } from "ponder:registry";
import * as fs from 'fs';
import { TOKENS } from './tokens';

/**
 * Token information for quick lookup
 */
interface TokenInfo {
  /** Token contract address */
  address: string;
  /** Token symbol (e.g., 'USDC') */
  symbol: string;
  /** Number of decimal places for the token */
  decimals: number;
}

/**
 * Case-insensitive map of token addresses to token info
 */
const TOKEN_MAP: Readonly<Record<string, TokenInfo>> = Object.freeze(
  TOKENS.reduce<Record<string, TokenInfo>>((acc, token) => {
    const lowerAddress = token.address.toLowerCase();
    acc[lowerAddress] = {
      address: token.address,
      symbol: token.symbol,
      decimals: token.decimals
    };
    return acc;
  }, {})
);

/**
 * Aave LiquidationCall event structure
 */
interface AaveLiquidationCallEvent {
  /** Address of the collateral asset being liquidated */
  collateralAsset: `0x${string}`;
  /** Address of the debt asset being repaid */
  debtAsset: `0x${string}`;
  /** Address of the user being liquidated */
  user: `0x${string}`;
  /** Amount of debt being covered */
  debtToCover: bigint;
  /** Amount of collateral being liquidated */
  liquidatedCollateralAmount: bigint;
  /** Address of the liquidator */
  liquidator: `0x${string}`;
  /** Whether liquidator receives aToken or underlying asset */
  receiveAToken: boolean;
};

/**
 * File paths for logs
 */
const LOG_PATHS = Object.freeze({
  DIR: './logs',
  EVENTS: './logs/events.log',
  AAVE_LIQUIDATIONS: './logs/aave_liquidations.log',
  AAVE_LIQUIDATIONS_JSON: './logs/aave_liquidations.json'
});

/**
 * Formats a raw token amount to a human-readable number based on token decimals
 * @param amount Raw amount in smallest units
 * @param tokenAddress Token address to get decimals
 * @returns Formatted amount as number
 */
function getFormattedAmount(amount: bigint, tokenAddress: string): number {
  const lowerAddress = tokenAddress.toLowerCase();
  const tokenInfo = TOKEN_MAP[lowerAddress];
  
  if (!tokenInfo) {
    console.warn(`Token info not found for address: ${tokenAddress}, using default 6 decimals`);
    return Number(amount) / 1e6;
  }
  
  const divisor = 10 ** tokenInfo.decimals;
  return Number(amount) / divisor;
}

/**
 * Event structure passed from Ponder event handler
 */
interface LiquidationEventData {
  args: AaveLiquidationCallEvent;
  block: { number: bigint; timestamp: bigint };
  transaction: { hash: `0x${string}` };
  log: { logIndex: number };
  // Add additional properties expected from Ponder's event structure
  hash?: `0x${string}`;
  number?: bigint;
  timestamp?: bigint;
  logIndex?: number;
}

/**
 * Structure for JSON liquidation logs
 */
interface LiquidationLogEntry {
  eventType: string;
  timestamp: string;
  blockNumber: string;
  transactionHash: string;
  borrower: string;
  collateralAsset: string;
  collateralSymbol: string;
  debtAsset: string;
  debtSymbol: string;
  liquidatedCollateralAmount: string;
  formattedCollateralAmount: number;
  debtToCover: string;
  formattedDebtAmount: number;
  receiveAToken: boolean;
  liquidator: string;
}

/**
 * Logs Aave liquidation events to console and files
 */
function logAaveLiquidation(event: LiquidationEventData): void {
  // Ensure log directory exists
  if (!fs.existsSync(LOG_PATHS.DIR)) {
    fs.mkdirSync(LOG_PATHS.DIR, { recursive: true });
  }
  
  const timestamp = new Date().toISOString();
  const { collateralAsset, debtAsset, user, debtToCover, liquidatedCollateralAmount, liquidator, receiveAToken } = event.args;
  const { number: blockNumber, timestamp: blockTimestamp } = event.block;
  const txHash = event.transaction.hash;
  
  // Format amounts and get token symbols
  const formattedCollateralAmount = getFormattedAmount(liquidatedCollateralAmount, collateralAsset);
  const formattedDebtAmount = getFormattedAmount(debtToCover, debtAsset);
  const collateralSymbol = TOKEN_MAP[collateralAsset.toLowerCase()]?.symbol || "UNKNOWN";
  const debtSymbol = TOKEN_MAP[debtAsset.toLowerCase()]?.symbol || "UNKNOWN";
  
  // Human-readable log message
  const logMessage = `${timestamp} - [AaveLiquidation] Borrower: ${user} Liquidator: ${liquidator} ` +
    `CollateralAsset: ${collateralAsset} (${collateralSymbol}) ` +
    `LiquidatedCollateral: ${formattedCollateralAmount} ${collateralSymbol} ` +
    `ReceiveAToken: ${receiveAToken} Block: ${blockNumber} Tx: ${txHash}`;
  
  // Console logging
  console.log(`[AAVE LIQUIDATION] User: ${user} Liquidator: ${liquidator}`);
  console.log(`[AAVE LIQUIDATION] Collateral: ${formattedCollateralAmount} ${collateralSymbol} Debt: ${formattedDebtAmount} ${debtSymbol}`);
  
  // File logging
  fs.appendFileSync(LOG_PATHS.EVENTS, `${logMessage}\n`);
  fs.appendFileSync(LOG_PATHS.AAVE_LIQUIDATIONS, `${logMessage}\n`);
  
  // Structured JSON logging
  const detailedLog: LiquidationLogEntry = {
    eventType: 'AaveLiquidationCall',
    timestamp,
    blockNumber: blockNumber.toString(),
    transactionHash: txHash,
    borrower: user,
    collateralAsset,
    collateralSymbol,
    debtAsset,
    debtSymbol,
    liquidatedCollateralAmount: liquidatedCollateralAmount.toString(),
    formattedCollateralAmount,
    debtToCover: debtToCover.toString(),
    formattedDebtAmount,
    receiveAToken,
    liquidator
  };
  
  // Log to JSON file (one object per line for easy parsing)
  fs.appendFileSync(LOG_PATHS.AAVE_LIQUIDATIONS_JSON, JSON.stringify(detailedLog) + '\n');
}

/**
 * Sets up event handlers for Aave liquidation events
 */
export function setupAaveLiquidationHandlers(): void {
  console.log("Setting up Aave LiquidationCall event handler");
  
  // Set up Aave LiquidationCall event handler
  // @ts-ignore - Ignore type errors for dynamic event handler registration
  ponder.on("Aave:LiquidationCall", async ({ event, context }: { event: any; context: any }) => {
    try {
      // Adapt the Ponder event format to our expected LiquidationEventData format
      const liquidationEvent: LiquidationEventData = {
        args: event.args as unknown as AaveLiquidationCallEvent,
        block: { 
          number: event.block?.number || 0n, 
          timestamp: event.block?.timestamp || 0n 
        },
        transaction: { hash: event.transaction?.hash || '0x0' },
        log: { logIndex: event.log?.logIndex || 0 }
      };
      
      logAaveLiquidation(liquidationEvent);
    } catch (error) {
      console.error(`[EVENT ERROR] Failed to process Aave LiquidationCall event:`, error);
    }
  });
  
  console.log("Aave liquidation event handler successfully set up");
}

// Initialize the handlers
setupAaveLiquidationHandlers();