import type { LanguageModelUsage, Message, ProviderMetadata } from 'ai';
import { createScopedLogger } from 'chef-agent/utils/logger';
import type { ProviderType, UsageAnnotation } from '~/lib/common/annotations';
import { modelForProvider, type ModelProvider } from './llm/provider';

const logger = createScopedLogger('usage');

export function encodeUsageAnnotation(
  toolCallId: { kind: 'tool-call'; toolCallId: string | undefined } | { kind: 'final' },
  usage: LanguageModelUsage,
  providerMetadata: ProviderMetadata | undefined,
) {
  const payload: UsageAnnotation = {
    toolCallId: toolCallId.kind === 'tool-call' ? toolCallId.toolCallId : 'final',
    completionTokens: usage.completionTokens,
    promptTokens: usage.promptTokens,
    totalTokens: usage.totalTokens,
    providerMetadata,
  };
  return { payload: JSON.stringify(payload) };
}

export function encodeModelAnnotation(
  call: { kind: 'tool-call'; toolCallId: string | null } | { kind: 'final' },
  providerMetadata: ProviderMetadata | undefined,
  modelChoice: string | undefined,
) {
  let provider: ProviderType | null = null;
  let model: string | null = null;
  if (providerMetadata?.anthropic) {
    provider = 'Anthropic'; model = modelForProvider('Anthropic', modelChoice);
  } else if (providerMetadata?.openai) {
    provider = 'OpenAI'; model = modelForProvider('OpenAI', modelChoice);
  } else if (providerMetadata?.xai) {
    provider = 'XAI'; model = modelForProvider('XAI', modelChoice);
  } else if (providerMetadata?.google) {
    provider = 'Google'; model = modelForProvider('Google', modelChoice);
  } else if (providerMetadata?.bedrock) {
    provider = 'Bedrock'; model = modelForProvider('Bedrock', modelChoice);
  }
  return { toolCallId: call.kind === 'tool-call' ? call.toolCallId : 'final', provider, model };
}

// No-op: usage recording not needed in local/BYOK mode
export async function recordUsage(
  _provisionHost: string,
  _token: string,
  _modelProvider: ModelProvider,
  _teamSlug: string,
  _deploymentName: string | undefined,
  _lastMessage: Message | undefined,
  _finalGeneration: { usage: LanguageModelUsage; providerMetadata?: ProviderMetadata },
) {
  logger.debug('Usage recording skipped (local mode)');
}
