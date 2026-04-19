/**
 * Simplified history sync - saves to localStorage instead of Convex.
 */
import type { Message } from 'ai';
import { useEffect } from 'react';
import { chatSyncState } from './chatSyncState';
import { lastCompleteMessageInfoStore } from './messages';

export function useBackupSyncState(chatId: string, loadedSubchatIndex?: number, initialMessages?: Message[]) {
  useEffect(() => {
    if (initialMessages !== undefined) {
      const lastMessage = initialMessages[initialMessages.length - 1];
      const lastMessagePartIndex = (lastMessage?.parts?.length ?? 0) - 1;
      const currentSyncState = chatSyncState.get();
      if (
        loadedSubchatIndex !== undefined &&
        (currentSyncState.persistedMessageInfo === null || loadedSubchatIndex !== currentSyncState.subchatIndex)
      ) {
        chatSyncState.set({
          ...currentSyncState,
          persistedMessageInfo: {
            messageIndex: initialMessages.length - 1,
            partIndex: lastMessagePartIndex,
          },
          subchatIndex: loadedSubchatIndex,
        });
        lastCompleteMessageInfoStore.set({
          messageIndex: initialMessages.length - 1,
          partIndex: lastMessagePartIndex,
          allMessages: initialMessages,
          hasNextPart: false,
        });
      }
    }
  }, [initialMessages, loadedSubchatIndex]);
}
