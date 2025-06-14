/**
 * Main entry point for the AAVE Protocol liquidations tracker
 * 
 * This file sets up event handlers for liquidation tracking using the
 * Ponder framework for real-time blockchain event processing.
 */

import { ponder } from 'ponder:registry';
import { logger } from './utils/logger';
import { PriceService } from './services/PriceService';
import { DatabaseService } from './services/DatabaseService';
import { getTokenByAddress } from './tokens';
import { formatTokenAmount } from './utils/format';
import type { AaveLiquidationCallEvent } from './types/events';

// Initialize services
const priceService = new PriceService();
const databaseService = new DatabaseService();

/**
 * Setup event handlers for AAVE liquidation events
 */
export function setupEventHandlers(): void {
  logger.init('Setting up AAVE LiquidationCall event handlers');

  // Set up AAVE LiquidationCall event handler
  ponder.on('Aave:LiquidationCall', async ({ event, context }) => {
    try {
      const eventArgs = event.args as AaveLiquidationCallEvent;
      const {
        collateralAsset,
        debtAsset,
        user,
        debtToCover,
        liquidatedCollateralAmount,
        liquidator,
        receiveAToken,
      } = eventArgs;

      const { number: blockNumber, timestamp: blockTimestamp } = event.block;
      const { hash: txHash } = event.transaction;

      // Find the collateral and debt token configurations
      const collateralToken = getTokenByAddress(collateralAsset);
      const debtToken = getTokenByAddress(debtAsset);

      if (!collateralToken || !debtToken) {
        logger.error(
          `Token not found - Collateral: ${collateralAsset}, Debt: ${debtAsset}`
        );
        return;
      }

      // Get current prices for both tokens
      const [collateralPrice, debtPrice] = await Promise.all([
        priceService.getTokenPriceFromAave(collateralAsset),
        priceService.getTokenPriceFromAave(debtAsset),
      ]);

      if (!collateralPrice || !debtPrice) {
        logger.error('Failed to get price data for AAVE liquidation');
        return;
      }

      // Calculate USD values
      const collateralAmountFormatted = formatTokenAmount(
        liquidatedCollateralAmount,
        collateralToken.decimals
      );
      const debtAmountFormatted = formatTokenAmount(debtToCover, debtToken.decimals);

      const usdValueSeized = collateralAmountFormatted * collateralPrice;
      const usdValueDebt = debtAmountFormatted * debtPrice;

      // Store liquidation data
      await databaseService.storeLiquidationEvent({
        blockNumber,
        borrowerAddress: user,
        seizedTokenAmount: liquidatedCollateralAmount,
        tokenSymbol: collateralToken.symbol,
        usdValueSeized: Number(usdValueSeized.toFixed(4)),
        transactionHash: txHash,
        blockTimestamp,
      });

      // Log the AAVE liquidation event
      logger.logLiquidation({
        borrower: user,
        liquidator,
        collateralSymbol: collateralToken.symbol,
        seizedAmount: collateralAmountFormatted,
        usdValue: Number(usdValueSeized.toFixed(4)),
        blockNumber,
        transactionHash: txHash,
      });

      logger.log(
        'events',
        `Processing AAVE LiquidationCall: liquidator ${liquidator} for borrower ${user} ` +
        `collateral ${collateralToken.symbol} (${usdValueSeized.toFixed(2)} USD) ` +
        `debt ${debtToken.symbol} (${usdValueDebt.toFixed(2)} USD) ` +
        `receiveAToken: ${receiveAToken}`
      );
    } catch (error) {
      logger.error('Error processing AAVE LiquidationCall event', error as Error);
    }
  });

  logger.init('AAVE LiquidationCall event handler successfully set up');
}

/**
 * Initialize the event indexing system
 */
export function initializeEventIndexer(): void {
  logger.init('Initializing event indexer');

  // Perform database health check
  databaseService
    .healthCheck()
    .then(isHealthy => {
      if (isHealthy) {
        logger.init('Database connection healthy');
      } else {
        logger.error('Database connection unhealthy');
      }
    })
    .catch(error => {
      logger.error('Database health check failed', error as Error);
    });

  // Set up event handlers
  setupEventHandlers();

  logger.init('Event indexer initialized successfully');
}

// Initialize the system
initializeEventIndexer();