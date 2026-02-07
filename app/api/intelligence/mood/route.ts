/**
 * GET /api/intelligence/mood
 * Returns DistributionVelocity score and PivotRecommendation
 */

import { NextResponse } from 'next/server';
import { MoodResponseSchema } from '@/lib/schemas/intelligence.schema';

// Mock intelligence data for demo (replace with actual Kimi integration)
function generateMockIntelligence() {
  const velocity = Math.random() * 40 + 50; // 50-90 range
  const sentimentScore = Math.random() * 0.6 + 0.2; // 0.2-0.8 range

  let action: 'ACCELERATE' | 'MAINTAIN' | 'PIVOT' | 'HALT';
  let urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

  if (velocity >= 80) {
    action = 'ACCELERATE';
    urgency = 'HIGH';
  } else if (velocity >= 50) {
    action = 'MAINTAIN';
    urgency = 'MEDIUM';
  } else if (velocity >= 25) {
    action = 'PIVOT';
    urgency = 'HIGH';
  } else {
    action = 'HALT';
    urgency = 'CRITICAL';
  }

  // Generate reasoning trace
  const reasoningSteps = [
    `Analyzing market conditions and distribution patterns...`,
    `Current velocity at ${velocity.toFixed(1)}% indicates ${velocity >= 60 ? 'healthy' : 'concerning'} momentum.`,
    `Sentiment analysis shows ${sentimentScore > 0.5 ? 'positive' : 'neutral'} market signals.`,
    `Evaluating channel performance across organic and paid acquisition.`,
    `Recommending ${action.toLowerCase()} strategy based on composite analysis.`,
  ];

  const reasoningTrace = reasoningSteps.map((thought, index) => ({
    step: index + 1,
    thought,
    confidence: 0.6 + Math.random() * 0.35,
    timestamp: new Date().toISOString(),
  }));

  return {
    distributionVelocity: velocity,
    pivotRecommendation: {
      action,
      rationale: `Distribution velocity at ${velocity.toFixed(1)}% with ${sentimentScore > 0.5 ? 'bullish' : 'neutral'} sentiment. ${action === 'ACCELERATE' ? 'Conditions favorable for increased distribution spend.' : action === 'MAINTAIN' ? 'Continue current trajectory with optimization focus.' : 'Consider strategic reallocation to higher-performing channels.'}`,
      urgency,
      suggestedChannels: action === 'PIVOT'
        ? ['Organic Content', 'Community Building', 'SEO']
        : action === 'ACCELERATE'
        ? ['Paid Acquisition', 'Influencer Partnerships', 'PR Blitz']
        : undefined,
    },
    reasoningTrace,
    sentiment: {
      overall: sentimentScore > 0.5 ? 'BULLISH' : sentimentScore > 0.2 ? 'NEUTRAL' : 'BEARISH',
      score: sentimentScore * 2 - 1, // Convert to -1 to 1 range
      drivers: ['market_momentum', 'engagement_metrics', 'reach_growth'],
    },
    timestamp: new Date().toISOString(),
  };
}

export async function GET() {
  try {
    // In production, this would call the actual Kimi k2.5 API
    // const agent = getIntelligenceAgent();
    // agent.setContext('Current market conditions and distribution metrics');
    // const result = await agent.analyze();

    // For demo, use mock data
    const result = generateMockIntelligence();

    // Validate response
    const validated = MoodResponseSchema.parse({
      distributionVelocity: result.distributionVelocity,
      pivotRecommendation: result.pivotRecommendation,
      timestamp: result.timestamp,
    });

    return NextResponse.json({
      ...validated,
      reasoningTrace: result.reasoningTrace,
      sentiment: result.sentiment,
    });
  } catch (error) {
    console.error('Intelligence API Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate intelligence',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
