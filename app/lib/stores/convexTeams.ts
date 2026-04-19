/**
 * Stub: team management not needed in local mode.
 */
import { atom } from 'nanostores';

export type ConvexTeam = {
  id: string;
  name: string;
  slug: string;
  referralCode: string;
};

export const convexTeamsStore = atom<ConvexTeam[] | null>(null);
export const selectedTeamSlugStore = atom<string | null>(null);

export function getStoredTeamSlug(): string | null { return null; }
export function setSelectedTeamSlug(_slug: string | null) {}
export function useSelectedTeamSlug(): string | null { return null; }
export function useSelectedTeam(): ConvexTeam | null { return null; }
export async function waitForSelectedTeamSlug(_caller?: string): Promise<string> {
  return 'local';
}
