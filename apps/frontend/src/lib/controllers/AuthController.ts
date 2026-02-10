import { authStore, type User } from '../../stores/authStore';

// Use Render backend as the default API base. You can still override via VITE_API_URL if needed.
const API_BASE =
  import.meta.env.VITE_API_URL || 'https://mynoteapp-g3wt.onrender.com/api';

interface AuthResponse {
  message?: string;
  user: User;
  accessToken: string;
  refreshToken: string;
}

interface RefreshResponse {
  user: User;
  accessToken: string;
}

interface MeResponse {
  user: User;
}

export class AuthController {
  private static getAuthHeader(): HeadersInit {
    let token: string | null = null;
    authStore.subscribe((s) => (token = s.accessToken))();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  /**
   * Register a new user
   */
  public static async register(email: string, password: string, name: string): Promise<void> {
    authStore.setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      const { user, accessToken, refreshToken } = data as AuthResponse;
      authStore.setUser(user, accessToken, refreshToken);
    } catch (error) {
      authStore.setError(error instanceof Error ? error.message : 'Registration failed');
      throw error;
    }
  }

  /**
   * Login user
   */
  public static async login(email: string, password: string): Promise<void> {
    authStore.setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      const { user, accessToken, refreshToken } = data as AuthResponse;
      authStore.setUser(user, accessToken, refreshToken);
    } catch (error) {
      authStore.setError(error instanceof Error ? error.message : 'Login failed');
      throw error;
    }
  }

  /**
   * Logout user
   */
  public static async logout(): Promise<void> {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeader(),
        },
      });
    } catch {
      // Ignore logout errors
    } finally {
      authStore.logout();
    }
  }

  /**
   * Refresh access token
   */
  public static async refreshToken(): Promise<boolean> {
    let refreshToken: string | null = null;
    authStore.subscribe((s) => (refreshToken = s.refreshToken))();

    if (!refreshToken) {
      authStore.logout();
      return false;
    }

    try {
      const response = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        authStore.logout();
        return false;
      }

      const data = (await response.json()) as RefreshResponse;
      authStore.updateAccessToken(data.accessToken);
      return true;
    } catch {
      authStore.logout();
      return false;
    }
  }

  /**
   * Get current user info
   */
  public static async getCurrentUser(): Promise<User | null> {
    try {
      const response = await fetch(`${API_BASE}/auth/me`, {
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeader(),
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Try to refresh token
          const refreshed = await this.refreshToken();
          if (refreshed) {
            return this.getCurrentUser();
          }
        }
        return null;
      }

      const data = (await response.json()) as MeResponse;
      return data.user;
    } catch {
      return null;
    }
  }

  /**
   * Check if user is authenticated and token is valid
   */
  public static async validateSession(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return user !== null;
  }
}
