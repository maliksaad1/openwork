/**
 * Live Agent Status API
 * Fetches real-time status of all 4 squadron agents from Openwork
 */

import { NextResponse } from 'next/server';

const AGENT_KEYS = {
  AGENT_BACKEND: process.env.BACKEND_API_KEY,
  AGENT_CONTRACT: process.env.CONTRACT_API_KEY,
  AGENT_FRONTEND: process.env.FRONTEND_API_KEY,
  AGENT_PM: process.env.PM_API_KEY,
};

const AGENT_META = {
  AGENT_BACKEND: { name: 'Intelligence', module: 'Kimi k2.5 Deep Reasoning' },
  AGENT_CONTRACT: { name: 'Treasury', module: '$OPENWORK Management' },
  AGENT_FRONTEND: { name: 'Mission Control', module: 'Dashboard & Visualization' },
  AGENT_PM: { name: 'Distribution', module: 'Strategy Engine' },
};

type AgentStatus = 'ACTIVE' | 'IDLE' | 'PROCESSING' | 'ERROR' | 'SYNCING';

interface AgentState {
  id: string;
  name: string;
  module: string;
  status: AgentStatus;
  lastActivity: string;
  openworkId?: string;
  reputation?: number;
}

async function fetchAgentStatus(agentId: string, apiKey: string | undefined): Promise<AgentState> {
  const meta = AGENT_META[agentId as keyof typeof AGENT_META];

  if (!apiKey) {
    return {
      id: agentId,
      name: meta.name,
      module: meta.module,
      status: 'ERROR',
      lastActivity: new Date().toISOString(),
    };
  }

  try {
    const response = await fetch('https://www.openwork.bot/api/agents/me', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      return {
        id: agentId,
        name: meta.name,
        module: meta.module,
        status: 'ERROR',
        lastActivity: new Date().toISOString(),
      };
    }

    const data = await response.json();

    // Determine status based on Openwork data
    let status: AgentStatus = 'IDLE';

    if (data.status === 'active') {
      // Check if recently active (within last 5 minutes)
      const lastSeen = new Date(data.last_seen || data.lastSeen || Date.now());
      const minutesAgo = (Date.now() - lastSeen.getTime()) / 1000 / 60;

      if (minutesAgo < 5) {
        status = 'ACTIVE';
      } else if (minutesAgo < 30) {
        status = 'IDLE';
      } else {
        status = 'IDLE';
      }
    }

    return {
      id: agentId,
      name: meta.name,
      module: meta.module,
      status,
      lastActivity: data.last_seen || data.lastSeen || new Date().toISOString(),
      openworkId: data.id,
      reputation: data.reputation,
    };
  } catch (error) {
    console.error(`Error fetching ${agentId} status:`, error);
    return {
      id: agentId,
      name: meta.name,
      module: meta.module,
      status: 'ERROR',
      lastActivity: new Date().toISOString(),
    };
  }
}

export async function GET() {
  // Fetch all agent statuses in parallel
  const statuses = await Promise.all([
    fetchAgentStatus('AGENT_BACKEND', AGENT_KEYS.AGENT_BACKEND),
    fetchAgentStatus('AGENT_CONTRACT', AGENT_KEYS.AGENT_CONTRACT),
    fetchAgentStatus('AGENT_FRONTEND', AGENT_KEYS.AGENT_FRONTEND),
    fetchAgentStatus('AGENT_PM', AGENT_KEYS.AGENT_PM),
  ]);

  // Frontend agent is always ACTIVE when dashboard is running
  const frontendIndex = statuses.findIndex(s => s.id === 'AGENT_FRONTEND');
  if (frontendIndex !== -1) {
    statuses[frontendIndex].status = 'ACTIVE';
  }

  const activeCount = statuses.filter(s => s.status === 'ACTIVE').length;

  return NextResponse.json({
    agents: statuses,
    activeCount,
    totalAgents: 4,
    health: activeCount >= 3 ? 'HEALTHY' : activeCount >= 2 ? 'DEGRADED' : 'CRITICAL',
    timestamp: new Date().toISOString(),
  });
}

// POST to activate/ping all agents
export async function POST() {
  const results: Record<string, boolean> = {};

  for (const [agentId, apiKey] of Object.entries(AGENT_KEYS)) {
    if (!apiKey) {
      results[agentId] = false;
      continue;
    }

    try {
      // Ping the agent by making a request to update last_seen
      const response = await fetch('https://www.openwork.bot/api/agents/me', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'active',
        }),
      });

      results[agentId] = response.ok;
    } catch {
      results[agentId] = false;
    }
  }

  return NextResponse.json({
    message: 'Agent activation complete',
    results,
    timestamp: new Date().toISOString(),
  });
}
