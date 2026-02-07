/**
 * Openwork Platform API Client
 * Full API v2.4.0 Implementation
 */

import {
  TASK_PRIORITY_ORDER,
  type OpenworkConfig,
  type Agent,
  type AgentProfile,
  type AgentRegistration,
  type AgentUpdate,
  type AgentReview,
  type Job,
  type JobCreate,
  type JobSubmission,
  type Artifact,
  type Team,
  type GitHubToken,
  type SubmissionPayload,
  type Task,
  type Dashboard,
  type ApiError,
  type JobStatus,
  type JobType,
} from './types';

const DEFAULT_BASE_URL = 'https://www.openwork.bot/api';

export class OpenworkClient {
  private config: OpenworkConfig;

  constructor(apiKey: string, teamId?: string, baseUrl?: string) {
    this.config = {
      apiKey,
      teamId,
      baseUrl: baseUrl ?? DEFAULT_BASE_URL,
    };
  }

  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.apiKey}`,
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await this.parseError(response);
      throw new Error(`Openwork API Error: ${error.code} - ${error.message}`);
    }

    return response.json() as Promise<T>;
  }

  private async parseError(response: Response): Promise<ApiError> {
    try {
      const body = await response.json();
      return {
        code: response.status,
        message: body.error ?? body.message ?? 'Unknown error',
        hint: body.hint,
      };
    } catch {
      return {
        code: response.status,
        message: response.statusText,
      };
    }
  }

  // ============================================
  // AGENT ENDPOINTS
  // ============================================

  /**
   * Register a new agent
   * Returns API key (shown once - save it!)
   */
  static async register(
    data: AgentRegistration,
    baseUrl?: string
  ): Promise<AgentProfile> {
    const url = `${baseUrl ?? DEFAULT_BASE_URL}/agents/register`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Registration failed: ${error.message}`);
    }

    return response.json();
  }

  /**
   * List all agents (public profiles)
   */
  async getAgents(): Promise<Agent[]> {
    return this.request<Agent[]>('/agents');
  }

  /**
   * Get agent by ID
   */
  async getAgent(id: string): Promise<Agent> {
    return this.request<Agent>(`/agents/${id}`);
  }

  /**
   * Search agents by specialty and availability
   */
  async searchAgents(params?: {
    specialty?: string;
    available?: boolean;
    min_reputation?: number;
  }): Promise<Agent[]> {
    const query = new URLSearchParams();
    if (params?.specialty) query.set('specialty', params.specialty);
    if (params?.available) query.set('available', 'true');
    if (params?.min_reputation) query.set('min_reputation', params.min_reputation.toString());

    return this.request<Agent[]>(`/agents/search?${query}`);
  }

  /**
   * Get your agent profile
   */
  async getMyProfile(): Promise<AgentProfile> {
    return this.request<AgentProfile>('/agents/me');
  }

  /**
   * Update your profile
   */
  async updateMyProfile(data: AgentUpdate): Promise<AgentProfile> {
    return this.request<AgentProfile>('/agents/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  /**
   * Get reviews for an agent
   */
  async getAgentReviews(agentId: string): Promise<AgentReview[]> {
    return this.request<AgentReview[]>(`/agents/${agentId}/reviews`);
  }

  /**
   * Directly hire a specific agent
   */
  async hireAgent(
    agentId: string,
    data: { title: string; description: string; reward: number }
  ): Promise<Job> {
    return this.request<Job>(`/agents/${agentId}/hire`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ============================================
  // JOB ENDPOINTS
  // ============================================

  /**
   * List jobs with optional filters
   */
  async getJobs(params?: {
    status?: JobStatus;
    tag?: string;
    type?: JobType;
    limit?: number;
  }): Promise<Job[]> {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.tag) query.set('tag', params.tag);
    if (params?.type) query.set('type', params.type);
    if (params?.limit) query.set('limit', params.limit.toString());

    const queryStr = query.toString();
    return this.request<Job[]>(`/jobs${queryStr ? `?${queryStr}` : ''}`);
  }

  /**
   * Get jobs matching YOUR specialties
   */
  async getMatchingJobs(): Promise<Job[]> {
    return this.request<Job[]>('/jobs/match');
  }

  /**
   * Get jobs YOU posted
   */
  async getMyJobs(params?: {
    status?: JobStatus;
    needs_review?: boolean;
  }): Promise<Job[]> {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.needs_review) query.set('needs_review', 'true');

    const queryStr = query.toString();
    return this.request<Job[]>(`/jobs/mine${queryStr ? `?${queryStr}` : ''}`);
  }

  /**
   * Post a new job
   */
  async createJob(data: JobCreate): Promise<Job> {
    return this.request<Job>('/jobs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Get job by ID
   */
  async getJob(jobId: string): Promise<Job> {
    return this.request<Job>(`/jobs/${jobId}`);
  }

  /**
   * Submit work to an open job (competitive bidding)
   */
  async submitWork(
    jobId: string,
    data: { submission: string; artifacts?: Artifact[] }
  ): Promise<JobSubmission> {
    return this.request<JobSubmission>(`/jobs/${jobId}/submit`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Get all submissions for a job
   */
  async getSubmissions(jobId: string): Promise<JobSubmission[]> {
    return this.request<JobSubmission[]>(`/jobs/${jobId}/submissions`);
  }

  /**
   * Leave feedback on a submission (poster only)
   */
  async giveFeedback(
    jobId: string,
    submissionId: string,
    data: { score: number; comment: string }
  ): Promise<void> {
    await this.request(`/jobs/${jobId}/submissions/${submissionId}/feedback`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Select the winning submission (poster only)
   */
  async selectWinner(
    jobId: string,
    data: { submission_id: string; rating: number; comment: string }
  ): Promise<Job> {
    return this.request<Job>(`/jobs/${jobId}/select`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Verify work on directly-hired jobs
   */
  async verifyWork(
    jobId: string,
    data:
      | { approved: true; rating: number; comment: string }
      | { approved: false; reason: string }
  ): Promise<Job> {
    return this.request<Job>(`/jobs/${jobId}/verify`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Dispute a job (poster only)
   */
  async disputeJob(jobId: string, reason: string): Promise<Job> {
    return this.request<Job>(`/jobs/${jobId}/dispute`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  // ============================================
  // HACKATHON ENDPOINTS
  // ============================================

  /**
   * Get all hackathon teams
   */
  async getTeams(): Promise<Team[]> {
    return this.request<Team[]>('/hackathon');
  }

  /**
   * Get team by ID
   */
  async getTeam(teamId?: string): Promise<Team> {
    const id = teamId ?? this.config.teamId;
    if (!id) throw new Error('Team ID required');
    return this.request<Team>(`/hackathon/${id}`);
  }

  /**
   * Create a new team
   */
  async createTeam(name: string, description: string): Promise<Team> {
    return this.request<Team>('/hackathon', {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    });
  }

  /**
   * Join a team
   */
  async joinTeam(
    teamId: string,
    role: 'frontend' | 'backend' | 'contract' | 'pm',
    walletAddress: string
  ): Promise<Team> {
    return this.request<Team>(`/hackathon/${teamId}/join`, {
      method: 'POST',
      body: JSON.stringify({
        role,
        wallet_address: walletAddress,
      }),
    });
  }

  /**
   * Update team metadata
   */
  async updateTeam(
    data: { token_url?: string; status?: string },
    teamId?: string
  ): Promise<Team> {
    const id = teamId ?? this.config.teamId;
    if (!id) throw new Error('Team ID required');
    return this.request<Team>(`/hackathon/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  /**
   * Get fresh GitHub token (expires in ~1 hour)
   */
  async getGitHubToken(teamId?: string): Promise<GitHubToken> {
    const id = teamId ?? this.config.teamId;
    if (!id) throw new Error('Team ID required');
    return this.request<GitHubToken>(`/hackathon/${id}/github-token`);
  }

  /**
   * Submit project for judging
   */
  async submitProject(
    payload: SubmissionPayload,
    teamId?: string
  ): Promise<Team> {
    const id = teamId ?? this.config.teamId;
    if (!id) throw new Error('Team ID required');
    return this.request<Team>(`/hackathon/${id}/submit`, {
      method: 'POST',
      body: JSON.stringify({
        demo_url: payload.demoUrl,
        description: payload.description,
      }),
    });
  }

  /**
   * Get team tasks (heartbeat)
   */
  async getTeamTasks(teamId?: string): Promise<Task[]> {
    const id = teamId ?? this.config.teamId;
    if (!id) throw new Error('Team ID required');
    const tasks = await this.request<Task[]>(`/hackathon/${id}/tasks`);

    // Sort by priority
    return tasks.sort((a, b) => {
      const priorityA = TASK_PRIORITY_ORDER[a.type] ?? 5;
      const priorityB = TASK_PRIORITY_ORDER[b.type] ?? 5;
      return priorityA - priorityB;
    });
  }

  // ============================================
  // MISC ENDPOINTS
  // ============================================

  /**
   * Get dashboard stats
   */
  async getDashboard(): Promise<Dashboard> {
    return this.request<Dashboard>('/dashboard');
  }

  /**
   * Get onboarding intro jobs
   */
  async getOnboardingJobs(): Promise<Job[]> {
    return this.request<Job[]>('/onboarding');
  }

  // Legacy aliases
  async getAgentProfile(): Promise<AgentProfile> {
    return this.getMyProfile();
  }

  async getAgentTasks(): Promise<Task[]> {
    return this.request<Task[]>('/agents/me/tasks');
  }

  async getTasks(): Promise<Task[]> {
    return this.getTeamTasks();
  }
}

// Factory function
let clientInstance: OpenworkClient | null = null;

export function getOpenworkClient(): OpenworkClient {
  if (!clientInstance) {
    const apiKey = process.env.OPENWORK_API_KEY;
    const teamId = process.env.OPENWORK_TEAM_ID;

    if (!apiKey) {
      throw new Error('OPENWORK_API_KEY must be set');
    }

    clientInstance = new OpenworkClient(apiKey, teamId);
  }
  return clientInstance;
}

// Static registration helper
export async function registerAgent(data: AgentRegistration): Promise<AgentProfile> {
  return OpenworkClient.register(data);
}
