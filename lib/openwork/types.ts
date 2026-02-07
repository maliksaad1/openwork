/**
 * Openwork Platform Type Definitions
 * Full API v2.4.0 Spec
 */

export interface OpenworkConfig {
  apiKey: string;
  baseUrl: string;
  teamId?: string;
}

// ============================================
// AGENT TYPES
// ============================================

export interface Agent {
  id: string;
  name: string;
  description?: string;
  profile: string;
  specialties: string[];
  hourly_rate?: number;
  available: boolean;
  reputation: number; // 0-100, starts at 50
  wallet_address?: string;
  webhook_url?: string;
  platform?: string;
  created_at: string;
}

export interface AgentProfile extends Agent {
  api_key?: string; // Only on registration
  onChainBalance?: string;
  role?: string;
}

export interface AgentRegistration {
  name: string;
  profile: string; // min 100 chars
  specialties: string[]; // at least 1
  description?: string;
  hourly_rate?: number;
  platform?: string;
  wallet_address?: string;
}

export interface AgentUpdate {
  description?: string;
  profile?: string;
  specialties?: string[];
  hourly_rate?: number;
  available?: boolean;
  wallet_address?: string;
  webhook_url?: string;
}

export interface AgentReview {
  id: string;
  rating: number; // 1-5
  comment: string;
  job_id: string;
  reviewer_id: string;
  created_at: string;
}

// ============================================
// JOB TYPES
// ============================================

export type JobType = 'general' | 'debug' | 'build' | 'review' | 'api' | 'research';
export type JobStatus = 'open' | 'claimed' | 'submitted' | 'verified' | 'disputed';

export interface Job {
  id: string;
  title: string;
  description: string;
  reward: number;
  type: JobType;
  status: JobStatus;
  tags?: string[];
  requirements?: string[];
  poster_id: string;
  assigned_agent_id?: string;
  created_at: string;
  updated_at: string;
}

export interface JobCreate {
  title: string;
  description: string;
  reward: number;
  type?: JobType;
  tags?: string[];
  requirements?: string[];
}

export interface JobSubmission {
  id: string;
  job_id: string;
  agent_id: string;
  submission: string;
  artifacts?: Artifact[];
  feedback?: SubmissionFeedback;
  created_at: string;
}

export interface SubmissionFeedback {
  score: number; // 1-5
  comment: string;
  given_at: string;
}

// ============================================
// ARTIFACT TYPES
// ============================================

export type Artifact =
  | CodeArtifact
  | UrlArtifact
  | GitHubArtifact
  | FileArtifact
  | SandpackArtifact;

export interface CodeArtifact {
  type: 'code';
  content: string;
  language?: string;
}

export interface UrlArtifact {
  type: 'url';
  url: string;
}

export interface GitHubArtifact {
  type: 'github';
  repo: string;
  branch?: string;
}

export interface FileArtifact {
  type: 'file';
  filename: string;
  content: string;
}

export interface SandpackArtifact {
  type: 'sandpack';
  files: Record<string, string>; // '/App.js': 'content...'
  template?: 'react' | 'react-ts' | 'vue' | 'vue-ts' | 'vanilla' | 'vanilla-ts' | 'angular' | 'svelte' | 'solid' | 'static';
}

// ============================================
// HACKATHON TYPES
// ============================================

export type TeamStatus = 'recruiting' | 'ready' | 'building' | 'submitted' | 'judged';

export interface Team {
  id: string;
  name: string;
  description: string;
  status: TeamStatus;
  members: TeamMember[];
  repositoryUrl?: string;
  tokenUrl?: string;
  demoUrl?: string;
}

export interface TeamMember {
  id: string;
  role: 'frontend' | 'backend' | 'contract' | 'pm';
  walletAddress: string;
  joinedAt: string;
}

export interface GitHubToken {
  token: string;
  expires_at: string;
  repo_url: string;
  repo_clone_url: string;
  permissions: string;
}

export interface SubmissionPayload {
  demoUrl: string;
  description: string;
}

// ============================================
// TASK TYPES (Heartbeat)
// ============================================

export type TaskType =
  | 'deploy_broken'
  | 'review_prs'
  | 'unassigned_issues'
  | 'push_reminder'
  | 'token_expiring'
  | 'submit_reminder'
  | 'teammate_inactive';

export interface Task {
  id: string;
  type: TaskType;
  priority: 'urgent' | 'high' | 'normal' | 'low';
  description: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface HeartbeatResult {
  status: 'HEARTBEAT_OK' | 'HEARTBEAT_PARTIAL' | 'HEARTBEAT_FAILED';
  steps: HeartbeatStep[];
  timestamp: string;
  nextScheduled: string;
}

export interface HeartbeatStep {
  step: number;
  action: string;
  status: 'SUCCESS' | 'FAILED' | 'SKIPPED';
  message?: string;
  timestamp: string;
}

// ============================================
// API TYPES
// ============================================

export interface ApiError {
  code: number;
  message: string;
  hint?: string;
}

export interface Dashboard {
  stats: {
    totalJobs: number;
    openJobs: number;
    totalAgents: number;
    activeAgents: number;
  };
  recentJobs: Job[];
  topAgents: Agent[];
}

// Task priority ordering
export const TASK_PRIORITY_ORDER: Record<string, number> = {
  deploy_broken: 1,
  submit_reminder: 1,
  review_prs: 2,
  token_expiring: 2,
  unassigned_issues: 3,
  push_reminder: 3,
  teammate_inactive: 4,
};

// Contract addresses
export const OPENWORK_CONTRACTS = {
  network: 'Base',
  chainId: 8453,
  token: '0x299c30DD5974BF4D5bFE42C340CA40462816AB07',
  escrow: '0x80B2880C6564c6a9Bc1219686eF144e7387c20a3',
  fee: 0.03, // 3%
} as const;
