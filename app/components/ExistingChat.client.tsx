import { useConvexChatExisting } from '~/lib/stores/startup';
import { Chat } from './chat/Chat';
import { ChefAuthProvider } from './chat/ChefAuthWrapper';
import { setPageLoadChatId } from '~/lib/stores/chatId';
import { Loading } from './Loading';
import { ContainerBootState, useContainerBootState } from '~/lib/stores/containerBootState';
import { useReloadMessages } from '~/lib/stores/startup/reloadMessages';
import { useSplines } from '~/lib/splines';
import { UserProvider } from '~/components/UserProvider';
import { Toaster } from '~/components/ui/Toaster';
import { useRef } from 'react';
import type { PartCache } from '~/lib/hooks/useMessageParser';

export function ExistingChat({ chatId }: { chatId: string }) {
  setPageLoadChatId(chatId);

  return (
    <>
      <ChefAuthProvider>
        <UserProvider>
          <ExistingChatWrapper chatId={chatId} />
        </UserProvider>
      </ChefAuthProvider>
      <Toaster />
    </>
  );
}

function ExistingChatWrapper({ chatId }: { chatId: string }) {
  const partCache = useRef<PartCache>(new Map());
  const { initialMessages, storeMessageHistory, initializeChat, subchats } = useConvexChatExisting(chatId);

  const reloadState = useReloadMessages(initialMessages ?? undefined);
  const bootState = useContainerBootState();

  let loading: null | string = null;

  if (initialMessages === undefined) {
    loading = 'Loading chat messages...';
  } else if (reloadState === undefined) {
    loading = 'Parsing chat messages...';
  } else if (bootState.state === ContainerBootState.LOADING_SNAPSHOT) {
    loading = 'Loading snapshot...';
  } else if (bootState.state === ContainerBootState.DOWNLOADING_DEPENDENCIES) {
    loading = 'Downloading dependencies...';
  } else if (bootState.state === ContainerBootState.SETTING_UP_CONVEX_PROJECT) {
    loading = 'Setting up project...';
  } else if (bootState.state !== ContainerBootState.READY) {
    loading = 'Loading environment...';
  }

  const isError = bootState.state === ContainerBootState.ERROR;
  const easterEgg = useSplines(!isError && !!loading);

  const hadSuccessfulDeploy = initialMessages?.some(
    (message) =>
      message.role === 'assistant' &&
      message.parts?.some((part) => part.type === 'tool-invocation' && part.toolInvocation.toolName === 'deploy'),
  );

  if (initialMessages === null) {
    return <NotFound />;
  }

  return (
    <>
      {loading && <Loading message={easterEgg ?? loading} />}
      {!loading && (
        <Chat
          initialMessages={initialMessages!}
          partCache={reloadState!.partCache}
          storeMessageHistory={storeMessageHistory}
          initializeChat={initializeChat}
          isReload={true}
          hadSuccessfulDeploy={!!hadSuccessfulDeploy}
          subchats={subchats}
        />
      )}
    </>
  );
}

function NotFound() {
  return (
    <div className="flex h-full flex-col items-center justify-center p-8 text-center">
      <h1 className="mb-4 font-display text-4xl font-bold tracking-tight text-content-primary">Not found</h1>
      <p className="mb-4 text-balance text-content-secondary">
        The chat you&apos;re looking for can&apos;t be found. It may have been deleted.
      </p>
      <a
        href="/"
        className="inline-flex items-center gap-2 rounded-lg bg-bolt-elements-button-primary-background px-4 py-2 text-bolt-elements-button-primary-text transition-colors hover:bg-bolt-elements-button-primary-backgroundHover"
      >
        <span className="text-sm font-medium">Return home</span>
      </a>
    </div>
  );
}
