/**
 * Stub: Show/share feature requires Convex — not available in local mode.
 */
export function Show(_props: unknown) {
  return (
    <div className="flex h-full flex-col items-center justify-center p-8 text-center">
      <h1 className="mb-4 text-2xl font-bold">Share feature unavailable</h1>
      <p className="text-content-secondary">This feature requires Convex backend.</p>
      <a href="/" className="mt-4 text-blue-500 hover:underline">
        Go home
      </a>
    </div>
  );
}
