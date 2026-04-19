/**
 * Simplified usage store — no Convex/server-side usage tracking.
 * Users use their own API keys, so quota tracking is not needed.
 */
import { useCallback } from 'react';

export type UsageData = {
  centitokensUsed: number;
  centitokensQuota: number;
  isPaidPlan: boolean;
};

export function useUsage(_args: { teamSlug: string | null }) {
  const refetch = useCallback(async () => {}, []);
  return {
    isLoadingUsage: false as const,
    usagePercentage: 0,
    used: null,
    quota: null,
    isPaidPlan: null,
    refetch,
  };
}

export function useTokenUsage(_teamSlug: string | null) {
  return { isLoading: false as const, tokenUsage: null };
}
