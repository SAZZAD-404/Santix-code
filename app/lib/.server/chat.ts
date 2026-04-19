import { type ActionFunctionArgs } from '@vercel/remix';
import { createScopedLogger } from 'chef-agent/utils/logger';
import { convexAgent } from '~/lib/.server/llm/convex-agent';
import type { LanguageModelUsage, Message, ProviderMetadata } from 'ai';
import type { ModelProvider } from '~/lib/.server/llm/provider';
import type { PromptCharacterCounts } from 'chef-agent/ChatContextManager';

/** Minimal OpenTelemetry-compatible tracer interface (no-op in local mode) */
export type Tracer = {
  startSpan(name: string): { setAttribute(key: string, value: unknown): void; end(): void };
};

type Messages = Message[];

const logger = createScopedLogger('api.chat');

export async function chatAction({ request }: ActionFunctionArgs) {
  const body = (await request.json()) as {
    messages: Messages;
    firstUserMessage: boolean;
    chatInitialId: string;
    token: string;
    teamSlug: string;
    deploymentName: string | undefined;
    modelProvider: ModelProvider;
    modelChoice: string | undefined;
    userApiKey:
      | { preference: 'always' | 'quotaExhausted'; value?: string; openai?: string; xai?: string; google?: string }
      | undefined;
    shouldDisableTools: boolean;
    recordRawPromptsForDebugging?: boolean;
    collapsedMessages: boolean;
    promptCharacterCounts?: PromptCharacterCounts;
    featureFlags: {
      enableResend?: boolean;
    };
  };

  const { messages, firstUserMessage, chatInitialId, recordRawPromptsForDebugging } = body;

  // Resolve the user's API key for the selected provider
  let userApiKey: string | undefined;
  if (body.modelProvider === 'Anthropic' || body.modelProvider === 'Bedrock') {
    userApiKey = body.userApiKey?.value;
    body.modelProvider = 'Anthropic';
  } else if (body.modelProvider === 'OpenAI') {
    userApiKey = body.userApiKey?.openai;
  } else if (body.modelProvider === 'XAI') {
    userApiKey = body.userApiKey?.xai;
  } else if (body.modelProvider === 'Google') {
    userApiKey = body.userApiKey?.google;
  } else if (body.modelProvider === 'LongCat') {
    // Use user key if provided, otherwise fall back to server key
    userApiKey = (body.userApiKey as any)?.longcat || undefined;
  }

  // For LongCat: fall back to server-side key if no user key provided
  const hasServerKey = body.modelProvider === 'LongCat'
    ? !!process.env.LONGCAT_API_KEY
    : false;

  if (!userApiKey && !hasServerKey) {
    return new Response(
      JSON.stringify({
        code: 'missing-api-key',
        error: `No API key provided for ${body.modelProvider}. Please add your API key in Settings.`,
      }),
      { status: 402 },
    );
  }

  logger.info(`Using model provider: ${body.modelProvider}`);

  // No-op usage recording since we're using user's own API key
  const recordUsageCb = async (
    _lastMessage: Message | undefined,
    _finalGeneration: { usage: LanguageModelUsage; providerMetadata?: ProviderMetadata },
  ) => {};

  try {
    const totalMessageContent = messages.reduce((acc, message) => acc + message.content, '');
    logger.debug(`Total message length: ${totalMessageContent.split(' ').length} words`);

    const dataStream = await convexAgent({
      chatInitialId,
      firstUserMessage,
      messages,
      tracer: null,
      modelProvider: body.modelProvider,
      modelChoice: body.modelChoice,
      userApiKey,
      shouldDisableTools: body.shouldDisableTools,
      recordUsageCb,
      recordRawPromptsForDebugging: !!recordRawPromptsForDebugging,
      collapsedMessages: body.collapsedMessages,
      promptCharacterCounts: body.promptCharacterCounts,
      featureFlags: {
        enableResend: body.featureFlags.enableResend ?? false,
      },
    });

    return new Response(dataStream, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        Connection: 'keep-alive',
        'Cache-Control': 'no-cache',
        'Text-Encoding': 'chunked',
      },
    });
  } catch (error: any) {
    logger.error(error);

    if (error.message?.includes('API key') || error.message?.includes('Invalid')) {
      return new Response(JSON.stringify({ error: 'Invalid or missing API key' }), {
        status: 401,
      });
    }

    return new Response(null, { status: 500, statusText: 'Internal Server Error' });
  }
}
