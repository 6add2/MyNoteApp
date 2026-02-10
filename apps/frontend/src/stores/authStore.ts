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

// Try to restore from localStorage
function getInitialState(): AuthState {
  if (typeof window === 'undefined') return initialState;
  
  try {
    const stored = localStorage.getItem('auth');
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...initialState, ...parsed, isLoading: false, error: null };
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
      localStorage.setItem('auth', JSON.stringify({ user, accessToken, refreshToken }));
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
export const isAuthenticated = derived(authStore, ($auth) => !!$auth.user && !!$auth.accessToken);
export const isLoading = derived(authStore, ($auth) => $auth.isLoading);
export const authError = derived(authStore, ($auth) => $auth.error);
