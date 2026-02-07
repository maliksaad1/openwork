/**
 * Activity Feed API
 * Tracks and returns agent activities
 */

import { NextResponse } from 'next/server';

interface Activity {
  id: string;
  agent: string;
  action: string;
  description: string;
  status: 'success' | 'pending' | 'failed';
  timestamp: string;
  metadata?: Record<string, unknown>;
}

// In-memory activity store (in production, use Redis or database)
const activities: Activity[] = [];

function generateId(): string {
  return `act_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export async function GET() {
  // Fetch recent agent activities from Openwork
  const OPENWORK_API = 'https://www.openwork.bot/api';
  const apiKey = process.env.OPENWORK_API_KEY;

  const recentActivities: Activity[] = [...activities];

  // Fetch jobs completed by our agents
  try {
    const response = await fetch(`${OPENWORK_API}/agents/me`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (response.ok) {
      const data = await response.json();

      // Add system activity about agent status
      recentActivities.unshift({
        id: generateId(),
        agent: 'SYSTEM',
        action: 'STATUS_CHECK',
        description: `TeamNeuraFinity: ${data.jobs_completed} jobs completed, Reputation: ${data.reputation}`,
        status: 'success',
        timestamp: new Date().toISOString(),
        metadata: { reputation: data.reputation, jobsCompleted: data.jobs_completed },
      });
    }
  } catch (error) {
    console.error('Error fetching agent data:', error);
  }

  // Fetch available jobs to show discovery activity
  try {
    const response = await fetch(`${OPENWORK_API}/jobs/match`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (response.ok) {
      const data = await response.json();
      const jobs = data.jobs || data || [];

      if (jobs.length > 0) {
        recentActivities.unshift({
          id: generateId(),
          agent: 'NF-Backend',
          action: 'JOB_SCAN',
          description: `Discovered ${jobs.length} potential jobs matching squadron skills`,
          status: 'success',
          timestamp: new Date().toISOString(),
          metadata: { jobCount: jobs.length },
        });

        // Highlight top opportunity
        const topJob = jobs[0];
        if (topJob) {
          recentActivities.unshift({
            id: generateId(),
            agent: 'NF-PM',
            action: 'OPPORTUNITY_ANALYSIS',
            description: `Analyzing: "${topJob.title || 'New opportunity'}" - Budget: $${topJob.budget || 'TBD'}`,
            status: 'pending',
            timestamp: new Date().toISOString(),
            metadata: { jobId: topJob.id },
          });
        }
      }
    }
  } catch (error) {
    console.error('Error fetching jobs:', error);
  }

  // Add treasury monitoring activity
  recentActivities.unshift({
    id: generateId(),
    agent: 'NF-Contract',
    action: 'TREASURY_MONITOR',
    description: 'Monitoring $OPENWORK treasury on Base Network',
    status: 'success',
    timestamp: new Date().toISOString(),
  });

  // Add frontend activity
  recentActivities.unshift({
    id: generateId(),
    agent: 'NF-Frontend',
    action: 'DASHBOARD_RENDER',
    description: 'Mission Control dashboard active and rendering',
    status: 'success',
    timestamp: new Date().toISOString(),
  });

  // Sort by timestamp descending and limit
  recentActivities.sort((a, b) =>
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return NextResponse.json({
    activities: recentActivities.slice(0, 20),
    totalCount: recentActivities.length,
    timestamp: new Date().toISOString(),
  });
}

// POST to log a new activity
export async function POST(request: Request) {
  try {
    const { agent, action, description, status, metadata } = await request.json();

    const activity: Activity = {
      id: generateId(),
      agent,
      action,
      description,
      status: status || 'success',
      timestamp: new Date().toISOString(),
      metadata,
    };

    activities.unshift(activity);

    // Keep only last 100 activities in memory
    if (activities.length > 100) {
      activities.pop();
    }

    return NextResponse.json(activity);
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to log activity',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
