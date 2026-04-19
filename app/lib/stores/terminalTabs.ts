import { atom } from 'nanostores';

export const VITE_TAB_INDEX = 0;
export const DEPLOY_TAB_INDEX = 1;

export const activeTerminalTabStore = atom(0);
export const isDeployTerminalVisibleStore = atom(false);

// Legacy compat aliases
export const CONVEX_DEPLOY_TAB_INDEX = DEPLOY_TAB_INDEX;
export const isConvexDeployTerminalVisibleStore = isDeployTerminalVisibleStore;
