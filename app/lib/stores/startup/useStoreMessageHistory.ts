import { useCallback } from 'react';
import type { Message } from '@ai-sdk/react';
import { chatIdStore } from '~/lib/stores/chatId';
import { saveChatMessages } from '~/lib/stores/localChatHistory';
import { description } from '~/lib/stores/description';

export function useStoreMessageHistory() {
  return useCallback(async (messages: Message[], _streamStatus: 'streaming' | 'submitted' | 'ready' | 'error') => {
    if (messages.length === 0) return;
    const chatId = chatIdStore.get();
    if (!chatId) return;
    const desc = description.get() ?? undefined;
    saveChatMessages(chatId, messages, desc);
  }, []);
}

// Re-export for compatibility
export function getLastCompletePart(
  messages: Message[],
  streamStatus: 'streaming' | 'submitted' | 'ready' | 'error',
): { messageIndex: number; partIndex: number; hasNextPart: boolean } | null {
  if (messages.length === 0) return null;
  const lastIdx = messages.length - 1;
  const lastMsg = messages[lastIdx];
  const partIdx = (lastMsg.parts?.length ?? 0) - 1;
  return { messageIndex: lastIdx, partIndex: Math.max(0, partIdx), hasNextPart: false };
}
