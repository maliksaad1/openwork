/**
 * Server-Side Auto-Pilot Engine
 * Runs automatically in the background - no browser required
 * Can be force-stopped via API
 */

const OPENWORK_API = 'https://www.openwork.bot/api';
const CYCLE_INTERVAL = 5 * 60 * 1000; // 5 minutes

interface EngineState {
  isRunning: boolean;
  intervalId: NodeJS.Timeout | null;
  cycleCount: number;
  lastCycle: Date | null;
  lastResult: CycleResult | null;
  startedAt: Date | null;
}

interface CycleResult {
  success: boolean;
  totalJobs: number;
  openJobs: number;
  submissionsSuccessful: number;
  submissionsFailed: number;
  timestamp: string;
  message: string;
}

// Global state - persists across requests in Node.js
const state: EngineState = {
  isRunning: false,
  intervalId: null,
  cycleCount: 0,
  lastCycle: null,
  lastResult: null,
  startedAt: null,
};

const AGENT_KEYS = {
  MASTER: process.env.OPENWORK_API_KEY!,
  BACKEND: process.env.BACKEND_API_KEY!,
  CONTRACT: process.env.CONTRACT_API_KEY!,
  FRONTEND: process.env.FRONTEND_API_KEY!,
  PM: process.env.PM_API_KEY!,
};

// Run a single autopilot cycle
async function runCycle(): Promise<CycleResult> {
  state.cycleCount++;
  state.lastCycle = new Date();

  console.log(`[AutoPilot] Cycle #${state.cycleCount} starting...`);

  try {
    // Use internal API call
    const baseUrl = process.env.NEXT_PUBLIC_URL || process.env.RENDER_EXTERNAL_URL || 'http://localhost:3000';

    const response = await fetch(`${baseUrl}/api/autopilot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ minMatchScore: 15, maxBids: 10 }),
    });

    const data = await response.json();

    const result: CycleResult = {
      success: data.success || false,
      totalJobs: data.totalJobs || 0,
      openJobs: data.openJobs || 0,
      submissionsSuccessful: data.submissionsSuccessful || 0,
      submissionsFailed: data.submissionsFailed || 0,
      timestamp: new Date().toISOString(),
      message: data.message || (data.success ? 'Cycle completed' : 'Cycle failed'),
    };

    state.lastResult = result;

    console.log(`[AutoPilot] Cycle #${state.cycleCount} complete: ${result.submissionsSuccessful} submissions, ${result.openJobs} open jobs`);

    return result;
  } catch (error) {
    const result: CycleResult = {
      success: false,
      totalJobs: 0,
      openJobs: 0,
      submissionsSuccessful: 0,
      submissionsFailed: 0,
      timestamp: new Date().toISOString(),
      message: error instanceof Error ? error.message : 'Unknown error',
    };

    state.lastResult = result;
    console.error(`[AutoPilot] Cycle #${state.cycleCount} error:`, error);

    return result;
  }
}

// Start the autopilot engine
export function startEngine(): { success: boolean; message: string } {
  if (state.isRunning) {
    return { success: false, message: 'Engine already running' };
  }

  console.log('[AutoPilot] Starting engine...');

  state.isRunning = true;
  state.startedAt = new Date();
  state.cycleCount = 0;

  // Run immediately
  runCycle();

  // Then run every 5 minutes
  state.intervalId = setInterval(runCycle, CYCLE_INTERVAL);

  return { success: true, message: 'Engine started' };
}

// Stop the autopilot engine
export function stopEngine(): { success: boolean; message: string } {
  if (!state.isRunning) {
    return { success: false, message: 'Engine not running' };
  }

  console.log('[AutoPilot] Stopping engine...');

  if (state.intervalId) {
    clearInterval(state.intervalId);
    state.intervalId = null;
  }

  state.isRunning = false;

  return { success: true, message: `Engine stopped after ${state.cycleCount} cycles` };
}

// Get engine status
export function getEngineStatus() {
  const now = new Date();
  const nextCycleIn = state.lastCycle
    ? Math.max(0, CYCLE_INTERVAL - (now.getTime() - state.lastCycle.getTime()))
    : 0;

  return {
    isRunning: state.isRunning,
    cycleCount: state.cycleCount,
    lastCycle: state.lastCycle?.toISOString() || null,
    lastResult: state.lastResult,
    startedAt: state.startedAt?.toISOString() || null,
    nextCycleIn: Math.floor(nextCycleIn / 1000), // seconds
    uptime: state.startedAt ? Math.floor((now.getTime() - state.startedAt.getTime()) / 1000) : 0,
  };
}

// Auto-start on first import (when server starts)
if (!state.isRunning && typeof process !== 'undefined') {
  // Delay start to ensure server is ready
  setTimeout(() => {
    console.log('[AutoPilot] Auto-starting engine on server boot...');
    startEngine();
  }, 5000); // Wait 5 seconds for server to be ready
}
