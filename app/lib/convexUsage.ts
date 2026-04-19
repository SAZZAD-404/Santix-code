/**
 * Stub: usage tracking not needed in local/BYOK mode.
 */
export function renderTokenCount(tokens: number): string {
  return Math.max(1, tokens).toLocaleString();
}

export function disabledText(_isPaidPlan: boolean): string {
  return 'Usage limit reached. Please add your own API key in Settings.';
}

export function noTokensText(_used: number, _quota: number): string {
  return 'No remaining tokens. Please add your own API key in Settings.';
}
