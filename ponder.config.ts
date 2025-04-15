import { createConfig } from "ponder";
import { http } from "viem";
import { AaveAbi } from "./abis/Aave";
import { TOKENS } from "./src/tokens";

/**
 * Configuration constants for contracts and network
 */
const CONFIG = {
  NETWORK: {
    NAME: "base",
    CHAIN_ID: 8453,
  },
  BLOCKS: {
    START_BLOCK: 28281660,
    INTERVAL: 60, // Re-check every 60 blocks
  },
  ADDRESSES: {
    AAVE: "0xA238Dd80C259a72e81d7e4664a9801593F98d1c5" as const,
    FALLBACK_TOKEN: "0x6Ff9c8FF8F9F7C3551f1A753A6A8BD54B6445DD7" as const,
  },
};

/**
 * Contract configuration type definition
 */
interface ContractConfig {
  /** Contract ABI definition */
  
  /** Target blockchain network */
  network: string;
  /** Contract address in 0x format */
  address: `0x${string}`;
  /** Block number to start indexing from */
  startBlock: number;
}

/**
 * Generate contract configurations for all supported tokens
 * @returns Record of contract configurations keyed by contract name
 */
function generateTokenContracts(): Record<string, ContractConfig> {
  const contracts: Record<string, ContractConfig> = {};
  
  // Process tokens if available
  if (TOKENS.length > 0) {
    TOKENS.forEach((token) => {
      if (!token.symbol || !token.address) {
        console.warn(`Skipping token with missing data:`, token);
        return;
      }
      
      // Use simple "MToken" name for first token, otherwise prefix with symbol
      const contractName = token.symbol === TOKENS[0]?.symbol 
        ? "MToken" 
        : `MToken_${token.symbol}`;
      
      contracts[contractName] = {
        
        network: CONFIG.NETWORK.NAME,
        address: token.address,
        startBlock: CONFIG.BLOCKS.START_BLOCK,
      };
    });
  }
  
  // Add fallback if no valid tokens were processed
  if (Object.keys(contracts).length === 0) {
    console.warn('No valid tokens found, using fallback configuration');
    contracts["MToken"] = {
      network: CONFIG.NETWORK.NAME,
      address: CONFIG.ADDRESSES.FALLBACK_TOKEN,
      startBlock: CONFIG.BLOCKS.START_BLOCK,
    };
  }
  
  return contracts;
}

// Generate token contracts configuration
const tokenContracts = generateTokenContracts();

/**
 * Ponder configuration object
 */
export default createConfig({
  networks: {
    [CONFIG.NETWORK.NAME]: {
      chainId: CONFIG.NETWORK.CHAIN_ID,
      transport: http(process.env.PONDER_RPC_URL_8453),
    },
  },
  contracts: {
    // Aave main contract
    Aave: {
      abi: AaveAbi,
      network: CONFIG.NETWORK.NAME,
      address: CONFIG.ADDRESSES.AAVE,
      startBlock: CONFIG.BLOCKS.START_BLOCK,
    },
    // All token contracts
    ...tokenContracts,
  },
  blocks: {
    MarketParamsCheck: {
      network: CONFIG.NETWORK.NAME,
      startBlock: CONFIG.BLOCKS.START_BLOCK,
      interval: CONFIG.BLOCKS.INTERVAL,
    },
  },
  database: {
    // Use pglite for local development (SQLite-compatible version of PostgreSQL)
    kind: "pglite",
  },
});
