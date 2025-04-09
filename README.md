# Moonwell Protocol Indexer

This project is an indexer for the Moonwell Protocol on Base network, built using Ponder. It tracks market parameters for multiple tokens in the protocol.

## Features

- Real-time tracking of market parameters for 17 different tokens
- Comprehensive market metrics including:
   - address
   - block number
   - price
   - total supply
   - supply APY
   - total borrows
   - borrow APY
   - liquidity
   - utilization
   - collateral factor
   - reserves
   - reserve factor
   - supply cap
   - borrow cap
   - liquidation incentive
   - block timestamp

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- A Base RPC URL (for production)
- A PostgreSQL database (for production)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd moonwell-indexer
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Create a `.env` file in the root directory:
```env
# Development
PONDER_RPC_URL_8453=https://mainnet.base.org

# Production (replace with your RPC URL)
# PONDER_RPC_URL_8453=your-rpc-url

# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/database_name
DATABASE_SCHEMA=your_schema
```

## Development

1. Start the development server:
```bash
npm run dev
# or
yarn dev
```

2. The indexer will start processing blocks and events from the Moonwell Protocol.

3. Access the Ponder dashboard at `http://localhost:42069` to view indexed data.

## Production Deployment

1. Set up your production environment:
   - Use a reliable RPC provider for Base network
   - Set up a PostgreSQL database
   - Set up monitoring and logging

2. Update the `.env` file with production values:
```env
PONDER_RPC_URL_8453=your-production-rpc-url
DATABASE_URL=postgresql://username:password@host:5432/database_name
DATABASE_SCHEMA=your_schema
```

3. Build the project:
```bash
npm run build
# or
yarn build
```

4. Start the production server:
```bash
npm start
# or
yarn start
```

## Database Configuration

### Database Setup

1. Create a PostgreSQL database for your project
2. Get your database connection URL in the format:
   ```
   postgresql://username:password@host:port/database_name
   ```
3. Add the DATABASE_URL to your `.env` file:
   ```env
   DATABASE_URL=postgresql://username:password@host:port/database_name
   DATABASE_SCHEMA=your_schema
   ```

4. The indexer will automatically create the necessary tables using the schema defined in `ponder.schema.ts`

### Database Schema

The indexer creates token-specific tables for each supported token. Here's an example of the table structure:

```sql
CREATE TABLE "DAI" (
  "mTokenAddress" hex NOT NULL,
  "blockNumber" bigint NOT NULL,
  "price" bigint,
  "totalSupply" bigint,
  "supplyAPY" real,
  "totalBorrows" bigint,
  "borrowAPY" real,
  "liquidity" bigint,
  "utilization" real,
  "collateralFactor" bigint,
  "reserves" bigint,
  "reserveFactor" bigint,
  "supplyCap" bigint,
  "borrowCap" bigint,
  "liquidationIncentive" bigint,
  "blockTimestamp" bigint,
  PRIMARY KEY ("mTokenAddress", "blockNumber")
);
```

## Supported Tokens

The indexer tracks the following tokens:
- DAI
- USDC
- USDbC
- WETH
- cbETH
- wstETH
- rETH
- weETH
- AERO
- cbBTC
- EURC
- wrsETH
- WELL
- USDS
- tBTC
- LBTC
- VIRTUAL

## Monitoring and Maintenance

- Monitor the indexer's health through the Ponder dashboard
- Check logs for any errors or issues
- Regularly verify data consistency
- Keep the RPC endpoint updated and reliable
- Monitor database performance and storage usage
- Set up alerts for any indexing failures or data inconsistencies