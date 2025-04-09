import { ponder } from "ponder:registry";
import * as fs from 'fs';
import { TOKENS } from './tokens';

// Token list with address, symbol and decimals for quick lookup
interface TokenInfo {
  address: string;
  symbol: string;
  decimals: number;
}

// Create a map for fast token lookup by address (case-insensitive)
const TOKEN_MAP: { [address: string]: TokenInfo } = {};
TOKENS.forEach(token => {
  const lowerAddress = token.address.toLowerCase();
  TOKEN_MAP[lowerAddress] = {
    address: token.address,
    symbol: token.symbol,
    decimals: token.decimals
  };
});

// Define Aave LiquidationCall event type
type AaveLiquidationCallEvent = {
  collateralAsset: `0x${string}`;
  debtAsset: `0x${string}`;
  user: `0x${string}`;
  debtToCover: bigint;
  liquidatedCollateralAmount: bigint;
  liquidator: `0x${string}`;
  receiveAToken: boolean;
};

/**
 * Get formatted amount based on token decimals
 * @param amount Raw amount in smallest units
 * @param tokenAddress Token address to get decimals
 * @returns Formatted amount as number
 */
function getFormattedAmount(amount: bigint, tokenAddress: string): number {
  const lowerAddress = tokenAddress.toLowerCase();
  const tokenInfo = TOKEN_MAP[lowerAddress];
  
  if (!tokenInfo) {
    // Default to 6 decimals if token not found
    return Number(amount) / 1e6;
  }
  
  // Handle based on token decimals
  if (tokenInfo.decimals === 18) {
    return Number(amount) / 1e18;
  } else if (tokenInfo.decimals === 6) {
    return Number(amount) / 1e6;
  } else if (tokenInfo.decimals === 8) {
    return Number(amount) / 1e8;
  } else {
    // Default fallback
    return Number(amount) / 1e6;
  }
}

/**
 * Log Aave liquidation events to files
 */
function logAaveLiquidation(event: {
  args: AaveLiquidationCallEvent,
  block: { number: bigint, timestamp: bigint },
  transaction: { hash: `0x${string}` },
  log: { logIndex: number }
}) {
  const logDir = './logs';
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  
  const timestamp = new Date().toISOString();
  const { collateralAsset, debtAsset, user, debtToCover, liquidatedCollateralAmount, liquidator, receiveAToken } = event.args;
  const blockNumber = event.block.number;
  const blockTimestamp = event.block.timestamp;
  const txHash = event.transaction.hash;
  
  // Format amounts based on token decimals
  const formattedCollateralAmount = getFormattedAmount(liquidatedCollateralAmount, collateralAsset);
  const formattedDebtAmount = getFormattedAmount(debtToCover, debtAsset);
  
  // Get token symbols
  const collateralSymbol = TOKEN_MAP[collateralAsset.toLowerCase()]?.symbol || "UNKNOWN";
  const debtSymbol = TOKEN_MAP[debtAsset.toLowerCase()]?.symbol || "UNKNOWN";
  
  // Human-readable log message
  const logMessage = `${timestamp} - [AaveLiquidation] Borrower: ${user} Liquidator: ${liquidator} ` +
    `CollateralAsset: ${collateralAsset} (${collateralSymbol})  ` +
    ` LiquidatedCollateral: ${formattedCollateralAmount} ${collateralSymbol} ` +
    `ReceiveAToken: ${receiveAToken} Block: ${blockNumber} Tx: ${txHash}`;
  
  // Log to console for monitoring
  console.log(`[AAVE LIQUIDATION] User: ${user} Liquidator: ${liquidator}`);
  console.log(`[AAVE LIQUIDATION] Collateral: ${formattedCollateralAmount} ${collateralSymbol} Debt: ${formattedDebtAmount} ${debtSymbol}`);
  
  // Log to a general events file
  fs.appendFileSync(`${logDir}/events.log`, `${logMessage}\n`);
  
  // Log to an Aave-specific log file
  fs.appendFileSync(`${logDir}/aave_liquidations.log`, `${logMessage}\n`);
  
  // Create a structured JSON log with all details
  const detailedLog = {
    eventType: 'AaveLiquidationCall',
    timestamp: timestamp,
    blockNumber: blockNumber.toString(),
    transactionHash: txHash,
    borrower: user,
    collateralAsset: collateralAsset,
    debtAsset: debtAsset,
    liquidatedCollateralAmount: liquidatedCollateralAmount.toString(),
    receiveAToken: receiveAToken
  };
  
  // Log the structured data to a JSON file (one object per line for easy parsing)
  fs.appendFileSync(`${logDir}/aave_liquidations.json`, JSON.stringify(detailedLog) + '\n');
}

/**
 * Set up event handlers for Aave liquidation events
 */
export function setupAaveLiquidationHandlers() {
  console.log("Setting up Aave LiquidationCall event handler");
  
  // Set up Aave LiquidationCall event handler
  ponder.on("Aave:LiquidationCall", async ({ event }) => {
    try {
      logAaveLiquidation(event);
    } catch (error) {
      console.error(`[EVENT ERROR] Failed to process Aave LiquidationCall event:`, error);
    }
  });
  
  console.log("Aave liquidation event handler successfully set up");
}

// Initialize the handlers
setupAaveLiquidationHandlers(); 