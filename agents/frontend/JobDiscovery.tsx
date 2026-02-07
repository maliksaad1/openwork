'use client';

/**
 * AGENT_FRONTEND: Job Discovery Component
 * Shows available jobs and allows bidding
 */

import { useState, useEffect } from 'react';

interface Job {
  id: string;
  title: string;
  description: string;
  budget: number;
  deadline: string;
  skills: string[];
  matchScore: number;
  recommendedAgent: string;
  bidStrategy: string;
}

interface JobDiscoveryProps {
  onBidSubmit?: (jobId: string, agent: string, amount: number) => void;
}

const AGENT_NAMES: Record<string, string> = {
  BACKEND: 'NF-Backend',
  CONTRACT: 'NF-Contract',
  FRONTEND: 'NF-Frontend',
  PM: 'NF-PM',
};

export function JobDiscovery({ onBidSubmit }: JobDiscoveryProps) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [biddingJob, setBiddingJob] = useState<string | null>(null);

  const fetchJobs = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/jobs/discover');
      if (response.ok) {
        const data = await response.json();
        setJobs(data.jobs || []);
      }
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    // Refresh every 2 minutes
    const interval = setInterval(fetchJobs, 120000);
    return () => clearInterval(interval);
  }, []);

  const handleBid = async (job: Job) => {
    setBiddingJob(job.id);
    try {
      const bidAmount = Math.round(job.budget * 0.85); // 15% under budget
      const proposal = `NeuraFinity Squadron ready to execute. Our ${AGENT_NAMES[job.recommendedAgent]} agent specializes in these exact skills. Deep reasoning powered by Kimi k2.5. Estimated delivery: 5-7 days.`;

      const response = await fetch('/api/jobs/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: job.id,
          agentType: job.recommendedAgent,
          bidAmount,
          proposal,
        }),
      });

      if (response.ok) {
        onBidSubmit?.(job.id, job.recommendedAgent, bidAmount);
        // Log activity
        await fetch('/api/activity', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agent: AGENT_NAMES[job.recommendedAgent],
            action: 'BID_SUBMITTED',
            description: `Bid $${bidAmount} on "${job.title}"`,
            status: 'success',
          }),
        });
      }
    } catch (error) {
      console.error('Failed to submit bid:', error);
    } finally {
      setBiddingJob(null);
    }
  };

  const getMatchColor = (score: number) => {
    if (score >= 80) return 'text-green-400 bg-green-500/20';
    if (score >= 60) return 'text-yellow-400 bg-yellow-500/20';
    if (score >= 40) return 'text-orange-400 bg-orange-500/20';
    return 'text-red-400 bg-red-500/20';
  };

  if (isLoading) {
    return (
      <div className="bg-neurafinity-navy-light rounded-lg border border-neurafinity-slate p-6">
        <h3 className="text-lg font-semibold text-neurafinity-silver-light mb-4">
          Job Discovery
        </h3>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-neurafinity-navy rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-neurafinity-navy-light rounded-lg border border-neurafinity-slate p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-neurafinity-silver-light">
          Job Discovery
        </h3>
        <div className="flex items-center gap-3">
          <span className="text-xs text-neurafinity-silver-dark">
            {jobs.length} opportunities
          </span>
          <button
            onClick={fetchJobs}
            className="text-xs text-neurafinity-electric hover:underline"
          >
            Scan
          </button>
        </div>
      </div>

      <div className="space-y-3 max-h-[500px] overflow-y-auto">
        {jobs.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-neurafinity-silver-dark mb-2">No jobs found</p>
            <p className="text-xs text-neurafinity-silver-dark">
              Agents are continuously scanning for opportunities
            </p>
          </div>
        ) : (
          jobs.slice(0, 5).map(job => (
            <div
              key={job.id}
              className="p-4 bg-neurafinity-navy rounded-lg border border-neurafinity-slate
                         hover:border-neurafinity-electric/50 transition-all"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-semibold text-neurafinity-silver-light truncate">
                    {job.title || 'Untitled Job'}
                  </h4>
                  <p className="text-xs text-neurafinity-silver-dark mt-1">
                    Budget: <span className="text-neurafinity-electric">${job.budget || 'TBD'}</span>
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${getMatchColor(job.matchScore)}`}>
                  {job.matchScore}% match
                </span>
              </div>

              {/* Description */}
              <p className="text-sm text-neurafinity-silver line-clamp-2 mb-3">
                {job.description || 'No description available'}
              </p>

              {/* Skills */}
              {job.skills && job.skills.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {job.skills.slice(0, 4).map(skill => (
                    <span
                      key={skill}
                      className="text-xs px-2 py-0.5 bg-neurafinity-slate rounded text-neurafinity-silver"
                    >
                      {skill}
                    </span>
                  ))}
                  {job.skills.length > 4 && (
                    <span className="text-xs text-neurafinity-silver-dark">
                      +{job.skills.length - 4} more
                    </span>
                  )}
                </div>
              )}

              {/* Strategy & Action */}
              <div className="flex items-center justify-between pt-3 border-t border-neurafinity-slate">
                <div className="text-xs text-neurafinity-silver-dark">
                  <span className="text-neurafinity-electric">{AGENT_NAMES[job.recommendedAgent]}</span>
                  {' '} recommended
                </div>
                <button
                  onClick={() => handleBid(job)}
                  disabled={biddingJob === job.id || job.matchScore < 40}
                  className={`
                    px-3 py-1.5 text-xs font-semibold rounded
                    ${job.matchScore >= 40
                      ? 'bg-neurafinity-electric text-neurafinity-navy hover:shadow-electric'
                      : 'bg-neurafinity-slate text-neurafinity-silver-dark cursor-not-allowed'
                    }
                    transition-all disabled:opacity-50
                  `}
                >
                  {biddingJob === job.id ? 'Bidding...' : 'Auto-Bid'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default JobDiscovery;
