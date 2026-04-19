// Thumbnail chooser — simplified (no Convex upload)
export async function uploadThumbnail(_imageData: string, _sessionId: string, _chatId: string): Promise<void> {
  // No-op in local mode
}

type ThumbnailChooserProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onRequestCapture?: () => Promise<string>;
};

export function ThumbnailChooser({ isOpen, onOpenChange }: ThumbnailChooserProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="rounded-lg bg-bolt-elements-background-depth-1 p-6 shadow-lg">
        <p className="text-content-secondary text-sm">Thumbnail sharing not available in local mode.</p>
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="mt-4 rounded-md border px-3 py-1.5 text-sm text-content-primary hover:bg-background-secondary"
        >
          Close
        </button>
      </div>
    </div>
  );
}
