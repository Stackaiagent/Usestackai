export type Tier = "free" | "builder" | "unlimited";

export interface TierConfig {
  limit: number;
}

export const TIERS: Record<Tier, TierConfig> = {
  free: { limit: 50 },
  builder: { limit: 200 },
  unlimited: { limit: Number.POSITIVE_INFINITY },
};

export function tierLimit(tier: Tier): number {
  return TIERS[tier].limit;
}
