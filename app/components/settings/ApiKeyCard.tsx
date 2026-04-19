import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { EyeNoneIcon, EyeOpenIcon } from '@radix-ui/react-icons';
import { getLocalApiKeys, setLocalApiKeys, type LocalApiKeys } from '~/lib/stores/localApiKeys';

type KeyField = 'value' | 'openai' | 'xai' | 'google' | 'longcat';

const KEY_CONFIGS: { field: KeyField; label: string; placeholder: string; docsUrl: string }[] = [
  { field: 'longcat', label: 'LongCat AI API Key', placeholder: 'ak_...', docsUrl: 'https://longcat.chat' },
  { field: 'value', label: 'Anthropic API Key', placeholder: 'sk-ant-...', docsUrl: 'https://docs.anthropic.com/en/api/getting-started#accessing-the-api' },
  { field: 'openai', label: 'OpenAI API Key', placeholder: 'sk-...', docsUrl: 'https://platform.openai.com/api-keys' },
  { field: 'xai', label: 'xAI (Grok) API Key', placeholder: 'xai-...', docsUrl: 'https://console.x.ai/' },
  { field: 'google', label: 'Google AI API Key', placeholder: 'AIza...', docsUrl: 'https://aistudio.google.com/app/apikey' },
];

export function ApiKeyCard() {
  const [keys, setKeys] = useState<LocalApiKeys>({ preference: 'always' });
  const [visible, setVisible] = useState<Record<KeyField, boolean>>({ value: false, openai: false, xai: false, google: false, longcat: false });

  useEffect(() => { setKeys(getLocalApiKeys()); }, []);

  const handleSave = (field: KeyField, val: string) => {
    const updated = { ...keys, [field]: val.trim() || undefined };
    setLocalApiKeys(updated);
    setKeys(updated);
    toast.success('API key saved.');
  };

  const handleClear = (field: KeyField) => {
    const updated = { ...keys };
    delete updated[field];
    setLocalApiKeys(updated);
    setKeys(updated);
    toast.success('API key removed.');
  };

  const toggleVisible = (field: KeyField) => setVisible((prev) => ({ ...prev, [field]: !prev[field] }));

  return (
    <div className="rounded-lg border bg-bolt-elements-background-depth-1 shadow-sm">
      <div className="p-6">
        <h2 className="mb-2 text-xl font-semibold text-content-primary">API Keys</h2>
        <p className="mb-6 max-w-prose text-sm text-content-secondary">
          Add your own API keys. Keys are stored locally in your browser and never sent to any server except the respective AI provider.
        </p>
        <div className="space-y-6">
          {KEY_CONFIGS.map(({ field, label, placeholder, docsUrl }) => (
            <ApiKeyItem
              key={field}
              label={label}
              placeholder={placeholder}
              docsUrl={docsUrl}
              value={keys[field] ?? ''}
              visible={visible[field]}
              onToggleVisible={() => toggleVisible(field)}
              onSave={(val) => handleSave(field, val)}
              onClear={() => handleClear(field)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function ApiKeyItem({ label, placeholder, docsUrl, value, visible, onToggleVisible, onSave, onClear }: {
  label: string; placeholder: string; docsUrl: string; value: string;
  visible: boolean; onToggleVisible: () => void; onSave: (val: string) => void; onClear: () => void;
}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => { setDraft(value); }, [value]);

  const isDirty = draft !== value;
  const hasKey = !!value;

  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-content-primary">{label}</label>
      <a href={docsUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-content-link hover:underline">
        How to get this key
      </a>
      <div className="mt-1 flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type={visible ? 'text' : 'password'}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={placeholder}
            className="w-full rounded-md border bg-bolt-elements-background-depth-2 px-3 py-2 pr-10 text-sm text-content-primary placeholder:text-content-tertiary focus:outline-none focus:ring-2 focus:ring-bolt-elements-focus"
          />
          <button type="button" onClick={onToggleVisible} className="absolute right-2 top-1/2 -translate-y-1/2 text-content-secondary hover:text-content-primary">
            {visible ? <EyeNoneIcon /> : <EyeOpenIcon />}
          </button>
        </div>
        {isDirty && (
          <button type="button" onClick={() => onSave(draft)} className="rounded-md bg-bolt-elements-button-primary-background px-3 py-2 text-sm font-medium text-bolt-elements-button-primary-text hover:bg-bolt-elements-button-primary-backgroundHover">
            Save
          </button>
        )}
        {hasKey && !isDirty && (
          <button type="button" onClick={onClear} className="rounded-md border px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950">
            Remove
          </button>
        )}
      </div>
    </div>
  );
}
