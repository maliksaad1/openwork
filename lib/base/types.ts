/**
 * Base Network / $OPENWORK Treasury Type Definitions
 */

export interface TreasuryConfig {
  rpcUrl: string;
  chainId: number;
  contracts: ContractAddresses;
  walletAddress: string;
}

export interface ContractAddresses {
  OPENWORK: `0x${string}`;
  MCV2_Bond: `0x${string}`;
  MCV2_Token: `0x${string}`;
  MCV2_ZapV1: `0x${string}`;
}

export interface TreasuryBalance {
  openwork: bigint;
  openworkFormatted: string;
  eth: bigint;
  ethFormatted: string;
  timestamp: string;
}

export interface SpendRequest {
  type: 'HIRE_SKILL' | 'BUY_AD_SPACE' | 'MINT_TOKEN' | 'BURN_TOKEN';
  amount: bigint;
  recipient: `0x${string}`;
  metadata?: Record<string, unknown>;
}

export interface SpendResult {
  success: boolean;
  txHash?: `0x${string}`;
  error?: string;
  requiresOversight: boolean;
  oversightReason?: string;
}

export interface OversightRequest {
  id: string;
  spendRequest: SpendRequest;
  treasuryPercentage: number;
  createdAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  approvedBy?: string;
  approvedAt?: string;
}

export interface TokenParams {
  name: string;
  symbol: string;
}

export interface BondParams {
  mintRoyalty: number; // basis points (100 = 1%)
  burnRoyalty: number; // basis points
  reserveToken: `0x${string}`;
  maxSupply: bigint;
  stepRanges: bigint[];
  stepPrices: bigint[];
}

export interface MintRequest {
  tokenAddress: `0x${string}`;
  tokensToMint: bigint;
  maxReserveAmount: bigint;
  receiver: `0x${string}`;
}

export interface BurnRequest {
  tokenAddress: `0x${string}`;
  tokensToBurn: bigint;
  minRefund: bigint;
  receiver: `0x${string}`;
}

// Base Network constants
export const BASE_CHAIN_ID = 8453;

export const CONTRACTS: ContractAddresses = {
  OPENWORK: '0x299c30DD5974BF4D5bFE42C340Ca40462816AB07',
  MCV2_Bond: '0xc5a076cad94176c2996B32d8466Be1cE757FAa27',
  MCV2_Token: '0xAa70bC79fD1cB4a6FBA717018351F0C3c64B79Df',
  MCV2_ZapV1: '0x91523b39813F3F4E406ECe406D0bEAaA9dE251fa',
};

export const TREASURY_GUARDRAIL = {
  humanOversightThreshold: 0.05, // 5%
  minimumBalance: 100000n * 10n ** 18n, // 100K $OPENWORK
};
