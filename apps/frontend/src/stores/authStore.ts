import { writable, derived } from 'svelte/store';

export interface User {
  _id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  createdAt: string;
  lastLogin: string;
  preferences: {
    theme: 'light' | 'dark' | 'system';
    defaultWorkspace?: string;
  };
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isLoading: false,
  error: null,
};

function base64UrlToBase64(input: string): string {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
  const padLength = (4 - (base64.length % 4)) % 4;
  return base64 + '='.repeat(padLength);
}

function isJwtExpired(token: string, skewSeconds: number = 30): boolean {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return true;
    const payloadJson = atob(base64UrlToBase64(parts[1]));
    const payload = JSON.parse(payloadJson) as { exp?: number };
    if (typeof payload.exp !== 'number') return true;
    const nowSeconds = Math.floor(Date.now() / 1000);
    return payload.exp <= nowSeconds + skewSeconds;
  } catch {
    return true;
  }
}

// Try to restore from localStorage
function getInitialState(): AuthState {
  if (typeof window === 'undefined') return initialState;
  
  try {
    const stored = localStorage.getItem('auth');
    if (stored) {
      const parsed = JSON.parse(stored);
      const candidate = { ...initialState, ...parsed, isLoading: false, error: null } as AuthState;
      // If token is expired (or unparsable), treat as logged out to avoid "fake login" state.
      if (candidate.accessToken && isJwtExpired(candidate.accessToken)) {
        localStorage.removeItem('auth');
        return initialState;
      }
      return candidate;
    }
  } catch {
    // Ignore parse errors
  }
  return initialState;
}

function createAuthStore() {
  const { subscribe, set, update } = writable<AuthState>(getInitialState());

  // Persist to localStorage on changes
  subscribe((state) => {
    if (typeof window !== 'undefined') {
      const { user, accessToken, refreshToken } = state;
      if (!user && !accessToken && !refreshToken) {
        localStorage.removeItem('auth');
      } else {
        localStorage.setItem('auth', JSON.stringify({ user, accessToken, refreshToken }));
      }
    }
  });

  return {
    subscribe,
    
    setLoading: (isLoading: boolean) => update((s) => ({ ...s, isLoading })),
    
    setError: (error: string | null) => update((s) => ({ ...s, error, isLoading: false })),
    
    setUser: (user: User | null, accessToken: string | null, refreshToken: string | null) => {
      update((s) => ({
        ...s,
        user,
        accessToken,
        refreshToken,
        isLoading: false,
        error: null,
      }));
    },
    
    updateAccessToken: (accessToken: string) => {
      update((s) => ({ ...s, accessToken }));
    },
    
    logout: () => {
      set(initialState);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth');
      }
    },
    
    reset: () => set(initialState),
  };
}

export const authStore = createAuthStore();

// Derived stores for convenience
export const currentUser = derived(authStore, ($auth) => $auth.user);
export const isAuthenticated = derived(
  authStore,
  ($auth) => !!$auth.user && !!$auth.accessToken && !isJwtExpired($auth.accessToken!)
);
export const isLoading = derived(authStore, ($auth) => $auth.isLoading);
export const authError = derived(authStore, ($auth) => $auth.error);
