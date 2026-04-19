/**
 * Stub: Convex project store is no longer used.
 * Kept for import compatibility.
 */
import { atom } from 'nanostores';
import type { ConvexProject } from 'chef-agent/types';

export const convexProjectStore = atom<ConvexProject | null>(null);

export function waitForConvexProjectConnection(): Promise<ConvexProject> {
  // No Convex project — resolve immediately with a dummy value
  return Promise.resolve({
    deploymentName: '',
    token: '',
    projectSlug: '',
    teamSlug: '',
  } as unknown as ConvexProject);
}
