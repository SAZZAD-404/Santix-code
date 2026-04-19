import { useStore } from '@nanostores/react';
import type { Message, UIMessage } from 'ai';
import { useChat } from '@ai-sdk/react';
import { useAnimate } from 'framer-motion';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMessageParser, type PartCache } from '~/lib/hooks/useMessageParser';
import { useSnapScroll } from '~/lib/hooks/useSnapScroll';
import { description } from '~/lib/stores/description';
import { chatStore } from '~/lib/stores/chatId';
import { workbenchStore } from '~/lib/stores/workbench.client';
import { MAX_CONSECUTIVE_DEPLOY_ERRORS, type ModelSelection } from '~/utils/constants';
import { cubicEasingFn } from '~/utils/easings';
import { createScopedLogger } from 'chef-agent/utils/logger';
import { BaseChat } from './BaseChat.client';
import { createSampler } from '~/utils/sampler';
import { filesToArtifacts } from '~/utils/fileUtils';
import { ChatContextManager } from 'chef-agent/ChatContextManager';
import { toast } from 'sonner';
import type { PartId } from '~/lib/stores/artifacts';
import { captureException } from '@sentry/remix';
import type { ActionStatus } from '~/lib/runtime/action-runner';
import { chatIdStore, initialIdStore } from '~/lib/stores/chatId';
import { atom } from 'nanostores';
import { STATUS_MESSAGES } from './StreamingIndicator';
import { MissingApiKey } from './MissingApiKey';
import { models, type ModelProvider } from '~/components/chat/ModelSelector';
import { useLocalStorage } from '@uidotdev/usehooks';
import { UsageDebugView } from '~/components/debug/UsageDebugView';
import { hasApiKeySet } from '~/lib/common/apiKey';
import { chatSyncState } from '~/lib/stores/startup/chatSyncState';
import { getLocalApiKeys, type LocalApiKeys } from '~/lib/stores/localApiKeys';
import type { ProviderType } from '~/lib/common/annotations';

const logger = createScopedLogger('Chat');

const MAX_RETRIES = 4;

// Feature flag defaults (no LaunchDarkly needed)
const DEFAULT_FLAGS = {
  recordRawPromptsForDebugging: false,
  maxCollapsedMessagesSize: 65536,
  maxRelevantFilesSize: 8192,
  minCollapsedMessagesSize: 8192,
  useGeminiAuto: false,
  enableResend: false,
  useAnthropicFraction: 1.0,
};

const processSampledMessages = createSampler(
  (options: {
    messages: Message[];
    initialMessages: Message[];
    parseMessages: (messages: Message[]) => void;
    streamStatus: 'streaming' | 'submitted' | 'ready' | 'error';
    storeMessageHistory: (
      messages: Message[],
      streamStatus: 'streaming' | 'submitted' | 'ready' | 'error',
    ) => Promise<void>;
  }) => {
    const { messages, initialMessages, parseMessages, storeMessageHistory, streamStatus } = options;
    parseMessages(messages);
    if (messages.length >= initialMessages.length) {
      storeMessageHistory(messages, streamStatus).catch((error) => toast.error(error.message));
    }
  },
  50,
);

interface ChatProps {
  initialMessages: Message[];
  partCache: PartCache;
  storeMessageHistory: (
    messages: Message[],
    streamStatus: 'streaming' | 'submitted' | 'ready' | 'error',
  ) => Promise<void>;
  initializeChat: () => Promise<boolean>;
  description?: string;
  isReload: boolean;
  hadSuccessfulDeploy: boolean;
  subchats?: { subchatIndex: number; updatedAt: number; description?: string }[];
}

const retryState = atom({
  numFailures: 0,
  nextRetry: Date.now(),
});

export const Chat = memo(
  ({
    initialMessages,
    partCache,
    storeMessageHistory,
    initializeChat,
    isReload,
    hadSuccessfulDeploy,
    subchats,
  }: ChatProps) => {
    const [chatStarted, setChatStarted] = useState(initialMessages.length > 0 || (!!subchats && subchats.length > 1));
    const actionAlert = useStore(workbenchStore.alert);
    const syncState = useStore(chatSyncState);

    // Read API keys from localStorage
    const [apiKey, setApiKey] = useState<LocalApiKeys | null>(null);
    useEffect(() => {
      setApiKey(getLocalApiKeys());
      // Re-read on focus (user may have updated keys in settings)
      const onFocus = () => setApiKey(getLocalApiKeys());
      window.addEventListener('focus', onFocus);
      return () => window.removeEventListener('focus', onFocus);
    }, []);

    const {
      recordRawPromptsForDebugging,
      maxCollapsedMessagesSize,
      maxRelevantFilesSize,
      minCollapsedMessagesSize,
      useGeminiAuto,
      enableResend,
      useAnthropicFraction,
    } = DEFAULT_FLAGS;

    const title = useStore(description);
    const { showChat } = useStore(chatStore);
    const [animationScope, animate] = useAnimate();

    const [modelSelection, setModelSelection] = useLocalStorage<ModelSelection>('modelSelection', 'auto');

    const terminalInitializationOptions = useMemo(
      () => ({
        isReload,
        shouldDeployConvexFunctions: hadSuccessfulDeploy || (!!subchats && subchats.length > 1),
      }),
      [isReload, hadSuccessfulDeploy, subchats],
    );

    // Reset retries counter every minute
    useEffect(() => {
      const resetInterval = setInterval(() => {
        retryState.set({ numFailures: 0, nextRetry: Date.now() });
      }, 60 * 1000);
      return () => clearInterval(resetInterval);
    }, []);

    const chatContextManager = useRef(
      new ChatContextManager(
        () => workbenchStore.currentDocument.get(),
        () => workbenchStore.files.get(),
        () => workbenchStore.userWrites,
      ),
    );

    const checkApiKeyForCurrentModel = useCallback(
      (model: ModelSelection): { hasMissingKey: boolean; provider?: ModelProvider; requireKey: boolean } => {
        const requireKey = models[model]?.requireKey || false;

        const MODEL_TO_PROVIDER_MAP: {
          [K in ModelSelection]: { providerName: ModelProvider; apiKeyField: 'value' | 'openai' | 'xai' | 'google' | 'longcat' };
        } = {
          auto: { providerName: 'anthropic', apiKeyField: 'value' },
          'longcat-flash': { providerName: 'longcat', apiKeyField: 'longcat' },
          'claude-4.6-sonnet': { providerName: 'anthropic', apiKeyField: 'value' },
          'claude-4.5-sonnet': { providerName: 'anthropic', apiKeyField: 'value' },
          'gpt-4.1': { providerName: 'openai', apiKeyField: 'openai' },
          'gpt-5': { providerName: 'openai', apiKeyField: 'openai' },
          'grok-3-mini': { providerName: 'xai', apiKeyField: 'xai' },
          'gemini-2.5-pro': { providerName: 'google', apiKeyField: 'google' },
          'claude-3-5-haiku': { providerName: 'anthropic', apiKeyField: 'value' },
          'gpt-4.1-mini': { providerName: 'openai', apiKeyField: 'openai' },
        };

        const providerInfo = MODEL_TO_PROVIDER_MAP[model];
        const keyValue = apiKey?.[providerInfo.apiKeyField];
        if (!keyValue || keyValue.trim() === '') {
          return { hasMissingKey: true, provider: providerInfo.providerName, requireKey };
        }
        return { hasMissingKey: false, requireKey };
      },
      [apiKey],
    );

    const [disableChatMessage, setDisableChatMessage] = useState<
      | { type: 'MissingApiKey'; provider: ModelProvider; requireKey: boolean }
      | null
    >(null);

    const [sendMessageInProgress, setSendMessageInProgress] = useState(false);

    const anthropicProviders: ProviderType[] =
      Math.random() < useAnthropicFraction ? ['Anthropic', 'Bedrock'] : ['Bedrock', 'Anthropic'];

    const checkApiKeyStatus = useCallback(() => {
      if (!apiKey) return;
      if (hasApiKeySet(modelSelection, useGeminiAuto, apiKey)) {
        setDisableChatMessage(null);
        return;
      }
      const { hasMissingKey, provider, requireKey } = checkApiKeyForCurrentModel(modelSelection);
      if (hasMissingKey && provider) {
        setDisableChatMessage({ type: 'MissingApiKey', provider, requireKey });
      } else {
        setDisableChatMessage(null);
      }
    }, [apiKey, modelSelection, checkApiKeyForCurrentModel, useGeminiAuto]);

    useEffect(() => {
      checkApiKeyStatus();
    }, [checkApiKeyStatus]);

    const { messages, status, stop, append, setMessages, reload, error } = useChat({
      initialMessages,
      api: '/api/chat',
      sendExtraMessageFields: true,
      experimental_prepareRequestBody: ({ messages: currentMessages }: { messages: any[] }) => {
        const chatInitialId = initialIdStore.get();
        const retries = retryState.get();

        let modelProvider: ProviderType;
        let modelChoice: string | undefined = undefined;

        if (modelSelection === 'auto') {
          const providers: ProviderType[] = anthropicProviders;
          modelProvider = providers[retries.numFailures % providers.length];
          modelChoice = 'claude-sonnet-4-6';
        } else if (modelSelection === 'claude-3-5-haiku') {
          modelProvider = 'Anthropic';
          modelChoice = 'claude-3-5-haiku-latest';
        } else if (modelSelection === 'claude-4.6-sonnet') {
          const providers: ProviderType[] = anthropicProviders;
          modelProvider = providers[retries.numFailures % providers.length];
          modelChoice = 'claude-sonnet-4-6';
        } else if (modelSelection === 'claude-4.5-sonnet') {
          const providers: ProviderType[] = anthropicProviders;
          modelProvider = providers[retries.numFailures % providers.length];
          modelChoice = 'claude-sonnet-4-5';
        } else if (modelSelection === 'grok-3-mini') {
          modelProvider = 'XAI';
        } else if (modelSelection === 'gemini-2.5-pro') {
          modelProvider = 'Google';
        } else if (modelSelection === 'gpt-4.1-mini') {
          modelProvider = 'OpenAI';
          modelChoice = 'gpt-4.1-mini';
        } else if (modelSelection === 'gpt-4.1') {
          modelProvider = 'OpenAI';
        } else if (modelSelection === 'gpt-5') {
          modelProvider = 'OpenAI';
          modelChoice = 'gpt-5';
        } else if (modelSelection === 'longcat-flash') {
          modelProvider = 'LongCat';
          modelChoice = 'LongCat-Flash-Thinking-2601';
        } else {
          // Fallback
          modelProvider = 'Anthropic';
          modelChoice = undefined;
        }

        let shouldDisableTools = false;
        if (currentMessages.length > 0 && currentMessages[currentMessages.length - 1].role === 'assistant') {
          const lastSystemMessage = currentMessages[currentMessages.length - 1];
          const toolCalls = lastSystemMessage.parts.filter(
            (part: any) => part.type === 'tool-invocation' && part.toolInvocation.state === 'result',
          );
          if (toolCalls.length >= MAX_CONSECUTIVE_DEPLOY_ERRORS) {
            const lastToolCalls = toolCalls.slice(-MAX_CONSECUTIVE_DEPLOY_ERRORS);
            const allFailed = lastToolCalls.every(
              (t: any) =>
                t.type === 'tool-invocation' &&
                t.toolInvocation.state === 'result' &&
                t.toolInvocation.result.startsWith('Error:'),
            );
            if (allFailed) shouldDisableTools = true;
          }
        }

        const { messages: preparedMessages, collapsedMessages } = chatContextManager.current.prepareContext(
          currentMessages,
          maxSizeForModel(modelSelection, maxCollapsedMessagesSize),
          minCollapsedMessagesSize,
        );

        const characterCounts = chatContextManager.current.calculatePromptCharacterCounts(preparedMessages);

        // Always use user API key (no Convex tokens)
        const userApiKey = { ...apiKey, preference: 'always' as const };

        return {
          messages: preparedMessages,
          firstUserMessage: currentMessages.filter((m: any) => m.role === 'user').length === 1,
          chatInitialId,
          // Dummy values - server will use userApiKey directly
          token: 'local',
          teamSlug: 'local',
          deploymentName: undefined,
          modelProvider,
          userApiKey,
          shouldDisableTools,
          recordRawPromptsForDebugging,
          modelChoice,
          collapsedMessages,
          promptCharacterCounts: characterCounts,
          featureFlags: { enableResend },
        };
      },
      maxSteps: 64,
      async onToolCall({ toolCall }: { toolCall: any }) {
        console.log('Starting tool call', toolCall);
        const { result } = await workbenchStore.waitOnToolCall(toolCall.toolCallId);
        console.log('Tool call finished', result);
        return result;
      },
      onError: async (e: Error) => {
        captureException(e);
        const retries = retryState.get();
        logger.error(`Request failed (retries: ${JSON.stringify(retries)})`, e, error);
        const backoff = error?.message.includes(STATUS_MESSAGES.error)
          ? exponentialBackoff(retries.numFailures + 1)
          : 0;
        retryState.set({
          numFailures: retries.numFailures + 1,
          nextRetry: Date.now() + backoff,
        });
        workbenchStore.abortAllActions();
        checkApiKeyStatus();
      },
      onFinish: async (_message: any, response: any) => {
        const usage = response.usage;
        if (usage) console.debug('Token usage in response:', usage);
        if (response.finishReason === 'stop') {
          retryState.set({ numFailures: 0, nextRetry: Date.now() });
        }
        logger.debug('Finished streaming');
      },
    });

    useEffect(() => {
      setMessages(initialMessages);
      chatContextManager.current.reset();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [setMessages, syncState.subchatIndex]);

    const { parsedMessages, parseMessages } = useMessageParser(partCache);

    useEffect(() => {
      chatStore.setKey('started', messages.length > 0 || (!!subchats && subchats.length > 1));
    }, [messages.length, subchats]);

    useEffect(() => {
      processSampledMessages({
        messages,
        initialMessages,
        parseMessages,
        storeMessageHistory,
        streamStatus: status,
      });
    }, [initialMessages, messages, parseMessages, status, storeMessageHistory]);

    const abort = () => {
      stop();
      chatStore.setKey('aborted', true);
      workbenchStore.abortAllActions();
    };

    const toolStatus = useCurrentToolStatus();

    const runAnimation = async () => {
      if (chatStarted) return;
      await Promise.all([
        animate('#suggestions', { opacity: 0, display: 'none' }, { duration: 0.1 }),
        animate('#intro', { opacity: 0, flex: 1 }, { duration: 0.2, ease: cubicEasingFn }),
        animate('#footer', { opacity: 0, display: 'none' }, { duration: 0.2 }),
      ]);
      chatStore.setKey('started', true);
      setChatStarted(true);
    };

    const sendMessage = async (messageInput: string) => {
      if (status === 'streaming' || status === 'submitted') {
        abort();
        return;
      }
      if (sendMessageInProgress) return;

      // Check if API key is set for the selected model
      if (!hasApiKeySet(modelSelection, useGeminiAuto, apiKey)) {
        const { hasMissingKey, provider, requireKey } = checkApiKeyForCurrentModel(modelSelection);
        if (hasMissingKey && provider) {
          setDisableChatMessage({ type: 'MissingApiKey', provider, requireKey });
          toast.error('Please add your API key in Settings to start chatting.');
          return;
        }
      }

      try {
        setSendMessageInProgress(true);
        enableAutoScroll();

        const chatInitialized = await initializeChat();
        if (!chatInitialized) return;

        runAnimation();

        const shouldSendRelevantFiles = chatContextManager.current.shouldSendRelevantFiles(
          messages,
          maxSizeForModel(modelSelection, maxCollapsedMessagesSize),
        );
        const maybeRelevantFilesMessage: UIMessage = shouldSendRelevantFiles
          ? chatContextManager.current.relevantFiles(messages, `${Date.now()}`, maxRelevantFilesSize)
          : { id: `${Date.now()}`, content: '', role: 'user', parts: [] };

        const newMessage = structuredClone(maybeRelevantFilesMessage);
        newMessage.parts.push({ type: 'text', text: messageInput });
        newMessage.content = messageInput;

        if (!chatStarted) {
          setMessages([newMessage]);
          reload();
          return;
        }

        const modifiedFiles = workbenchStore.getModifiedFiles();
        chatStore.setKey('aborted', false);
        if (modifiedFiles !== undefined) {
          const userUpdateArtifact = filesToArtifacts(modifiedFiles, `${Date.now()}`);
          maybeRelevantFilesMessage.parts.push({ type: 'text', text: userUpdateArtifact });
          workbenchStore.resetAllFileModifications();
        }
        maybeRelevantFilesMessage.content = messageInput;
        maybeRelevantFilesMessage.parts.push({ type: 'text', text: messageInput });
        append(maybeRelevantFilesMessage);
      } finally {
        setSendMessageInProgress(false);
      }
    };

    const { messageRef, scrollRef, enableAutoScroll } = useSnapScroll();

    const handleModelSelectionChange = useCallback(
      async (newModel: ModelSelection) => {
        setModelSelection(newModel);
        if (hasApiKeySet(newModel, useGeminiAuto, apiKey)) {
          setDisableChatMessage(null);
          return;
        }
        const { hasMissingKey, provider, requireKey } = checkApiKeyForCurrentModel(newModel);
        if (hasMissingKey && provider) {
          setDisableChatMessage({ type: 'MissingApiKey', provider, requireKey });
        } else {
          setDisableChatMessage(null);
        }
      },
      [apiKey, checkApiKeyForCurrentModel, setModelSelection, useGeminiAuto],
    );

    return (
      <>
        <BaseChat
          ref={animationScope}
          messageRef={messageRef}
          scrollRef={scrollRef}
          showChat={showChat}
          chatStarted={chatStarted}
          description={title}
          onStop={abort}
          onSend={sendMessage}
          streamStatus={status}
          currentError={error}
          toolStatus={toolStatus}
          messages={parsedMessages}
          actionAlert={actionAlert}
          clearAlert={() => workbenchStore.clearAlert()}
          terminalInitializationOptions={terminalInitializationOptions}
          disableChatMessage={
            disableChatMessage?.type === 'MissingApiKey' ? (
              <MissingApiKey
                provider={disableChatMessage.provider}
                requireKey={disableChatMessage.requireKey}
                resetDisableChatMessage={() => setDisableChatMessage(null)}
              />
            ) : null
          }
          sendMessageInProgress={sendMessageInProgress}
          modelSelection={modelSelection}
          setModelSelection={handleModelSelectionChange}
          onRewindToMessage={undefined}
          subchats={subchats}
        />
        <UsageDebugView />
      </>
    );
  },
);
Chat.displayName = 'Chat';

function useCurrentToolStatus() {
  const [toolStatus, setToolStatus] = useState<Record<string, ActionStatus>>({});
  useEffect(() => {
    let canceled = false;
    let artifactSubscription: (() => void) | null = null;
    const partSubscriptions: Record<PartId, () => void> = {};
    const subscribe = async () => {
      artifactSubscription = workbenchStore.artifacts.subscribe((artifacts: any) => {
        if (canceled) return;
        for (const [partId, artifactState] of Object.entries(artifacts)) {
          if (partSubscriptions[partId as PartId]) continue;
          const { actions } = (artifactState as any).runner;
          const sub = actions.subscribe((actionsMap: any) => {
            for (const [id, action] of Object.entries(actionsMap)) {
              setToolStatus((prev: any) => {
                if (prev[id] !== (action as any).status) return { ...prev, [id]: (action as any).status };
                return prev;
              });
            }
          });
          partSubscriptions[partId as PartId] = sub;
        }
      });
    };
    void subscribe();
    return () => {
      canceled = true;
      artifactSubscription?.();
      for (const sub of Object.values(partSubscriptions)) sub();
    };
  }, []);
  return toolStatus;
}

function exponentialBackoff(numFailures: number) {
  const jitter = Math.random() + 0.5;
  return 1000 * Math.pow(2, numFailures) * jitter;
}

function maxSizeForModel(model: ModelSelection, defaultMax: number): number {
  // Gemini has a larger context window
  if (model === 'gemini-2.5-pro') return defaultMax * 2;
  return defaultMax;
}
