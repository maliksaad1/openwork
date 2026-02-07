/**
 * POST /api/treasury/spend
 * Process treasury spend requests with oversight guardrails
 */

import { NextRequest, NextResponse } from 'next/server';
import { SpendRequestSchema } from '@/lib/schemas/treasury.schema';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const spendRequest = SpendRequestSchema.parse(body);

    // Mock treasury balance for demo
    const treasuryBalance = 1250000n * 10n ** 18n;
    const spendAmount = BigInt(spendRequest.amount);
    const spendPercentage = Number(spendAmount) / Number(treasuryBalance);

    // Check if oversight is required (>5% of treasury)
    const OVERSIGHT_THRESHOLD = 0.05;
    const requiresOversight = spendPercentage > OVERSIGHT_THRESHOLD;

    if (requiresOversight) {
      // Create oversight request
      const oversightRequest = {
        id: `oversight_${Date.now()}`,
        spendRequest,
        treasuryPercentage: spendPercentage,
        createdAt: new Date().toISOString(),
        status: 'PENDING',
      };

      return NextResponse.json({
        success: false,
        requiresOversight: true,
        oversightRequest,
        message: `Transaction of ${(spendPercentage * 100).toFixed(2)}% of treasury requires Human Pilot approval.`,
      });
    }

    // Process the spend (in production, this would execute the transaction)
    return NextResponse.json({
      success: true,
      requiresOversight: false,
      transaction: {
        type: spendRequest.type,
        amount: spendRequest.amount,
        recipient: spendRequest.recipient,
        status: 'PENDING_EXECUTION',
        timestamp: new Date().toISOString(),
      },
      message: 'Spend request approved and queued for execution.',
    });
  } catch (error) {
    console.error('[TREASURY] Spend Error:', error);

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid spend request', details: error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to process spend request' },
      { status: 500 }
    );
  }
}
