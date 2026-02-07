/**
 * Skill Hiring Module
 * Automated procurement of external skills via $OPENWORK
 */

import type { SpendResult } from '@/lib/base/types';
import { createTreasuryAgent, TreasuryAgent } from './treasury';

export interface SkillListing {
  id: string;
  name: string;
  description: string;
  address: `0x${string}`;
  pricePerUnit: bigint;
  category: 'CONTENT' | 'DISTRIBUTION' | 'ANALYTICS' | 'AUTOMATION';
  rating: number;
  hireCount: number;
}

export interface HireRequest {
  skillId: string;
  units: number;
  purpose: string;
  maxBudget: bigint;
}

export interface HireResult extends SpendResult {
  skillId: string;
  unitsHired: number;
  totalCost: bigint;
}

// Mock skill registry (would be on-chain in production)
const skillRegistry: Map<string, SkillListing> = new Map([
  [
    'skill_content_writer',
    {
      id: 'skill_content_writer',
      name: 'ContentCraft AI',
      description: 'Autonomous content generation for distribution',
      address: '0x1234567890123456789012345678901234567890' as `0x${string}`,
      pricePerUnit: 1000n * 10n ** 18n, // 1000 $OPENWORK
      category: 'CONTENT',
      rating: 4.8,
      hireCount: 156,
    },
  ],
  [
    'skill_social_amplifier',
    {
      id: 'skill_social_amplifier',
      name: 'SocialBoost Engine',
      description: 'Cross-platform distribution amplification',
      address: '0x2345678901234567890123456789012345678901' as `0x${string}`,
      pricePerUnit: 500n * 10n ** 18n,
      category: 'DISTRIBUTION',
      rating: 4.5,
      hireCount: 89,
    },
  ],
]);

export class HiringManager {
  private treasury: TreasuryAgent;

  constructor(walletAddress: `0x${string}`) {
    this.treasury = createTreasuryAgent(walletAddress);
  }

  /**
   * Get available skills
   */
  getAvailableSkills(category?: SkillListing['category']): SkillListing[] {
    const skills = Array.from(skillRegistry.values());
    if (category) {
      return skills.filter((s) => s.category === category);
    }
    return skills;
  }

  /**
   * Get skill by ID
   */
  getSkill(skillId: string): SkillListing | undefined {
    return skillRegistry.get(skillId);
  }

  /**
   * Hire a skill
   */
  async hire(request: HireRequest): Promise<HireResult> {
    const skill = skillRegistry.get(request.skillId);
    if (!skill) {
      return {
        success: false,
        requiresOversight: false,
        error: `Skill not found: ${request.skillId}`,
        skillId: request.skillId,
        unitsHired: 0,
        totalCost: 0n,
      };
    }

    const totalCost = skill.pricePerUnit * BigInt(request.units);

    // Check budget
    if (totalCost > request.maxBudget) {
      return {
        success: false,
        requiresOversight: false,
        error: `Cost ${totalCost} exceeds budget ${request.maxBudget}`,
        skillId: request.skillId,
        unitsHired: 0,
        totalCost,
      };
    }

    // Execute hire through treasury
    const spendResult = await this.treasury.hireSkill(skill.address, totalCost);

    return {
      ...spendResult,
      skillId: request.skillId,
      unitsHired: spendResult.success ? request.units : 0,
      totalCost,
    };
  }

  /**
   * Recommend skills based on need
   */
  recommendSkills(
    need: 'CONTENT' | 'DISTRIBUTION' | 'ANALYTICS',
    budget: bigint
  ): SkillListing[] {
    return this.getAvailableSkills(need as SkillListing['category'])
      .filter((s) => s.pricePerUnit <= budget)
      .sort((a, b) => b.rating - a.rating);
  }
}

// Factory
export function createHiringManager(walletAddress: `0x${string}`): HiringManager {
  return new HiringManager(walletAddress);
}
