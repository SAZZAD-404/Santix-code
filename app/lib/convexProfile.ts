/**
 * Stub: profile fetching not used in local mode.
 */
export interface UserProfile {
  name: string;
  email: string;
  id: string;
}

export async function getUserProfile(_token: string): Promise<UserProfile> {
  return { name: 'Local User', email: '', id: 'local' };
}
