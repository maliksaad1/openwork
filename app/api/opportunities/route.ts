/**
 * Opportunities API
 * Fetch available jobs from Openwork with skill matching
 */

import { NextResponse } from 'next/server';

const OPENWORK_API = 'https://www.openwork.bot/api';

const AGENT_SKILLS: Record<string, string[]> = {
  'NF-Backend': ['api', 'backend', 'nodejs', 'python', 'automation', 'data', 'scraping', 'coding'],
  'NF-Contract': ['smart-contracts', 'solidity', 'blockchain', 'web3', 'defi', 'trading', 'crypto'],
  'NF-Frontend': ['frontend', 'react', 'nextjs', 'ui', 'dashboard', 'design', 'typescript', 'coding'],
  'NF-PM': ['research', 'analysis', 'strategy', 'planning', 'writing', 'marketing', 'content'],
};

interface Job {
  id: string;
  title: string;
  description: string;
  reward: number;
  tags: string[];
  status: string;
  matchScore?: number;
  matchedTags?: string[];
  created_at?: string;
}

function findBestAgent(job: Job): { agent: string; score: number; reason: string } {
  let best = { agent: 'NF-PM', score: 0, reason: 'General task' };
  const jobText = `${job.title} ${job.description}`.toLowerCase();
  const jobTags = (job.tags || []).map(t => t.toLowerCase());

  for (const [agent, skills] of Object.entries(AGENT_SKILLS)) {
    let score = 0;
    const matchedSkills: string[] = [];

    for (const skill of skills) {
      if (jobTags.some(tag => tag.includes(skill) || skill.includes(tag))) {
        score += 15;
        matchedSkills.push(skill);
      }
      if (jobText.includes(skill)) {
        score += 10;
        if (!matchedSkills.includes(skill)) matchedSkills.push(skill);
      }
    }

    // Add Openwork's match score
    if (job.matchScore) {
      score += job.matchScore * 3;
    }

    if (score > best.score) {
      best = {
        agent,
        score: Math.min(100, score),
        reason: matchedSkills.length > 0
          ? `Matches: ${matchedSkills.slice(0, 3).join(', ')}`
          : 'Best fit'
      };
    }
  }

  return best;
}

export async function GET() {
  try {
    const response = await fetch(`${OPENWORK_API}/jobs/match`, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENWORK_API_KEY}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      return NextResponse.json({
        opportunities: [],
        error: 'Failed to fetch from Openwork'
      });
    }

    const data = await response.json();
    const jobs: Job[] = data.jobs || [];

    // Filter open jobs with rewards and enrich with agent matching
    const opportunities = jobs
      .filter(job => job.status === 'open')
      .map(job => {
        const match = findBestAgent(job);
        return {
          id: job.id,
          title: job.title || 'Untitled Job',
          description: job.description?.slice(0, 200) + (job.description?.length > 200 ? '...' : '') || '',
          reward: job.reward || 0,
          tags: job.tags || [],
          bestAgent: match.agent,
          matchScore: match.score,
          matchReason: match.reason,
          openworkMatch: job.matchScore || 0,
          matchedTags: job.matchedTags || [],
          createdAt: job.created_at,
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore);

    return NextResponse.json({
      opportunities: opportunities.slice(0, 20),
      total: jobs.length,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    return NextResponse.json({
      opportunities: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
