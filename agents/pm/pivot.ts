/**
 * Pivot Execution Module
 * Handles strategy pivots and transitions
 */

import type { PivotRecommendation } from '@/lib/nvidia/types';
import type { DistributionStrategy } from './strategy';

export interface PivotEvent {
  id: string;
  timestamp: string;
  fromStrategy: string;
  toStrategy: string;
  recommendation: PivotRecommendation;
  status: 'PENDING' | 'EXECUTING' | 'COMPLETED' | 'FAILED';
  metrics: {
    velocityBefore: number;
    velocityAfter?: number;
    executionTimeMs?: number;
  };
}

export interface PivotPlan {
  steps: PivotStep[];
  estimatedImpact: {
    velocityChange: number;
    budgetReallocation: number;
    channelChanges: number;
  };
  rollbackPlan: PivotStep[];
}

export interface PivotStep {
  order: number;
  action: string;
  target: string;
  params: Record<string, unknown>;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
}

// Pivot history
const pivotHistory: PivotEvent[] = [];

export class PivotController {
  /**
   * Create a pivot plan based on recommendation
   */
  createPlan(
    recommendation: PivotRecommendation,
    currentStrategy: DistributionStrategy
  ): PivotPlan {
    const steps: PivotStep[] = [];
    const rollbackSteps: PivotStep[] = [];

    switch (recommendation.action) {
      case 'ACCELERATE':
        steps.push({
          order: 1,
          action: 'INCREASE_BUDGET',
          target: 'budget.dailyBurn',
          params: { multiplier: 1.5 },
          status: 'PENDING',
        });
        steps.push({
          order: 2,
          action: 'SCALE_TOP_CHANNELS',
          target: 'channels',
          params: { topN: 2, scalePercent: 20 },
          status: 'PENDING',
        });
        rollbackSteps.push({
          order: 1,
          action: 'DECREASE_BUDGET',
          target: 'budget.dailyBurn',
          params: { multiplier: 0.67 },
          status: 'PENDING',
        });
        break;

      case 'PIVOT':
        steps.push({
          order: 1,
          action: 'PAUSE_UNDERPERFORMERS',
          target: 'channels',
          params: { threshold: 0.5 },
          status: 'PENDING',
        });
        steps.push({
          order: 2,
          action: 'REALLOCATE_BUDGET',
          target: 'channels',
          params: { newChannels: recommendation.suggestedChannels },
          status: 'PENDING',
        });
        steps.push({
          order: 3,
          action: 'ACTIVATE_NEW_CHANNELS',
          target: 'channels',
          params: { channels: recommendation.suggestedChannels },
          status: 'PENDING',
        });
        break;

      case 'HALT':
        steps.push({
          order: 1,
          action: 'PAUSE_ALL_CHANNELS',
          target: 'channels',
          params: {},
          status: 'PENDING',
        });
        steps.push({
          order: 2,
          action: 'SET_STATUS',
          target: 'strategy',
          params: { status: 'PAUSED' },
          status: 'PENDING',
        });
        break;

      case 'MAINTAIN':
        steps.push({
          order: 1,
          action: 'OPTIMIZE_EXISTING',
          target: 'channels',
          params: { adjustmentRange: 0.1 },
          status: 'PENDING',
        });
        break;
    }

    return {
      steps,
      estimatedImpact: this.estimateImpact(recommendation, currentStrategy),
      rollbackPlan: rollbackSteps,
    };
  }

  /**
   * Estimate impact of pivot
   */
  private estimateImpact(
    recommendation: PivotRecommendation,
    strategy: DistributionStrategy
  ): PivotPlan['estimatedImpact'] {
    let velocityChange = 0;
    let budgetReallocation = 0;
    let channelChanges = 0;

    switch (recommendation.action) {
      case 'ACCELERATE':
        velocityChange = 15;
        budgetReallocation = strategy.budget.remaining * 0.5;
        break;
      case 'PIVOT':
        velocityChange = 25;
        budgetReallocation = strategy.budget.remaining * 0.8;
        channelChanges = (recommendation.suggestedChannels?.length ?? 0);
        break;
      case 'HALT':
        velocityChange = -50;
        break;
      case 'MAINTAIN':
        velocityChange = 5;
        budgetReallocation = strategy.budget.remaining * 0.1;
        break;
    }

    return { velocityChange, budgetReallocation, channelChanges };
  }

  /**
   * Execute a pivot plan
   */
  async execute(plan: PivotPlan, strategyId: string): Promise<PivotEvent> {
    const event: PivotEvent = {
      id: `pivot_${Date.now()}`,
      timestamp: new Date().toISOString(),
      fromStrategy: strategyId,
      toStrategy: strategyId, // Updated during execution
      recommendation: { action: 'MAINTAIN', rationale: '', urgency: 'LOW' },
      status: 'EXECUTING',
      metrics: {
        velocityBefore: 0,
      },
    };

    const startTime = Date.now();

    try {
      for (const step of plan.steps) {
        step.status = 'COMPLETED';
        // In production, actually execute each step
      }

      event.status = 'COMPLETED';
      event.metrics.executionTimeMs = Date.now() - startTime;
    } catch (error) {
      event.status = 'FAILED';
      event.metrics.executionTimeMs = Date.now() - startTime;
    }

    pivotHistory.push(event);
    return event;
  }

  /**
   * Get pivot history
   */
  getHistory(limit?: number): PivotEvent[] {
    const slice = limit ? pivotHistory.slice(-limit) : pivotHistory;
    return [...slice];
  }

  /**
   * Get last pivot
   */
  getLastPivot(): PivotEvent | null {
    return pivotHistory.length > 0 ? pivotHistory[pivotHistory.length - 1] : null;
  }
}

// Singleton
let controllerInstance: PivotController | null = null;

export function getPivotController(): PivotController {
  if (!controllerInstance) {
    controllerInstance = new PivotController();
  }
  return controllerInstance;
}
