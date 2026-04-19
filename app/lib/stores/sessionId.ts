/**
 * Simplified session store - no Convex auth needed.
 * Session ID is always 'local'.
 */
import { useStore } from '@nanostores/react';
import { atom } from 'nanostores';

// Always set to 'local' - no real session management needed
export const sessionIdStore = atom<string | null | undefined>('local');

export const convexAuthTokenStore = atom<string | null>(null);

export function useConvexSessionIdOrNullOrLoading(): string | null | undefined {
  return useStore(sessionIdStore);
}

export function useConvexSessionId(): string {
  return 'local';
}

export async function waitForConvexSessionId(_caller?: string): Promise<string> {
  return 'local';
}

// No-op stubs kept for compatibility
export function getConvexAuthToken(_convex?: any): string | null {
  return null;
}
