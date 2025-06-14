/**
 * Service for handling database operations
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { pgTable, bigint, text, real } from 'drizzle-orm/pg-core';
import { logger } from '../utils/logger';
import type { IndexedEvent, Address } from '../types/events';

// Define Drizzle schema for liquidation events
const liquidationEventsTable = pgTable('liquidation_events', {
    blockNumber: bigint('block_number', { mode: 'bigint' }).notNull(),
    borrowerAddress: text('borrower_address').notNull(),
    seizedTokenAmount: bigint('seized_token_amount', { mode: 'bigint' }).notNull(),
    tokenSymbol: text('token_symbol').notNull(),
    usdValueSeized: real('usd_value_seized').notNull(),
    transactionHash: text('transaction_hash').notNull(),
    blockTimestamp: bigint('block_timestamp', { mode: 'bigint' }).notNull(),
});

export interface LiquidationEventData {
    blockNumber: bigint;
    borrowerAddress: Address;
    seizedTokenAmount: bigint;
    tokenSymbol: string;
    usdValueSeized: number;
    transactionHash: Address;
    blockTimestamp: bigint;
}

export class DatabaseService {
    private db;

    constructor(connectionString?: string) {
        const defaultConnectionString =
            'postgresql://postgres.wwzsmqvbmbnckokvbuth:anshuman1@aws-0-ap-south-1.pooler.supabase.com:5432/postgres';

        const client = postgres(connectionString || defaultConnectionString);
        this.db = drizzle(client);
    }

    /**
     * Stores an event in the database
     */
    async storeEvent(event: IndexedEvent, schema: any): Promise<void> {
        try {
            const id = `${event.transactionHash}-${event.logIndex}`;

            await this.db.insert(schema.userTransactions).values({
                id,
                userAddress: event.user,
                mTokenAddress: event.tokenAddress,
                transactionType: event.type,
                amount: event.amount,
                tokenAmount: event.tokenAmount,
                relatedAddress: event.relatedAddress,
                blockNumber: event.blockNumber,
                blockTimestamp: event.blockTimestamp,
                transactionHash: event.transactionHash,
            });

            logger.log('database', `Stored ${event.type} event for user ${event.user} with token ${event.token}`);
        } catch (error) {
            logger.error(`Failed to store event in database`, error as Error);
            throw error;
        }
    }

    /**
     * Stores a liquidation event in the database
     */
    async storeLiquidationEvent(eventData: LiquidationEventData): Promise<void> {
        try {
            await this.db.insert(liquidationEventsTable).values({
                blockNumber: eventData.blockNumber,
                borrowerAddress: eventData.borrowerAddress,
                seizedTokenAmount: eventData.seizedTokenAmount,
                tokenSymbol: eventData.tokenSymbol,
                usdValueSeized: eventData.usdValueSeized,
                transactionHash: eventData.transactionHash,
                blockTimestamp: eventData.blockTimestamp,
            });

            logger.log('database',
                `Stored liquidation event for borrower ${eventData.borrowerAddress} with token ${eventData.tokenSymbol}`
            );
        } catch (error) {
            logger.error('Failed to store liquidation event in database', error as Error);
            throw error;
        }
    }

    /**
     * Gets the database instance for direct queries
     */
    getDb() {
        return this.db;
    }

    /**
     * Gets the liquidation events table for direct queries
     */
    getLiquidationEventsTable() {
        return liquidationEventsTable;
    }

    /**
     * Executes a health check on the database connection
     */
    async healthCheck(): Promise<boolean> {
        try {
            // Simple query to test connection
            await this.db.execute('SELECT 1');
            return true;
        } catch (error) {
            logger.error('Database health check failed', error as Error);
            return false;
        }
    }
}

// Export a default database service instance
export const databaseService = new DatabaseService(); 