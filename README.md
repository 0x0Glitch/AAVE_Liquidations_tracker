# 🔍 AAVE Liquidations Tracker

A real-time monitoring and tracking system for liquidation events on the AAVE protocol, specifically designed for the Base blockchain. Built with Ponder for efficient blockchain indexing and comprehensive event analysis.

![AAVE](https://img.shields.io/badge/AAVE-B6509E?style=for-the-badge&logo=aave&logoColor=white)
![Base](https://img.shields.io/badge/Base-0052FF?style=for-the-badge&logo=coinbase&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Ponder](https://img.shields.io/badge/Ponder-FF6B35?style=for-the-badge)

## 🚀 Overview

This project provides real-time monitoring of AAVE liquidation events on Base blockchain, offering comprehensive tracking, logging, and analysis capabilities. It captures both protocol-level and token-specific liquidation events, storing them in multiple formats for different use cases.

## 🏗️ Architecture

### System Components

```mermaid
graph TB
    subgraph "Blockchain Layer"
        BC[Base Blockchain<br/>Chain ID: 8453]
        AAVE[AAVE Protocol<br/>Main Contract]
        TOK[Token Contracts<br/>WETH, USDC, etc.]
    end
    
    subgraph "Indexing Layer"
        PONDER[Ponder Framework<br/>Event Indexer]
    end
    
    subgraph "Processing Layer"
        LH[Liquidation Handler<br/>liquidation-logger.ts]
        TH[Token Handlers<br/>index.ts]
        TM[Token Manager<br/>tokens.ts]
    end
    
    subgraph "Storage Layer"
        DB[(Database<br/>pglite)]
        LOGS[Log Files<br/>JSON & Text]
        CONSOLE[Console Output<br/>Real-time]
    end
    
    BC --> PONDER
    AAVE --> PONDER
    TOK --> PONDER
    
    PONDER --> LH
    PONDER --> TH
    TM --> LH
    TM --> TH
    
    LH --> DB
    LH --> LOGS
    LH --> CONSOLE
    
    TH --> DB
    TH --> LOGS
    TH --> CONSOLE
    
    style AAVE fill:#B6509E,color:#fff
    style PONDER fill:#FF6B35,color:#fff
    style DB fill:#336791,color:#fff
```

## 📊 Data Flow

```mermaid
sequenceDiagram
    participant BC as Base Blockchain
    participant AAVE as AAVE Protocol
    participant PONDER as Ponder Indexer
    participant LH as Liquidation Handler
    participant TM as Token Manager
    participant DB as Database
    participant LOGS as Log Files
    
    BC->>AAVE: Liquidation Transaction
    AAVE->>PONDER: LiquidationCall Event
    PONDER->>LH: Process Event
    LH->>TM: Get Token Info
    TM->>LH: Token Metadata
    LH->>LH: Format Amounts
    
    par Storage Operations
        LH->>DB: Store Event Data
    and
        LH->>LOGS: Write to events.log
    and
        LH->>LOGS: Write to aave_liquidations.log
    and
        LH->>LOGS: Write to aave_liquidations.json
    end
    
    Note over LH,LOGS: Real-time console output
```

## 🛠️ Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- PostgreSQL (for production) or pglite (for development)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd aave-liquidations-tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the indexer**
   ```bash
   npm run dev
   ```

## ⚙️ Configuration

### Supported Tokens

| Token | Symbol | Decimals | Purpose |
|-------|--------|----------|---------|
| Wrapped Ether | WETH | 18 | Collateral/Debt |
| USD Coin | USDC | 6 | Stablecoin |
| USD Base Coin | USDbC | 6 | Base Native Stablecoin |
| Coinbase ETH | cbETH | 18 | Liquid Staking |
| Wrapped stETH | wstETH | 18 | Lido Staking |

### Network Configuration

```typescript
// Base Mainnet
export const base = {
  chainId: 8453,
  name: "Base",
  rpcUrl: "https://mainnet.base.org"
}
```


## 🔄 Event Processing Flow

```mermaid
flowchart TD
    A[Liquidation Event Detected] --> B{Event Type?}
    
    B -->|LiquidationCall| C[AAVE Native Handler]
    B -->|LiquidateBorrow| D[Token Handler]
    
    C --> E[Extract Event Data]
    D --> E
    
    E --> F[Get Token Metadata]
    F --> G[Format Token Amounts]
    G --> H[Validate Event Data]
    
    H --> I{Valid Event?}
    I -->|Yes| J[Process Event]
    I -->|No| K[Log Error]
    
    J --> L[Database Storage]
    J --> M[File Logging]
    J --> N[Console Output]
    
    K --> O[Error Logging]
    
    style A fill:#e1f5fe
    style J fill:#e8f5e8
    style K fill:#ffebee
    style L fill:#f3e5f5
    style M fill:#fff3e0
    style N fill:#e0f2f1
```

## 📊 Database Schema

### Core Tables

- **Token Markets**: Market parameters for each supported token
- **User Positions**: Track user positions across different assets
- **User Transactions**: Record all user transaction history
- **Liquidation Events**: Comprehensive liquidation event data

### Schema Highlights

```sql
-- Example: WETH Market Parameters
CREATE TABLE WETHMarketParams (
  id TEXT PRIMARY KEY,
  loanToken TEXT NOT NULL,
  collateralToken TEXT NOT NULL,
  oracle TEXT NOT NULL,
  irm TEXT NOT NULL,
  lltv BIGINT NOT NULL
);

-- Example: Liquidation Events
CREATE TABLE WETHLiquidations (
  id TEXT PRIMARY KEY,
  borrower TEXT NOT NULL,
  liquidator TEXT NOT NULL,
  repaidAssets BIGINT NOT NULL,
  seizedAssets BIGINT NOT NULL,
  timestamp BIGINT NOT NULL,
  blockNumber BIGINT NOT NULL
);
```

## 📝 Event Data Structure

### Liquidation Event Format

```json
{
  "eventType": "LiquidationCall",
  "blockNumber": 12345678,
  "timestamp": 1640995200,
  "transactionHash": "0x...",
  "borrower": "0x...",
  "liquidator": "0x...",
  "collateralAsset": "0x...",
  "debtAsset": "0x...",
  "debtToCover": "1000000000000000000",
  "liquidatedCollateralAmount": "500000000000000000",
  "formattedDebtToCover": "1.0 WETH",
  "formattedCollateralAmount": "0.5 WETH"
}
```

## 📈 Monitoring & Logging

### Log Files Generated

1. **events.log**: General system events and errors
2. **aave_liquidations.log**: Human-readable liquidation summaries
3. **aave_liquidations.json**: Structured JSON for programmatic access

### Sample Log Output

```
[2024-01-15 10:30:45] LIQUIDATION: Borrower 0x1234...5678 liquidated
  - Debt Covered: 1.5 WETH ($2,400.00)
  - Collateral Seized: 2.1 USDC ($2,100.00)
  - Liquidator: 0xabcd...efgh
  - Block: 12345678
```

## 🔧 Development

### Running in Development

```bash
# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Generate database schema
npm run generate
```

### Environment Variables

```bash
# Required
DATABASE_URL=your_database_url
RPC_URL_BASE=your_base_rpc_url

# Optional
LOG_LEVEL=info
BLOCK_START=1000000
POLLING_INTERVAL=12000
```

## 🚀 Deployment

### Production Setup

1. **Database Setup**
   ```bash
   # Set up PostgreSQL
   createdb aave_liquidations
   ```

2. **Environment Configuration**
   ```bash
   export DATABASE_URL="postgresql://user:pass@localhost/aave_liquidations"
   export RPC_URL_BASE="https://mainnet.base.org"
   ```

3. **Start Production Server**
   ```bash
   npm run build
   npm start
   ```

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 📊 Analytics & Insights

The tracker provides rich data for analysis:

- **Liquidation Frequency**: Track liquidation patterns over time
- **Asset Analysis**: Monitor which assets are most frequently liquidated
- **User Behavior**: Analyze borrower and liquidator patterns
- **Market Conditions**: Correlate liquidations with market volatility

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Add tests for new features
- Update documentation as needed
- Ensure proper error handling

## 📄 API Reference

### Event Handler Interface

```typescript
interface LiquidationEvent {
  borrower: string;
  liquidator: string;
  collateralAsset: string;
  debtAsset: string;
  debtToCover: bigint;
  liquidatedCollateralAmount: bigint;
  blockNumber: bigint;
  timestamp: bigint;
}
```

## 🛡️ Security Considerations

- **Data Validation**: All event data is validated before processing
- **Error Handling**: Comprehensive error handling prevents system crashes
- **Rate Limiting**: Built-in protection against RPC rate limits
- **Safe Parsing**: BigInt handling for precise token amount calculations

## 📋 Roadmap

- [ ] Multi-chain support (Ethereum, Arbitrum, Polygon)
- [ ] Real-time alerts and notifications
- [ ] Web dashboard for visualization
- [ ] GraphQL API for flexible queries
- [ ] Integration with DeFi analytics platforms

## 📞 Support

- **Issues**: Please use GitHub Issues for bug reports
- **Discussions**: Use GitHub Discussions for questions
- **Documentation**: Check the `/docs` folder for detailed guides

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

src/
├── index.ts           # Main entry point (listens for AAVE liquidation events)
├── api/               # API endpoints for accessing tracked data
│   └── index.ts
├── services/          # Core business logic services
│   ├── PriceService.ts
│   └── DatabaseService.ts
├── utils/             # Helper functions
│   ├── format.ts
│   └── logger.ts
├── constants/         # Application constants
│   ├── addresses.ts
│   └── abis.ts
├── types/             # TypeScript type definitions
│   ├── events.ts
│   └── tokens.ts
└── tokens.ts          # Token configuration and registry

