import { createConfig } from "ponder";
import { http } from "viem";

import { AaveAbi } from "./abis/Aave";
import { TOKENS } from "./src/tokens";


const START_BLOCK = 28281660; // Adjust as needed

// Aave contract address
const AAVE_ADDRESS = "0xA238Dd80C259a72e81d7e4664a9801593F98d1c5";

// Define the type for contract configuration
type ContractConfig = {
  abi: typeof AaveAbi;
  network: string;
  address: `0x${string}`;
  startBlock: number;
};

// Create contract configurations for each token
const tokenContracts: Record<string, ContractConfig> = {};

// Ensure TOKENS is defined and has at least one entry


export default createConfig({
  networks: {
    base: {
      chainId: 8453,
      transport: http(process.env.PONDER_RPC_URL_8453),
    },
  },
  contracts: {

    Aave: {
      abi: AaveAbi,
      network: "base",
      address: AAVE_ADDRESS,
      startBlock: START_BLOCK,
    },
    // Spread the token contracts into the configuration
    ...tokenContracts,
  },
  blocks: {
    MarketParamsCheck: {
      network: "base",
      startBlock: START_BLOCK,
      interval: 60, // e.g. re-check every 60 blocks
    },
  },
  database: {
    // Use pglite for local development (SQLite-compatible version of PostgreSQL)
    kind: "pglite",
  },
});
