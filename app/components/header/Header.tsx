import { useStore } from '@nanostores/react';
import { useState } from 'react';
import { ClientOnly } from 'remix-utils/client-only';
import { chatStore } from '~/lib/stores/chatId';
import { HeaderActionButtons } from './HeaderActionButtons.client';
import { ChatDescription } from '~/components/header/ChatDescription.client';
import { DeployButton } from './DeployButton';
import { DownloadButton } from './DownloadButton';
import { HamburgerMenuIcon, GearIcon } from '@radix-ui/react-icons';
import { Menu } from '~/components/sidebar/Menu.client';

export function Header({ hideSidebarIcon = false }: { hideSidebarIcon?: boolean }) {
  const chat = useStore(chatStore);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="flex h-[var(--header-height)] items-center overflow-x-auto overflow-y-hidden border-b p-5">
      <div className="z-40 flex cursor-pointer items-center gap-4 text-content-primary">
        {!hideSidebarIcon && (
          <HamburgerMenuIcon
            className="shrink-0"
            data-hamburger-menu
            onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }}
          />
        )}
        <a href="/">
          <img src="/chef.svg" alt="Chef logo" width={72} height={42} className="relative -top-1" />
        </a>
      </div>

      <>
        {chat.started && (
          <span className="flex-1 truncate px-4 text-center text-content-primary">
            <ClientOnly>{() => <ChatDescription />}</ClientOnly>
          </span>
        )}
        <ClientOnly>
          {() => (
            <div className="ml-auto flex items-center gap-2">
              {chat.started && (
                <>
                  <DownloadButton />
                  <DeployButton />
                  <div className="mr-1">
                    <HeaderActionButtons />
                  </div>
                </>
              )}
              <a
                href="/settings"
                title="Settings"
                className="inline-flex items-center justify-center rounded-md border p-1.5 text-content-secondary hover:bg-background-secondary hover:text-content-primary"
              >
                <GearIcon className="size-4" />
              </a>
            </div>
          )}
        </ClientOnly>
      </>
      <Menu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </header>
  );
}
