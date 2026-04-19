import { useState, useEffect } from 'react';
import type { Message } from '@ai-sdk/react';
import { getChatMessages } from '~/lib/stores/localChatHistory';
import { setKnownUrlId, setKnownInitialId } from '~/lib/stores/chatId';
import { description } from '~/lib/stores/description';

export interface InitialMessages {
  loadedChatId: string;
  deserialized: Message[];
  loadedSubchatIndex: number;
}

export function useInitialMessages(chatId: string | undefined): InitialMessages | null | undefined {
  const [initialMessages, setInitialMessages] = useState<InitialMessages | null | undefined>(undefined);

  useEffect(() => {
    if (!chatId) {
      setInitialMessages(undefined);
      return;
    }

    const messages = getChatMessages(chatId);
    setKnownInitialId(chatId);
    setKnownUrlId(chatId);

    // Try to get description from first user message
    const firstUserMsg = messages.find((m) => m.role === 'user');
    if (firstUserMsg) {
      const text = typeof firstUserMsg.content === 'string'
        ? firstUserMsg.content
        : '';
      description.set(text.slice(0, 80));
    }

    setInitialMessages({
      loadedChatId: chatId,
      deserialized: messages,
      loadedSubchatIndex: 0,
    });
  }, [chatId]);

  return initialMessages;
}
