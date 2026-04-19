import type { Terminal as XTerm } from '@xterm/xterm';

export interface ITerminal {
  readonly cols: number;
  readonly rows: number;
  onData(cb: (data: string) => void): void;
  onBinary(cb: (data: string) => void): void;
  write(data: string | Uint8Array): void;
  reset(): void;
  input(data: string, wasUserInput?: boolean): void;
}

export type TerminalInitializationOptions = {
  isReload?: boolean;
  shouldDeployFunctions?: boolean;
  /** @deprecated use shouldDeployFunctions */
  shouldDeployConvexFunctions?: boolean;
};
