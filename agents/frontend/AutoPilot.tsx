'use client';

/**
 * Auto-Pilot Component
 * Toggle automatic job bidding for NeuraFinity
 */

import { useState, useEffect, useRef } from 'react';

interface BidResult {
  jobId: string;
  jobTitle: string;
  agent: string;
  bidAmount: number;
  success: boolean;
  message: string;
}

interface AutoPilotStatus {
  isRunning: boolean;
  lastRun: string | null;
  totalBids: number;
  successfulBids: number;
  failedBids: number;
  recentResults: BidResult[];
}

interface AutoPilotProps {
  onBidComplete?: () => void;
}

export function AutoPilot({ onBidComplete }: AutoPilotProps) {
  const [enabled, setEnabled] = useState(false);
  const [status, setStatus] = useState<AutoPilotStatus>({
    isRunning: false,
    lastRun: null,
    totalBids: 0,
    successfulBids: 0,
    failedBids: 0,
    recentResults: [],
  });
  const [settings, setSettings] = useState({
    minMatchScore: 50,
    maxBids: 3,
    bidDiscount: 15, // percentage
    intervalMinutes: 5,
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Run auto-pilot cycle
  const runCycle = async () => {
    if (status.isRunning) return;

    setStatus(prev => ({ ...prev, isRunning: true }));

    try {
      const response = await fetch('/api/autopilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          minMatchScore: settings.minMatchScore,
          maxBids: settings.maxBids,
          bidDiscount: settings.bidDiscount / 100,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const successCount = data.results.filter((r: BidResult) => r.success).length;
        const failCount = data.results.filter((r: BidResult) => !r.success).length;

        setStatus(prev => ({
          ...prev,
          lastRun: new Date().toISOString(),
          totalBids: prev.totalBids + data.results.length,
          successfulBids: prev.successfulBids + successCount,
          failedBids: prev.failedBids + failCount,
          recentResults: [...data.results, ...prev.recentResults].slice(0, 10),
        }));

        // Refresh parent data
        if (onBidComplete) {
          onBidComplete();
        }
      }
    } catch (error) {
      console.error('Auto-pilot cycle failed:', error);
    } finally {
      setStatus(prev => ({ ...prev, isRunning: false }));
    }
  };

  // Toggle auto-pilot
  const toggleAutoPilot = () => {
    if (enabled) {
      // Disable
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setEnabled(false);
    } else {
      // Enable - run immediately then set interval
      setEnabled(true);
      runCycle();
      intervalRef.current = setInterval(runCycle, settings.intervalMinutes * 60 * 1000);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Update interval when settings change
  useEffect(() => {
    if (enabled && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = setInterval(runCycle, settings.intervalMinutes * 60 * 1000);
    }
  }, [settings.intervalMinutes, enabled]);

  return (
    <div className="bg-neurafinity-navy-light rounded-lg border border-neurafinity-slate p-6">
      {/* Header with toggle */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-neurafinity-silver-light">
            Auto-Pilot
          </h3>
          <p className="text-xs text-neurafinity-silver-dark mt-1">
            Automatically find and bid on jobs
          </p>
        </div>

        {/* Toggle switch */}
        <button
          onClick={toggleAutoPilot}
          className={`
            relative w-14 h-7 rounded-full transition-colors duration-300
            ${enabled ? 'bg-neurafinity-electric' : 'bg-neurafinity-slate'}
          `}
        >
          <span
            className={`
              absolute top-1 w-5 h-5 bg-white rounded-full transition-transform duration-300
              ${enabled ? 'translate-x-8' : 'translate-x-1'}
            `}
          />
        </button>
      </div>

      {/* Status indicator */}
      <div className={`
        p-4 rounded-lg mb-4 border
        ${enabled
          ? status.isRunning
            ? 'bg-yellow-500/10 border-yellow-500 text-yellow-400'
            : 'bg-green-500/10 border-green-500 text-green-400'
          : 'bg-neurafinity-navy border-neurafinity-slate text-neurafinity-silver-dark'
        }
      `}>
        <div className="flex items-center gap-3">
          <span className={`w-3 h-3 rounded-full ${
            enabled
              ? status.isRunning ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'
              : 'bg-gray-500'
          }`} />
          <span className="font-semibold">
            {enabled
              ? status.isRunning ? 'Searching for jobs...' : 'Active - Watching for jobs'
              : 'Disabled'
            }
          </span>
        </div>
        {enabled && status.lastRun && (
          <p className="text-xs mt-2 opacity-75">
            Last scan: {new Date(status.lastRun).toLocaleTimeString()}
          </p>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <div className="bg-neurafinity-navy rounded-lg p-3 text-center">
          <p className="text-xl font-mono text-neurafinity-electric">
            {status.totalBids}
          </p>
          <p className="text-xs text-neurafinity-silver-dark">Total</p>
        </div>
        <div className="bg-neurafinity-navy rounded-lg p-3 text-center">
          <p className="text-xl font-mono text-green-400">
            {status.successfulBids}
          </p>
          <p className="text-xs text-neurafinity-silver-dark">Sent</p>
        </div>
        <div className="bg-neurafinity-navy rounded-lg p-3 text-center">
          <p className="text-xl font-mono text-red-400">
            {status.failedBids}
          </p>
          <p className="text-xs text-neurafinity-silver-dark">Failed</p>
        </div>
        <div className="bg-neurafinity-navy rounded-lg p-3 text-center">
          <p className="text-xl font-mono text-yellow-400">
            {settings.intervalMinutes}m
          </p>
          <p className="text-xs text-neurafinity-silver-dark">Interval</p>
        </div>
      </div>

      {/* Settings */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-neurafinity-silver">Min match score</span>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="30"
              max="80"
              value={settings.minMatchScore}
              onChange={(e) => setSettings(s => ({ ...s, minMatchScore: parseInt(e.target.value) }))}
              className="w-24 h-2 bg-neurafinity-slate rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-sm font-mono text-neurafinity-electric w-10">
              {settings.minMatchScore}%
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-neurafinity-silver">Max bids per cycle</span>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="1"
              max="10"
              value={settings.maxBids}
              onChange={(e) => setSettings(s => ({ ...s, maxBids: parseInt(e.target.value) }))}
              className="w-24 h-2 bg-neurafinity-slate rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-sm font-mono text-neurafinity-electric w-10">
              {settings.maxBids}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-neurafinity-silver">Bid discount</span>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="5"
              max="30"
              value={settings.bidDiscount}
              onChange={(e) => setSettings(s => ({ ...s, bidDiscount: parseInt(e.target.value) }))}
              className="w-24 h-2 bg-neurafinity-slate rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-sm font-mono text-neurafinity-electric w-10">
              {settings.bidDiscount}%
            </span>
          </div>
        </div>
      </div>

      {/* Manual run button */}
      <button
        onClick={runCycle}
        disabled={status.isRunning}
        className="w-full py-2 bg-neurafinity-electric text-neurafinity-navy font-semibold rounded-lg
                   hover:shadow-electric transition-all disabled:opacity-50"
      >
        {status.isRunning ? 'Scanning...' : 'Run Now'}
      </button>

      {/* Recent results */}
      {status.recentResults.length > 0 && (
        <div className="mt-4 pt-4 border-t border-neurafinity-slate">
          <p className="text-sm font-semibold text-neurafinity-silver mb-2">Recent Bids</p>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {status.recentResults.map((result, i) => (
              <div
                key={`${result.jobId}-${i}`}
                className={`
                  p-2 rounded text-xs
                  ${result.success
                    ? 'bg-green-500/10 text-green-400'
                    : 'bg-red-500/10 text-red-400'
                  }
                `}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{result.agent}</span>
                  <span>${result.bidAmount}</span>
                </div>
                <p className="truncate opacity-75">{result.jobTitle}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default AutoPilot;
