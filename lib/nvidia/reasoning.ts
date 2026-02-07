/**
 * Deep Reasoning Processor
 * Transforms Kimi k2.5 output into structured Intelligence
 */

import type {
  KimiResponse,
  ReasoningTrace,
  IntelligenceOutput,
  PivotRecommendation,
  SentimentAnalysis,
} from './types';

/**
 * Parse reasoning_content into structured trace steps
 */
export function parseReasoningTrace(reasoningContent: string): ReasoningTrace[] {
  const traces: ReasoningTrace[] = [];
  const lines = reasoningContent.split('\n').filter(Boolean);

  let stepIndex = 0;
  for (const line of lines) {
    stepIndex++;
    traces.push({
      step: stepIndex,
      thought: line.trim(),
      confidence: extractConfidence(line),
      timestamp: new Date().toISOString(),
    });
  }

  return traces;
}

/**
 * Extract confidence level from reasoning text (heuristic)
 */
function extractConfidence(text: string): number {
  const lowerText = text.toLowerCase();

  // High confidence indicators
  if (lowerText.includes('certainly') || lowerText.includes('definitely') || lowerText.includes('clearly')) {
    return 0.9;
  }

  // Medium-high confidence
  if (lowerText.includes('likely') || lowerText.includes('probably') || lowerText.includes('appears')) {
    return 0.7;
  }

  // Medium confidence
  if (lowerText.includes('might') || lowerText.includes('could') || lowerText.includes('possibly')) {
    return 0.5;
  }

  // Low confidence
  if (lowerText.includes('uncertain') || lowerText.includes('unclear') || lowerText.includes('unsure')) {
    return 0.3;
  }

  return 0.6; // Default moderate confidence
}

/**
 * Calculate Distribution Velocity from reasoning output
 */
export function calculateDistributionVelocity(
  reasoningTrace: ReasoningTrace[],
  sentiment: SentimentAnalysis
): number {
  // Base score from sentiment
  let velocity = ((sentiment.score + 1) / 2) * 50; // 0-50 from sentiment

  // Add confidence boost from reasoning
  const avgConfidence = reasoningTrace.reduce((sum, t) => sum + t.confidence, 0) / reasoningTrace.length;
  velocity += avgConfidence * 30; // 0-30 from confidence

  // Trace depth bonus (more reasoning = higher velocity potential)
  const depthBonus = Math.min(reasoningTrace.length / 10, 1) * 20; // 0-20 from depth
  velocity += depthBonus;

  return Math.min(Math.max(velocity, 0), 100); // Clamp 0-100
}

/**
 * Determine pivot recommendation based on velocity and sentiment
 */
export function determinePivotRecommendation(
  velocity: number,
  sentiment: SentimentAnalysis,
  reasoningContent: string
): PivotRecommendation {
  let action: PivotRecommendation['action'];
  let urgency: PivotRecommendation['urgency'];

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

  // Extract rationale from reasoning
  const rationale = reasoningContent.split('\n').slice(0, 2).join(' ') ||
    `Velocity at ${velocity.toFixed(1)}% with ${sentiment.overall} market sentiment`;

  return {
    action,
    rationale,
    urgency,
    suggestedChannels: deriveChannels(velocity, sentiment),
  };
}

/**
 * Suggest distribution channels based on analysis
 */
function deriveChannels(velocity: number, sentiment: SentimentAnalysis): string[] {
  const channels: string[] = [];

  if (velocity >= 70 && sentiment.overall === 'BULLISH') {
    channels.push('Paid Acquisition', 'Influencer Partnerships', 'PR Blitz');
  } else if (velocity >= 40) {
    channels.push('Organic Content', 'Community Building', 'SEO');
  } else {
    channels.push('Product Iteration', 'User Research', 'Retention Focus');
  }

  return channels;
}

/**
 * Process full Kimi response into Intelligence Output
 */
export function processKimiResponse(response: KimiResponse): IntelligenceOutput {
  const choice = response.choices[0];
  if (!choice) {
    throw new Error('No response choice from Kimi');
  }

  const reasoningContent = choice.message.reasoning_content ?? '';
  const content = choice.message.content ?? '';

  // Parse reasoning trace
  const reasoningTrace = parseReasoningTrace(reasoningContent);

  // Extract or infer sentiment
  let sentiment: SentimentAnalysis;
  try {
    const sentimentMatch = content.match(/\{[^}]*"sentiment"[^}]*\}/);
    if (sentimentMatch) {
      const parsed = JSON.parse(sentimentMatch[0]);
      sentiment = {
        overall: parsed.sentiment ?? 'NEUTRAL',
        score: parsed.score ?? 0,
        drivers: parsed.drivers ?? [],
      };
    } else {
      sentiment = inferSentimentFromReasoning(reasoningContent);
    }
  } catch {
    sentiment = inferSentimentFromReasoning(reasoningContent);
  }

  // Calculate velocity
  const distributionVelocity = calculateDistributionVelocity(reasoningTrace, sentiment);

  // Determine pivot recommendation
  const pivotRecommendation = determinePivotRecommendation(
    distributionVelocity,
    sentiment,
    reasoningContent
  );

  return {
    distributionVelocity,
    pivotRecommendation,
    reasoningTrace,
    sentiment,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Infer sentiment from reasoning text
 */
function inferSentimentFromReasoning(text: string): SentimentAnalysis {
  const lowerText = text.toLowerCase();

  const bullishTerms = ['growth', 'increase', 'positive', 'strong', 'momentum', 'opportunity'];
  const bearishTerms = ['decline', 'decrease', 'negative', 'weak', 'risk', 'concern'];

  let score = 0;
  const drivers: string[] = [];

  for (const term of bullishTerms) {
    if (lowerText.includes(term)) {
      score += 0.15;
      drivers.push(term);
    }
  }

  for (const term of bearishTerms) {
    if (lowerText.includes(term)) {
      score -= 0.15;
      drivers.push(`negative: ${term}`);
    }
  }

  score = Math.min(Math.max(score, -1), 1);

  let overall: SentimentAnalysis['overall'];
  if (score > 0.2) overall = 'BULLISH';
  else if (score < -0.2) overall = 'BEARISH';
  else overall = 'NEUTRAL';

  return { overall, score, drivers };
}
