/**
 * Job Discovery API
 * Finds relevant jobs on Openwork and can auto-bid with Kimi k2.5 analysis
 */

import { NextResponse } from 'next/server';

const OPENWORK_API = 'https://www.openwork.bot/api';
const AGENT_KEYS = {
  MASTER: process.env.OPENWORK_API_KEY,
  BACKEND: process.env.BACKEND_API_KEY,
  CONTRACT: process.env.CONTRACT_API_KEY,
  FRONTEND: process.env.FRONTEND_API_KEY,
  PM: process.env.PM_API_KEY,
};

interface Job {
  id: string;
  title: string;
  description: string;
  budget: number;
  deadline: string;
  skills: string[];
  status: string;
  postedBy: string;
}

interface DiscoveredJob extends Job {
  matchScore: number;
  recommendedAgent: string;
  bidStrategy: string;
}

// Skills each agent specializes in
const AGENT_SKILLS = {
  BACKEND: ['api', 'research', 'analysis', 'automation', 'backend', 'nodejs', 'python'],
  CONTRACT: ['trading', 'smart-contracts', 'solidity', 'blockchain', 'defi', 'base'],
  FRONTEND: ['coding', 'frontend', 'react', 'nextjs', 'ui', 'dashboard'],
  PM: ['research', 'analysis', 'strategy', 'coordination', 'planning'],
};

function calculateMatchScore(job: Job, agentSkills: string[]): number {
  // Handle missing skills array
  const jobSkills = job.skills || [];
  const jobSkillsLower = jobSkills.map(s => s.toLowerCase());
  const matches = agentSkills.filter(skill =>
    jobSkillsLower.some(js => js.includes(skill) || skill.includes(js))
  );

  // Also check description for skill mentions
  const description = job.description || '';
  const descLower = description.toLowerCase();
  const descMatches = agentSkills.filter(skill => descLower.includes(skill));

  const totalMatches = new Set([...matches, ...descMatches]).size;
  return Math.min(100, (totalMatches / agentSkills.length) * 100 + 20);
}

function findBestAgent(job: Job): { agent: string; score: number } {
  let bestAgent = 'BACKEND';
  let bestScore = 0;

  for (const [agent, skills] of Object.entries(AGENT_SKILLS)) {
    const score = calculateMatchScore(job, skills);
    if (score > bestScore) {
      bestScore = score;
      bestAgent = agent;
    }
  }

  return { agent: bestAgent, score: bestScore };
}

function generateBidStrategy(job: Job, matchScore: number): string {
  if (matchScore >= 80) {
    return `AGGRESSIVE: High skill match. Bid at ${Math.round(job.budget * 0.9)} (10% under budget). Emphasize deep expertise.`;
  } else if (matchScore >= 60) {
    return `COMPETITIVE: Good match. Bid at ${Math.round(job.budget * 0.85)} (15% under). Highlight relevant experience.`;
  } else if (matchScore >= 40) {
    return `CONSERVATIVE: Partial match. Bid at ${Math.round(job.budget * 0.75)} (25% under). Focus on learning potential.`;
  }
  return `PASS: Low skill match (${matchScore}%). Consider skipping this job.`;
}

async function fetchJobs(apiKey: string): Promise<Job[]> {
  try {
    const response = await fetch(`${OPENWORK_API}/jobs/match`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error('Failed to fetch jobs:', response.status);
      return [];
    }

    const data = await response.json();
    return data.jobs || data || [];
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return [];
  }
}

async function submitBid(jobId: string, agentKey: string, amount: number, proposal: string): Promise<boolean> {
  try {
    const response = await fetch(`${OPENWORK_API}/jobs/${jobId}/bid`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${agentKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        proposal,
        estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('Error submitting bid:', error);
    return false;
  }
}

export async function GET() {
  const apiKey = AGENT_KEYS.MASTER;
  if (!apiKey) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
  }

  const jobs = await fetchJobs(apiKey);

  const discoveredJobs: DiscoveredJob[] = jobs.map(job => {
    const { agent, score } = findBestAgent(job);
    return {
      ...job,
      matchScore: Math.round(score),
      recommendedAgent: agent,
      bidStrategy: generateBidStrategy(job, score),
    };
  });

  // Sort by match score
  discoveredJobs.sort((a, b) => b.matchScore - a.matchScore);

  return NextResponse.json({
    jobs: discoveredJobs,
    totalFound: discoveredJobs.length,
    highMatches: discoveredJobs.filter(j => j.matchScore >= 70).length,
    timestamp: new Date().toISOString(),
  });
}

// POST to auto-bid on a specific job
export async function POST(request: Request) {
  try {
    const { jobId, agentType, bidAmount, proposal } = await request.json();

    const agentKey = AGENT_KEYS[agentType as keyof typeof AGENT_KEYS];
    if (!agentKey) {
      return NextResponse.json({ error: 'Invalid agent type' }, { status: 400 });
    }

    const success = await submitBid(jobId, agentKey, bidAmount, proposal);

    return NextResponse.json({
      success,
      jobId,
      agent: agentType,
      bidAmount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to submit bid',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
