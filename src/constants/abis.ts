/**
 * ABI definitions for smart contracts
 */

export const ORACLE_ABI = [
    {
        inputs: [],
        name: "oracle",
        outputs: [{ name: "", type: "address" }],
        stateMutability: "view",
        type: "function"
    }
] as const;

export const PRICE_ORACLE_ABI = [
    {
        inputs: [{ name: 'mToken', type: 'address' }],
        name: 'getUnderlyingPrice',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    }
] as const;

export const AAVE_ORACLE_ABI = [
    {
        inputs: [{ internalType: "address", name: "asset", type: "address" }],
        name: "getAssetPrice",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [{ internalType: "address[]", name: "assets", type: "address[]" }],
        name: "getAssetsPrices",
        outputs: [{ internalType: "uint256[]", name: "", type: "uint256[]" }],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [],
        name: "BASE_CURRENCY",
        outputs: [{ internalType: "address", name: "", type: "address" }],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [],
        name: "BASE_CURRENCY_UNIT",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function"
    }
] as const; 