/**
 * Zod Schemas for Intelligence Layer Communication
 * AGENT_BACKEND output validation
 */

import { z } from 'zod';

// Sentiment analysis
export const SentimentSchema = z.object({
  overall: z.enum(['BULLISH', 'NEUTRAL', 'BEARISH']),
  score: z.number().min(-1).max(1),
  drivers: z.array(z.string()),
});

export type Sentiment = z.infer<typeof SentimentSchema>;

// Reasoning trace step
export const ReasoningStepSchema = z.object({
  step: z.number().int().positive(),
  thought: z.string(),
  confidence: z.number().min(0).max(1),
  timestamp: z.string().datetime(),
});

export type ReasoningStep = z.infer<typeof ReasoningStepSchema>;

// Pivot recommendation
export const PivotActionSchema = z.enum(['ACCELERATE', 'MAINTAIN', 'PIVOT', 'HALT']);
export const UrgencySchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);

export const PivotRecommendationSchema = z.object({
  action: PivotActionSchema,
  rationale: z.string().min(1),
  targetAudience: z.string().optional(),
  suggestedChannels: z.array(z.string()).optional(),
  urgency: UrgencySchema,
});

export type PivotRecommendation = z.infer<typeof PivotRecommendationSchema>;

// Full intelligence output
export const IntelligenceOutputSchema = z.object({
  distributionVelocity: z.number().min(0).max(100),
  pivotRecommendation: PivotRecommendationSchema.nullable(),
  reasoningTrace: z.array(ReasoningStepSchema),
  sentiment: SentimentSchema,
  timestamp: z.string().datetime(),
});

export type IntelligenceOutput = z.infer<typeof IntelligenceOutputSchema>;

// Intelligence request
export const IntelligenceRequestSchema = z.object({
  context: z.string().min(1).max(10000),
  focus: z.enum(['MARKET', 'DISTRIBUTION', 'SENTIMENT', 'FULL']).default('FULL'),
  includeReasoning: z.boolean().default(true),
});

export type IntelligenceRequest = z.infer<typeof IntelligenceRequestSchema>;

// Mood endpoint response
export const MoodResponseSchema = z.object({
  distributionVelocity: z.number().min(0).max(100),
  pivotRecommendation: PivotRecommendationSchema.nullable(),
  timestamp: z.string().datetime(),
});

export type MoodResponse = z.infer<typeof MoodResponseSchema>;
