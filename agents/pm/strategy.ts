/**
 * AGENT_PM: Distribution Architect
 * Strategy Engine for distribution optimization
 */

import type { IntelligenceOutput, PivotRecommendation } from '@/lib/nvidia/types';
import type { VelocityMetrics } from '@/agents/backend/velocity';

export interface StrategyState {
  currentStrategy: DistributionStrategy;
  velocityThresholds: VelocityThresholds;
  activePivot: PivotRecommendation | null;
  lastEvaluation: string;
}

export interface DistributionStrategy {
  id: string;
  name: string;
  channels: DistributionChannel[];
  budget: BudgetAllocation;
  status: 'ACTIVE' | 'PAUSED' | 'EVALUATING';
  startedAt: string;
}

export interface DistributionChannel {
  id: string;
  name: string;
  type: 'ORGANIC' | 'PAID' | 'PARTNERSHIP' | 'VIRAL';
  allocationPercent: number;
  performance: ChannelPerformance;
}

export interface ChannelPerformance {
  reach: number;
  engagement: number;
  conversion: number;
  roi: number;
}

export interface BudgetAllocation {
  total: number;
  spent: number;
  remaining: number;
  dailyBurn: number;
}

export interface VelocityThresholds {
  accelerate: number; // Above this, accelerate
  maintain: number; // Above this, maintain
  pivot: number; // Above this, consider pivot
  halt: number; // Below this, halt
}

const DEFAULT_THRESHOLDS: VelocityThresholds = {
  accelerate: 80,
  maintain: 50,
  pivot: 25,
  halt: 10,
};

export class StrategyEngine {
  private currentStrategy: DistributionStrategy | null = null;
  private thresholds: VelocityThresholds;

  constructor(thresholds?: Partial<VelocityThresholds>) {
    this.thresholds = { ...DEFAULT_THRESHOLDS, ...thresholds };
  }

  /**
   * Initialize a new distribution strategy
   */
  initializeStrategy(
    name: string,
    channels: Omit<DistributionChannel, 'performance'>[],
    totalBudget: number
  ): DistributionStrategy {
    this.currentStrategy = {
      id: `strategy_${Date.now()}`,
      name,
      channels: channels.map((ch) => ({
        ...ch,
        performance: { reach: 0, engagement: 0, conversion: 0, roi: 0 },
      })),
      budget: {
        total: totalBudget,
        spent: 0,
        remaining: totalBudget,
        dailyBurn: 0,
      },
      status: 'ACTIVE',
      startedAt: new Date().toISOString(),
    };

    return this.currentStrategy;
  }

  /**
   * Evaluate current strategy based on intelligence
   */
  evaluate(intelligence: IntelligenceOutput, velocity: VelocityMetrics): {
    recommendation: PivotRecommendation;
    shouldPivot: boolean;
    urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  } {
    const v = velocity.currentVelocity;
    let shouldPivot = false;
    let urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';

    // Use intelligence pivot recommendation if available
    if (intelligence.pivotRecommendation) {
      const rec = intelligence.pivotRecommendation;

      // Determine if we should actually pivot
      if (rec.action === 'PIVOT' || rec.action === 'HALT') {
        shouldPivot = true;
        urgency = rec.urgency;
      }

      return { recommendation: rec, shouldPivot, urgency };
    }

    // Fallback to velocity-based evaluation
    let action: PivotRecommendation['action'];
    if (v >= this.thresholds.accelerate) {
      action = 'ACCELERATE';
      urgency = 'HIGH';
    } else if (v >= this.thresholds.maintain) {
      action = 'MAINTAIN';
      urgency = 'MEDIUM';
    } else if (v >= this.thresholds.pivot) {
      action = 'PIVOT';
      shouldPivot = true;
      urgency = 'HIGH';
    } else {
      action = 'HALT';
      shouldPivot = true;
      urgency = 'CRITICAL';
    }

    return {
      recommendation: {
        action,
        rationale: `Velocity at ${v.toFixed(1)}%, trend: ${velocity.velocityTrend}`,
        urgency,
      },
      shouldPivot,
      urgency,
    };
  }

  /**
   * Execute a strategy pivot
   */
  executePivot(recommendation: PivotRecommendation): DistributionStrategy | null {
    if (!this.currentStrategy) return null;

    switch (recommendation.action) {
      case 'ACCELERATE':
        // Increase budget allocation
        this.currentStrategy.budget.dailyBurn *= 1.5;
        break;

      case 'MAINTAIN':
        // No changes needed
        break;

      case 'PIVOT':
        // Reallocate to suggested channels
        if (recommendation.suggestedChannels) {
          this.reallocateChannels(recommendation.suggestedChannels);
        }
        break;

      case 'HALT':
        // Pause strategy
        this.currentStrategy.status = 'PAUSED';
        break;
    }

    return this.currentStrategy;
  }

  /**
   * Reallocate budget to new channels
   */
  private reallocateChannels(newChannels: string[]): void {
    if (!this.currentStrategy) return;

    // Equal distribution to new channels
    const perChannel = 100 / newChannels.length;

    this.currentStrategy.channels = newChannels.map((name, i) => ({
      id: `channel_${i}`,
      name,
      type: 'ORGANIC' as const,
      allocationPercent: perChannel,
      performance: { reach: 0, engagement: 0, conversion: 0, roi: 0 },
    }));
  }

  /**
   * Get current strategy
   */
  getCurrentStrategy(): DistributionStrategy | null {
    return this.currentStrategy;
  }

  /**
   * Get thresholds
   */
  getThresholds(): VelocityThresholds {
    return { ...this.thresholds };
  }

  /**
   * Update thresholds
   */
  updateThresholds(updates: Partial<VelocityThresholds>): void {
    this.thresholds = { ...this.thresholds, ...updates };
  }
}

// Singleton
let engineInstance: StrategyEngine | null = null;

export function getStrategyEngine(): StrategyEngine {
  if (!engineInstance) {
    engineInstance = new StrategyEngine();
  }
  return engineInstance;
}
