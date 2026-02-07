'use client';

import { useState, useEffect, useRef } from 'react';

interface Agent {
  name: string;
  status: string;
  jobsCompleted: number;
  reputation: number;
}

interface Job {
  id: string;
  title: string;
  reward: number;
  tags: string[];
  bestAgent: string;
  createdAt?: string;
}

interface Bid {
  id: string;
  jobTitle: string;
  agent: string;
  bidAmount: number;
  status: string;
  message: string;
  timestamp?: string;
}

interface Stats {
  totalReputation: number;
  pendingCount: number;
  failedCount: number;
  submittedCount: number;
}

interface EngineStatus {
  isRunning: boolean;
  cycleCount: number;
  lastCycle: string | null;
  nextCycleIn: number;
  uptime: number;
  message: string;
  lastResult?: {
    success: boolean;
    totalJobs: number;
    openJobs: number;
    submissionsSuccessful: number;
    submissionsFailed: number;
    timestamp: string;
    message: string;
  };
}

interface ActivityLog {
  id: string;
  type: 'info' | 'success' | 'error' | 'warning' | 'submit';
  message: string;
  detail?: string;
  timestamp: Date;
}

// Format relative time
function timeAgo(dateString?: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

// Agent specialty badges
const AGENT_BADGES: Record<string, { role: string; color: string }> = {
  'NF-Backend': { role: 'API & Automation', color: 'bg-blue-500/20 text-blue-400' },
  'NF-Contract': { role: 'Smart Contracts', color: 'bg-purple-500/20 text-purple-400' },
  'NF-Frontend': { role: 'UI Development', color: 'bg-pink-500/20 text-pink-400' },
  'NF-PM': { role: 'Research & Strategy', color: 'bg-amber-500/20 text-amber-400' },
};

export default function Dashboard() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [bids, setBids] = useState<Bid[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [wallet, setWallet] = useState('0');
  const [engineStatus, setEngineStatus] = useState<EngineStatus | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);
  const [isControlling, setIsControlling] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);
  const prevCycleCount = useRef(0);

  // Add to activity log
  const addLog = (type: ActivityLog['type'], message: string, detail?: string) => {
    const entry: ActivityLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type,
      message,
      detail,
      timestamp: new Date(),
    };
    setActivityLog(prev => [entry, ...prev].slice(0, 100)); // Keep last 100 entries
  };

  // Count jobs won from bids with "won" status
  const jobsWon = bids.filter(b => b.status === 'won').length;

  const loadData = async () => {
    const [statsRes, jobsRes, bidsRes, treasuryRes] = await Promise.all([
      fetch('/api/stats'),
      fetch('/api/opportunities'),
      fetch('/api/bids'),
      fetch('/api/treasury'),
    ]);

    if (statsRes.ok) {
      const d = await statsRes.json();
      setAgents((d.agents || []).filter((a: Agent) => a.name.startsWith('NF-')));
      setStats({
        totalReputation: d.totalReputation || 0,
        pendingCount: d.pendingCount || 0,
        failedCount: d.failedCount || 0,
        submittedCount: d.submittedCount || 0,
      });
    }
    if (jobsRes.ok) {
      const d = await jobsRes.json();
      setJobs(d.opportunities || []);
    }
    if (bidsRes.ok) {
      const d = await bidsRes.json();
      setBids(d.bids || []);
    }
    if (treasuryRes.ok) {
      const d = await treasuryRes.json();
      setWallet(d.balanceFormatted || '0');
    }
    setLastUpdate(new Date());
  };

  const loadEngineStatus = async () => {
    try {
      const res = await fetch('/api/autopilot/control');
      if (res.ok) {
        const status = await res.json();
        setEngineStatus(status);

        // Log new cycles
        if (status.cycleCount > prevCycleCount.current && status.lastResult) {
          const result = status.lastResult;
          if (result.success) {
            addLog('info', `Cycle #${status.cycleCount} completed`,
              `${result.submissionsSuccessful} submissions, ${result.openJobs} open jobs`);
          } else {
            addLog('error', `Cycle #${status.cycleCount} failed`, result.message);
          }
        }
        prevCycleCount.current = status.cycleCount;
      }
    } catch {
      // Ignore errors
    }
  };

  const controlEngine = async (action: 'start' | 'stop') => {
    setIsControlling(true);
    try {
      const res = await fetch('/api/autopilot/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();

      if (action === 'stop') {
        addLog('warning', 'Auto-Pilot force stopped', data.message);
      } else {
        addLog('info', 'Auto-Pilot started', data.message);
      }

      await loadEngineStatus();
    } catch (error) {
      addLog('error', 'Control failed', error instanceof Error ? error.message : 'Unknown error');
    }
    setIsControlling(false);
  };

  useEffect(() => {
    addLog('info', 'Dashboard initialized', 'NeuraFinity Squadron ready');
    loadData();
    loadEngineStatus();

    // Poll for data updates every 30 seconds
    const dataInterval = setInterval(loadData, 30000);

    // Poll for engine status every 5 seconds (for countdown)
    const statusInterval = setInterval(loadEngineStatus, 5000);

    return () => {
      clearInterval(dataInterval);
      clearInterval(statusInterval);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isRunning = engineStatus?.isRunning ?? false;
  const nextCycleIn = engineStatus?.nextCycleIn ?? 0;
  const cycleCount = engineStatus?.cycleCount ?? 0;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-gray-100">
      {/* Header */}
      <header className="border-b border-gray-800/50 bg-[#0d0d14]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-lg">
              NF
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">NeuraFinity</h1>
              <p className="text-xs text-gray-500">Autonomous AI Squadron</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            {isRunning && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
                <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
                <span className="text-sm text-cyan-400 font-medium">Auto-Pilot Active</span>
                {nextCycleIn > 0 && (
                  <span className="text-xs text-cyan-400/70 font-mono">
                    ({Math.floor(nextCycleIn / 60)}:{(nextCycleIn % 60).toString().padStart(2, '0')})
                  </span>
                )}
              </div>
            )}
            {!isRunning && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 rounded-lg border border-red-500/20">
                <span className="w-2 h-2 bg-red-400 rounded-full" />
                <span className="text-sm text-red-400 font-medium">Auto-Pilot Stopped</span>
              </div>
            )}
            <div className="text-right">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Treasury</p>
              <p className="font-mono text-lg">{wallet} <span className="text-cyan-400">$OPEN</span></p>
            </div>
            {lastUpdate && (
              <div className="text-xs text-gray-600">
                Updated {timeAgo(lastUpdate.toISOString())}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-5 gap-4 mb-8">
          <div className="bg-[#12121a] rounded-xl p-5 border border-gray-800/50">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Jobs Won</p>
            <p className="text-3xl font-mono font-semibold text-cyan-400">{jobsWon}</p>
          </div>
          <div className="bg-[#12121a] rounded-xl p-5 border border-gray-800/50">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Available</p>
            <p className="text-3xl font-mono font-semibold text-emerald-400">{jobs.length}</p>
          </div>
          <div className="bg-[#12121a] rounded-xl p-5 border border-gray-800/50">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Pending</p>
            <p className="text-3xl font-mono font-semibold text-amber-400">{stats?.pendingCount || 0}</p>
          </div>
          <div className="bg-[#12121a] rounded-xl p-5 border border-gray-800/50">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Total Bids</p>
            <p className="text-3xl font-mono font-semibold text-gray-300">{stats?.submittedCount || 0}</p>
          </div>
          <div className="bg-[#12121a] rounded-xl p-5 border border-gray-800/50">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Reputation</p>
            <p className="text-3xl font-mono font-semibold text-purple-400">{stats?.totalReputation || 0}</p>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Left Column - Squadron */}
          <div className="col-span-4">
            <div className="bg-[#12121a] rounded-xl border border-gray-800/50 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-800/50">
                <h2 className="font-semibold">Squadron</h2>
                <p className="text-xs text-gray-500 mt-1">4 specialized AI agents</p>
              </div>
              <div className="p-4 space-y-3">
                {agents.map((agent) => {
                  const badge = AGENT_BADGES[agent.name] || { role: 'Agent', color: 'bg-gray-500/20 text-gray-400' };
                  return (
                    <div key={agent.name} className="p-4 bg-[#0a0a0f] rounded-lg border border-gray-800/30">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${agent.status === 'active' ? 'bg-emerald-400 shadow-lg shadow-emerald-400/50' : 'bg-gray-600'}`} />
                          <span className="font-medium">{agent.name}</span>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${badge.color}`}>
                          {badge.role}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">{agent.reputation} reputation</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="p-4 border-t border-gray-800/50">
                {isRunning ? (
                  <button
                    onClick={() => controlEngine('stop')}
                    disabled={isControlling}
                    className="w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 shadow-lg shadow-red-500/20 disabled:opacity-50"
                  >
                    {isControlling ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Stopping...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                        </svg>
                        Force Stop
                      </span>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={() => controlEngine('start')}
                    disabled={isControlling}
                    className="w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-lg shadow-cyan-500/20 disabled:opacity-50"
                  >
                    {isControlling ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Starting...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Start Auto-Pilot
                      </span>
                    )}
                  </button>
                )}
                <p className="text-xs text-gray-600 text-center mt-2">
                  {isRunning
                    ? `Cycle #${cycleCount} | Next in ${Math.floor(nextCycleIn / 60)}:${(nextCycleIn % 60).toString().padStart(2, '0')}`
                    : 'Auto-Pilot runs automatically on server start'}
                </p>
              </div>
            </div>

            {/* Activity Log */}
            <div className="bg-[#12121a] rounded-xl border border-gray-800/50 overflow-hidden mt-6">
              <div className="px-5 py-4 border-b border-gray-800/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold">Live Activity</h2>
                  {isRunning && (
                    <span className="flex items-center gap-1 text-xs text-cyan-400">
                      <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
                      Active
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-600">Cycle #{cycleCount}</span>
              </div>
              <div ref={logRef} className="max-h-[300px] overflow-y-auto">
                {activityLog.length === 0 ? (
                  <div className="px-5 py-8 text-center text-gray-600">
                    <p className="text-sm">No activity yet</p>
                    <p className="text-xs mt-1">Auto-Pilot runs automatically</p>
                  </div>
                ) : (
                  activityLog.map((log) => (
                    <div
                      key={log.id}
                      className={`px-4 py-3 border-b border-gray-800/30 flex items-start gap-3 ${
                        log.type === 'success' ? 'bg-emerald-500/5' :
                        log.type === 'error' ? 'bg-red-500/5' :
                        log.type === 'warning' ? 'bg-amber-500/5' : ''
                      }`}
                    >
                      <div className="mt-0.5">
                        {log.type === 'success' && (
                          <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                        {log.type === 'error' && (
                          <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )}
                        {log.type === 'warning' && (
                          <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        )}
                        {log.type === 'info' && (
                          <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-200">{log.message}</p>
                        {log.detail && (
                          <p className="text-xs text-gray-500 mt-0.5 truncate">{log.detail}</p>
                        )}
                      </div>
                      <span className="text-xs text-gray-600 whitespace-nowrap">
                        {log.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Jobs & Submissions */}
          <div className="col-span-8 space-y-6">
            {/* Available Jobs */}
            <div className="bg-[#12121a] rounded-xl border border-gray-800/50 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-800/50 flex items-center justify-between">
                <div>
                  <h2 className="font-semibold">Available Jobs</h2>
                  <p className="text-xs text-gray-500 mt-1">Matching opportunities from Openwork</p>
                </div>
                <span className="text-xs px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full font-mono">
                  {jobs.length} jobs
                </span>
              </div>
              <div className="max-h-[340px] overflow-y-auto">
                {jobs.length === 0 ? (
                  <div className="px-5 py-8 text-center text-gray-500">
                    <p>No jobs available</p>
                    <p className="text-xs mt-1">Jobs will appear here when fetched from Openwork</p>
                  </div>
                ) : (
                  jobs.slice(0, 20).map((job) => (
                    <div key={job.id} className="px-5 py-4 border-b border-gray-800/30 hover:bg-[#0a0a0f]/50 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{job.title}</p>
                          <div className="flex items-center gap-3 mt-2">
                            {job.tags.slice(0, 3).map((tag) => (
                              <span key={tag} className="text-xs text-gray-500">#{tag}</span>
                            ))}
                            <span className="text-xs text-cyan-400">{job.bestAgent}</span>
                            {job.createdAt && (
                              <span className="text-xs text-gray-600">{timeAgo(job.createdAt)}</span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-mono text-emerald-400 font-semibold">
                            {job.reward.toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-500">$OPEN</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Recent Submissions */}
            {bids.length > 0 && (
              <div className="bg-[#12121a] rounded-xl border border-gray-800/50 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-800/50 flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold">Recent Submissions</h2>
                    <p className="text-xs text-gray-500 mt-1">Bids awaiting poster selection</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs px-2 py-1 bg-amber-500/10 text-amber-400 rounded-full">
                      {stats?.pendingCount || 0} pending
                    </span>
                    {(stats?.failedCount || 0) > 0 && (
                      <span className="text-xs px-2 py-1 bg-red-500/10 text-red-400 rounded-full">
                        {stats?.failedCount} failed
                      </span>
                    )}
                  </div>
                </div>
                <div className="max-h-[280px] overflow-y-auto">
                  {bids.slice(0, 20).map((bid) => (
                    <div
                      key={bid.id}
                      className={`px-5 py-4 border-b border-gray-800/30 ${
                        bid.status === 'pending' ? 'border-l-2 border-l-amber-500' :
                        bid.status === 'failed' ? 'border-l-2 border-l-red-500 opacity-60' :
                        bid.status === 'won' ? 'border-l-2 border-l-emerald-500' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="truncate">{bid.jobTitle}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-cyan-400">{bid.agent}</span>
                            {bid.timestamp && (
                              <span className="text-xs text-gray-600">submitted {timeAgo(bid.timestamp)}</span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-mono">{bid.bidAmount.toLocaleString()}</p>
                          <p className={`text-xs ${
                            bid.status === 'pending' ? 'text-amber-400' :
                            bid.status === 'failed' ? 'text-red-400' :
                            bid.status === 'won' ? 'text-emerald-400' : 'text-gray-500'
                          }`}>
                            {bid.status}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800/50 mt-12">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between text-xs text-gray-600">
          <span>NeuraFinity Squadron - Powered by Claude</span>
          <span>$OPEN on Base Network</span>
        </div>
      </footer>
    </div>
  );
}
