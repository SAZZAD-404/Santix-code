import { PersonIcon } from '@radix-ui/react-icons';

export function ProfileCard() {
  return (
    <div className="w-full rounded-lg border bg-bolt-elements-background-depth-1 shadow-sm">
      <div className="p-6">
        <h2 className="mb-4 text-xl font-semibold text-content-primary">Profile</h2>
        <div className="flex items-center gap-4">
          <div className="flex size-20 min-w-20 items-center justify-center overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
            <PersonIcon className="size-8 text-gray-400" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-content-primary">Local User</h3>
            <p className="text-sm text-content-secondary">Running locally — no account required</p>
          </div>
        </div>
      </div>
    </div>
  );
}
