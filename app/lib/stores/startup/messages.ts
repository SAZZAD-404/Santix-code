import type { Message } from '@ai-sdk/react';
import { atom } from 'nanostores';
import { getKnownUrlId, setKnownInitialId, setKnownUrlId } from '~/lib/stores/chatId';
import { description as descriptionStore } from '~/lib/stores/description';
import { compressWithLz4 } from '~/lib/compression';
import { stripMetadata } from '~/components/chat/UserMessage';

type CompleteMessageInfo = {
  messageIndex: number;
  partIndex: number;
  hasNextPart: boolean;
  allMessages: Message[];
};

export const lastCompleteMessageInfoStore = atom<CompleteMessageInfo | null>(null);

/**
 * Prepares message history for local storage (no Convex).
 * Returns a no-op update since localStorage is handled by useStoreMessageHistory.
 */
export async function prepareMessageHistory(args: {
  chatId: string;
  sessionId: string;
  completeMessageInfo: CompleteMessageInfo;
  persistedMessageInfo: { messageIndex: number; partIndex: number };
  subchatIndex: number;
}): Promise<{
  url: URL;
  update: {
    compressed: Uint8Array;
    urlHintAndDescription: { urlHint: string; description: string } | undefined;
    messageIndex: number;
    partIndex: number;
    firstMessage: string | undefined;
  } | null;
}> {
  const { chatId, completeMessageInfo, persistedMessageInfo } = args;
  const { messageIndex, partIndex, allMessages } = completeMessageInfo;
  const url = new URL(`http://localhost/store_chat`);
  url.searchParams.set('chatId', chatId);

  const firstMessage = allMessages.length > 0 ? stripMetadata(allMessages[0].content) : undefined;
  if (messageIndex === persistedMessageInfo.messageIndex && partIndex === persistedMessageInfo.partIndex) {
    return { url, update: null };
  }

  let urlHintAndDescription: { urlHint: string; description: string } | undefined;
  if (getKnownUrlId() === undefined) {
    urlHintAndDescription = extractUrlHintAndDescription(allMessages) ?? undefined;
  }
  const compressed = await compressMessages(allMessages, messageIndex, partIndex);
  return { url, update: { compressed, urlHintAndDescription, messageIndex, partIndex, firstMessage } };
}

/**
 * Handles URL hint and description locally (no Convex mutation).
 */
export async function handleUrlHintAndDescription(
  _convex: unknown,
  chatId: string,
  _sessionId: string,
  urlHint: string,
  description: string,
) {
  if (getKnownUrlId() === undefined) {
    descriptionStore.set(description);
    setKnownUrlId(urlHint);
    setKnownInitialId(chatId);
  }
}

export async function waitForNewMessages(messageIndex: number, partIndex: number, alertOnNextPartStart: boolean) {
  return new Promise<void>((resolve) => {
    let unsubscribe: (() => void) | null = null;
    unsubscribe = lastCompleteMessageInfoStore.subscribe((lastCompleteMessageInfo) => {
      if (
        lastCompleteMessageInfo !== null &&
        (lastCompleteMessageInfo.messageIndex !== messageIndex ||
          lastCompleteMessageInfo.partIndex !== partIndex ||
          (alertOnNextPartStart && lastCompleteMessageInfo.hasNextPart))
      ) {
        if (unsubscribe !== null) {
          unsubscribe();
          unsubscribe = null;
        }
        resolve();
      }
    });
  });
}

function extractUrlHintAndDescription(messages: Message[]) {
  for (const message of messages) {
    for (const part of message.parts ?? []) {
      if (part.type === 'text') {
        const content = part.text;
        const match = content.match(/<boltArtifact id="([^"]+)" title="(?!Relevant Files)([^"]+)"/);
        if (match) {
          return { urlHint: match[1], description: match[2] };
        }
      }
    }
  }
  return null;
}

export function serializeMessageForConvex(message: Message) {
  const { content: _content, toolInvocations: _toolInvocations, ...rest } = message;
  return {
    ...rest,
    parts: message.parts,
    createdAt: message.createdAt?.getTime() ?? undefined,
  };
}

async function compressMessages(messages: Message[], lastMessageRank: number, partIndex: number): Promise<Uint8Array> {
  const slicedMessages = messages.slice(0, lastMessageRank + 1);
  slicedMessages[lastMessageRank].parts = slicedMessages[lastMessageRank].parts?.slice(0, partIndex + 1);
  const serialized = slicedMessages.map(serializeMessageForConvex);
  const textEncoder = new TextEncoder();
  const uint8Array = textEncoder.encode(JSON.stringify(serialized));
  return compressWithLz4(uint8Array);
}
