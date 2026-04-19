import type { WebContainer, WebContainerProcess } from '@webcontainer/api';
import { atom, type WritableAtom } from 'nanostores';
import type { ITerminal, TerminalInitializationOptions } from '~/types/terminal';
import { newBoltShellProcess, newShellProcess } from '~/utils/shell';
import { coloredText } from '~/utils/terminal';
import { workbenchStore } from './workbench.client';
import { activeTerminalTabStore, VITE_TAB_INDEX } from './terminalTabs';
import { ContainerBootState } from './containerBootState';

export class TerminalStore {
  #webcontainer: Promise<WebContainer>;
  #terminals: Array<{ terminal: ITerminal; process: WebContainerProcess }> = [];
  #boltTerminal = newBoltShellProcess();
  #deployTerminal = newBoltShellProcess();
  showTerminal: WritableAtom<boolean> = import.meta.hot?.data.showTerminal ?? atom(true);

  startDevServerOnAttach = false;

  constructor(webcontainerPromise: Promise<WebContainer>) {
    this.#webcontainer = webcontainerPromise;
    if (import.meta.hot) {
      import.meta.hot.data.showTerminal = this.showTerminal;
    }
  }

  get boltTerminal() {
    return this.#boltTerminal;
  }

  toggleTerminal(value?: boolean) {
    this.showTerminal.set(value !== undefined ? value : !this.showTerminal.get());
  }

  async attachBoltTerminal(terminal: ITerminal) {
    try {
      const wc = await this.#webcontainer;
      await this.#boltTerminal.init(wc, terminal);
    } catch (error: any) {
      console.error('Failed to initialize bolt terminal:', error);
      terminal.write(coloredText.red('Failed to spawn dev server shell\n\n') + error.message);
    }
  }

  async deployFunctionsAndRunDevServer(shouldDeploy: boolean) {
    if (!workbenchStore.isDefaultPreviewRunning()) {
      await this.#boltTerminal.executeCommand('npm run dev');
    }
  }

  async attachDeployTerminal(terminal: ITerminal, options?: TerminalInitializationOptions) {
    try {
      const wc = await this.#webcontainer;
      await this.#deployTerminal.init(wc, terminal);
      if (options?.isReload) {
        const shouldDeploy = options.shouldDeployFunctions ?? options.shouldDeployConvexFunctions ?? false;
        await this.deployFunctionsAndRunDevServer(shouldDeploy);
      }
    } catch (error: any) {
      console.error('Failed to initialize deploy terminal:', error);
      terminal.write(coloredText.red('Failed to spawn dev server shell\n\n') + error.message);
    }
  }

  async attachTerminal(terminal: ITerminal) {
    try {
      const shellProcess = await newShellProcess(await this.#webcontainer, terminal);
      this.#terminals.push({ terminal, process: shellProcess });
    } catch (error: any) {
      terminal.write(coloredText.red('Failed to spawn shell\n\n') + error.message);
    }
  }

  onTerminalResize(cols: number, rows: number) {
    for (const { process } of this.#terminals) {
      process.resize({ cols, rows });
    }
  }
}
