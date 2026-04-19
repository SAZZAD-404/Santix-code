import Cookies from 'js-cookie';
import { useStore } from '@nanostores/react';
import { EnhancePromptButton } from './EnhancePromptButton.client';
import { messageInputStore } from '~/lib/stores/messageInput';
import React, {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type ChangeEventHandler,
  type KeyboardEventHandler,
} from 'react';
import { useSearchParams } from '@remix-run/react';
import { classNames } from '~/utils/classNames';
import { PROMPT_COOKIE_KEY, type ModelSelection } from '~/utils/constants';
import { ModelSelector } from './ModelSelector';
import { ArrowRightIcon, ExclamationTriangleIcon, MagnifyingGlassIcon, StopIcon } from '@radix-ui/react-icons';
import { SquaresPlusIcon } from '@heroicons/react/24/outline';
import { Tooltip } from '@ui/Tooltip';
import { useChefAuth } from './ChefAuthWrapper';
import { KeyboardShortcut } from '@ui/KeyboardShortcut';
import { Button } from '@ui/Button';
import { Spinner } from '@ui/Spinner';
import { debounce } from '~/utils/debounce';
import { toast } from 'sonner';
import { captureException } from '@sentry/remix';
import { Menu as MenuComponent, MenuItem as MenuItemComponent } from '@ui/Menu';
import { PencilSquareIcon } from '@heroicons/react/24/outline';
import { ChatBubbleLeftIcon, DocumentArrowUpIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

const PROMPT_LENGTH_WARNING_THRESHOLD = 2000;

type Highlight = {
  text: string;
  tooltip: ReactNode;
};

const HIGHLIGHTS: Highlight[] = [];

export const MessageInput = memo(function MessageInput({
  chatStarted,
  isStreaming,
  sendMessageInProgress,
  onStop,
  onSend,
  disabled,
  modelSelection,
  setModelSelection,
  numMessages,
}: {
  chatStarted: boolean;
  isStreaming: boolean;
  sendMessageInProgress: boolean;
  onStop: () => void;
  onSend: (message: string) => Promise<void>;
  disabled: boolean;
  modelSelection: ModelSelection;
  setModelSelection: (modelSelection: ModelSelection) => void;
  numMessages: number | undefined;
}) {
  const [isEnhancing, setIsEnhancing] = useState(false);
  const chefAuthState = useChefAuth();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const input = useStore(messageInputStore);

  const [searchParams] = useSearchParams();
  useEffect(() => {
    messageInputStore.set(searchParams.get('prefill') || Cookies.get(PROMPT_COOKIE_KEY) || '');
  }, [searchParams]);

  const handleSend = useCallback(async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput) return;
    await onSend(trimmedInput);
    Cookies.remove(PROMPT_COOKIE_KEY);
    messageInputStore.set('');
    textareaRef.current?.blur();
  }, [input, onSend]);

  const handleClickButton = useCallback(() => {
    if (isStreaming) { onStop?.(); return; }
    handleSend();
  }, [handleSend, isStreaming, onStop]);

  const handleKeyDown: KeyboardEventHandler<HTMLTextAreaElement> = useCallback(
    (event) => {
      if (event.key === 'Enter') {
        if (event.shiftKey) return;
        event.preventDefault();
        if (isStreaming) { onStop?.(); return; }
        if (event.nativeEvent.isComposing) return;
        handleSend();
      }
    },
    [handleSend, isStreaming, onStop],
  );

  const handleChange: ChangeEventHandler<HTMLTextAreaElement> = useCallback((event) => {
    const value = event.target.value;
    messageInputStore.set(value);
    cachePrompt(value);
  }, []);

  const enhancePrompt = useCallback(async () => {
    try {
      setIsEnhancing(true);
      const response = await fetch('/api/enhance-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: input.trim() }),
      });
      if (!response.ok) {
        throw new Error(response.status === 402
          ? 'No remaining tokens available for prompt enhancement'
          : 'Failed to enhance prompt. Please try again.');
      }
      const data = await response.json();
      if (data.enhancedPrompt) messageInputStore.set(data.enhancedPrompt);
    } catch (error) {
      captureException('Failed to enhance prompt', { level: 'error', extra: { error } });
      toast.error(error instanceof Error ? error.message : 'Failed to enhance prompt. Please try again.');
    } finally {
      setIsEnhancing(false);
    }
  }, [input]);

  const insertTemplate = useCallback(
    (template: string) => {
      const newValue = input && input.trim().length > 0
        ? input + (input.endsWith('\n') ? '' : '\n\n') + template
        : template;
      messageInputStore.set(newValue);
      setTimeout(() => {
        const textarea = textareaRef.current;
        if (textarea) {
          const start = newValue.lastIndexOf('...');
          if (start !== -1) { textarea.focus(); textarea.setSelectionRange(start, start + 5); }
        }
      }, 0);
    },
    [input],
  );

  return (
    <div className="relative z-20 mx-auto w-full max-w-chat rounded-xl shadow transition-all duration-200">
      <div className="rounded-xl bg-background-primary/75 backdrop-blur-md">
        <div className="rounded-t-xl border transition-all has-[textarea:focus]:border-border-selected">
          <TextareaWithHighlights
            onKeyDown={handleKeyDown}
            onChange={handleChange}
            value={input}
            chatStarted={chatStarted}
            minHeight={100}
            maxHeight={chatStarted ? 400 : 200}
            placeholder={
              chatStarted
                ? numMessages !== undefined && numMessages > 0
                  ? 'Request changes by sending another message…'
                  : 'Send a prompt for a new feature…'
                : 'What app do you want to build?'
            }
            disabled={disabled}
            highlights={HIGHLIGHTS}
          />
        </div>
        <div className="flex items-center gap-2 border rounded-b-xl border-t-0 bg-background-secondary/80 p-1.5 text-sm flex-wrap">
          {chefAuthState.kind === 'fullyLoggedIn' && (
            <ModelSelector modelSelection={modelSelection} setModelSelection={setModelSelection} size="sm" />
          )}
          {input.length > 3 && input.length <= PROMPT_LENGTH_WARNING_THRESHOLD && <NewLineShortcut />}
          {input.length > PROMPT_LENGTH_WARNING_THRESHOLD && <CharacterWarning />}
          <div className="ml-auto flex items-center gap-1">
            {chefAuthState.kind === 'fullyLoggedIn' && (
              <MenuComponent
                buttonProps={{
                  variant: 'neutral',
                  tip: 'Use a recipe',
                  inline: true,
                  icon: <div className="text-lg"><SquaresPlusIcon className="size-4" /></div>,
                }}
                placement="top-start"
              >
                <div className="ml-3 flex items-center gap-1">
                  <h2 className="text-sm font-bold">Use a recipe</h2>
                  <Tooltip tip="Recipes are prompts that add powerful features to your app." side="top">
                    <span className="cursor-help text-content-tertiary"><InformationCircleIcon className="size-4" /></span>
                  </Tooltip>
                </div>
                <MenuItemComponent action={() => insertTemplate('Make a collaborative text editor that ...')}>
                  <div className="flex w-full items-center gap-2"><PencilSquareIcon className="size-4 text-content-secondary" />Make a collaborative text editor</div>
                </MenuItemComponent>
                <MenuItemComponent action={() => insertTemplate('Add AI chat to ...')}>
                  <div className="flex w-full items-center gap-2"><ChatBubbleLeftIcon className="size-4 text-content-secondary" />Add AI chat</div>
                </MenuItemComponent>
                <MenuItemComponent action={() => insertTemplate('Add file upload to ...')}>
                  <div className="flex w-full items-center gap-2"><DocumentArrowUpIcon className="size-4 text-content-secondary" />Add file upload</div>
                </MenuItemComponent>
                <MenuItemComponent action={() => insertTemplate('Add full text search to ...')}>
                  <div className="flex w-full items-center gap-2"><MagnifyingGlassIcon className="size-4 text-content-secondary" />Add full text search</div>
                </MenuItemComponent>
              </MenuComponent>
            )}
            {chefAuthState.kind === 'fullyLoggedIn' && (
              <EnhancePromptButton isEnhancing={isEnhancing} disabled={disabled || input.length === 0} onClick={enhancePrompt} />
            )}
            <Button
              disabled={(!isStreaming && input.length === 0) || chefAuthState.kind === 'loading' || sendMessageInProgress || disabled}
              onClick={handleClickButton}
              size="xs"
              className="ml-2 h-[1.625rem]"
              aria-label={isStreaming ? 'Stop' : 'Send'}
              icon={sendMessageInProgress ? <Spinner className="text-white" /> : !isStreaming ? <ArrowRightIcon /> : <StopIcon />}
            />
          </div>
        </div>
      </div>
    </div>
  );
});

const TextareaWithHighlights = memo(function TextareaWithHighlights({
  onKeyDown, onChange, value, minHeight, maxHeight, placeholder, disabled, highlights,
}: {
  onKeyDown: KeyboardEventHandler<HTMLTextAreaElement>;
  onChange: ChangeEventHandler<HTMLTextAreaElement>;
  value: string; chatStarted: boolean; placeholder: string; disabled: boolean;
  minHeight: number; maxHeight: number; highlights: Highlight[];
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) { textarea.style.height = 'auto'; textarea.style.height = `${textarea.scrollHeight}px`; }
  }, [value]);

  const blocks = useMemo(() => {
    if (!highlights.length) return [];
    const pattern = highlights.map((h) => h.text).join('|');
    const regex = new RegExp(pattern, 'gi');
    return Array.from(value.matchAll(regex)).map((match) => ({
      from: match.index!,
      length: match[0].length,
      tip: highlights.find((h) => h.text === match[0].toLowerCase())!.tooltip,
    }));
  }, [highlights, value]);

  return (
    <div className="relative overflow-y-auto" style={{ minHeight, maxHeight }}>
      <textarea
        ref={textareaRef}
        className={classNames(
          'w-full px-3 py-3 outline-none resize-none text-content-primary placeholder-content-tertiary bg-transparent text-sm leading-snug',
          'transition-opacity',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'scrollbar-thin scrollbar-thumb-macosScrollbar-thumb scrollbar-track-transparent',
        )}
        disabled={disabled}
        onKeyDown={onKeyDown}
        onChange={onChange}
        value={value}
        style={{ minHeight }}
        placeholder={placeholder}
        translate="no"
        data-gramm="false"
      />
      <HighlightBlocks textareaRef={textareaRef} text={value} blocks={blocks} />
    </div>
  );
});

const HighlightBlocks = memo(function HighlightBlocks({
  text, blocks, textareaRef,
}: {
  text: string;
  blocks: { from: number; length: number; tip: ReactNode }[];
  textareaRef: React.RefObject<HTMLTextAreaElement>;
}) {
  const mirrorRef = useRef<HTMLDivElement>(null);
  const [forceRerender, setForceRerender] = useState(0);
  const [blockPositions, setBlockPositions] = useState<{ top: number; left: number; width: number; height: number; tip: ReactNode }[]>([]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const ro = new ResizeObserver(() => setForceRerender((n) => n + 1));
    ro.observe(textarea);
    return () => ro.disconnect();
  }, [textareaRef]);

  useLayoutEffect(() => {
    if (!blocks.length) return;
    const mirror = mirrorRef.current;
    if (!mirror) return;
    const wrapperRect = mirror.getBoundingClientRect();
    const positions = blocks.flatMap((block) => {
      const range = document.createRange();
      range.setStart(mirror.firstChild!, block.from);
      range.setEnd(mirror.firstChild!, block.from + block.length);
      const result: typeof blockPositions = [];
      for (const rect of range.getClientRects()) {
        result.push({ top: rect.top - wrapperRect.top + mirror.scrollTop, left: rect.left - wrapperRect.left + mirror.scrollLeft, width: rect.width, height: rect.height, tip: block.tip });
      }
      return result;
    });
    setBlockPositions(positions);
  }, [blocks, textareaRef, forceRerender]);

  if (!blocks.length) return null;

  return (
    <div>
      <div ref={mirrorRef} className="pointer-events-none absolute inset-0 -z-20 whitespace-pre-wrap break-words p-3 text-sm leading-snug opacity-0" aria-hidden>
        {text}
      </div>
      <div>
        {blockPositions.map((block, index) => (
          <div key={index} className="absolute flex overflow-hidden bg-[#f8d077] mix-blend-color" style={{ width: block.width, height: block.height, top: block.top, left: block.left }}>
            <Tooltip className="absolute inset-0" tip={block.tip}>{null}</Tooltip>
          </div>
        ))}
      </div>
    </div>
  );
});

const NewLineShortcut = memo(function NewLineShortcut() {
  return (
    <div className="text-xs text-content-tertiary">
      <KeyboardShortcut value={['Shift', 'Return']} className="mr-0.5 font-semibold" /> for new line
    </div>
  );
});

const CharacterWarning = memo(function CharacterWarning() {
  return (
    <Tooltip tip="Shorter prompts work better. Consider breaking it into smaller chunks." side="bottom">
      <div className="flex cursor-help items-center text-xs text-content-warning">
        <ExclamationTriangleIcon className="mr-1 size-4" />
        Prompt exceeds {PROMPT_LENGTH_WARNING_THRESHOLD.toLocaleString()} characters
      </div>
    </Tooltip>
  );
});

const cachePrompt = debounce(function cachePrompt(prompt: string) {
  Cookies.set(PROMPT_COOKIE_KEY, prompt.trim(), { expires: 30 });
}, 1000);
