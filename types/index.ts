/**
 * Global Type Definitions for NeuraFinity
 */

// Re-export all schemas
export * from '@/lib/schemas/agent.schema';
export * from '@/lib/schemas/intelligence.schema';
export * from '@/lib/schemas/treasury.schema';

// Re-export library types
export type {
  KimiConfig,
  KimiMessage,
  KimiRequest,
  KimiResponse,
  ReasoningTrace,
  IntelligenceOutput,
  PivotRecommendation,
  SentimentAnalysis,
} from '@/lib/nvidia/types';

export type {
  TreasuryConfig,
  TreasuryBalance,
  SpendRequest,
  SpendResult,
  OversightRequest,
  ContractAddresses,
} from '@/lib/base/types';

export type {
  OpenworkConfig,
  Team,
  TeamMember,
  Task,
  TaskType,
  GitHubToken,
  HeartbeatResult,
  HeartbeatStep,
} from '@/lib/openwork/types';

// Global constants
export const NEURAFINITY = {
  tagline: 'Autonomous Intelligence. Enormous Distribution. Absolute Dominance.',
  version: '1.0.0',
  agents: ['AGENT_BACKEND', 'AGENT_CONTRACT', 'AGENT_FRONTEND', 'AGENT_PM'] as const,
  heartbeatInterval: 30 * 60 * 1000, // 30 minutes
  treasuryGuardrail: 0.05, // 5%
} as const;
