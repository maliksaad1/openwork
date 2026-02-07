/**
 * Treasury Management Module
 * Handles spend validation and Human Pilot oversight
 */

import { formatUnits } from 'viem';
import { getBaseClient } from './client';
import {
  type SpendRequest,
  type SpendResult,
  type OversightRequest,
  TREASURY_GUARDRAIL,
} from './types';

// In-memory oversight queue (replace with persistent storage in production)
const oversightQueue: Map<string, OversightRequest> = new Map();

export class TreasuryManager {
  private walletAddress: `0x${string}`;

  constructor(walletAddress: `0x${string}`) {
    this.walletAddress = walletAddress;
  }

  /**
   * Validate and process a spend request
   * Enforces the 5% Human Pilot oversight guardrail
   */
  async processSpend(request: SpendRequest): Promise<SpendResult> {
    const client = getBaseClient();
    const balance = await client.getTreasuryBalance(this.walletAddress);

    // Calculate percentage of treasury
    const spendPercentage = Number(request.amount) / Number(balance.openwork);

    // Check if oversight is required
    if (spendPercentage > TREASURY_GUARDRAIL.humanOversightThreshold) {
      const oversightRequest = this.createOversightRequest(request, spendPercentage);
      oversightQueue.set(oversightRequest.id, oversightRequest);

      return {
        success: false,
        requiresOversight: true,
        oversightReason: `Transaction exceeds ${TREASURY_GUARDRAIL.humanOversightThreshold * 100}% of treasury (${(spendPercentage * 100).toFixed(2)}%). Human Pilot signature required.`,
      };
    }

    // For transactions under threshold, return approval for execution
    // Note: Actual transaction execution requires wallet signing (not implemented in read-only client)
    return {
      success: true,
      requiresOversight: false,
    };
  }

  /**
   * Create an oversight request for Human Pilot review
   */
  private createOversightRequest(
    spendRequest: SpendRequest,
    treasuryPercentage: number
  ): OversightRequest {
    return {
      id: `oversight_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      spendRequest,
      treasuryPercentage,
      createdAt: new Date().toISOString(),
      status: 'PENDING',
    };
  }

  /**
   * Get pending oversight requests
   */
  getPendingOversight(): OversightRequest[] {
    return Array.from(oversightQueue.values()).filter(
      (req) => req.status === 'PENDING'
    );
  }

  /**
   * Approve an oversight request (Human Pilot action)
   */
  approveOversight(id: string, approverAddress: string): boolean {
    const request = oversightQueue.get(id);
    if (!request || request.status !== 'PENDING') {
      return false;
    }

    request.status = 'APPROVED';
    request.approvedBy = approverAddress;
    request.approvedAt = new Date().toISOString();
    oversightQueue.set(id, request);
    return true;
  }

  /**
   * Reject an oversight request (Human Pilot action)
   */
  rejectOversight(id: string, approverAddress: string): boolean {
    const request = oversightQueue.get(id);
    if (!request || request.status !== 'PENDING') {
      return false;
    }

    request.status = 'REJECTED';
    request.approvedBy = approverAddress;
    request.approvedAt = new Date().toISOString();
    oversightQueue.set(id, request);
    return true;
  }

  /**
   * Calculate ROI metrics for dashboard
   */
  async calculateROI(
    totalSpend: bigint,
    brandReachMetric: number
  ): Promise<{
    costPerReach: string;
    efficiency: number;
    recommendation: string;
  }> {
    const spendInTokens = Number(formatUnits(totalSpend, 18));

    if (spendInTokens === 0 || brandReachMetric === 0) {
      return {
        costPerReach: '0',
        efficiency: 0,
        recommendation: 'Insufficient data for ROI calculation',
      };
    }

    const costPerReach = (spendInTokens / brandReachMetric).toFixed(6);
    const efficiency = brandReachMetric / spendInTokens;

    let recommendation: string;
    if (efficiency > 1000) {
      recommendation = 'ACCELERATE: High efficiency distribution. Increase spend velocity.';
    } else if (efficiency > 100) {
      recommendation = 'MAINTAIN: Healthy ROI. Continue current distribution strategy.';
    } else if (efficiency > 10) {
      recommendation = 'OPTIMIZE: Review channel mix. Consider pivoting low-performers.';
    } else {
      recommendation = 'HALT: Poor ROI. Pause spending and reassess distribution strategy.';
    }

    return { costPerReach, efficiency, recommendation };
  }
}

// Factory function
export function createTreasuryManager(walletAddress: `0x${string}`): TreasuryManager {
  return new TreasuryManager(walletAddress);
}
