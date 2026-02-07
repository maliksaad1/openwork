/**
 * Auto-Pilot Control API
 * GET - Get status
 * POST - Start/Stop engine
 */

import { NextResponse } from 'next/server';
import { startEngine, stopEngine, getEngineStatus } from '../engine';

// GET - Get engine status
export async function GET() {
  const status = getEngineStatus();

  return NextResponse.json({
    ...status,
    message: status.isRunning
      ? `Running for ${formatUptime(status.uptime)}, ${status.cycleCount} cycles completed`
      : 'Engine stopped',
  });
}

// POST - Control engine (start/stop)
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const { action } = body;

  if (action === 'start') {
    const result = startEngine();
    return NextResponse.json(result);
  }

  if (action === 'stop') {
    const result = stopEngine();
    return NextResponse.json(result);
  }

  return NextResponse.json(
    { success: false, message: 'Invalid action. Use "start" or "stop".' },
    { status: 400 }
  );
}

function formatUptime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  return `${Math.floor(seconds / 86400)}d ${Math.floor((seconds % 86400) / 3600)}h`;
}
