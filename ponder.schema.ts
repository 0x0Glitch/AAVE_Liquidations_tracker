/**
 * Schema definition for the AAVE Protocol liquidations tracker
 * 
 * This file defines the database structure for tracking market parameters,
 * user positions, transaction history, and liquidation events across multiple tokens.
 */

import { onchainTable, primaryKey } from "ponder";

/**
 * Creates token tables with consistent structure
 * 
 * Each token (WETH, USDC, etc.) gets its own table with identical schema
 * to track market parameters over time. This factory function ensures
 * all token tables have the same structure and indexes.
 * 
 * @param name - The name of the token (e.g., "WETH", "USDC")
 * @returns A table definition with market parameters
 */
const createTokenTable = (name: string) => onchainTable(
  name,
  (t) => ({
    // Token and block identification
    mTokenAddress: t.hex().notNull(), // The address of the mToken contract
    blockNumber: t.bigint().notNull(), // The block number when these parameters were recorded

    // Market parameters
    price: t.bigint(), // Current price of the token in USD (scaled by 1e18)
    totalSupply: t.bigint(), // Total supply of mTokens (borrowed + available)
    supplyAPY: t.real(), // Annual Percentage Yield for suppliers
    totalBorrows: t.bigint(), // Total amount borrowed across all users
    borrowAPY: t.real(), // Annual Percentage Yield for borrowers
    liquidity: t.bigint(), // Available cash in the market (totalSupply - totalBorrows)
    utilization: t.real(), // Utilization rate (totalBorrows / totalSupply)
    collateralFactor: t.bigint(), // Collateral factor for this token (scaled by 1e18)
    reserves: t.bigint(), // Protocol reserves
    reserveFactor: t.bigint(), // Reserve factor (scaled by 1e18)
    supplyCap: t.bigint(), // Maximum supply cap (0 for unlimited)
    borrowCap: t.bigint(), // Maximum borrow cap (0 for unlimited)
    liquidationIncentive: t.bigint(), // Liquidation incentive (scaled by 1e18)
    blockTimestamp: t.bigint(), // Unix timestamp of the block
  }),
  (table) => ({
    // Composite primary key of token address and block number
    pk: primaryKey({ columns: [table.mTokenAddress, table.blockNumber] }),
  })
);

/**
 * Token tables for all supported assets
 * 
 * Each token gets its own table with identical structure defined by createTokenTable
 */
export const WETH = createTokenTable("WETH");
export const USDC = createTokenTable("USDC");
export const USDbC = createTokenTable("USDbC");
export const cbETH = createTokenTable("cbETH");
export const wstETH = createTokenTable("wstETH");
export const weETH = createTokenTable("weETH");
export const cbBTC = createTokenTable("cbBTC");
export const EURC = createTokenTable("EURC");
export const wrsETH = createTokenTable("wrsETH");
export const LBTC = createTokenTable("LBTC");
export const ezETH = createTokenTable("ezETH");
export const GHO = createTokenTable("GHO");

// Additional tokens that may be used in the future
export const DAI = createTokenTable("DAI");
export const rETH = createTokenTable("rETH");
export const AERO = createTokenTable("AERO");
export const WELL = createTokenTable("WELL");
export const USDS = createTokenTable("USDS");
export const tBTC = createTokenTable("tBTC");
export const VIRTUAL = createTokenTable("VIRTUAL");

/**
 * Table for tracking unique user addresses
 * This table stores all addresses that have interacted with the protocol
 */
export const userAddresses = onchainTable(
  "user_addresses",
  (t) => ({
    userAddress: t.hex().notNull(),
  }),
  (table) => ({
    pk: primaryKey({ columns: [table.userAddress] }),
  })
);

/**
 * Table for tracking user positions in the protocol
 * Stores current supply, collateral and borrow balances for each user
 */
export const userPositions = onchainTable(
  "user_positions",
  (t) => ({
    userAddress: t.hex().notNull(),
    amountSupplied: t.bigint().default(0n), // Total raw supply amount
    adjustedCollateral: t.bigint().default(0n), // NEW: Total collateral-factor adjusted supply (for health factor)
    amountBorrowed: t.bigint().default(0n), // Total borrow amount
    healthFactor: t.real(), // Collateral-adjusted health factor
  }),
  (table) => ({
    pk: primaryKey({ columns: [table.userAddress] }),
  })
);

/**
 * Table for tracking all user transactions
 * Records every supply, borrow, repay, redeem, and liquidation event
 */
export const userTransactions = onchainTable(
  "user_transactions",
  (t) => ({
    // Unique identifier combining transaction hash and log index
    id: t.text().notNull(),
    userAddress: t.hex().notNull(), // The address of the user
    mTokenAddress: t.hex().notNull(), // The market address
    
    // Transaction details
    transactionType: t.text().notNull(), // Type of transaction (BORROW, REPAY, SUPPLY, etc.)
    amount: t.bigint().notNull(), // Amount involved in the transaction
    tokenAmount: t.bigint(), // Token amount (for mint/redeem/liquidation)
    relatedAddress: t.hex(), // Related address (for repayBorrowBehalf, liquidations)
    
    // Block information
    blockNumber: t.bigint().notNull(), // Block number of the transaction
    blockTimestamp: t.bigint().notNull(), // Unix timestamp of the block
    transactionHash: t.hex().notNull(), // Hash of the transaction
  }),
  (table) => ({
    // Primary key is the composite ID
    pk: primaryKey({ columns: [table.id] }),
    // Indexes for efficient querying
    userIndex: {
      columns: [table.userAddress]
    },
    marketIndex: {
      columns: [table.mTokenAddress]
    },
    typeIndex: {
      columns: [table.transactionType]
    },
    blockIndex: {
      columns: [table.blockNumber]
    }
  })
);

/**
 * Table for tracking liquidation events
 * Records comprehensive information about each liquidation event
 * including both collateral and debt details
 */
export const liquidationEvents = onchainTable(
  "liquidation_events",
  (t) => ({
    // Event identification
    id: t.text().notNull(), // Unique identifier (tx hash + log index)
    eventType: t.text().notNull(), // Event type (LiquidationCall, LiquidateBorrow)
    protocol: t.text().notNull(), // Protocol name (Aave)
    
    // Block and transaction information
    blockNumber: t.bigint().notNull(), // Block number when liquidation occurred
    blockTimestamp: t.bigint().notNull(), // Block timestamp
    transactionHash: t.hex().notNull(), // Transaction hash
    logIndex: t.integer().notNull(), // Log index in the transaction
    gasUsed: t.bigint(), // Gas used for the transaction
    gasPrice: t.bigint(), // Gas price in wei
    
    // Liquidation participants
    borrowerAddress: t.hex().notNull(), // Address of the borrower being liquidated
    liquidatorAddress: t.hex().notNull(), // Address of the liquidator
    receiveAToken: t.boolean(), // Whether liquidator receives aToken (Aave specific)
    
    // Collateral details
    collateralTokenAddress: t.hex().notNull(), // Address of the collateral token
    collateralTokenSymbol: t.text().notNull(), // Symbol of the collateral token
    seizedTokenAmount: t.bigint().notNull(), // Raw amount of collateral seized
    formattedCollateralAmount: t.real(), // Human-readable collateral amount
    collateralDecimals: t.integer(), // Decimals of the collateral token
    collateralPriceUsd: t.real(), // USD price of collateral at liquidation time
    usdValueSeized: t.real().notNull(), // USD value of seized tokens
    
    // Debt details
    debtTokenAddress: t.hex().notNull(), // Address of the debt token
    debtTokenSymbol: t.text().notNull(), // Symbol of the debt token
    debtAmount: t.bigint().notNull(), // Raw debt amount repaid
    formattedDebtAmount: t.real(), // Human-readable debt amount
    debtDecimals: t.integer(), // Decimals of the debt token
    debtPriceUsd: t.real(), // USD price of debt token at liquidation time
    usdValueDebt: t.real(), // USD value of debt repaid
    
    // Liquidation details
    liquidationDiscount: t.real(), // Liquidation bonus percentage
    liquidationPenalty: t.real(), // Penalty applied to the borrower
    healthFactorBefore: t.real(), // Health factor before liquidation (if available)
    healthFactorAfter: t.real(), // Health factor after liquidation (if available)
  }),
  (table) => ({
    // Composite primary key
    pk: primaryKey({ columns: [table.transactionHash, table.logIndex] }),
    
    // Indexes for efficient querying
    blockIndex: {
      columns: [table.blockNumber]
    },
    borrowerIndex: {
      columns: [table.borrowerAddress]
    },
    liquidatorIndex: {
      columns: [table.liquidatorAddress]
    },
    collateralIndex: {
      columns: [table.collateralTokenAddress]
    },
    debtIndex: {
      columns: [table.debtTokenAddress]
    },
    timestampIndex: {
      columns: [table.blockTimestamp]
    }
  })
);