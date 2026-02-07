/**
 * Human Pilot Oversight Module
 * Manages approval workflows for high-value transactions
 */

import type { OversightRequest } from '@/lib/base/types';

export interface OversightConfig {
  thresholdPercentage: number; // 0.05 = 5%
  expirationMinutes: number;
  notificationChannels: string[];
}

export interface OversightNotification {
  requestId: string;
  type: 'CREATED' | 'REMINDER' | 'EXPIRING' | 'RESOLVED';
  message: string;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH';
  timestamp: string;
}

const DEFAULT_CONFIG: OversightConfig = {
  thresholdPercentage: 0.05,
  expirationMinutes: 60,
  notificationChannels: ['dashboard', 'webhook'],
};

// Notification queue
const notificationQueue: OversightNotification[] = [];

export class OversightController {
  private config: OversightConfig;

  constructor(config?: Partial<OversightConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Create notification for new oversight request
   */
  notifyNewRequest(request: OversightRequest): void {
    const notification: OversightNotification = {
      requestId: request.id,
      type: 'CREATED',
      message: `Treasury spend requires Human Pilot approval: ${(request.treasuryPercentage * 100).toFixed(2)}% of treasury`,
      urgency: request.treasuryPercentage > 0.1 ? 'HIGH' : 'MEDIUM',
      timestamp: new Date().toISOString(),
    };

    notificationQueue.push(notification);
    this.sendNotification(notification);
  }

  /**
   * Send notification through configured channels
   */
  private sendNotification(notification: OversightNotification): void {
    // In production, integrate with:
    // - Dashboard WebSocket
    // - Webhook endpoints
    // - Email/SMS services
    console.log(`[OVERSIGHT] ${notification.type}: ${notification.message}`);
  }

  /**
   * Check for expiring requests and send reminders
   */
  checkExpirations(pendingRequests: OversightRequest[]): void {
    const now = new Date();
    const expirationThreshold = this.config.expirationMinutes * 60 * 1000;

    for (const request of pendingRequests) {
      const createdAt = new Date(request.createdAt);
      const elapsed = now.getTime() - createdAt.getTime();
      const remaining = expirationThreshold - elapsed;

      // Reminder at 50% and 25% time remaining
      if (remaining < expirationThreshold * 0.25) {
        this.notifyExpiring(request, 'CRITICAL');
      } else if (remaining < expirationThreshold * 0.5) {
        this.notifyExpiring(request, 'WARNING');
      }
    }
  }

  /**
   * Notify about expiring request
   */
  private notifyExpiring(request: OversightRequest, level: 'WARNING' | 'CRITICAL'): void {
    const notification: OversightNotification = {
      requestId: request.id,
      type: 'EXPIRING',
      message: `Oversight request expiring soon - ${level}`,
      urgency: level === 'CRITICAL' ? 'HIGH' : 'MEDIUM',
      timestamp: new Date().toISOString(),
    };

    notificationQueue.push(notification);
    this.sendNotification(notification);
  }

  /**
   * Get pending notifications
   */
  getNotifications(limit?: number): OversightNotification[] {
    const slice = limit ? notificationQueue.slice(-limit) : notificationQueue;
    return [...slice];
  }

  /**
   * Clear notifications for resolved request
   */
  clearNotifications(requestId: string): void {
    // Mark as resolved
    const notification: OversightNotification = {
      requestId,
      type: 'RESOLVED',
      message: 'Oversight request has been resolved',
      urgency: 'LOW',
      timestamp: new Date().toISOString(),
    };
    notificationQueue.push(notification);
  }

  /**
   * Get configuration
   */
  getConfig(): OversightConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<OversightConfig>): void {
    this.config = { ...this.config, ...updates };
  }
}

// Singleton
let controllerInstance: OversightController | null = null;

export function getOversightController(): OversightController {
  if (!controllerInstance) {
    controllerInstance = new OversightController();
  }
  return controllerInstance;
}
