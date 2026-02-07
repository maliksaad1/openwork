'use client';

/**
 * Real Stats Component
 * Shows actual performance data from Openwork
 */

import { useState, useEffect } from 'react';

interface AgentStats {
  name: string;
  reputation: number;
  jobsCompleted: number;
  status: string;
}

interface StatsData {
  totalReputation: number;
  totalJobsCompleted: number;
  agentCount: number;
  activeAgents: number;
  agents: AgentStats[];
  availableJobs: number;
  topJobBudget: number;
  submittedCount: number;
  pendingCount: number;
  failedCount: number;
}

export function RealStats() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="bg-neurafinity-navy-light rounded-lg border border-neurafinity-slate p-6">
        <h3 className="text-lg font-semibold text-neurafinity-silver-light mb-4">
          Team Stats
        </h3>
        <div className="animate-pulse space-y-3">
          <div className="h-16 bg-neurafinity-navy rounded" />
          <div className="h-16 bg-neurafinity-navy rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-neurafinity-navy-light rounded-lg border border-neurafinity-slate p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-neurafinity-silver-light">
          Team Stats
        </h3>
        <button
          onClick={fetchStats}
          className="text-xs text-neurafinity-electric hover:underline"
        >
          Refresh
        </button>
      </div>

      {/* Main stats - 3 column layout */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {/* Jobs Done (Won) */}
        <div className="bg-neurafinity-navy rounded-lg p-4 border border-neurafinity-slate">
          <p className="text-xs text-neurafinity-silver mb-1 uppercase tracking-wide">Jobs Done</p>
          <p className="text-3xl font-mono text-neurafinity-electric">
            {stats?.totalJobsCompleted || 0}
          </p>
        </div>

        {/* Available Jobs */}
        <div className="bg-neurafinity-navy rounded-lg p-4 border border-neurafinity-slate">
          <p className="text-xs text-neurafinity-silver mb-1 uppercase tracking-wide">Available</p>
          <p className="text-3xl font-mono text-green-400">
            {stats?.availableJobs || 0}
          </p>
        </div>

        {/* Submitted (Pending) */}
        <div className="bg-neurafinity-navy rounded-lg p-4 border border-neurafinity-slate">
          <p className="text-xs text-neurafinity-silver mb-1 uppercase tracking-wide">Submitted</p>
          <p className="text-3xl font-mono text-yellow-400">
            {stats?.pendingCount || 0}
          </p>
        </div>
      </div>

      {/* Secondary stats row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {/* Reputation */}
        <div className="bg-neurafinity-navy rounded-lg p-3 border border-neurafinity-slate">
          <p className="text-xs text-neurafinity-silver-dark">Reputation</p>
          <p className="text-xl font-mono text-neurafinity-silver-light">
            {stats?.totalReputation || 0}
          </p>
        </div>

        {/* Top Bounty */}
        <div className="bg-neurafinity-navy rounded-lg p-3 border border-neurafinity-slate">
          <p className="text-xs text-neurafinity-silver-dark">Top Bounty</p>
          <p className="text-xl font-mono text-purple-400">
            {(stats?.topJobBudget || 0).toLocaleString()}
          </p>
        </div>

        {/* Failed */}
        <div className="bg-neurafinity-navy rounded-lg p-3 border border-neurafinity-slate">
          <p className="text-xs text-neurafinity-silver-dark">Failed</p>
          <p className="text-xl font-mono text-red-400">
            {stats?.failedCount || 0}
          </p>
        </div>
      </div>

      {/* Agent breakdown */}
      <div className="border-t border-neurafinity-slate pt-4">
        <p className="text-sm font-semibold text-neurafinity-silver mb-3">
          Agent Performance
        </p>
        <div className="space-y-2">
          {stats?.agents.filter(a => a.name.startsWith('NF-')).map((agent, index) => (
            <div
              key={index}
              className="flex items-center justify-between py-2 px-3 bg-neurafinity-navy rounded"
            >
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    agent.status === 'active' ? 'bg-green-400' : 'bg-gray-400'
                  }`}
                />
                <span className="text-sm text-neurafinity-silver-light">
                  {agent.name}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="text-neurafinity-electric">
                  {agent.reputation} rep
                </span>
                <span className="text-green-400">
                  {agent.jobsCompleted} won
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default RealStats;
