import { create } from "zustand";
import type { AuthUser } from "@franchise/types";
import type { SignupInput } from "@franchise/validators";
import { saveTokens, getAccessToken, getRefreshToken, clearTokens } from "./storage";
import { api } from "../api/client";

type AuthState = {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // Called on app start — loads tokens and verifies them
  checkAuth: () => Promise<void>;
  // Sign in with email + password
  login: (email: string, password: string) => Promise<void>;
  // Create a new account
  signup: (input: SignupInput) => Promise<void>;
  // Sign out — revokes refresh token on server
  logout: () => Promise<void>;
  // Re-fetch /me to pick up any profile changes
  refreshUser: () => Promise<void>;

  // Internal — called by api client's onUnauthorized
  _clearAuth: () => void;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  // ── App boot ───────────────────────────────────────────────────────────────
  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const [at, rt] = await Promise.all([getAccessToken(), getRefreshToken()]);
      if (!at && !rt) return; // fresh install, go to login

      // api.auth.me() will auto-refresh via the client if the access token is expired
      const user = await api.auth.me();
      set({ user, isAuthenticated: true });
    } catch {
      await clearTokens();
      set({ user: null, isAuthenticated: false });
    } finally {
      set({ isLoading: false });
    }
  },

  // ── Login ──────────────────────────────────────────────────────────────────
  login: async (email, password) => {
    const result = await api.auth.login({ email, password });
    await saveTokens(result.accessToken, result.refreshToken);
    set({ user: result.user, isAuthenticated: true });
  },

  // ── Signup ─────────────────────────────────────────────────────────────────
  signup: async (input) => {
    await api.auth.signup(input);
    // After signup, user is pending — no tokens yet; navigate to pending screen
  },

  // ── Logout ─────────────────────────────────────────────────────────────────
  logout: async () => {
    try {
      const rt = await getRefreshToken();
      if (rt) await api.auth.logout(rt).catch(() => {}); // best-effort server revoke
    } finally {
      await clearTokens();
      set({ user: null, isAuthenticated: false });
    }
  },

  // ── Refresh user ───────────────────────────────────────────────────────────
  refreshUser: async () => {
    try {
      const user = await api.auth.me();
      set({ user });
    } catch {
      /* silent — user stays as-is */
    }
  },

  // ── Internal ───────────────────────────────────────────────────────────────
  _clearAuth: () => {
    set({ user: null, isAuthenticated: false, isLoading: false });
  },
}));
