import type { CoreMessage } from 'ai';

/**
 * Stub: debug prompt feature requires Convex — always returns no data.
 */

export type UsageRecord = {
  completionTokens: number;
  promptTokens: number;
  cachedPromptTokens: number;
};

export type DebugPromptEntry = {
  prompt: CoreMessage[] | undefined;
  completion: CoreMessage[];
  finishReason: string;
  modelId: string;
  usage: UsageRecord;
  chefTokens: number;
  coreMessagesUrl?: string;
};

export function useAuthToken(): string | null {
  return null;
}

export function useIsAdmin(): boolean {
  return false;
}

export function useDebugPrompt(_chatInitialId: string): {
  data: DebugPromptEntry[] | null;
  isPending: boolean;
  error: Error | null;
} {
  return {
    data: null,
    isPending: false,
    error: null,
  };
}
