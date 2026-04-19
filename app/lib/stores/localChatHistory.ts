/**
 * localStorage-based chat history storage.
 * Replaces Convex-based message/chat storage.
 */
import type { Message } from 'ai';

const CHATS_INDEX_KEY = 'chef_chats_index';
const CHAT_PREFIX = 'chef_chat_';
const MAX_CHATS = 100;

export type ChatMeta = {
  id: string;
  description: string;
  createdAt: number;
  updatedAt: number;
};

export function getChatIndex(): ChatMeta[] {
  try {
    const raw = localStorage.getItem(CHATS_INDEX_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ChatMeta[];
  } catch {
    return [];
  }
}

function saveChatIndex(index: ChatMeta[]): void {
  localStorage.setItem(CHATS_INDEX_KEY, JSON.stringify(index));
}

export function getChatMessages(chatId: string): Message[] {
  try {
    const raw = localStorage.getItem(CHAT_PREFIX + chatId);
    if (!raw) return [];
    return JSON.parse(raw) as Message[];
  } catch {
    return [];
  }
}

export function saveChatMessages(chatId: string, messages: Message[], description?: string): void {
  try {
    localStorage.setItem(CHAT_PREFIX + chatId, JSON.stringify(messages));

    const index = getChatIndex();
    const existing = index.find((c) => c.id === chatId);
    const now = Date.now();

    if (existing) {
      existing.updatedAt = now;
      if (description) existing.description = description;
    } else {
      // Trim old chats if over limit
      if (index.length >= MAX_CHATS) {
        const oldest = index.sort((a, b) => a.updatedAt - b.updatedAt)[0];
        if (oldest) {
          localStorage.removeItem(CHAT_PREFIX + oldest.id);
          index.splice(index.indexOf(oldest), 1);
        }
      }
      index.push({
        id: chatId,
        description: description ?? 'New chat',
        createdAt: now,
        updatedAt: now,
      });
    }
    saveChatIndex(index);
  } catch (e) {
    console.error('Failed to save chat messages to localStorage', e);
  }
}

export function deleteChatFromHistory(chatId: string): void {
  localStorage.removeItem(CHAT_PREFIX + chatId);
  const index = getChatIndex().filter((c) => c.id !== chatId);
  saveChatIndex(index);
}

export function updateChatDescription(chatId: string, description: string): void {
  const index = getChatIndex();
  const chat = index.find((c) => c.id === chatId);
  if (chat) {
    chat.description = description;
    saveChatIndex(index);
  }
}
