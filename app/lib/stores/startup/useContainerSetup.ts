import { useEffect } from 'react';
import { ContainerBootState, setContainerBootState, waitForBootStepCompleted } from '~/lib/stores/containerBootState';
import { webcontainer } from '~/lib/webcontainer';
import { decompressWithLz4 } from '~/lib/compression';
import { streamOutput } from '~/utils/process';
import { cleanTerminalOutput } from 'chef-agent/utils/shell';
import { toast } from 'sonner';
import { workbenchStore } from '~/lib/stores/workbench.client';
import { getFileUpdateCounter } from '~/lib/stores/fileUpdateCounter';
import { chatSyncState } from './chatSyncState';
import { FILE_EVENTS_DEBOUNCE_MS } from '~/lib/stores/files';
import { setChefDebugProperty } from 'chef-agent/utils/chefDebug';

const TEMPLATE_URL = '/template-snapshot-342e2b07.bin';

export function useNewChatContainerSetup() {
  useEffect(() => {
    const runSetup = async () => {
      try {
        await waitForBootStepCompleted(ContainerBootState.STARTING);
        await setupContainer({ snapshotUrl: TEMPLATE_URL, allowNpmInstallFailure: false });
      } catch (error: any) {
        toast.error('Failed to setup Chef environment. Try reloading the page.');
        setContainerBootState(ContainerBootState.ERROR, error);
      }
    };
    void runSetup();
  }, []);
}

export function useExistingChatContainerSetup(loadedChatId: string | undefined) {
  useEffect(() => {
    if (!loadedChatId) {
      return;
    }
    const runSetup = async () => {
      try {
        await waitForBootStepCompleted(ContainerBootState.STARTING);
        // No Convex snapshot lookup — always use the base template
        await setupContainer({ snapshotUrl: TEMPLATE_URL, allowNpmInstallFailure: true });
      } catch (error: any) {
        toast.error('Failed to setup Chef environment. Try reloading the page.');
        setContainerBootState(ContainerBootState.ERROR, error);
      }
    };
    void runSetup();
  }, [loadedChatId]);
}

async function setupContainer(options: { snapshotUrl: string; allowNpmInstallFailure: boolean }) {
  const resp = await fetch(options.snapshotUrl);
  if (!resp.ok) {
    throw new Error(`Failed to download snapshot (${resp.statusText}): ${resp.statusText}`);
  }
  const compressed = await resp.arrayBuffer();
  const decompressed = decompressWithLz4(new Uint8Array(compressed));

  const container = await webcontainer;
  await container.mount(decompressed);

  // After loading the snapshot, load files into FilesStore
  await workbenchStore.prewarmWorkdir(container);

  setChefDebugProperty('webcontainer', container);

  setContainerBootState(ContainerBootState.DOWNLOADING_DEPENDENCIES);
  const npm = await container.spawn('npm', ['install', '--no-fund', '--no-deprecated']);
  const { output, exitCode } = await streamOutput(npm);
  console.log('NPM output', cleanTerminalOutput(output));

  if (exitCode !== 0) {
    if (options.allowNpmInstallFailure) {
      toast.error(`Failed to install dependencies. Fix your package.json and tell Chef to redeploy.`, {
        duration: Infinity,
      });
      console.error(`npm install failed with exit code ${exitCode}: ${output}`);
    } else {
      throw new Error(`npm install failed with exit code ${exitCode}: ${output}`);
    }
  }

  // Skip Convex project setup, env vars, and auth — not needed
  setContainerBootState(ContainerBootState.SETTING_UP_CONVEX_PROJECT);
  setContainerBootState(ContainerBootState.SETTING_UP_CONVEX_ENV_VARS);
  setContainerBootState(ContainerBootState.CONFIGURING_CONVEX_AUTH);

  setContainerBootState(ContainerBootState.STARTING_BACKUP);
  await initializeFileSystemBackup();

  setContainerBootState(ContainerBootState.READY);
}

async function initializeFileSystemBackup() {
  // Flush current file events before marking as synced
  await new Promise((resolve) => setTimeout(resolve, FILE_EVENTS_DEBOUNCE_MS * 2));
  const currentChatSyncState = chatSyncState.get();
  if (currentChatSyncState.savedFileUpdateCounter === null) {
    const fileUpdateCounter = getFileUpdateCounter();
    chatSyncState.set({
      ...currentChatSyncState,
      savedFileUpdateCounter: fileUpdateCounter,
    });
  }
}
