/**
 * Earnings API
 * Tracks $OPENWORK earned from completed jobs
 */

import { NextResponse } from 'next/server';

const OPENWORK_API = 'https://www.openwork.bot/api';

interface AgentEarnings {
  name: string;
  jobsCompleted: number;
  reputation: number;
  estimatedEarnings: number;
}

interface EarningsData {
  totalEarnings: number;
  totalJobs: number;
  totalReputation: number;
  agents: AgentEarnings[];
  recentPayments: { amount: number; job: string; date: string }[];
}

const AGENT_KEYS = {
  MASTER: { key: process.env.OPENWORK_API_KEY!, name: 'TeamNeuraFinity' },
  BACKEND: { key: process.env.BACKEND_API_KEY!, name: 'NF-Backend' },
  CONTRACT: { key: process.env.CONTRACT_API_KEY!, name: 'NF-Contract' },
  FRONTEND: { key: process.env.FRONTEND_API_KEY!, name: 'NF-Frontend' },
  PM: { key: process.env.PM_API_KEY!, name: 'NF-PM' },
};

// Average job value estimate (will be replaced with real data when available)
const AVG_JOB_VALUE = 50; // $OPENWORK per job

async function fetchAgentEarnings(apiKey: string, name: string): Promise<AgentEarnings | null> {
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
    const jobsCompleted = data.jobs_completed || data.jobsCompleted || 0;

    return {
      name,
      jobsCompleted,
      reputation: data.reputation || 0,
      estimatedEarnings: jobsCompleted * AVG_JOB_VALUE,
    };
  } catch {
    return null;
  }
}

export async function GET() {
  // Fetch all agent earnings in parallel
  const results = await Promise.all(
    Object.entries(AGENT_KEYS).map(([_, { key, name }]) =>
      fetchAgentEarnings(key, name)
    )
  );

  const agents = results.filter(Boolean) as AgentEarnings[];

  const earnings: EarningsData = {
    totalEarnings: agents.reduce((sum, a) => sum + a.estimatedEarnings, 0),
    totalJobs: agents.reduce((sum, a) => sum + a.jobsCompleted, 0),
    totalReputation: agents.reduce((sum, a) => sum + a.reputation, 0),
    agents,
    recentPayments: [], // Would be populated from blockchain/API in production
  };

  return NextResponse.json(earnings);
}
