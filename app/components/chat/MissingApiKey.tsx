import { useState } from 'react';
import { Button } from '@ui/Button';
import { TextInput } from '@ui/TextInput';
import { toast } from 'sonner';
import { EyeNoneIcon, EyeOpenIcon } from '@radix-ui/react-icons';
import { type ModelProvider, displayModelProviderName } from './ModelSelector';
import { KeyIcon } from '@heroicons/react/24/outline';
import { getLocalApiKeys, setLocalApiKeys } from '~/lib/stores/localApiKeys';

export interface MissingApiKeyProps {
  provider: ModelProvider;
  requireKey: boolean;
  resetDisableChatMessage: () => void;
}

export function MissingApiKey({ provider, requireKey, resetDisableChatMessage }: MissingApiKeyProps) {
  const [isAdding, setIsAdding] = useState(requireKey);
  const [isSaving, setIsSaving] = useState(false);
  const [newKeyValue, setNewKeyValue] = useState('');
  const [showKey, setShowKey] = useState(false);

  const handleSaveKey = async () => {
    try {
      setIsSaving(true);
      const current = getLocalApiKeys();

      switch (provider) {
        case 'anthropic':
        case 'auto':
          current.value = newKeyValue.trim();
          break;
        case 'google':
          current.google = newKeyValue.trim();
          break;
        case 'openai':
          current.openai = newKeyValue.trim();
          break;
        case 'xai':
          current.xai = newKeyValue.trim();
          break;
        case 'longcat':
          current.longcat = newKeyValue.trim();
          break;
        default: {
          const _exhaustiveCheck: never = provider;
          throw new Error(`Unknown provider: ${_exhaustiveCheck}`);
        }
      }

      setLocalApiKeys(current);
      toast.success(`${displayModelProviderName(provider)} API key saved`);
      setIsAdding(false);
      setNewKeyValue('');
      resetDisableChatMessage();
    } catch (error) {
      toast.error(`Failed to save ${displayModelProviderName(provider)} API key`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsAdding(false);
    setNewKeyValue('');
  };

  return (
    <>
      <div className="flex flex-col gap-1">
        <h4>{requireKey ? 'Add an API key to use this model' : 'API key required'}</h4>
        <p className="max-w-prose text-pretty">
          {requireKey ? (
            <>
              This model requires your own API key. Please add an API key for{' '}
              <span className="font-semibold">{displayModelProviderName(provider)}</span> to continue.
            </>
          ) : (
            <>
              Please add an API key for{' '}
              <span className="font-semibold">{displayModelProviderName(provider)}</span> to continue, or choose a
              different model.
            </>
          )}
        </p>
      </div>

      {!isAdding ? (
        <div className="flex flex-wrap items-center gap-2">
          <Button className="w-fit" onClick={() => setIsAdding(true)} icon={<KeyIcon className="size-4" />}>
            Add {displayModelProviderName(provider)} API key
          </Button>
          <Button variant="neutral" href="/settings">
            Go to Settings
          </Button>
        </div>
      ) : (
        <div className="flex items-end gap-2">
          <div className="w-80">
            <TextInput
              autoFocus
              type={showKey ? 'text' : 'password'}
              className="h-[34px]"
              value={newKeyValue}
              onChange={(e: any) => setNewKeyValue(e.target.value)}
              placeholder={`Enter your ${displayModelProviderName(provider)} API key`}
              action={(() => setShowKey(!showKey)) as any}
              icon={showKey ? <EyeNoneIcon /> : <EyeOpenIcon />}
            />
          </div>
          <Button onClick={handleSaveKey} disabled={isSaving || !newKeyValue.trim()} loading={isSaving}>
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
          {!requireKey && (
            <Button variant="neutral" onClick={handleCancel} disabled={isSaving}>
              Cancel
            </Button>
          )}
        </div>
      )}
    </>
  );
}
