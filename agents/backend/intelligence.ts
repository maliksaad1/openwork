/**
 * AGENT_BACKEND: Intelligence Layer
 * Market Intelligence & Distribution Gap Analysis
 */

import { getKimiClient } from '@/lib/nvidia/client';
import { processKimiResponse } from '@/lib/nvidia/reasoning';
import type { IntelligenceOutput } from '@/lib/nvidia/types';
import { IntelligenceOutputSchema } from '@/lib/schemas/intelligence.schema';

const INTELLIGENCE_SYSTEM_PROMPT = `You are a Market Intelligence Analyst for NeuraFinity, a high-velocity distribution engine.

Your task is to analyze market conditions and distribution opportunities. Focus on:
1. Distribution Velocity - How fast can we reach our target audience?
2. Market Sentiment - What is the overall market mood?
3. Gap Analysis - Where are the untapped distribution channels?
4. Pivot Opportunities - Should we accelerate, maintain, pivot, or halt?

CRITICAL: Use deep reasoning. Think step by step. Justify every conclusion.

Output your analysis as structured JSON with:
- sentiment: { overall: "BULLISH"|"NEUTRAL"|"BEARISH", score: -1 to 1, drivers: [] }
- distributionVelocity: 0-100 score
- pivotRecommendation: { action, rationale, urgency }`;

export class IntelligenceAgent {
  private context: string = '';

  /**
   * Set market context for analysis
   */
  setContext(context: string): void {
    this.context = context;
  }

  /**
   * Execute full intelligence analysis with deep reasoning
   */
  async analyze(additionalContext?: string): Promise<IntelligenceOutput> {
    const client = getKimiClient();

    const userPrompt = `
Analyze the following market context and provide intelligence:

CONTEXT:
${this.context}

${additionalContext ? `ADDITIONAL SIGNALS:\n${additionalContext}` : ''}

Provide comprehensive analysis with reasoning trace.
`;

    const response = await client.reason(INTELLIGENCE_SYSTEM_PROMPT, userPrompt);
    const output = processKimiResponse(response);

    // Validate output against schema
    const validated = IntelligenceOutputSchema.parse(output);
    return validated;
  }

  /**
   * Quick sentiment check without full analysis
   */
  async quickSentiment(content: string): Promise<{
    overall: 'BULLISH' | 'NEUTRAL' | 'BEARISH';
    score: number;
  }> {
    const client = getKimiClient();
    const result = await client.analyzeSentiment(content);
    return { overall: result.sentiment, score: result.score };
  }

  /**
   * Stream reasoning for real-time Cognitive Pulse
   */
  async *streamAnalysis(context: string): AsyncGenerator<{
    type: 'reasoning' | 'content';
    text: string;
  }> {
    const client = getKimiClient();

    for await (const chunk of client.streamReason(
      INTELLIGENCE_SYSTEM_PROMPT,
      `Analyze: ${context}`
    )) {
      const delta = chunk.choices[0]?.delta;
      if (delta?.reasoning_content) {
        yield { type: 'reasoning', text: delta.reasoning_content };
      }
      if (delta?.content) {
        yield { type: 'content', text: delta.content };
      }
    }
  }
}

// Singleton instance
let agentInstance: IntelligenceAgent | null = null;

export function getIntelligenceAgent(): IntelligenceAgent {
  if (!agentInstance) {
    agentInstance = new IntelligenceAgent();
  }
  return agentInstance;
}
