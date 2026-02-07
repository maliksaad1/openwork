/**
 * Real Stats API
 * Fetches actual performance data from Openwork agents
 */

import { NextResponse } from 'next/server';

const OPENWORK_API = 'https://www.openwork.bot/api';

const AGENT_KEYS = {
  MASTER: process.env.OPENWORK_API_KEY!,
  BACKEND: process.env.BACKEND_API_KEY!,
  CONTRACT: process.env.CONTRACT_API_KEY!,
  FRONTEND: process.env.FRONTEND_API_KEY!,
  PM: process.env.PM_API_KEY!,
};

interface AgentStats {
  name: string;
  reputation: number;
  jobsCompleted: number;
  status: string;
}

interface OverallStats {
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
  timestamp: string;
}

async function fetchAgentData(apiKey: string): Promise<AgentStats | null> {
  try {
    const response = await fetch(`${OPENWORK_API}/agents/me`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) return null;

    const data = await response.json();
    return {
      name: data.name,
      reputation: data.reputation || 0,
      jobsCompleted: data.jobs_completed || data.jobsCompleted || 0,
      status: data.status || 'unknown',
    };
  } catch {
    return null;
  }
}

async function fetchJobCount(apiKey: string): Promise<{ count: number; topBudget: number }> {
  try {
    const response = await fetch(`${OPENWORK_API}/jobs/match`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) return { count: 0, topBudget: 0 };

    const data = await response.json();
    const jobs = data.jobs || data || [];
    const topBudget = jobs.length > 0
      ? Math.max(...jobs.map((j: { budget?: number; reward?: number }) => j.budget || j.reward || 0))
      : 0;

    return { count: jobs.length, topBudget };
  } catch {
    return { count: 0, topBudget: 0 };
  }
}

async function fetchBidStats(): Promise<{ total: number; pending: number; failed: number }> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/bids`);
    if (!response.ok) return { total: 0, pending: 0, failed: 0 };

    const data = await response.json();
    return {
      total: data.stats?.total || 0,
      pending: data.stats?.pending || 0,
      failed: data.stats?.failed || 0,
    };
  } catch {
    return { total: 0, pending: 0, failed: 0 };
  }
}

export async function GET() {
  // Fetch all agent data in parallel
  const [master, backend, contract, frontend, pm, jobs, bidStats] = await Promise.all([
    fetchAgentData(AGENT_KEYS.MASTER),
    fetchAgentData(AGENT_KEYS.BACKEND),
    fetchAgentData(AGENT_KEYS.CONTRACT),
    fetchAgentData(AGENT_KEYS.FRONTEND),
    fetchAgentData(AGENT_KEYS.PM),
    fetchJobCount(AGENT_KEYS.MASTER),
    fetchBidStats(),
  ]);

  const agents = [master, backend, contract, frontend, pm].filter(Boolean) as AgentStats[];

  const stats: OverallStats = {
    totalReputation: agents.reduce((sum, a) => sum + a.reputation, 0),
    totalJobsCompleted: agents.reduce((sum, a) => sum + a.jobsCompleted, 0),
    agentCount: agents.length,
    activeAgents: agents.filter(a => a.status === 'active').length,
    agents,
    availableJobs: jobs.count,
    topJobBudget: jobs.topBudget,
    submittedCount: bidStats.total,
    pendingCount: bidStats.pending,
    failedCount: bidStats.failed,
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(stats);
}
