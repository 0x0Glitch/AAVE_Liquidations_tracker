import { ponder } from "ponder:registry";
import { userPositions, userTransactions, userAddresses, liquidationEvents } from "ponder:schema";
import { TOKENS } from "./tokens";
import * as fs from 'fs';
import { sql } from "drizzle-orm";
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { pgTable, bigint, text, real } from 'drizzle-orm/pg-core';

import { createPublicClient, http, defineChain } from "viem";

// PostgreSQL connection setup
const connectionString = "postgresql://postgres.wwzsmqvbmbnckokvbuth:anshuman1@aws-0-ap-south-1.pooler.supabase.com:5432/postgres";
const client = postgres(connectionString);
const db = drizzle(client);

// Define Drizzle schema for liquidation events
const liquidationEventsTable = pgTable('liquidation_events', {
  blockNumber: bigint('block_number', { mode: 'bigint' }).notNull(),
  borrowerAddress: text('borrower_address').notNull(),
  seizedTokenAmount: bigint('seized_token_amount', { mode: 'bigint' }).notNull(),
  tokenSymbol: text('token_symbol').notNull(),
  usdValueSeized: real('usd_value_seized').notNull(),
  transactionHash: text('transaction_hash').notNull(),
  blockTimestamp: bigint('block_timestamp', { mode: 'bigint' }).notNull()
});

// Define event types (reusing from index.ts)
type BorrowEvent = {
  borrower: `0x${string}`;
  borrowAmount: bigint;
  accountBorrows: bigint;
  totalBorrows: bigint;
};

type RepayBorrowEvent = {
  payer: `0x${string}`;
  borrower: `0x${string}`;
  repayAmount: bigint;
  accountBorrows: bigint;
  totalBorrows: bigint;
};

type MintEvent = {
  minter: `0x${string}`;
  mintAmount: bigint;
  mintTokens: bigint;
};

type RedeemEvent = {
  redeemer: `0x${string}`;
  redeemAmount: bigint;
  redeemTokens: bigint;
};

type LiquidateBorrowEvent = {
  liquidator: `0x${string}`;
  borrower: `0x${string}`;
  repayAmount: bigint;
  mTokenCollateral: `0x${string}`;
  seizeTokens: bigint;
};

// Event type mapping
type EventType = 'Mint' | 'Redeem' | 'Borrow' | 'RepayBorrow' | 'LiquidateBorrow';

// Structure to hold indexed events
interface IndexedEvent {
  type: EventType;
  user: `0x${string}`;
  token: string;
  tokenAddress: `0x${string}`;
  amount: bigint;
  tokenAmount?: bigint;
  relatedAddress?: `0x${string}`;
  blockNumber: bigint;
  blockTimestamp: bigint;
  transactionHash: `0x${string}`;
  logIndex: number;
}

/**
 * Log events to a file for debugging/tracking
 */
function logEventToFile(event: IndexedEvent) {
  const logDir = './logs';
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  
  const timestamp = new Date().toISOString();
  
  // Format amounts for better readability
  const amount = event.amount.toString();
  const tokenAmount = event.tokenAmount ? event.tokenAmount.toString() : 'N/A';
  
  let logMessage = `${timestamp} - [${event.type}] User: ${event.user} Token: ${event.token} ` +
    `Amount: ${amount} TokenAmount: ${tokenAmount} ` +
    `Block: ${event.blockNumber} Tx: ${event.transactionHash}`;
    
  // Add additional details for liquidation events
  if (event.type === 'LiquidateBorrow' && event.relatedAddress) {
    logMessage += ` Liquidator: ${event.relatedAddress}`;
  }
    
  // Log to events.log for all events
  fs.appendFileSync(`${logDir}/events.log`, `${logMessage}\n`);
  
  // Additionally log liquidation events to liq.log
  if (event.type === 'LiquidateBorrow') {
    fs.appendFileSync(`${logDir}/liq.log`, `${logMessage}\n`);
  }
}

/**
 * Store event in the database
 */
async function storeEvent(db: any, event: IndexedEvent) {
  try {
    const id = `${event.transactionHash}-${event.logIndex}`;
    
    await db.insert(userTransactions).values({
      id,
      userAddress: event.user,
      mTokenAddress: event.tokenAddress,
      transactionType: event.type,
      amount: event.amount,
      tokenAmount: event.tokenAmount,
      relatedAddress: event.relatedAddress,
      blockNumber: event.blockNumber,
      blockTimestamp: event.blockTimestamp,
      transactionHash: event.transactionHash
    });
    
    console.log(`[DB] Stored ${event.type} event for user ${event.user} with token ${event.token}`);
  } catch (error) {
    console.error(`[DB ERROR] Failed to store event:`, error);
  }
}

/**
 * Setup event handlers for all token events
 * This function should be called once during initialization
 */
export function setupEventHandlers() {
  console.log(`Setting up LiquidateBorrow event handlers for ${TOKENS.length} tokens`);
  
  // Set up a LiquidateBorrow handler for each token
  TOKENS.forEach(token => {
    const contractName = token.symbol === TOKENS[0]?.symbol ? "MToken" : `MToken_${token.symbol}`;
    
    // LiquidateBorrow event
    // @ts-ignore - Ignore type errors for dynamic event handler registration
    ponder.on(`${contractName}:LiquidateBorrow`, async ({ event, context }: { event: any; context: any }) => {
      try {
        const { liquidator, borrower, repayAmount, mTokenCollateral, seizeTokens } = event.args as LiquidateBorrowEvent;
        const blockNumber = event.block.number;
        const blockTimestamp = event.block.timestamp;
        const txHash = event.transaction.hash;
        const logIndex = event.log.logIndex;

        // Find the collateral token configuration
        const collateralToken = TOKENS.find(t => t.address.toLowerCase() === mTokenCollateral.toLowerCase());
        if (!collateralToken) {
          console.error(`[EVENT ERROR] Collateral token not found: ${mTokenCollateral}`);
          return;
        }

        // Get the price of the collateral token from the comptroller
        const comptrollerAddress = "0xfBb21d0380beE3312B33c4353c8936a0F13EF26C"; // Base Comptroller address
        const publicClient = createPublicClient({
          chain: defineChain({
            id: 8453,
            name: 'Base',
            network: 'base',
            nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
            rpcUrls: {
              default: { http: [process.env.PONDER_RPC_URL_8453 || ''] },
              public: { http: [process.env.PONDER_RPC_URL_8453 || ''] },
            },
          }),
          transport: http()
        });

        // First get the oracle address from the comptroller
        let oracleAddress;
        try {
          oracleAddress = await publicClient.readContract({
            address: comptrollerAddress,
            abi: [{
              inputs: [],
              name: "oracle",
              outputs: [{ name: "", type: "address" }],
              stateMutability: "view",
              type: "function"
            }],
            functionName: "oracle"
          });
          console.log(`Oracle address: ${oracleAddress}`);
        } catch (error) {
          console.error(`[EVENT ERROR] Failed to fetch oracle address from comptroller`);
          console.error(`Contract Address: ${comptrollerAddress}`);
          console.error(`Error Details:`, error);
          return;
        }

        // Get the price from the oracle
        let priceData;
        try {
          priceData = await publicClient.readContract({
            address: oracleAddress,
            abi: [{
              inputs: [{ name: 'mToken', type: 'address' }],
              name: 'getUnderlyingPrice',
              outputs: [{ name: '', type: 'uint256' }],
              stateMutability: 'view',
              type: 'function',
            }],
            functionName: 'getUnderlyingPrice',
            args: [mTokenCollateral],
            blockNumber: blockNumber
          });
        } catch (error) {
          console.error(`[EVENT ERROR] Failed to fetch price from oracle for token: ${mTokenCollateral}`);
          console.error(`Oracle Address: ${oracleAddress}`);
          console.error(`Contract Address: ${comptrollerAddress}`);
          console.error(`Function: getUnderlyingPrice`);
          console.error(`Args: ${mTokenCollateral}`);
          console.error(`Error Details:`, error);
          return;
        }
        var usdValue = 0
        // Calculate USD value of seized collateral
        const price = priceData || 0n;
        const seizedtokensnew = (Number(seizeTokens)/1e8)
        if (collateralToken.decimals == 6){
         usdValue = Number((Number((seizeTokens * price) / (10n ** BigInt(collateralToken.decimals)))/1e32).toFixed(4));
        }
        else if (collateralToken.decimals == 8){
            usdValue = Number((Number((seizeTokens * price) / (10n ** BigInt(collateralToken.decimals)))/1e28).toFixed(4));
        }
        else {
            usdValue = Number((Number((seizeTokens * price) / (10n ** BigInt(collateralToken.decimals)))/1e8).toFixed(4));
        }
        
        // Store liquidation data in PostgreSQL
        try {
          await db.insert(liquidationEventsTable).values({
            blockNumber: BigInt(blockNumber),
            borrowerAddress: borrower,
            seizedTokenAmount: seizeTokens,
            tokenSymbol: collateralToken.symbol,
            usdValueSeized: usdValue,
            transactionHash: txHash,
            blockTimestamp: BigInt(blockTimestamp)
          });
          console.log(`[DB] Stored liquidation event for borrower ${borrower} with token ${collateralToken.symbol}`);
        } catch (error) {
          console.error(`[DB ERROR] Failed to store liquidation event:`, error);
        }
        
        // Log to both files with USD value
        const timestamp = new Date().toISOString();
        const logMessage = `${timestamp} - [LiquidateBorrow] Borrower: ${borrower} Collateral: ${collateralToken.symbol} ` +
          `Seized Amount: ${seizedtokensnew} USD Value: ${usdValue} ` +
          `Block: ${blockNumber} Tx: ${txHash} Liquidator: ${liquidator}`;
        
        fs.appendFileSync('./logs/events.log', `${logMessage}\n`);
        fs.appendFileSync('./logs/liq.log', `${logMessage}\n`);
        
        console.log(`Processing LiquidateBorrow from ${contractName}: liquidator ${liquidator} for borrower ${borrower} with repay amount ${repayAmount} and seize tokens ${seizeTokens}`);
      } catch (error) {
        console.error(`[EVENT ERROR] Error processing LiquidateBorrow event from ${contractName}:`, error);
      }
    });
  });
  
  console.log("LiquidateBorrow event handlers successfully set up");
}

/**
 * Initialize the event indexing system
 * This should be called once at application startup
 */
export function initializeEventIndexer() {
  console.log("Initializing event indexer");
  
  // Create logs directory if it doesn't exist
  const logDir = './logs';
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  
  // Log initialization
  const timestamp = new Date().toISOString();
  const initMessage = `${timestamp} - Event indexer initialized\n`;
  fs.appendFileSync(`${logDir}/events.log`, initMessage);
  
  // Set up event handlers
  setupEventHandlers();
  
  console.log("Event indexer initialized successfully");
}