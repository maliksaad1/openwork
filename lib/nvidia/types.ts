/**
 * NVIDIA NIM / Kimi k2.5 Type Definitions
 * Deep Reasoning Engine for Market Intelligence
 */

export interface KimiConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  thinking: boolean;
  temperature: number;
}

export interface ReasoningTrace {
  step: number;
  thought: string;
  confidence: number;
  timestamp: string;
}

export interface KimiMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface KimiRequest {
  model: string;
  messages: KimiMessage[];
  temperature: number;
  max_tokens?: number;
  top_p?: number;
  stream?: boolean;
  // Deep Reasoning activation (Kimi k2.5 format)
  chat_template_kwargs?: {
    thinking?: boolean;
  };
}

export interface KimiChoice {
  index: number;
  message: {
    role: string;
    content: string;
    reasoning_content?: string; // Deep reasoning trace
  };
  finish_reason: string;
}

export interface KimiResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: KimiChoice[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface KimiStreamChunk {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: {
      role?: string;
      content?: string;
      reasoning_content?: string;
    };
    finish_reason: string | null;
  }>;
}

export interface IntelligenceOutput {
  distributionVelocity: number; // 0-100 score
  pivotRecommendation: PivotRecommendation | null;
  reasoningTrace: ReasoningTrace[];
  sentiment: SentimentAnalysis;
  timestamp: string;
}

export interface PivotRecommendation {
  action: 'ACCELERATE' | 'MAINTAIN' | 'PIVOT' | 'HALT';
  rationale: string;
  targetAudience?: string;
  suggestedChannels?: string[];
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface SentimentAnalysis {
  overall: 'BULLISH' | 'NEUTRAL' | 'BEARISH';
  score: number; // -1 to 1
  drivers: string[];
}
