/**
 * AGENT_CONTRACT: Treasury Layer
 * Automated Brand Treasury Management
 */

import { getBaseClient } from '@/lib/base/client';
import { createTreasuryManager, TreasuryManager } from '@/lib/base/treasury';
import type { SpendRequest, SpendResult, OversightRequest } from '@/lib/base/types';
import { SpendRequestSchema, SpendResultSchema } from '@/lib/schemas/treasury.schema';

export interface TreasuryState {
  balance: {
    openwork: string;
    eth: string;
  };
  pendingOversight: OversightRequest[];
  recentTransactions: SpendResult[];
  lastUpdated: string;
}

export class TreasuryAgent {
  private manager: TreasuryManager;
  private walletAddress: `0x${string}`;
  private recentTransactions: SpendResult[] = [];

  constructor(walletAddress: `0x${string}`) {
    this.walletAddress = walletAddress;
    this.manager = createTreasuryManager(walletAddress);
  }

  /**
   * Get current treasury state
   */
  async getState(): Promise<TreasuryState> {
    const client = getBaseClient();
    const balance = await client.getTreasuryBalance(this.walletAddress);

    return {
      balance: {
        openwork: balance.openworkFormatted,
        eth: balance.ethFormatted,
      },
      pendingOversight: this.manager.getPendingOversight(),
      recentTransactions: this.recentTransactions.slice(-10),
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Process a spend request (hire skill, buy ad-space, etc.)
   */
  async spend(request: SpendRequest): Promise<SpendResult> {
    // Validate request
    const validated = SpendRequestSchema.parse({
      ...request,
      amount: request.amount.toString(),
    });

    // Process through treasury manager
    const result = await this.manager.processSpend({
      ...request,
      amount: BigInt(validated.amount),
    });

    // Validate and store result
    const parsed = SpendResultSchema.parse(result);
    const validatedResult: SpendResult = {
      success: parsed.success,
      requiresOversight: parsed.requiresOversight,
      txHash: parsed.txHash as `0x${string}` | undefined,
      error: parsed.error,
      oversightReason: parsed.oversightReason,
    };
    this.recentTransactions.push(validatedResult);

    return validatedResult;
  }

  /**
   * Hire a skill by spending $OPENWORK
   */
  async hireSkill(
    skillAddress: `0x${string}`,
    amount: bigint
  ): Promise<SpendResult> {
    return this.spend({
      type: 'HIRE_SKILL',
      amount,
      recipient: skillAddress,
      metadata: { skillType: 'external' },
    });
  }

  /**
   * Buy ad-space for distribution
   */
  async buyAdSpace(
    platformAddress: `0x${string}`,
    amount: bigint,
    campaignId?: string
  ): Promise<SpendResult> {
    return this.spend({
      type: 'BUY_AD_SPACE',
      amount,
      recipient: platformAddress,
      metadata: { campaignId },
    });
  }

  /**
   * Get pending oversight requests
   */
  getPendingOversight(): OversightRequest[] {
    return this.manager.getPendingOversight();
  }

  /**
   * Human Pilot approves oversight request
   */
  approveOversight(requestId: string, pilotAddress: string): boolean {
    return this.manager.approveOversight(requestId, pilotAddress);
  }

  /**
   * Human Pilot rejects oversight request
   */
  rejectOversight(requestId: string, pilotAddress: string): boolean {
    return this.manager.rejectOversight(requestId, pilotAddress);
  }

  /**
   * Calculate ROI for dashboard
   */
  async calculateROI(brandReachMetric: number): Promise<{
    costPerReach: string;
    efficiency: number;
    recommendation: string;
  }> {
    // Sum recent spend
    const totalSpend = this.recentTransactions
      .filter((t) => t.success)
      .reduce((sum) => sum + 1000n, 0n); // Placeholder - would track actual amounts

    return this.manager.calculateROI(totalSpend, brandReachMetric);
  }
}

// Factory function
export function createTreasuryAgent(walletAddress: `0x${string}`): TreasuryAgent {
  return new TreasuryAgent(walletAddress);
}
