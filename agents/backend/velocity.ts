/**
 * Distribution Velocity Calculator
 * Tracks and scores brand reach momentum
 */

import type { IntelligenceOutput } from '@/lib/nvidia/types';

export interface VelocityMetrics {
  currentVelocity: number;
  velocityTrend: 'ACCELERATING' | 'STABLE' | 'DECELERATING';
  historicalAverage: number;
  projectedVelocity: number;
  confidenceInterval: [number, number];
}

export interface VelocityDataPoint {
  timestamp: string;
  velocity: number;
  sentiment: 'BULLISH' | 'NEUTRAL' | 'BEARISH';
}

// In-memory velocity history (replace with persistent storage in production)
const velocityHistory: VelocityDataPoint[] = [];
const MAX_HISTORY = 100;

export class VelocityTracker {
  /**
   * Record a velocity data point
   */
  record(output: IntelligenceOutput): void {
    velocityHistory.push({
      timestamp: output.timestamp,
      velocity: output.distributionVelocity,
      sentiment: output.sentiment.overall,
    });

    // Trim history
    if (velocityHistory.length > MAX_HISTORY) {
      velocityHistory.shift();
    }
  }

  /**
   * Calculate velocity metrics
   */
  getMetrics(): VelocityMetrics {
    if (velocityHistory.length === 0) {
      return {
        currentVelocity: 0,
        velocityTrend: 'STABLE',
        historicalAverage: 0,
        projectedVelocity: 0,
        confidenceInterval: [0, 0],
      };
    }

    const current = velocityHistory[velocityHistory.length - 1].velocity;
    const sum = velocityHistory.reduce((acc, dp) => acc + dp.velocity, 0);
    const average = sum / velocityHistory.length;

    // Calculate trend
    let trend: VelocityMetrics['velocityTrend'] = 'STABLE';
    if (velocityHistory.length >= 3) {
      const recent = velocityHistory.slice(-3);
      const recentAvg = recent.reduce((acc, dp) => acc + dp.velocity, 0) / 3;
      const olderAvg = average;

      if (recentAvg > olderAvg * 1.1) {
        trend = 'ACCELERATING';
      } else if (recentAvg < olderAvg * 0.9) {
        trend = 'DECELERATING';
      }
    }

    // Simple projection (linear extrapolation)
    let projected = current;
    if (velocityHistory.length >= 2) {
      const prev = velocityHistory[velocityHistory.length - 2].velocity;
      const delta = current - prev;
      projected = Math.min(100, Math.max(0, current + delta));
    }

    // Confidence interval (simplified)
    const stdDev = this.calculateStdDev(velocityHistory.map((dp) => dp.velocity));
    const confidence: [number, number] = [
      Math.max(0, projected - stdDev),
      Math.min(100, projected + stdDev),
    ];

    return {
      currentVelocity: current,
      velocityTrend: trend,
      historicalAverage: average,
      projectedVelocity: projected,
      confidenceInterval: confidence,
    };
  }

  /**
   * Get velocity history
   */
  getHistory(limit?: number): VelocityDataPoint[] {
    const slice = limit ? velocityHistory.slice(-limit) : velocityHistory;
    return [...slice];
  }

  /**
   * Calculate standard deviation
   */
  private calculateStdDev(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map((v) => Math.pow(v - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
    return Math.sqrt(variance);
  }

  /**
   * Clear history
   */
  reset(): void {
    velocityHistory.length = 0;
  }
}

// Singleton
let trackerInstance: VelocityTracker | null = null;

export function getVelocityTracker(): VelocityTracker {
  if (!trackerInstance) {
    trackerInstance = new VelocityTracker();
  }
  return trackerInstance;
}
