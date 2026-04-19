import { useState } from 'react';
import JSZip from 'jszip';
import { webcontainer } from '~/lib/webcontainer';
import type { WebContainer } from '@webcontainer/api';
import { useStore } from '@nanostores/react';
import { convexProjectStore } from '~/lib/stores/convexProject';
import { getFileUpdateCounter, useFileUpdateCounter } from '~/lib/stores/fileUpdateCounter';
import { toast } from 'sonner';
import { streamOutput } from '~/utils/process';
import { Spinner } from '@ui/Spinner';
import { CheckIcon, ExternalLinkIcon, RocketIcon, UpdateIcon } from '@radix-ui/react-icons';
import { Button } from '@ui/Button';
import { useChatId } from '~/lib/stores/chatId';

interface ErrorResponse {
  error: string;
}

type DeployStatus =
  | { type: 'idle' }
  | { type: 'building' }
  | { type: 'zipping' }
  | { type: 'deploying' }
  | { type: 'error'; message: string }
  | { type: 'success'; updateCounter: number };

export function DeployButton() {
  const [status, setStatus] = useState<DeployStatus>({ type: 'idle' });
  const convex = useStore(convexProjectStore);
  const currentCounter = useFileUpdateCounter();
  const chatId = useChatId();

  const addFilesToZip = async (container: WebContainer, zip: JSZip, basePath: string, currentPath: string = '') => {
    const fullPath = currentPath ? `${basePath}/${currentPath}` : basePath;
    const entries = await container.fs.readdir(fullPath, { withFileTypes: true });
    for (const entry of entries) {
      const entryPath = currentPath ? `${currentPath}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        await addFilesToZip(container, zip, basePath, entryPath);
      } else if (entry.isFile()) {
        const content = await container.fs.readFile(`${basePath}/${entryPath}`);
        zip.file(entryPath, content);
      }
    }
  };

  const handleDeploy = async () => {
    try {
      setStatus({ type: 'building' });
      const container = await webcontainer;
      const buildProcess = await container.spawn('vite', ['build', '--mode', 'development']);
      const { output, exitCode } = await streamOutput(buildProcess);
      if (exitCode !== 0) throw new Error(`Build failed: ${output}`);

      setStatus({ type: 'zipping' });
      const zip = new JSZip();
      await addFilesToZip(container, zip, 'dist');
      const zipBlob = await zip.generateAsync({ type: 'blob' });

      setStatus({ type: 'deploying' });
      const formData = new FormData();
      formData.append('file', zipBlob, 'dist.zip');
      formData.append('deploymentName', convex!.deploymentName);
      formData.append('token', convex!.token);

      const response = await fetch('/api/deploy-simple', { method: 'POST', body: formData });
      if (!response.ok) {
        const errorData = (await response.json()) as ErrorResponse | null;
        throw new Error(errorData?.error ?? 'Deployment failed');
      }
      const resp = await response.json();
      if (resp.localDevWarning) toast.error(`${resp.localDevWarning}`);

      setStatus({ type: 'success', updateCounter: getFileUpdateCounter() });
    } catch (error) {
      toast.error('Failed to deploy. Please try again.');
      console.error('Deployment error:', error);
      setStatus({ type: 'error', message: error instanceof Error ? error.message : 'Deployment failed' });
    }
  };

  const isLoading = ['building', 'zipping', 'deploying'].includes(status.type);
  const isDisabled = isLoading || !convex;

  let buttonText: string;
  let icon: React.ReactNode;
  switch (status.type) {
    case 'idle':      buttonText = 'Deploy';            icon = <RocketIcon />; break;
    case 'building':  buttonText = 'Building...';       icon = <Spinner />; break;
    case 'zipping':   buttonText = 'Creating package...'; icon = <Spinner />; break;
    case 'deploying': buttonText = 'Deploying...';      icon = <Spinner />; break;
    case 'error':     buttonText = 'Deploy';            icon = <RocketIcon />; break;
    case 'success':
      buttonText = status.updateCounter === currentCounter ? 'Deployed' : 'Redeploy';
      icon = status.updateCounter === currentCounter
        ? <CheckIcon className="text-bolt-elements-icon-success" />
        : <UpdateIcon />;
      break;
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        disabled={isDisabled}
        onClick={handleDeploy}
        title={status.type === 'error' ? status.message : undefined}
        variant="neutral"
        size="xs"
        icon={icon}
      >
        {buttonText}
      </Button>
      {status.type === 'success' && convex && (
        <Button href={`https://${convex.deploymentName}.convex.app`} target="_blank" size="xs" icon={<ExternalLinkIcon />}>
          View site
        </Button>
      )}
    </div>
  );
}
