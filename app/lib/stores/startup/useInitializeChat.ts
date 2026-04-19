import { useCallback } from 'react';
import { ContainerBootState, waitForBootStepCompleted } from '~/lib/stores/containerBootState';
import { saveChatMessages, getChatMessages } from '~/lib/stores/localChatHistory';
import { chatIdStore } from '~/lib/stores/chatId';

export function useHomepageInitializeChat(chatId: string, setChatInitialized: (v: boolean) => void) {
  return useCallback(async () => {
    setChatInitialized(true);
    await waitForBootStepCompleted(ContainerBootState.LOADING_SNAPSHOT);
    return true;
  }, [chatId, setChatInitialized]);
}

export function useExistingInitializeChat(_chatId: string) {
  return useCallback(async () => {
    return true;
  }, []);
}
