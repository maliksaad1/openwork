/**
 * NVIDIA NIM Client for Kimi k2.5
 * Deep Reasoning Engine with thinking=true activation
 */

import type {
  KimiConfig,
  KimiMessage,
  KimiRequest,
  KimiResponse,
  KimiStreamChunk,
} from './types';

const DEFAULT_CONFIG: Partial<KimiConfig> = {
  baseUrl: 'https://integrate.api.nvidia.com/v1',
  model: 'moonshotai/kimi-k2.5',
  thinking: true,
  temperature: 1.0,
};

export class NvidiaKimiClient {
  private config: KimiConfig;

  constructor(apiKey: string, overrides?: Partial<KimiConfig>) {
    this.config = {
      apiKey,
      ...DEFAULT_CONFIG,
      ...overrides,
    } as KimiConfig;
  }

  /**
   * Execute a deep reasoning request with full cognitive trace
   */
  async reason(
    systemPrompt: string,
    userPrompt: string,
    options?: { maxTokens?: number; stream?: boolean }
  ): Promise<KimiResponse> {
    const messages: KimiMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];

    const request: KimiRequest = {
      model: this.config.model,
      messages,
      temperature: this.config.temperature,
      max_tokens: options?.maxTokens ?? 16384,
      top_p: 1.0,
      stream: options?.stream ?? false,
      chat_template_kwargs: {
        thinking: this.config.thinking,
      },
    };

    const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`NVIDIA NIM Error: ${response.status} - ${error}`);
    }

    return response.json() as Promise<KimiResponse>;
  }

  /**
   * Stream deep reasoning for real-time Cognitive Pulse visualization
   */
  async *streamReason(
    systemPrompt: string,
    userPrompt: string
  ): AsyncGenerator<KimiStreamChunk> {
    const messages: KimiMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];

    const request: KimiRequest = {
      model: this.config.model,
      messages,
      temperature: this.config.temperature,
      max_tokens: 16384,
      top_p: 1.0,
      stream: true,
      chat_template_kwargs: {
        thinking: this.config.thinking,
      },
    };

    const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`NVIDIA NIM Stream Error: ${response.status} - ${error}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          if (data === '[DONE]') return;
          try {
            yield JSON.parse(data) as KimiStreamChunk;
          } catch {
            // Skip malformed chunks
          }
        }
      }
    }
  }

  /**
   * Quick sentiment analysis without full reasoning trace
   */
  async analyzeSentiment(content: string): Promise<{
    sentiment: 'BULLISH' | 'NEUTRAL' | 'BEARISH';
    score: number;
  }> {
    const response = await this.reason(
      `You are a market sentiment analyzer. Respond only with JSON: {"sentiment": "BULLISH"|"NEUTRAL"|"BEARISH", "score": -1 to 1}`,
      `Analyze the market sentiment of: ${content}`
    );

    const text = response.choices[0]?.message?.content ?? '{}';
    try {
      return JSON.parse(text);
    } catch {
      return { sentiment: 'NEUTRAL', score: 0 };
    }
  }
}

// Singleton instance
let clientInstance: NvidiaKimiClient | null = null;

export function getKimiClient(): NvidiaKimiClient {
  if (!clientInstance) {
    const apiKey = process.env.NVIDIA_API_KEY;
    if (!apiKey) {
      throw new Error('NVIDIA_API_KEY environment variable not set');
    }
    clientInstance = new NvidiaKimiClient(apiKey);
  }
  return clientInstance;
}
