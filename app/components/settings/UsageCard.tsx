export function UsageCard() {
  return (
    <div className="rounded-lg border bg-bolt-elements-background-depth-1 shadow-sm">
      <div className="p-6">
        <h2 className="mb-3 text-xl font-semibold text-content-primary">Usage</h2>
        <p className="text-sm text-content-secondary">
          You are using your own API keys. Usage is tracked directly by your AI provider — check your provider dashboard for details.
        </p>
      </div>
    </div>
  );
}
