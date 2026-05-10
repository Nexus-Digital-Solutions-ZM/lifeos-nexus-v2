import { create } from "zustand";
import { persist } from "zustand/middleware";
import api, { setTokens, clearTokens, getTokens, type LifeOSUser } from "@/lib/api";

// ── Types ──────────────────────────────────────────────────────────────
// Re-uses LifeOSUser from api.ts so the shape stays consistent across the app.
// If you have a separate @/types User, map it here or just export LifeOSUser as User.
export type User = LifeOSUser;

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
  hydrate: () => void; // Call on app boot to sync localStorage → store
}

// ── Store ──────────────────────────────────────────────────────────────
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      // ── Login ────────────────────────────────────────────────────────
      login: async (email, password) => {
        const res = await api.post<{
          access_token: string;
          refresh_token: string;
          user: User;
        }>("/auth/login", { email, password });

        const { access_token, refresh_token, user } = res.data;

        setTokens(access_token, refresh_token);
        set({ user, isAuthenticated: true });
      },

      // ── Logout ───────────────────────────────────────────────────────
      logout: async () => {
        // Best-effort server-side logout (fire & forget)
        await api.post("/auth/logout").catch(() => {});

        clearTokens();
        set({ user: null, isAuthenticated: false });

        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
      },

      // ── Set User (for profile updates etc.) ─────────────────────────
      setUser: (user) =>
        set({
          user,
          isAuthenticated: user !== null,
        }),

      // ── Hydrate: sync token presence → isAuthenticated ───────────────
      // Call this in your root layout / _app on mount:
      //   useEffect(() => useAuthStore.getState().hydrate(), []);
      hydrate: () => {
        const { access } = getTokens();
        if (!access) {
          // No token in storage → ensure store is clean
          set({ user: null, isAuthenticated: false });
        }
        // If access exists, zustand persist already restored `user` from
        // localStorage, so we just leave the state as-is.
      },
    }),
    {
      name: "lifeos_user",
      // Only persist user data; tokens live separately in localStorage
      // under lifeos_access / lifeos_refresh (managed by api.ts Storage).
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);