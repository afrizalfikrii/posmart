import { mockSettings } from "@/data/settings";
import { mockUsers } from "@/data/users";
import type { AuthSession, AuthUser, StoreSettings, User } from "@/types";
import { readStorage, simulateLatency, STORAGE_KEYS, writeStorage } from "./storage";

export interface LoginCredentials {
  identifier: string;
  pin: string;
  rememberMe?: boolean;
}

function getAllAuthUsers(): User[] {
  const settings = readStorage<StoreSettings>(STORAGE_KEYS.SETTINGS, mockSettings);
  const employeeUsers: User[] = (settings.employees ?? []).map((emp) => {
    const parts = emp.name.trim().split(/\s+/);
    const initials =
      parts.length >= 2
        ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
        : emp.name.slice(0, 2).toUpperCase();
    return {
      id: emp.id,
      name: emp.name,
      email: emp.email,
      phone: emp.phone,
      pin: emp.pin ?? "123456",
      role: emp.role,
      initials,
      active: emp.active,
    };
  });

  return employeeUsers.length > 0 ? employeeUsers : mockUsers;
}

export const authService = {
  async login({ identifier, pin, rememberMe = true }: LoginCredentials): Promise<AuthSession> {
    await simulateLatency();
    const normalized = identifier.trim().toLowerCase();
    const users = getAllAuthUsers();
    const matched = users.find(
      (u) =>
        u.active &&
        (u.email.toLowerCase() === normalized || u.phone === identifier.trim()) &&
        u.pin === pin.trim(),
    );

    if (!matched) {
      throw new Error("Email / No. HP atau PIN salah. Coba admin@posymart.id / 123456.");
    }

    const user: AuthUser = {
      id: matched.id,
      name: matched.name,
      email: matched.email,
      phone: matched.phone,
      role: matched.role,
      initials: matched.initials,
      active: matched.active,
    };

    const session: AuthSession = {
      user,
      token: `posymart-token-${Date.now()}`,
      rememberMe,
      loggedInAt: new Date().toISOString(),
    };

    writeStorage(STORAGE_KEYS.AUTH_SESSION, session);
    return session;
  },

  async logout(): Promise<void> {
    await simulateLatency(200, 300);
    localStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
  },

  getCurrentSession(): AuthSession | null {
    return readStorage<AuthSession | null>(STORAGE_KEYS.AUTH_SESSION, null);
  },
};
