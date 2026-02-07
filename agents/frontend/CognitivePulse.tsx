'use client';

/**
 * AGENT_FRONTEND: Cognitive Pulse Component
 * Live stream of Kimi k2.5's reasoning process
 */

import { useState, useEffect, useRef } from 'react';

interface ReasoningStep {
  step: number;
  thought: string;
  confidence: number;
  timestamp: string;
}

interface CognitivePulseProps {
  isStreaming?: boolean;
  reasoningTrace?: ReasoningStep[];
  onNewThought?: (thought: ReasoningStep) => void;
}

export function CognitivePulse({
  isStreaming = false,
  reasoningTrace = [],
  onNewThought,
}: CognitivePulseProps) {
  const [thoughts, setThoughts] = useState<ReasoningStep[]>(reasoningTrace);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest thought
  useEffect(() => {
    if (containerRef.current && thoughts.length > 0) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [thoughts]);

  // Animate new thoughts
  useEffect(() => {
    if (thoughts.length > 0) {
      setActiveIndex(thoughts.length - 1);
      const timer = setTimeout(() => setActiveIndex(null), 1000);
      return () => clearTimeout(timer);
    }
  }, [thoughts.length]);

  // Update from props
  useEffect(() => {
    setThoughts(reasoningTrace);
  }, [reasoningTrace]);

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.8) return 'text-neurafinity-electric';
    if (confidence >= 0.6) return 'text-velocity-medium';
    if (confidence >= 0.4) return 'text-neurafinity-silver';
    return 'text-velocity-low';
  };

  const getConfidenceBar = (confidence: number): string => {
    if (confidence >= 0.8) return 'bg-neurafinity-electric';
    if (confidence >= 0.6) return 'bg-velocity-medium';
    if (confidence >= 0.4) return 'bg-neurafinity-silver';
    return 'bg-velocity-low';
  };

  return (
    <div className="bg-neurafinity-navy-light rounded-lg border border-neurafinity-slate p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-3 h-3 rounded-full ${
              isStreaming
                ? 'bg-neurafinity-electric animate-pulse-glow'
                : 'bg-neurafinity-silver-dark'
            }`}
          />
          <h3 className="text-lg font-semibold text-neurafinity-silver-light">
            Cognitive Pulse
          </h3>
        </div>
        <span className="text-xs font-mono text-neurafinity-silver">
          {thoughts.length} reasoning steps
        </span>
      </div>

      {/* Streaming indicator */}
      {isStreaming && (
        <div className="mb-4 flex items-center gap-2">
          <div className="h-1 flex-1 bg-neurafinity-slate rounded-full overflow-hidden">
            <div
              className="h-full bg-cognitive-gradient bg-[length:200%_100%] animate-cognitive-stream"
            />
          </div>
          <span className="text-xs text-neurafinity-electric">REASONING</span>
        </div>
      )}

      {/* Thought stream */}
      <div
        ref={containerRef}
        className="space-y-3 max-h-80 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-neurafinity-slate"
      >
        {thoughts.length === 0 ? (
          <div className="text-center py-8 text-neurafinity-silver">
            <p className="text-sm">Awaiting cognitive input...</p>
            <p className="text-xs mt-2 opacity-50">
              Deep reasoning will appear here
            </p>
          </div>
        ) : (
          thoughts.map((thought, index) => (
            <div
              key={`${thought.step}-${thought.timestamp}`}
              className={`
                relative pl-4 py-2 border-l-2 transition-all duration-300
                ${index === activeIndex
                  ? 'border-neurafinity-electric bg-neurafinity-electric-glow'
                  : 'border-neurafinity-slate'
                }
              `}
            >
              {/* Step number */}
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono text-neurafinity-electric">
                  STEP {thought.step}
                </span>
                <span className={`text-xs font-mono ${getConfidenceColor(thought.confidence)}`}>
                  {(thought.confidence * 100).toFixed(0)}% conf
                </span>
              </div>

              {/* Thought content */}
              <p className="text-sm text-neurafinity-silver-light leading-relaxed">
                {thought.thought}
              </p>

              {/* Confidence bar */}
              <div className="mt-2 h-1 bg-neurafinity-slate rounded-full overflow-hidden">
                <div
                  className={`h-full ${getConfidenceBar(thought.confidence)} transition-all duration-500`}
                  style={{ width: `${thought.confidence * 100}%` }}
                />
              </div>
            </div>
          ))
        )}
      </div>

      {/* Summary stats */}
      {thoughts.length > 0 && (
        <div className="mt-4 pt-4 border-t border-neurafinity-slate grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-xs text-neurafinity-silver">Avg Confidence</p>
            <p className="text-lg font-mono text-neurafinity-electric">
              {(
                (thoughts.reduce((sum, t) => sum + t.confidence, 0) / thoughts.length) *
                100
              ).toFixed(0)}%
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-neurafinity-silver">Depth</p>
            <p className="text-lg font-mono text-neurafinity-silver-light">
              {thoughts.length}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-neurafinity-silver">Status</p>
            <p className="text-lg font-mono text-neurafinity-electric">
              {isStreaming ? 'LIVE' : 'IDLE'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default CognitivePulse;
