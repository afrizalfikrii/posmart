import { create } from "zustand";
import { authService, type LoginCredentials } from "@/services/authService";
import type { AuthSession, AuthUser } from "@/types";

interface AuthState {
  session: AuthSession | null;
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  hydrate: () => void;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: authService.getCurrentSession(),
  user: authService.getCurrentSession()?.user ?? null,
  loading: false,
  error: null,

  hydrate: () => {
    const session = authService.getCurrentSession();
    set({ session, user: session?.user ?? null });
  },

  login: async (credentials) => {
    set({ loading: true, error: null });
    try {
      const session = await authService.login(credentials);
      set({ session, user: session.user, loading: false, error: null });
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal masuk ke sistem.";
      set({ loading: false, error: message });
      return false;
    }
  },

  logout: async () => {
    set({ loading: true });
    await authService.logout();
    set({ session: null, user: null, loading: false, error: null });
  },

  clearError: () => set({ error: null }),
}));
