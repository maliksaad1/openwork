/**
 * Zod Schemas for Agent Communication
 * Prevents "Hallucination Drift" between agents
 */

import { z } from 'zod';

// Agent identification
export const AgentIdSchema = z.enum([
  'AGENT_BACKEND',
  'AGENT_CONTRACT',
  'AGENT_FRONTEND',
  'AGENT_PM',
]);

export type AgentId = z.infer<typeof AgentIdSchema>;

// Agent status
export const AgentStatusSchema = z.enum([
  'ACTIVE',
  'IDLE',
  'PROCESSING',
  'ERROR',
  'SYNCING',
]);

export type AgentStatus = z.infer<typeof AgentStatusSchema>;

// Agent heartbeat
export const AgentHeartbeatSchema = z.object({
  agentId: AgentIdSchema,
  status: AgentStatusSchema,
  lastActivity: z.string().datetime(),
  currentTask: z.string().optional(),
  metrics: z.object({
    requestsProcessed: z.number().int().nonnegative(),
    errorsEncountered: z.number().int().nonnegative(),
    averageResponseMs: z.number().nonnegative(),
  }).optional(),
});

export type AgentHeartbeat = z.infer<typeof AgentHeartbeatSchema>;

// Inter-agent message
export const AgentMessageSchema = z.object({
  id: z.string().uuid(),
  from: AgentIdSchema,
  to: AgentIdSchema,
  type: z.enum(['REQUEST', 'RESPONSE', 'EVENT', 'ERROR']),
  payload: z.unknown(),
  timestamp: z.string().datetime(),
  correlationId: z.string().uuid().optional(),
});

export type AgentMessage = z.infer<typeof AgentMessageSchema>;

// Squadron status (all agents)
export const SquadronStatusSchema = z.object({
  timestamp: z.string().datetime(),
  agents: z.array(AgentHeartbeatSchema),
  overallHealth: z.enum(['HEALTHY', 'DEGRADED', 'CRITICAL']),
});

export type SquadronStatus = z.infer<typeof SquadronStatusSchema>;
