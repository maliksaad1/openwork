'use client';

/**
 * AGENT_FRONTEND: ROI Dashboard Component
 * Real-time tracking of $OPENWORK spend vs. Brand Reach
 */

import { useState, useEffect } from 'react';

interface ROIMetrics {
  totalSpend: string;
  brandReach: number;
  costPerReach: string;
  efficiency: number;
  recommendation: string;
}

interface SpendEntry {
  timestamp: string;
  amount: string;
  type: string;
  reach: number;
}

interface ROIDashboardProps {
  metrics?: ROIMetrics;
  spendHistory?: SpendEntry[];
  treasuryBalance?: string;
  isLoading?: boolean;
}

export function ROIDashboard({
  metrics,
  spendHistory = [],
  treasuryBalance = '0',
  isLoading = false,
}: ROIDashboardProps) {
  const [animatedEfficiency, setAnimatedEfficiency] = useState(0);

  // Animate efficiency number
  useEffect(() => {
    if (metrics?.efficiency) {
      const target = metrics.efficiency;
      const duration = 1000;
      const steps = 60;
      const increment = target / steps;
      let current = 0;

      const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
          setAnimatedEfficiency(target);
          clearInterval(timer);
        } else {
          setAnimatedEfficiency(current);
        }
      }, duration / steps);

      return () => clearInterval(timer);
    }
  }, [metrics?.efficiency]);

  const getEfficiencyColor = (efficiency: number): string => {
    if (efficiency > 1000) return 'text-neurafinity-electric';
    if (efficiency > 100) return 'text-velocity-medium';
    if (efficiency > 10) return 'text-neurafinity-silver';
    return 'text-velocity-low';
  };

  const getRecommendationStyle = (recommendation: string): string => {
    if (recommendation.startsWith('ACCELERATE')) {
      return 'bg-neurafinity-electric-glow border-neurafinity-electric text-neurafinity-electric';
    }
    if (recommendation.startsWith('MAINTAIN')) {
      return 'bg-velocity-medium/10 border-velocity-medium text-velocity-medium';
    }
    if (recommendation.startsWith('OPTIMIZE')) {
      return 'bg-neurafinity-silver/10 border-neurafinity-silver text-neurafinity-silver';
    }
    return 'bg-velocity-low/10 border-velocity-low text-velocity-low';
  };

  if (isLoading) {
    return (
      <div className="bg-neurafinity-navy-light rounded-lg border border-neurafinity-slate p-6 animate-pulse">
        <div className="h-6 bg-neurafinity-slate rounded w-1/3 mb-4" />
        <div className="grid grid-cols-3 gap-4">
          <div className="h-20 bg-neurafinity-slate rounded" />
          <div className="h-20 bg-neurafinity-slate rounded" />
          <div className="h-20 bg-neurafinity-slate rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-neurafinity-navy-light rounded-lg border border-neurafinity-slate p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-neurafinity-silver-light">
          ROI Dashboard
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-neurafinity-silver">Treasury:</span>
          <span className="font-mono text-neurafinity-electric">
            {parseFloat(treasuryBalance).toLocaleString()} $OPENWORK
          </span>
        </div>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {/* Total Spend */}
        <div className="bg-neurafinity-navy rounded-lg p-4 border border-neurafinity-slate">
          <p className="text-xs text-neurafinity-silver mb-1">Total Spend</p>
          <p className="text-2xl font-mono text-neurafinity-silver-light">
            {metrics?.totalSpend ?? '0'}
          </p>
          <p className="text-xs text-neurafinity-silver-dark mt-1">$OPENWORK</p>
        </div>

        {/* Brand Reach */}
        <div className="bg-neurafinity-navy rounded-lg p-4 border border-neurafinity-slate">
          <p className="text-xs text-neurafinity-silver mb-1">Brand Reach</p>
          <p className="text-2xl font-mono text-neurafinity-electric">
            {(metrics?.brandReach ?? 0).toLocaleString()}
          </p>
          <p className="text-xs text-neurafinity-silver-dark mt-1">impressions</p>
        </div>

        {/* Efficiency */}
        <div className="bg-neurafinity-navy rounded-lg p-4 border border-neurafinity-slate">
          <p className="text-xs text-neurafinity-silver mb-1">Efficiency</p>
          <p className={`text-2xl font-mono ${getEfficiencyColor(animatedEfficiency)}`}>
            {animatedEfficiency.toFixed(1)}x
          </p>
          <p className="text-xs text-neurafinity-silver-dark mt-1">reach/spend</p>
        </div>
      </div>

      {/* Cost per reach */}
      <div className="mb-6 p-4 bg-neurafinity-navy rounded-lg border border-neurafinity-slate">
        <div className="flex items-center justify-between">
          <span className="text-sm text-neurafinity-silver">Cost per Reach</span>
          <span className="font-mono text-lg text-neurafinity-silver-light">
            {metrics?.costPerReach ?? '0'} $OPENWORK
          </span>
        </div>
        <div className="mt-2 h-2 bg-neurafinity-slate rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-neurafinity-electric to-velocity-medium transition-all duration-1000"
            style={{
              width: `${Math.min((animatedEfficiency / 1000) * 100, 100)}%`,
            }}
          />
        </div>
      </div>

      {/* Recommendation */}
      {metrics?.recommendation && (
        <div
          className={`p-4 rounded-lg border ${getRecommendationStyle(metrics.recommendation)}`}
        >
          <p className="text-xs font-semibold mb-1">RECOMMENDATION</p>
          <p className="text-sm">{metrics.recommendation}</p>
        </div>
      )}

      {/* Recent spend history */}
      {spendHistory.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-semibold text-neurafinity-silver mb-3">
            Recent Activity
          </h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {spendHistory.slice(-5).map((entry, index) => (
              <div
                key={index}
                className="flex items-center justify-between py-2 px-3 bg-neurafinity-navy rounded text-sm"
              >
                <div className="flex items-center gap-3">
                  <span className="text-neurafinity-electric font-mono">
                    {entry.amount}
                  </span>
                  <span className="text-neurafinity-silver-dark">{entry.type}</span>
                </div>
                <span className="text-neurafinity-silver">
                  +{entry.reach.toLocaleString()} reach
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ROIDashboard;
