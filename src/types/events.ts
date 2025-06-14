/**
 * Event type definitions for the AAVE Protocol liquidations tracker
 */

export type Address = `0x${string}`;

export interface BorrowEvent {
    borrower: Address;
    borrowAmount: bigint;
    accountBorrows: bigint;
    totalBorrows: bigint;
}

export interface RepayBorrowEvent {
    payer: Address;
    borrower: Address;
    repayAmount: bigint;
    accountBorrows: bigint;
    totalBorrows: bigint;
}

export interface MintEvent {
    minter: Address;
    mintAmount: bigint;
    mintTokens: bigint;
}

export interface RedeemEvent {
    redeemer: Address;
    redeemAmount: bigint;
    redeemTokens: bigint;
}

export interface LiquidateBorrowEvent {
    liquidator: Address;
    borrower: Address;
    repayAmount: bigint;
    mTokenCollateral: Address;
    seizeTokens: bigint;
}

export interface AaveLiquidationCallEvent {
    collateralAsset: Address;
    debtAsset: Address;
    user: Address;
    debtToCover: bigint;
    liquidatedCollateralAmount: bigint;
    liquidator: Address;
    receiveAToken: boolean;
}

export type EventType = 'Mint' | 'Redeem' | 'Borrow' | 'RepayBorrow' | 'LiquidateBorrow';

export interface IndexedEvent {
    type: EventType;
    user: Address;
    token: string;
    tokenAddress: Address;
    amount: bigint;
    tokenAmount?: bigint;
    relatedAddress?: Address;
    blockNumber: bigint;
    blockTimestamp: bigint;
    transactionHash: Address;
    logIndex: number;
}

export interface BlockInfo {
    number: bigint;
    timestamp: bigint;
}

export interface TransactionInfo {
    hash: Address;
}

export interface LogInfo {
    logIndex: number;
}

export interface EventContext {
    event: {
        args: LiquidateBorrowEvent | AaveLiquidationCallEvent;
        block: BlockInfo;
        transaction: TransactionInfo;
        log: LogInfo;
    };
    context: unknown;
} 
