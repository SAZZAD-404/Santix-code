import type { LocalApiKeys } from '~/lib/stores/localApiKeys';
import { type ModelSelection } from '~/utils/constants';

export function hasApiKeySet(
  modelSelection: ModelSelection,
  _useGeminiAuto: boolean,
  apiKey?: LocalApiKeys | null,
) {
  if (!apiKey) return false;

  switch (modelSelection) {
    case 'auto':
      return !!apiKey.value?.trim() || !!apiKey.google?.trim();
    case 'claude-3-5-haiku':
    case 'claude-4.6-sonnet':
    case 'claude-4.5-sonnet':
      return !!apiKey.value?.trim();
    case 'gpt-4.1':
    case 'gpt-4.1-mini':
    case 'gpt-5':
      return !!apiKey.openai?.trim();
    case 'grok-3-mini':
      return !!apiKey.xai?.trim();
    case 'gemini-2.5-pro':
      return !!apiKey.google?.trim();
    case 'longcat-flash':
      // LongCat has a server-side key, so always available
      return true;
    default: {
      const _exhaustiveCheck: never = modelSelection;
      return false;
    }
  }
}

export function hasAnyApiKeySet(apiKey?: LocalApiKeys | null) {
  if (!apiKey) return false;
  return !!(apiKey.value?.trim() || apiKey.openai?.trim() || apiKey.xai?.trim() || apiKey.google?.trim());
}
