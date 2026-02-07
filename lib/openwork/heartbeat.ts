/**
 * Heartbeat Sync Protocol Implementation
 * Executes the 5-step heartbeat workflow every 30 minutes
 */

import { getOpenworkClient } from './client';
import type { HeartbeatResult, HeartbeatStep, Task } from './types';

const HEARTBEAT_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes

export class HeartbeatSync {
  private teamId: string;
  private intervalId: NodeJS.Timeout | null = null;

  constructor(teamId: string) {
    this.teamId = teamId;
  }

  /**
   * Execute a single heartbeat cycle
   */
  async execute(): Promise<HeartbeatResult> {
    const steps: HeartbeatStep[] = [];
    const client = getOpenworkClient();
    let overallSuccess = true;

    // Step 1: Token Refresh
    try {
      const token = await client.getGitHubToken();
      steps.push({
        step: 1,
        action: 'TOKEN_REFRESH',
        status: 'SUCCESS',
        message: `Token refreshed, expires at ${token.expires_at}`,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      overallSuccess = false;
      steps.push({
        step: 1,
        action: 'TOKEN_REFRESH',
        status: 'FAILED',
        message: error instanceof Error ? error.message : 'Token refresh failed',
        timestamp: new Date().toISOString(),
      });
    }

    // Step 2: Task Assessment
    try {
      const tasks = await client.getTasks();
      const urgentTasks = tasks.filter(
        (t) => t.type === 'deploy_broken' || t.type === 'submit_reminder'
      );

      steps.push({
        step: 2,
        action: 'TASK_ASSESSMENT',
        status: 'SUCCESS',
        message: `${tasks.length} tasks found, ${urgentTasks.length} urgent`,
        timestamp: new Date().toISOString(),
      });

      // Process urgent tasks
      await this.processUrgentTasks(urgentTasks);
    } catch (error) {
      overallSuccess = false;
      steps.push({
        step: 2,
        action: 'TASK_ASSESSMENT',
        status: 'FAILED',
        message: error instanceof Error ? error.message : 'Task assessment failed',
        timestamp: new Date().toISOString(),
      });
    }

    // Step 3: Progress Commitment
    steps.push({
      step: 3,
      action: 'PROGRESS_COMMITMENT',
      status: 'SUCCESS',
      message: 'Progress check completed (git operations handled externally)',
      timestamp: new Date().toISOString(),
    });

    // Step 4: Platform Tasks
    try {
      const agentTasks = await client.getAgentTasks();
      steps.push({
        step: 4,
        action: 'PLATFORM_TASKS',
        status: 'SUCCESS',
        message: `${agentTasks.length} platform tasks retrieved`,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      // Non-critical failure
      steps.push({
        step: 4,
        action: 'PLATFORM_TASKS',
        status: 'FAILED',
        message: error instanceof Error ? error.message : 'Platform task fetch failed',
        timestamp: new Date().toISOString(),
      });
    }

    // Step 5: Completion Signal
    steps.push({
      step: 5,
      action: 'COMPLETION_SIGNAL',
      status: 'SUCCESS',
      message: 'HEARTBEAT_OK',
      timestamp: new Date().toISOString(),
    });

    return {
      status: overallSuccess ? 'HEARTBEAT_OK' : 'HEARTBEAT_PARTIAL',
      steps,
      timestamp: new Date().toISOString(),
      nextScheduled: new Date(Date.now() + HEARTBEAT_INTERVAL_MS).toISOString(),
    };
  }

  /**
   * Process urgent tasks immediately
   */
  private async processUrgentTasks(tasks: Task[]): Promise<void> {
    for (const task of tasks) {
      switch (task.type) {
        case 'deploy_broken':
          console.log(`[URGENT] Deploy broken: ${task.description}`);
          // Trigger notification or auto-fix logic
          break;
        case 'submit_reminder':
          console.log(`[URGENT] Submission deadline approaching: ${task.description}`);
          break;
        default:
          // Skip non-urgent tasks in urgent processing
          break;
      }
    }
  }

  /**
   * Start automated heartbeat loop
   */
  start(): void {
    if (this.intervalId) {
      console.log('Heartbeat already running');
      return;
    }

    console.log('Starting heartbeat sync...');

    // Execute immediately
    this.execute().then((result) => {
      console.log(`Initial heartbeat: ${result.status}`);
    });

    // Then schedule recurring
    this.intervalId = setInterval(async () => {
      const result = await this.execute();
      console.log(`Heartbeat: ${result.status} at ${result.timestamp}`);
    }, HEARTBEAT_INTERVAL_MS);
  }

  /**
   * Stop automated heartbeat
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('Heartbeat sync stopped');
    }
  }

  /**
   * Get next scheduled heartbeat time
   */
  getNextScheduled(): string | null {
    if (!this.intervalId) return null;
    return new Date(Date.now() + HEARTBEAT_INTERVAL_MS).toISOString();
  }
}

// Factory function
export function createHeartbeatSync(teamId?: string): HeartbeatSync {
  const id = teamId ?? process.env.OPENWORK_TEAM_ID;
  if (!id) {
    throw new Error('Team ID required for heartbeat sync');
  }
  return new HeartbeatSync(id);
}
