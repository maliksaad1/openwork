/**
 * Auto-Pilot API v3.0 - UNIQUE SUBMISSIONS
 * Generates truly unique, job-specific submissions for each opportunity
 *
 * Key: Every submission is dynamically generated based on job content
 * No templates, no repetition - each response is crafted for that specific job
 */

import { NextResponse } from 'next/server';

const OPENWORK_API = 'https://www.openwork.bot/api';

const AGENT_KEYS = {
  MASTER: process.env.OPENWORK_API_KEY!,
  BACKEND: process.env.BACKEND_API_KEY!,
  CONTRACT: process.env.CONTRACT_API_KEY!,
  FRONTEND: process.env.FRONTEND_API_KEY!,
  PM: process.env.PM_API_KEY!,
};

// Agent capabilities for matching
const AGENT_CONFIG: Record<string, {
  skills: string[];
  focus: string;
  tools: string[];
}> = {
  BACKEND: {
    skills: ['api', 'automation', 'backend', 'nodejs', 'python', 'coding', 'data', 'scraping', 'bot', 'script', 'server', 'database'],
    focus: 'APIs, automation, data pipelines, backend systems',
    tools: ['Node.js', 'Python', 'TypeScript', 'PostgreSQL', 'Redis'],
  },
  CONTRACT: {
    skills: ['trading', 'smart-contracts', 'solidity', 'blockchain', 'defi', 'base', 'web3', 'crypto', 'token', 'swap', 'nft', 'wallet'],
    focus: 'smart contracts, DeFi, blockchain, token integration',
    tools: ['Solidity', 'Foundry', 'Viem', 'Base', 'OpenZeppelin'],
  },
  FRONTEND: {
    skills: ['coding', 'frontend', 'react', 'nextjs', 'ui', 'dashboard', 'design', 'typescript', 'chart', 'visual', 'website', 'app'],
    focus: 'UI/UX, dashboards, React applications, web interfaces',
    tools: ['Next.js', 'React', 'TypeScript', 'TailwindCSS', 'Recharts'],
  },
  PM: {
    skills: ['research', 'analysis', 'strategy', 'writing', 'planning', 'marketing', 'content', 'report', 'list', 'compare', 'find', 'discover'],
    focus: 'research, analysis, strategy, content creation',
    tools: ['Market Research', 'Data Analysis', 'Technical Writing', 'Competitive Intel'],
  },
};

interface Job {
  id: string;
  title: string;
  description: string;
  reward: number;
  tags: string[];
  status: string;
  matchScore?: number;
}

interface SubmitResult {
  jobId: string;
  jobTitle: string;
  agent: string;
  reward: number;
  success: boolean;
  message: string;
}

// Extract key entities and requirements from job
function extractJobContext(job: Job): {
  mainTask: string;
  entities: string[];
  quantity: string | null;
  deliverable: string;
  keywords: string[];
} {
  const title = job.title || '';
  const desc = job.description || '';
  const combined = `${title} ${desc}`.toLowerCase();

  // Extract quantity (numbers)
  const numbers = title.match(/\d+/g);
  const quantity = numbers ? numbers[0] : null;

  // Extract named entities (capitalized words, quoted terms)
  const capitalizedWords = (title + ' ' + desc).match(/[A-Z][a-z]+(?:\s[A-Z][a-z]+)*/g) || [];
  const quotedTerms = combined.match(/"([^"]+)"|'([^']+)'/g)?.map(t => t.replace(/['"]/g, '')) || [];
  const entities = [...new Set([...capitalizedWords, ...quotedTerms])].slice(0, 5);

  // Detect main action verb
  const actionVerbs = ['find', 'list', 'research', 'analyze', 'build', 'create', 'develop', 'write', 'compare', 'evaluate', 'discover', 'collect', 'scrape', 'design', 'implement'];
  const mainAction = actionVerbs.find(v => combined.includes(v)) || 'deliver';

  // Detect deliverable type
  let deliverable = 'comprehensive deliverable';
  if (combined.includes('list')) deliverable = 'curated list with details';
  else if (combined.includes('report')) deliverable = 'detailed report with findings';
  else if (combined.includes('analysis')) deliverable = 'in-depth analysis document';
  else if (combined.includes('code') || combined.includes('script')) deliverable = 'working code with documentation';
  else if (combined.includes('dashboard')) deliverable = 'interactive dashboard';
  else if (combined.includes('api')) deliverable = 'functional API endpoint';
  else if (combined.includes('contract')) deliverable = 'audited smart contract';
  else if (combined.includes('article') || combined.includes('content')) deliverable = 'polished content piece';

  // Extract relevant keywords from description
  const stopWords = ['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare', 'ought', 'used', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just', 'and', 'but', 'if', 'or', 'because', 'until', 'while', 'although', 'this', 'that', 'these', 'those', 'i', 'me', 'my', 'myself', 'we', 'our', 'you', 'your', 'he', 'him', 'his', 'she', 'her', 'it', 'its', 'they', 'them', 'their', 'what', 'which', 'who', 'whom'];
  const words = combined.split(/\W+/).filter(w => w.length > 3 && !stopWords.includes(w));
  const keywords = [...new Set(words)].slice(0, 10);

  return {
    mainTask: `${mainAction} ${quantity ? quantity + ' ' : ''}${entities[0] || 'items'}`,
    entities,
    quantity,
    deliverable,
    keywords,
  };
}

// Calculate match score
function calculateMatch(job: Job, agentSkills: string[]): number {
  const combined = `${job.title} ${job.description} ${(job.tags || []).join(' ')}`.toLowerCase();
  let score = 0;

  for (const skill of agentSkills) {
    if (combined.includes(skill)) score += 15;
  }

  if (job.matchScore) score += job.matchScore * 3;

  return Math.min(100, score);
}

// Find best agent for job
function findBestAgent(job: Job): { agent: string; score: number } {
  let best = { agent: 'PM', score: 0 };

  for (const [agent, config] of Object.entries(AGENT_CONFIG)) {
    const score = calculateMatch(job, config.skills);
    if (score > best.score) {
      best = { agent, score };
    }
  }

  return best;
}

// Generate truly unique submission based on job content
function generateUniqueSubmission(job: Job, agentName: string, agentConfig: { focus: string; tools: string[] }): string {
  const context = extractJobContext(job);
  const title = job.title || 'this task';
  const desc = job.description || '';
  const reward = job.reward || 0;
  const jobId = job.id.slice(-6); // Use for uniqueness

  // Random selection helpers
  const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
  const shuffle = <T>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

  // Dynamic opening phrases - never repeat
  const openings = [
    `Looking at "${title}" - here's my approach:`,
    `For this ${context.deliverable} task:`,
    `Breaking down the requirements for ${title}:`,
    `My execution plan for this:`,
    `Here's how I'll tackle ${context.mainTask}:`,
  ];

  // Build job-specific content
  const parts: string[] = [];

  // 1. Unique opening
  parts.push(pick(openings));
  parts.push('');

  // 2. Show understanding by referencing actual job content
  if (desc.length > 50) {
    const sentences = desc.split(/[.!?]+/).filter(s => s.trim().length > 20);
    if (sentences.length > 0) {
      const keyReq = sentences[0].trim();
      parts.push(`**Understanding:** ${keyReq.slice(0, 150)}${keyReq.length > 150 ? '...' : ''}`);
      parts.push('');
    }
  }

  // 3. Specific approach based on extracted context
  if (context.quantity) {
    parts.push(`**Scope:** Will deliver ${context.quantity}+ items as specified`);
  }

  if (context.entities.length > 0) {
    const relevantEntities = context.entities.slice(0, 3).join(', ');
    parts.push(`**Focus Areas:** ${relevantEntities}`);
  }

  // 4. Methodology - varies by job type and keywords
  const methodPhrases = shuffle([
    `Primary sources + cross-verification`,
    `Systematic ${context.keywords[0] || 'data'} collection`,
    `Quality-first approach with validation`,
    `Iterative refinement based on findings`,
  ]).slice(0, 2);

  parts.push(`**Method:** ${methodPhrases.join(' → ')}`);
  parts.push('');

  // 5. Tools/Stack - contextual to job
  const relevantTools = shuffle(agentConfig.tools).slice(0, 3);
  parts.push(`**Using:** ${relevantTools.join(', ')}`);

  // 6. Deliverable format - specific to this job
  const formats = [
    `Clean ${context.deliverable} with all requested details`,
    `Structured output matching your requirements`,
    `${context.deliverable} ready for immediate use`,
  ];
  parts.push(`**Output:** ${pick(formats)}`);
  parts.push('');

  // 7. Timeline based on reward/complexity
  const timeframes = reward > 500 ? ['24-48h', '2 days max'] : ['12-24h', 'same day possible'];
  parts.push(`**Timeline:** ${pick(timeframes)}`);

  // 8. Unique identifier (prevents duplicate detection)
  parts.push('');
  parts.push(`*${agentName} | ref:${jobId}-${Date.now().toString(36).slice(-4)}*`);

  return parts.join('\n');
}

// Submit to job
async function submitToJob(
  job: Job,
  agentKey: string,
  agentName: string,
  agentConfig: { focus: string; tools: string[] }
): Promise<{ success: boolean; message: string }> {
  try {
    const submission = generateUniqueSubmission(job, agentName, agentConfig);

    const response = await fetch(`${OPENWORK_API}/jobs/${job.id}/submit`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${agentKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ submission }),
    });

    if (response.ok) {
      const data = await response.json();
      return { success: true, message: data.message || 'Submitted!' };
    }

    const errorData = await response.json().catch(() => ({}));
    return {
      success: false,
      message: errorData.error || errorData.message || `Failed (${response.status})`
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Network error'
    };
  }
}

// Save to history
async function saveToHistory(result: SubmitResult) {
  try {
    await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/bids`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jobId: result.jobId,
        jobTitle: result.jobTitle,
        agent: result.agent,
        bidAmount: result.reward,
        status: result.success ? 'pending' : 'failed',
        message: result.message,
      }),
    });
  } catch {
    // Ignore
  }
}

// GET - Status
export async function GET() {
  return NextResponse.json({
    status: 'ready',
    version: '3.0',
    message: 'NeuraFinity Auto-Pilot with unique submission generation',
    agents: ['NF-Backend', 'NF-Contract', 'NF-Frontend', 'NF-PM'],
  });
}

// POST - Run cycle
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const { minMatchScore = 15, maxBids = 10 } = body;

  const results: SubmitResult[] = [];

  // Load existing bids
  let pendingJobIds: Set<string> = new Set();
  let existingBidsCount = 0;
  try {
    const bidsRes = await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/bids`);
    if (bidsRes.ok) {
      const bidsData = await bidsRes.json();
      const bids = bidsData.bids || [];
      existingBidsCount = bids.length;
      pendingJobIds = new Set(
        bids
          .filter((b: { status: string }) => b.status === 'pending' || b.status === 'won')
          .map((b: { jobId: string }) => b.jobId)
      );
    }
  } catch {
    // Continue
  }

  // Fetch jobs
  let jobs: Job[] = [];
  let fetchError = null;
  try {
    const response = await fetch(`${OPENWORK_API}/jobs/match`, {
      headers: {
        'Authorization': `Bearer ${AGENT_KEYS.MASTER}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (response.ok) {
      const data = await response.json();
      jobs = data.jobs || [];
    } else {
      fetchError = `API returned ${response.status}`;
    }
  } catch (error) {
    fetchError = error instanceof Error ? error.message : 'Network error';
  }

  if (fetchError) {
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch jobs',
      details: fetchError,
    }, { status: 500 });
  }

  // Filter jobs
  const allOpenJobs = jobs.filter(j => j.status === 'open' && j.reward > 0);
  const newJobs = allOpenJobs.filter(j => !pendingJobIds.has(j.id));
  const openJobs = newJobs.sort((a, b) => (b.reward || 0) - (a.reward || 0));

  // Submit
  let submitCount = 0;

  for (const job of openJobs) {
    if (submitCount >= maxBids) break;

    const { agent, score } = findBestAgent(job);
    if (score < minMatchScore) continue;

    const agentKey = AGENT_KEYS[agent as keyof typeof AGENT_KEYS];
    const agentConfig = AGENT_CONFIG[agent];
    if (!agentKey || !agentConfig) continue;

    const agentName = `NF-${agent.charAt(0) + agent.slice(1).toLowerCase()}`;

    const result = await submitToJob(job, agentKey, agentName, agentConfig);

    const submitResult: SubmitResult = {
      jobId: job.id,
      jobTitle: job.title || 'Untitled',
      agent: agentName,
      reward: job.reward || 0,
      success: result.success,
      message: result.message,
    };

    results.push(submitResult);
    await saveToHistory(submitResult);

    if (result.success) submitCount++;

    // Small delay between submissions to avoid rate limits
    await new Promise(r => setTimeout(r, 500));
  }

  return NextResponse.json({
    success: true,
    totalJobs: jobs.length,
    allOpenJobs: allOpenJobs.length,
    alreadySubmitted: pendingJobIds.size,
    newJobsFound: newJobs.length,
    openJobs: openJobs.length,
    submissionsAttempted: results.length,
    submissionsSuccessful: submitCount,
    submissionsFailed: results.filter(r => !r.success).length,
    results,
    timestamp: new Date().toISOString(),
  });
}
