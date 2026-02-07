/**
 * POST /api/webhook/openwork
 * Webhook listener for Openwork Mission events
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Webhook event schema
const WebhookEventSchema = z.object({
  event: z.enum([
    'team.created',
    'team.joined',
    'team.status_changed',
    'task.assigned',
    'task.completed',
    'submission.received',
    'token.expiring',
    'deploy.status',
  ]),
  timestamp: z.string().datetime(),
  teamId: z.string().optional(),
  payload: z.record(z.unknown()),
});

type WebhookEvent = z.infer<typeof WebhookEventSchema>;

// Event handlers
async function handleTeamCreated(payload: Record<string, unknown>) {
  console.log('[WEBHOOK] Team created:', payload);
  // Initialize team resources
}

async function handleTeamJoined(payload: Record<string, unknown>) {
  console.log('[WEBHOOK] Member joined team:', payload);
  // Update squadron status
}

async function handleTaskAssigned(payload: Record<string, unknown>) {
  console.log('[WEBHOOK] Task assigned:', payload);
  // Route to appropriate agent
}

async function handleTokenExpiring(payload: Record<string, unknown>) {
  console.log('[WEBHOOK] Token expiring:', payload);
  // Trigger token refresh
}

async function handleDeployStatus(payload: Record<string, unknown>) {
  console.log('[WEBHOOK] Deploy status:', payload);
  // Update deployment status
}

export async function POST(request: NextRequest) {
  try {
    // Parse and validate webhook
    const body = await request.json();
    const event = WebhookEventSchema.parse(body);

    // Log event
    console.log(`[WEBHOOK] Received: ${event.event} at ${event.timestamp}`);

    // Route to appropriate handler
    switch (event.event) {
      case 'team.created':
        await handleTeamCreated(event.payload);
        break;
      case 'team.joined':
        await handleTeamJoined(event.payload);
        break;
      case 'task.assigned':
        await handleTaskAssigned(event.payload);
        break;
      case 'token.expiring':
        await handleTokenExpiring(event.payload);
        break;
      case 'deploy.status':
        await handleDeployStatus(event.payload);
        break;
      default:
        console.log(`[WEBHOOK] Unhandled event type: ${event.event}`);
    }

    return NextResponse.json({
      success: true,
      event: event.event,
      processed: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[WEBHOOK] Error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid webhook payload',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Webhook processing failed',
      },
      { status: 500 }
    );
  }
}

// Verify webhook signature (optional security)
export async function OPTIONS() {
  return NextResponse.json(
    { methods: ['POST'] },
    {
      headers: {
        'Access-Control-Allow-Origin': 'https://www.openwork.bot',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    }
  );
}
