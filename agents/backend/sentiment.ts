/**
 * Sentiment Analysis Module
 * Aggregates and tracks market sentiment
 */

import type { SentimentAnalysis } from '@/lib/nvidia/types';

export interface SentimentTrend {
  current: SentimentAnalysis;
  previous: SentimentAnalysis | null;
  change: 'IMPROVING' | 'STABLE' | 'DECLINING';
  movingAverage: number;
}

export interface SentimentSource {
  name: string;
  weight: number;
  sentiment: SentimentAnalysis;
  timestamp: string;
}

// Sentiment history
const sentimentHistory: SentimentAnalysis[] = [];
const MAX_HISTORY = 50;

export class SentimentAggregator {
  private sources: Map<string, SentimentSource> = new Map();

  /**
   * Add a sentiment source
   */
  addSource(name: string, sentiment: SentimentAnalysis, weight: number = 1): void {
    this.sources.set(name, {
      name,
      weight,
      sentiment,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Calculate weighted aggregate sentiment
   */
  getAggregate(): SentimentAnalysis {
    if (this.sources.size === 0) {
      return { overall: 'NEUTRAL', score: 0, drivers: [] };
    }

    let totalWeight = 0;
    let weightedScore = 0;
    const allDrivers: string[] = [];

    for (const source of Array.from(this.sources.values())) {
      totalWeight += source.weight;
      weightedScore += source.sentiment.score * source.weight;
      allDrivers.push(...source.sentiment.drivers);
    }

    const avgScore = weightedScore / totalWeight;

    let overall: SentimentAnalysis['overall'];
    if (avgScore > 0.2) overall = 'BULLISH';
    else if (avgScore < -0.2) overall = 'BEARISH';
    else overall = 'NEUTRAL';

    // Deduplicate drivers
    const uniqueDrivers = Array.from(new Set(allDrivers));

    return {
      overall,
      score: avgScore,
      drivers: uniqueDrivers,
    };
  }

  /**
   * Record sentiment and get trend
   */
  recordAndGetTrend(sentiment: SentimentAnalysis): SentimentTrend {
    const previous = sentimentHistory.length > 0
      ? sentimentHistory[sentimentHistory.length - 1]
      : null;

    sentimentHistory.push(sentiment);
    if (sentimentHistory.length > MAX_HISTORY) {
      sentimentHistory.shift();
    }

    // Calculate moving average
    const scores = sentimentHistory.map((s) => s.score);
    const movingAverage = scores.reduce((a, b) => a + b, 0) / scores.length;

    // Determine change
    let change: SentimentTrend['change'] = 'STABLE';
    if (previous) {
      const delta = sentiment.score - previous.score;
      if (delta > 0.1) change = 'IMPROVING';
      else if (delta < -0.1) change = 'DECLINING';
    }

    return {
      current: sentiment,
      previous,
      change,
      movingAverage,
    };
  }

  /**
   * Get sentiment history
   */
  getHistory(limit?: number): SentimentAnalysis[] {
    const slice = limit ? sentimentHistory.slice(-limit) : sentimentHistory;
    return [...slice];
  }

  /**
   * Get all sources
   */
  getSources(): SentimentSource[] {
    return Array.from(this.sources.values());
  }

  /**
   * Clear sources
   */
  clearSources(): void {
    this.sources.clear();
  }
}

// Singleton
let aggregatorInstance: SentimentAggregator | null = null;

export function getSentimentAggregator(): SentimentAggregator {
  if (!aggregatorInstance) {
    aggregatorInstance = new SentimentAggregator();
  }
  return aggregatorInstance;
}
