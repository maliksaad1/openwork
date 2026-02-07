/**
 * Content Formatting Module
 * Enforces Instant Clarity Hook (0-3s) and Curiosity Gap Bridge (3-6s)
 */

export interface ContentBlock {
  type: 'HOOK' | 'BRIDGE' | 'BODY' | 'CTA';
  content: string;
  duration: [number, number]; // [startSeconds, endSeconds]
  validated: boolean;
  issues: string[];
}

export interface FormattedContent {
  blocks: ContentBlock[];
  totalDuration: number;
  isCompliant: boolean;
  score: number; // 0-100
}

export interface ContentGuidelines {
  hook: {
    maxWords: number;
    requiredElements: string[];
    forbiddenPatterns: RegExp[];
  };
  bridge: {
    maxWords: number;
    requiredElements: string[];
    transitionPhrases: string[];
  };
}

const DEFAULT_GUIDELINES: ContentGuidelines = {
  hook: {
    maxWords: 15,
    requiredElements: ['action_verb', 'value_prop'],
    forbiddenPatterns: [/^we are/i, /^our company/i, /^introducing/i],
  },
  bridge: {
    maxWords: 25,
    requiredElements: ['curiosity_trigger', 'specificity'],
    transitionPhrases: [
      'But here\'s what',
      'The problem is',
      'What if I told you',
      'Most people don\'t know',
    ],
  },
};

export class ContentFormatter {
  private guidelines: ContentGuidelines;

  constructor(guidelines?: Partial<ContentGuidelines>) {
    this.guidelines = { ...DEFAULT_GUIDELINES, ...guidelines };
  }

  /**
   * Format raw content into compliant structure
   */
  format(rawContent: string): FormattedContent {
    const sentences = this.splitSentences(rawContent);
    const blocks: ContentBlock[] = [];
    let currentDuration = 0;

    // First sentence(s) = Hook (0-3s)
    const hookContent = sentences.slice(0, 1).join(' ');
    const hookBlock = this.createBlock('HOOK', hookContent, [0, 3]);
    blocks.push(hookBlock);
    currentDuration = 3;

    // Next sentence(s) = Bridge (3-6s)
    if (sentences.length > 1) {
      const bridgeContent = sentences.slice(1, 2).join(' ');
      const bridgeBlock = this.createBlock('BRIDGE', bridgeContent, [3, 6]);
      blocks.push(bridgeBlock);
      currentDuration = 6;
    }

    // Remaining = Body
    if (sentences.length > 2) {
      const bodyContent = sentences.slice(2).join(' ');
      const bodyDuration = Math.ceil(bodyContent.split(' ').length / 3); // ~3 words per second
      const bodyBlock = this.createBlock(
        'BODY',
        bodyContent,
        [currentDuration, currentDuration + bodyDuration]
      );
      blocks.push(bodyBlock);
      currentDuration += bodyDuration;
    }

    const isCompliant = blocks.every((b) => b.validated);
    const score = this.calculateScore(blocks);

    return {
      blocks,
      totalDuration: currentDuration,
      isCompliant,
      score,
    };
  }

  /**
   * Create and validate a content block
   */
  private createBlock(
    type: ContentBlock['type'],
    content: string,
    duration: [number, number]
  ): ContentBlock {
    const issues: string[] = [];
    const words = content.split(/\s+/).length;

    // Validate based on type
    if (type === 'HOOK') {
      if (words > this.guidelines.hook.maxWords) {
        issues.push(`Hook exceeds ${this.guidelines.hook.maxWords} words (has ${words})`);
      }
      for (const pattern of this.guidelines.hook.forbiddenPatterns) {
        if (pattern.test(content)) {
          issues.push(`Hook contains forbidden pattern: ${pattern.source}`);
        }
      }
    }

    if (type === 'BRIDGE') {
      if (words > this.guidelines.bridge.maxWords) {
        issues.push(`Bridge exceeds ${this.guidelines.bridge.maxWords} words (has ${words})`);
      }
      const hasTransition = this.guidelines.bridge.transitionPhrases.some((phrase) =>
        content.toLowerCase().includes(phrase.toLowerCase())
      );
      if (!hasTransition) {
        issues.push('Bridge missing curiosity trigger transition');
      }
    }

    return {
      type,
      content,
      duration,
      validated: issues.length === 0,
      issues,
    };
  }

  /**
   * Split content into sentences
   */
  private splitSentences(text: string): string[] {
    return text
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  /**
   * Calculate compliance score
   */
  private calculateScore(blocks: ContentBlock[]): number {
    if (blocks.length === 0) return 0;

    let score = 100;

    for (const block of blocks) {
      // Deduct points for each issue
      score -= block.issues.length * 15;

      // Bonus for having all required blocks
      if (block.validated) {
        score += 5;
      }
    }

    // Ensure hook exists
    if (!blocks.some((b) => b.type === 'HOOK')) {
      score -= 30;
    }

    // Ensure bridge exists
    if (!blocks.some((b) => b.type === 'BRIDGE')) {
      score -= 20;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Generate a compliant hook
   */
  generateHook(topic: string, valueProposition: string): string {
    // Template: [Action Verb] [Specific Result] [Timeframe]
    const templates = [
      `Unlock ${valueProposition} with ${topic}.`,
      `Stop wasting time on ${topic}. Here's the fix.`,
      `${valueProposition}—and it starts with ${topic}.`,
    ];

    return templates[Math.floor(Math.random() * templates.length)];
  }

  /**
   * Generate a compliant bridge
   */
  generateBridge(hook: string): string {
    const triggers = this.guidelines.bridge.transitionPhrases;
    const trigger = triggers[Math.floor(Math.random() * triggers.length)];

    return `${trigger} most teams get wrong about this...`;
  }

  /**
   * Get formatting guidelines
   */
  getGuidelines(): ContentGuidelines {
    return { ...this.guidelines };
  }
}

// Singleton
let formatterInstance: ContentFormatter | null = null;

export function getContentFormatter(): ContentFormatter {
  if (!formatterInstance) {
    formatterInstance = new ContentFormatter();
  }
  return formatterInstance;
}
