'use client';

/**
 * AGENT_FRONTEND: Squadron Heartbeat Component
 * Live status indicators for all 4 agents
 */

import { useState, useEffect } from 'react';

type AgentId = 'AGENT_BACKEND' | 'AGENT_CONTRACT' | 'AGENT_FRONTEND' | 'AGENT_PM';
type AgentStatus = 'ACTIVE' | 'IDLE' | 'PROCESSING' | 'ERROR' | 'SYNCING';

interface AgentState {
  id: AgentId;
  name: string;
  module: string;
  status: AgentStatus;
  lastActivity: string;
  currentTask?: string;
  metrics?: {
    requestsProcessed: number;
    errorsEncountered: number;
    averageResponseMs: number;
  };
}

interface SquadronHeartbeatProps {
  agents?: AgentState[];
  lastHeartbeat?: string;
  nextHeartbeat?: string;
  isConnected?: boolean;
}

const DEFAULT_AGENTS: AgentState[] = [
  {
    id: 'AGENT_BACKEND',
    name: 'Brain',
    module: 'AI Analysis & Research',
    status: 'IDLE',
    lastActivity: new Date().toISOString(),
  },
  {
    id: 'AGENT_CONTRACT',
    name: 'Wallet',
    module: 'Money & Payments',
    status: 'IDLE',
    lastActivity: new Date().toISOString(),
  },
  {
    id: 'AGENT_FRONTEND',
    name: 'Dashboard',
    module: 'Display & Reports',
    status: 'ACTIVE',
    lastActivity: new Date().toISOString(),
  },
  {
    id: 'AGENT_PM',
    name: 'Manager',
    module: 'Strategy & Planning',
    status: 'IDLE',
    lastActivity: new Date().toISOString(),
  },
];

export function SquadronHeartbeat({
  agents = DEFAULT_AGENTS,
  lastHeartbeat,
  nextHeartbeat,
  isConnected = true,
}: SquadronHeartbeatProps) {
  const [pulsePhase, setPulsePhase] = useState(0);

  // Heartbeat animation
  useEffect(() => {
    const interval = setInterval(() => {
      setPulsePhase((prev) => (prev + 1) % 4);
    }, 375); // 1.5s / 4 phases
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: AgentStatus): string => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-agent-active';
      case 'PROCESSING':
        return 'bg-agent-syncing';
      case 'SYNCING':
        return 'bg-agent-syncing';
      case 'ERROR':
        return 'bg-agent-error';
      case 'IDLE':
      default:
        return 'bg-agent-idle';
    }
  };

  const getStatusText = (status: AgentStatus): string => {
    switch (status) {
      case 'ACTIVE':
        return 'ONLINE';
      case 'PROCESSING':
        return 'PROCESSING';
      case 'SYNCING':
        return 'SYNCING';
      case 'ERROR':
        return 'ERROR';
      case 'IDLE':
      default:
        return 'STANDBY';
    }
  };

  const getAgentIcon = (id: AgentId): string => {
    switch (id) {
      case 'AGENT_BACKEND':
        return '🧠';
      case 'AGENT_CONTRACT':
        return '💎';
      case 'AGENT_FRONTEND':
        return '📊';
      case 'AGENT_PM':
        return '🎯';
    }
  };

  const activeCount = agents.filter(
    (a) => a.status === 'ACTIVE' || a.status === 'PROCESSING'
  ).length;

  const overallHealth =
    activeCount >= 3
      ? 'HEALTHY'
      : activeCount >= 2
      ? 'DEGRADED'
      : 'CRITICAL';

  return (
    <div className="bg-neurafinity-navy-light rounded-lg border border-neurafinity-slate p-6">
      {/* Header with overall status */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div
            className={`
              w-4 h-4 rounded-full
              ${overallHealth === 'HEALTHY' ? 'bg-neurafinity-electric' : ''}
              ${overallHealth === 'DEGRADED' ? 'bg-velocity-medium' : ''}
              ${overallHealth === 'CRITICAL' ? 'bg-velocity-critical' : ''}
              ${isConnected ? 'animate-heartbeat' : ''}
            `}
          />
          <h3 className="text-lg font-semibold text-neurafinity-silver-light">
            Squadron Heartbeat
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`
              text-xs font-mono px-2 py-1 rounded
              ${overallHealth === 'HEALTHY' ? 'bg-neurafinity-electric-glow text-neurafinity-electric' : ''}
              ${overallHealth === 'DEGRADED' ? 'bg-velocity-medium/20 text-velocity-medium' : ''}
              ${overallHealth === 'CRITICAL' ? 'bg-velocity-critical/20 text-velocity-critical' : ''}
            `}
          >
            {overallHealth}
          </span>
        </div>
      </div>

      {/* Connection status */}
      {!isConnected && (
        <div className="mb-4 p-3 bg-velocity-critical/10 border border-velocity-critical rounded-lg">
          <p className="text-sm text-velocity-critical">
            Connection lost. Attempting to reconnect...
          </p>
        </div>
      )}

      {/* Agent grid */}
      <div className="grid grid-cols-2 gap-4">
        {agents.map((agent, index) => (
          <div
            key={agent.id}
            className={`
              relative bg-neurafinity-navy rounded-lg p-4 border transition-all duration-300
              ${agent.status === 'ACTIVE' || agent.status === 'PROCESSING'
                ? 'border-neurafinity-electric shadow-electric'
                : 'border-neurafinity-slate'
              }
              ${pulsePhase === index ? 'scale-[1.02]' : 'scale-100'}
            `}
          >
            {/* Status indicator */}
            <div className="absolute top-3 right-3 flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${getStatusColor(agent.status)} ${
                  agent.status === 'PROCESSING' || agent.status === 'SYNCING'
                    ? 'animate-pulse'
                    : ''
                }`}
              />
              <span
                className={`text-xs font-mono ${
                  agent.status === 'ERROR'
                    ? 'text-agent-error'
                    : agent.status === 'ACTIVE'
                    ? 'text-agent-active'
                    : 'text-agent-idle'
                }`}
              >
                {getStatusText(agent.status)}
              </span>
            </div>

            {/* Agent info */}
            <div className="flex items-start gap-3">
              <span className="text-2xl">{getAgentIcon(agent.id)}</span>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-neurafinity-silver-light">
                  {agent.name}
                </h4>
                <p className="text-xs text-neurafinity-silver truncate">
                  {agent.module}
                </p>

                {/* Current task */}
                {agent.currentTask && (
                  <p className="mt-2 text-xs text-neurafinity-electric truncate">
                    → {agent.currentTask}
                  </p>
                )}

                {/* Metrics */}
                {agent.metrics && (
                  <div className="mt-3 flex gap-3 text-xs">
                    <span className="text-neurafinity-silver">
                      {agent.metrics.requestsProcessed} req
                    </span>
                    <span className="text-neurafinity-silver-dark">
                      {agent.metrics.averageResponseMs}ms avg
                    </span>
                    {agent.metrics.errorsEncountered > 0 && (
                      <span className="text-velocity-low">
                        {agent.metrics.errorsEncountered} err
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Heartbeat timing */}
      <div className="mt-6 pt-4 border-t border-neurafinity-slate flex items-center justify-between text-xs">
        <div className="flex items-center gap-4">
          <span className="text-neurafinity-silver">
            Last sync:{' '}
            <span className="font-mono text-neurafinity-silver-light">
              {lastHeartbeat
                ? new Date(lastHeartbeat).toLocaleTimeString()
                : 'Never'}
            </span>
          </span>
          <span className="text-neurafinity-silver">
            Next:{' '}
            <span className="font-mono text-neurafinity-electric">
              {nextHeartbeat
                ? new Date(nextHeartbeat).toLocaleTimeString()
                : '--:--'}
            </span>
          </span>
        </div>
        <span className="text-neurafinity-silver-dark">
          {activeCount}/4 agents active
        </span>
      </div>
    </div>
  );
}

export default SquadronHeartbeat;
