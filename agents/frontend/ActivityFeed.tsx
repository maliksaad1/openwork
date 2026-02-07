'use client';

/**
 * AGENT_FRONTEND: Activity Feed Component
 * Live stream of agent activities
 */

import { useState, useEffect } from 'react';

interface Activity {
  id: string;
  agent: string;
  action: string;
  description: string;
  status: 'success' | 'pending' | 'failed';
  timestamp: string;
}

interface ActivityFeedProps {
  maxItems?: number;
  refreshInterval?: number;
}

const AGENT_COLORS: Record<string, string> = {
  'NF-Backend': 'text-purple-400',
  'NF-Contract': 'text-blue-400',
  'NF-Frontend': 'text-green-400',
  'NF-PM': 'text-yellow-400',
  'SYSTEM': 'text-neurafinity-electric',
};

const ACTION_ICONS: Record<string, string> = {
  'JOB_SCAN': '🔍',
  'OPPORTUNITY_ANALYSIS': '📊',
  'TREASURY_MONITOR': '💎',
  'DASHBOARD_RENDER': '📺',
  'STATUS_CHECK': '✅',
  'BID_SUBMITTED': '🎯',
  'JOB_COMPLETED': '🏆',
  'PAYMENT_RECEIVED': '💰',
};

const STATUS_STYLES: Record<string, string> = {
  success: 'bg-green-500/20 text-green-400',
  pending: 'bg-yellow-500/20 text-yellow-400',
  failed: 'bg-red-500/20 text-red-400',
};

export function ActivityFeed({ maxItems = 10, refreshInterval = 30000 }: ActivityFeedProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchActivities = async () => {
    try {
      const response = await fetch('/api/activity');
      if (response.ok) {
        const data = await response.json();
        setActivities(data.activities.slice(0, maxItems));
      }
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();

    // Auto-refresh
    const interval = setInterval(fetchActivities, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval, maxItems]);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return date.toLocaleTimeString();
  };

  if (isLoading) {
    return (
      <div className="bg-neurafinity-navy-light rounded-lg border border-neurafinity-slate p-6">
        <h3 className="text-lg font-semibold text-neurafinity-silver-light mb-4">
          Activity Feed
        </h3>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-12 bg-neurafinity-navy rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-neurafinity-navy-light rounded-lg border border-neurafinity-slate p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-neurafinity-silver-light">
          Activity Feed
        </h3>
        <span className="text-xs text-neurafinity-silver-dark">
          Live • {activities.length} events
        </span>
      </div>

      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        {activities.length === 0 ? (
          <p className="text-sm text-neurafinity-silver-dark text-center py-4">
            No recent activity
          </p>
        ) : (
          activities.map((activity, index) => (
            <div
              key={activity.id}
              className={`
                p-3 bg-neurafinity-navy rounded-lg border border-neurafinity-slate
                transition-all duration-300 hover:border-neurafinity-electric/50
                ${index === 0 ? 'animate-pulse-once' : ''}
              `}
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <span className="text-lg">
                  {ACTION_ICONS[activity.action] || '⚡'}
                </span>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-sm font-semibold ${AGENT_COLORS[activity.agent] || 'text-neurafinity-silver'}`}>
                      {activity.agent}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_STYLES[activity.status]}`}>
                      {activity.status}
                    </span>
                  </div>
                  <p className="text-sm text-neurafinity-silver truncate">
                    {activity.description}
                  </p>
                </div>

                {/* Time */}
                <span className="text-xs text-neurafinity-silver-dark whitespace-nowrap">
                  {formatTime(activity.timestamp)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Auto-refresh indicator */}
      <div className="mt-4 pt-3 border-t border-neurafinity-slate flex items-center justify-between text-xs text-neurafinity-silver-dark">
        <span>Auto-refreshing every {refreshInterval / 1000}s</span>
        <button
          onClick={fetchActivities}
          className="text-neurafinity-electric hover:underline"
        >
          Refresh now
        </button>
      </div>
    </div>
  );
}

export default ActivityFeed;
