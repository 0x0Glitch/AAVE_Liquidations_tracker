/**
 * Centralized logging utilities
 */

import * as fs from 'fs';
import { formatTimestamp } from './format';
import type { IndexedEvent } from '../types/events';

export interface LogConfig {
    logDir: string;
    enableConsole: boolean;
    enableFile: boolean;
}

export class Logger {
    private config: LogConfig;

    constructor(config: Partial<LogConfig> = {}) {
        this.config = {
            logDir: './logs',
            enableConsole: true,
            enableFile: true,
            ...config,
        };

        this.ensureLogDirectory();
    }

    private ensureLogDirectory(): void {
        if (this.config.enableFile && !fs.existsSync(this.config.logDir)) {
            fs.mkdirSync(this.config.logDir, { recursive: true });
        }
    }

    /**
     * Logs an event with structured formatting
     */
    logEvent(event: IndexedEvent): void {
        const timestamp = formatTimestamp(event.blockTimestamp);
        const amount = event.amount.toString();
        const tokenAmount = event.tokenAmount ? event.tokenAmount.toString() : 'N/A';

        let logMessage = `${timestamp} - [${event.type}] User: ${event.user} Token: ${event.token} ` +
            `Amount: ${amount} TokenAmount: ${tokenAmount} ` +
            `Block: ${event.blockNumber} Tx: ${event.transactionHash}`;

        // Add additional details for liquidation events
        if (event.type === 'LiquidateBorrow' && event.relatedAddress) {
            logMessage += ` Liquidator: ${event.relatedAddress}`;
        }

        this.log('events', logMessage);

        // Additionally log liquidation events to separate file
        if (event.type === 'LiquidateBorrow') {
            this.log('liquidations', logMessage);
        }
    }

    /**
     * Logs a liquidation event with USD value information
     */
    logLiquidation(params: {
        borrower: string;
        liquidator: string;
        collateralSymbol: string;
        seizedAmount: number;
        usdValue: number;
        blockNumber: bigint;
        transactionHash: string;
    }): void {
        const timestamp = new Date().toISOString();
        const logMessage = `${timestamp} - [LiquidateBorrow] Borrower: ${params.borrower} ` +
            `Collateral: ${params.collateralSymbol} Seized Amount: ${params.seizedAmount} ` +
            `USD Value: ${params.usdValue} Block: ${params.blockNumber} ` +
            `Tx: ${params.transactionHash} Liquidator: ${params.liquidator}`;

        this.log('events', logMessage);
        this.log('liquidations', logMessage);
    }

    /**
     * Logs token prices
     */
    logTokenPrices(prices: Record<string, { symbol: string; address: string; price: number }>): void {
        let logContent = `Timestamp: ${new Date().toISOString()}\n\nToken Prices (USD):\n`;
        logContent += '==================\n\n';

        Object.values(prices).forEach(({ symbol, address, price }) => {
            logContent += `${symbol}\nAddress: ${address}\nPrice: $${price.toFixed(6)}\n\n`;
        });

        this.writeToFile('prices.log', logContent);
    }

    /**
     * Generic logging method
     */
    log(type: string, message: string): void {
        if (this.config.enableConsole) {
            // eslint-disable-next-line no-console
            console.log(message);
        }

        if (this.config.enableFile) {
            this.appendToFile(`${type}.log`, message);
        }
    }

    /**
     * Logs errors with stack trace
     */
    error(message: string, error?: Error): void {
        const timestamp = new Date().toISOString();
        let logMessage = `${timestamp} - ERROR: ${message}`;

        if (error) {
            logMessage += `\nStack: ${error.stack}`;
        }

        if (this.config.enableConsole) {
            console.error(logMessage);
        }

        if (this.config.enableFile) {
            this.appendToFile('errors.log', logMessage);
        }
    }

    /**
     * Logs initialization messages
     */
    init(message: string): void {
        const timestamp = new Date().toISOString();
        const logMessage = `${timestamp} - INIT: ${message}`;

        this.log('events', logMessage);
    }

    private appendToFile(filename: string, content: string): void {
        try {
            fs.appendFileSync(`${this.config.logDir}/${filename}`, `${content}\n`);
        } catch (error) {
            console.error(`Failed to write to log file ${filename}:`, error);
        }
    }

    private writeToFile(filename: string, content: string): void {
        try {
            fs.writeFileSync(`${this.config.logDir}/${filename}`, content);
        } catch (error) {
            console.error(`Failed to write to log file ${filename}:`, error);
        }
    }
}

// Export a default logger instance
export const logger = new Logger(); 