import { useTeamsInitializer } from '~/lib/stores/startup/useTeamsInitializer';
import { ChefAuthProvider } from '~/components/chat/ChefAuthWrapper';
import type { MetaFunction } from '@vercel/remix';
import { ArrowLeftIcon } from '@radix-ui/react-icons';
import { useState, useEffect } from 'react';
import { useIsAdmin } from '~/lib/hooks/useDebugPrompt';
import { useSearchParams } from '@remix-run/react';
import { ClientOnly } from 'remix-utils/client-only';
import { UsageBreakdownView } from '~/components/debug/UsageBreakdownView';

export const meta: MetaFunction = () => {
  return [{ title: 'Usage Breakdown | Admin' }];
};

export default function UsageBreakdown() {
  useTeamsInitializer();
  return (
    <ChefAuthProvider redirectIfUnauthenticated={true}>
      <ClientOnly>{() => <UsageBreakdownContent />}</ClientOnly>
    </ChefAuthProvider>
  );
}

function UsageBreakdownContent() {
  const isAdmin = useIsAdmin();
  const [searchParams] = useSearchParams();
  const initialId = searchParams.get('id');
  const [chatId, setChatId] = useState(initialId || '');
  const [fileContent, setFileContent] = useState<Blob | null>(null);
  const [showDebug, setShowDebug] = useState(!!initialId);

  useEffect(() => {
    if (initialId) { setChatId(initialId); setShowDebug(true); }
  }, [initialId]);

  if (isAdmin === false) {
    return (
      <div className="min-h-screen bg-[var(--background-app)]">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <div className="mb-8 flex items-center gap-4">
            <a href="/" className="inline-flex" title="Back"><ArrowLeftIcon /></a>
            <h1 className="text-2xl font-bold text-[var(--content-primary)]">Usage Breakdown</h1>
          </div>
          <div className="rounded-lg border border-[var(--color-danger)]/20 bg-[var(--color-danger)]/8 p-4 text-sm text-[var(--color-danger)]">
            Admin access required.
          </div>
        </div>
      </div>
    );
  }

  if (isAdmin === undefined) return null;

  return (
    <div className="min-h-screen bg-[var(--background-app)]">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8 flex items-center gap-4">
          <a href="/" className="inline-flex" title="Back"><ArrowLeftIcon /></a>
          <h1 className="text-2xl font-bold text-[var(--content-primary)]">Usage Breakdown</h1>
        </div>
        <div className="space-y-4">
          <div className="flex flex-col gap-3 rounded-xl border border-[var(--border-default)] bg-[var(--background-primary)] p-6">
            <label className="block text-sm font-medium text-[var(--content-primary)]">
              Chat ID
              <input
                type="text"
                value={chatId}
                onChange={(e) => setChatId(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && chatId) setShowDebug(true); }}
                className="mt-1 block w-full rounded-lg border border-[var(--border-default)] bg-[var(--background-secondary)] px-3 py-2 text-sm text-[var(--content-primary)] outline-none focus:border-[var(--border-focus)]"
                placeholder="Enter chat ID"
              />
            </label>
            <label className="block text-sm font-medium text-[var(--content-primary)]">
              File Upload
              <input
                type="file"
                onChange={(e) => setFileContent(e.target.files?.[0] || null)}
                className="mt-1 block w-full rounded-lg border border-[var(--border-default)] bg-[var(--background-secondary)] px-3 py-2 text-sm text-[var(--content-primary)] outline-none"
              />
            </label>
            <button
              onClick={() => setShowDebug(true)}
              disabled={!chatId && !fileContent}
              className="mt-2 rounded-lg bg-[var(--brand-500)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--brand-600)] disabled:opacity-40"
            >
              Show Debug View
            </button>
          </div>
        </div>
      </div>
      {showDebug && (
        <UsageBreakdownView chatInitialId={chatId} convexSiteUrl="" fileContent={fileContent} />
      )}
    </div>
  );
}
