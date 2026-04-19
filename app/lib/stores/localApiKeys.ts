/**
 * localStorage-based API key storage.
 * Replaces Convex-based API key storage.
 */

const STORAGE_KEY = 'chef_api_keys';

export type LocalApiKeys = {
  preference: 'always' | 'quotaExhausted';
  value?: string;   // Anthropic
  openai?: string;
  xai?: string;
  google?: string;
  longcat?: string;
};

export function getLocalApiKeys(): LocalApiKeys {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { preference: 'always' };
    return JSON.parse(raw) as LocalApiKeys;
  } catch {
    return { preference: 'always' };
  }
}

export function setLocalApiKeys(keys: LocalApiKeys): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
}

export function clearLocalApiKeys(): void {
  localStorage.removeItem(STORAGE_KEY);
}
