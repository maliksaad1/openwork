/**
 * Zod Schemas for Treasury Layer Communication
 * AGENT_CONTRACT output validation
 */

import { z } from 'zod';

// Ethereum address validation
const EthAddressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address');

// Treasury balance
export const TreasuryBalanceSchema = z.object({
  openwork: z.string(), // BigInt as string for JSON
  openworkFormatted: z.string(),
  eth: z.string(),
  ethFormatted: z.string(),
  timestamp: z.string().datetime(),
});

export type TreasuryBalance = z.infer<typeof TreasuryBalanceSchema>;

// Spend request types
export const SpendTypeSchema = z.enum([
  'HIRE_SKILL',
  'BUY_AD_SPACE',
  'MINT_TOKEN',
  'BURN_TOKEN',
]);

// Spend request
export const SpendRequestSchema = z.object({
  type: SpendTypeSchema,
  amount: z.string(), // BigInt as string
  recipient: EthAddressSchema,
  metadata: z.record(z.unknown()).optional(),
});

export type SpendRequest = z.infer<typeof SpendRequestSchema>;

// Spend result
export const SpendResultSchema = z.object({
  success: z.boolean(),
  txHash: EthAddressSchema.optional(),
  error: z.string().optional(),
  requiresOversight: z.boolean(),
  oversightReason: z.string().optional(),
});

export type SpendResult = z.infer<typeof SpendResultSchema>;

// Oversight request
export const OversightStatusSchema = z.enum(['PENDING', 'APPROVED', 'REJECTED', 'EXPIRED']);

export const OversightRequestSchema = z.object({
  id: z.string(),
  spendRequest: SpendRequestSchema,
  treasuryPercentage: z.number().min(0).max(1),
  createdAt: z.string().datetime(),
  status: OversightStatusSchema,
  approvedBy: z.string().optional(),
  approvedAt: z.string().datetime().optional(),
});

export type OversightRequest = z.infer<typeof OversightRequestSchema>;

// ROI metrics
export const ROIMetricsSchema = z.object({
  costPerReach: z.string(),
  efficiency: z.number().nonnegative(),
  recommendation: z.string(),
  totalSpend: z.string(),
  brandReach: z.number().nonnegative(),
});

export type ROIMetrics = z.infer<typeof ROIMetricsSchema>;

// Bonding curve token params
export const TokenParamsSchema = z.object({
  name: z.string().min(1).max(64),
  symbol: z.string().min(1).max(8),
});

export const BondParamsSchema = z.object({
  mintRoyalty: z.number().int().min(0).max(10000), // basis points
  burnRoyalty: z.number().int().min(0).max(10000),
  reserveToken: EthAddressSchema,
  maxSupply: z.string(), // BigInt as string
  stepRanges: z.array(z.string()),
  stepPrices: z.array(z.string()),
});

export type TokenParams = z.infer<typeof TokenParamsSchema>;
export type BondParams = z.infer<typeof BondParamsSchema>;
