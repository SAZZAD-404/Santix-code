/**
 * Simplified auth wrapper - no login required.
 * Users are always considered "logged in" locally.
 */
import { createContext, useContext } from 'react';

type ChefAuthState =
  | { kind: 'loading' }
  | { kind: 'unauthenticated' }
  | { kind: 'fullyLoggedIn'; sessionId: string };

const ChefAuthContext = createContext<{ state: ChefAuthState }>({
  state: { kind: 'fullyLoggedIn', sessionId: 'local' },
});

export function useChefAuth() {
  return useContext(ChefAuthContext).state;
}

export function useChefAuthContext() {
  return useContext(ChefAuthContext);
}

export const SESSION_ID_KEY = 'sessionIdForConvex';

export const ChefAuthProvider = ({
  children,
}: {
  children: React.ReactNode;
  redirectIfUnauthenticated?: boolean;
}) => {
  return (
    <ChefAuthContext.Provider value={{ state: { kind: 'fullyLoggedIn', sessionId: 'local' } }}>
      {children}
    </ChefAuthContext.Provider>
  );
};
