import { useStore } from '@nanostores/react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { description as descriptionStore } from '~/lib/stores/description';
import { chatIdStore } from '~/lib/stores/chatId';
import { updateChatDescription } from '~/lib/stores/localChatHistory';

interface EditChatDescriptionOptions {
  initialDescription?: string;
  customChatId?: string;
  syncWithGlobalStore?: boolean;
}

type EditChatDescriptionHook = {
  editing: boolean;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleBlur: () => Promise<void>;
  handleSubmit: (event: React.FormEvent) => Promise<void>;
  handleKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => Promise<void>;
  currentDescription: string;
  toggleEditMode: () => void;
};

export function useEditChatDescription({
  initialDescription = descriptionStore.get()!,
  customChatId,
  syncWithGlobalStore,
}: EditChatDescriptionOptions): EditChatDescriptionHook {
  const chatIdFromStore = useStore(chatIdStore);
  const [editing, setEditing] = useState(false);
  const [currentDescription, setCurrentDescription] = useState(initialDescription);
  const [chatId, setChatId] = useState<string>();

  useEffect(() => {
    setChatId(customChatId || chatIdFromStore);
  }, [customChatId, chatIdFromStore]);

  useEffect(() => {
    setCurrentDescription(initialDescription);
  }, [initialDescription]);

  const toggleEditMode = useCallback(() => setEditing((prev) => !prev), []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentDescription(e.target.value);
  }, []);

  const handleBlur = useCallback(async () => {
    setCurrentDescription(initialDescription);
    toggleEditMode();
  }, [initialDescription, toggleEditMode]);

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();

      const trimmedDesc = currentDescription.trim();
      if (trimmedDesc === initialDescription) {
        toggleEditMode();
        return;
      }
      if (trimmedDesc.length === 0 || trimmedDesc.length > 100) {
        toast.error('Description must be between 1 and 100 characters.');
        return;
      }

      try {
        if (chatId) {
          updateChatDescription(chatId, trimmedDesc);
        }
        if (syncWithGlobalStore) {
          descriptionStore.set(trimmedDesc);
        }
        toast.success('Chat description updated');
      } catch (error) {
        toast.error('Failed to update chat description');
      }

      toggleEditMode();
    },
    [currentDescription, chatId, initialDescription, toggleEditMode, syncWithGlobalStore],
  );

  const handleKeyDown = useCallback(
    async (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Escape') {
        await handleBlur();
      }
    },
    [handleBlur],
  );

  return { editing, handleChange, handleBlur, handleSubmit, handleKeyDown, currentDescription, toggleEditMode };
}
