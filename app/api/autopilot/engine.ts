/**
 * Server-Side Auto-Pilot Engine v2
 * Runs automatically - starts on first API access
 * Stores activity history for dashboard display
 */

const CYCLE_INTERVAL = 5 * 60 * 1000; // 5 minutes

interface ActivityEntry {
  id: string;
  type: 'info' | 'success' | 'error' | 'warning';
  message: string;
  detail?: string;
  timestamp: string;
}

interface CycleResult {
  success: boolean;
  totalJobs: number;
  openJobs: number;
  newJobsFound: number;
  alreadySubmitted: number;
  submissionsSuccessful: number;
  submissionsFailed: number;
  timestamp: string;
  message: string;
  results?: Array<{
    jobId: string;
    jobTitle: string;
    agent: string;
    reward: number;
    success: boolean;
    message: string;
  }>;
}

interface EngineState {
  isRunning: boolean;
  intervalId: NodeJS.Timeout | null;
  cycleCount: number;
  lastCycle: Date | null;
  lastResult: CycleResult | null;
  startedAt: Date | null;
  activityLog: ActivityEntry[];
  initialized: boolean;
}

// Global state
const state: EngineState = {
  isRunning: false,
  intervalId: null,
  cycleCount: 0,
  lastCycle: null,
  lastResult: null,
  startedAt: null,
  activityLog: [],
  initialized: false,
};

// Add to activity log
function addActivity(type: ActivityEntry['type'], message: string, detail?: string) {
  const entry: ActivityEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type,
    message,
    detail,
    timestamp: new Date().toISOString(),
  };
  state.activityLog.unshift(entry);
  // Keep last 50 entries
  if (state.activityLog.length > 50) {
    state.activityLog = state.activityLog.slice(0, 50);
  }
  console.log(`[AutoPilot] ${type.toUpperCase()}: ${message}${detail ? ` - ${detail}` : ''}`);
}

// Run a single autopilot cycle
async function runCycle(): Promise<CycleResult> {
  state.cycleCount++;
  state.lastCycle = new Date();

  addActivity('info', `Cycle #${state.cycleCount} started`, 'Fetching jobs from Openwork...');

  try {
    const baseUrl = process.env.NEXT_PUBLIC_URL || process.env.RENDER_EXTERNAL_URL || 'http://localhost:3000';

    const response = await fetch(`${baseUrl}/api/autopilot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ minMatchScore: 5, maxBids: 3 }),
    });

    const data = await response.json();

    const result: CycleResult = {
      success: data.success || false,
      totalJobs: data.totalJobs || 0,
      openJobs: data.openJobs || 0,
      newJobsFound: data.newJobsFound || 0,
      alreadySubmitted: data.alreadySubmitted || 0,
      submissionsSuccessful: data.submissionsSuccessful || 0,
      submissionsFailed: data.submissionsFailed || 0,
      timestamp: new Date().toISOString(),
      message: data.message || '',
      results: data.results || [],
    };

    state.lastResult = result;

    // Log job scan results
    addActivity('info', `Scanned ${result.totalJobs} jobs`,
      `${result.openJobs} open, ${result.alreadySubmitted} already bid, ${result.newJobsFound} new`);

    // Log each submission
    if (result.results && result.results.length > 0) {
      for (const r of result.results) {
        if (r.success) {
          addActivity('success', `Submitted: ${r.jobTitle.slice(0, 40)}...`,
            `${r.agent} → ${r.reward.toLocaleString()} $OPEN`);
        } else {
          addActivity('error', `Failed: ${r.jobTitle.slice(0, 35)}...`, r.message);
        }
      }
    }

    // Summary
    if (result.submissionsSuccessful > 0 || result.submissionsFailed > 0) {
      addActivity('info', `Cycle #${state.cycleCount} complete`,
        `${result.submissionsSuccessful} successful, ${result.submissionsFailed} failed`);
    } else if (result.newJobsFound === 0) {
      addActivity('warning', 'No new jobs available',
        `${result.alreadySubmitted} jobs already have pending bids`);
    } else {
      addActivity('warning', 'No matching jobs', 'Jobs found but none matched agent skills');
    }

    return result;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    addActivity('error', `Cycle #${state.cycleCount} failed`, errorMsg);

    const result: CycleResult = {
      success: false,
      totalJobs: 0,
      openJobs: 0,
      newJobsFound: 0,
      alreadySubmitted: 0,
      submissionsSuccessful: 0,
      submissionsFailed: 0,
      timestamp: new Date().toISOString(),
      message: errorMsg,
    };

    state.lastResult = result;
    return result;
  }
}

// Start the engine
export function startEngine(): { success: boolean; message: string } {
  if (state.isRunning) {
    return { success: true, message: 'Engine already running' };
  }

  state.isRunning = true;
  state.startedAt = new Date();
  state.cycleCount = 0;

  addActivity('info', 'Auto-Pilot engine started', 'Running first cycle...');

  // Run immediately
  runCycle();

  // Then every 5 minutes
  state.intervalId = setInterval(runCycle, CYCLE_INTERVAL);

  return { success: true, message: 'Engine started' };
}

// Stop the engine
export function stopEngine(): { success: boolean; message: string } {
  if (!state.isRunning) {
    return { success: false, message: 'Engine not running' };
  }

  if (state.intervalId) {
    clearInterval(state.intervalId);
    state.intervalId = null;
  }

  state.isRunning = false;
  const cycles = state.cycleCount;

  addActivity('warning', 'Auto-Pilot stopped', `Completed ${cycles} cycles`);

  return { success: true, message: `Stopped after ${cycles} cycles` };
}

// Get status - also ensures engine is running (auto-start)
export function getEngineStatus() {
  // Auto-start if not running and not explicitly stopped
  if (!state.initialized) {
    state.initialized = true;
    addActivity('info', 'NeuraFinity initialized', 'Auto-starting engine...');
    startEngine();
  }

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
    nextCycleIn: Math.floor(nextCycleIn / 1000),
    uptime: state.startedAt ? Math.floor((now.getTime() - state.startedAt.getTime()) / 1000) : 0,
    activityLog: state.activityLog, // Include activity history
  };
}
