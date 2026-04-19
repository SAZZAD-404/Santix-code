import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@ui/Button';
import { Share2Icon, ClipboardIcon } from '@radix-ui/react-icons';
import * as Popover from '@radix-ui/react-popover';

export function ShareButton() {
  const [isOpen, setIsOpen] = useState(false);
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  const copyToClipboard = () => {
    navigator.clipboard.writeText(currentUrl);
    toast.success('Link copied to clipboard!');
  };

  return (
    <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
      <Popover.Trigger asChild>
        <Button focused={isOpen} variant="neutral" size="xs">
          <Share2Icon />
          <span>Share</span>
        </Button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className="z-50 w-80 animate-fadeInFromLoading rounded-md border bg-bolt-elements-background-depth-1 p-4 shadow-lg"
          sideOffset={5}
          align="end"
        >
          <p className="mb-3 text-sm text-content-secondary">Share this chat by copying the link:</p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={currentUrl}
              className="flex-1 rounded-md border bg-bolt-elements-background-depth-2 px-3 py-1.5 text-sm text-content-primary"
            />
            <Button variant="neutral" size="xs" onClick={copyToClipboard} tip="Copy link" icon={<ClipboardIcon />} />
          </div>
          <Popover.Arrow className="fill-border-transparent" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
