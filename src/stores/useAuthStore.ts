import { create } from "zustand";
import { persist } from "zustand/middleware";
import { prototypeStorage, PrototypeUser } from "@/lib/storage/prototypeStorage";
import { getCurrentUser } from "@/lib/data/users";

export interface MockUser {
  id: string;
  name: string;
  email: string;
  roleLabel: string;
  location?: string;
}

const getInitialUser = (): MockUser | null => {
  const current = prototypeStorage.getCurrentUser();
  if (current) {
    const profile = prototypeStorage.getProfile(current.id);
    const loc = profile?.location
      ? [profile.location.village, profile.location.district, profile.location.state].filter(Boolean).join(", ")
      : undefined;
    return {
      id: current.id,
      name: current.name,
      email: current.email,
      roleLabel: current.roleLabel || "Entrepreneur",
      location: loc,
    };
  }
  return null;
};

interface AuthState {
  token: string | null;
  user: MockUser | null;
  _hasHydrated: boolean;

  setHasHydrated: (val: boolean) => void;
  login: (token: string, user: MockUser) => void;
  logout: () => void;
  fetchUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: getInitialUser(),
      _hasHydrated: false,

      setHasHydrated: (val: boolean) => set({ _hasHydrated: val }),

      login: (token: string, user: MockUser) => {
        if (typeof window !== "undefined") {
          localStorage.setItem("ventureroot_token", token);
          document.cookie = `ventureroot_token=${token}; path=/; max-age=2592000; SameSite=Lax`;
        }
        prototypeStorage.setCurrentUser({
          id: user.id,
          name: user.name,
          email: user.email,
          roleLabel: user.roleLabel,
          createdAt: new Date().toISOString(),
        });
        set({ token, user });
      },

      logout: () => {
        if (typeof window !== "undefined") {
          localStorage.removeItem("ventureroot_token");
          document.cookie = "ventureroot_token=; path=/; max-age=0";
        }
        prototypeStorage.logout();
        set({ token: null, user: null });
      },

      fetchUser: async () => {
        const user = await getCurrentUser();
        if (user) {
          set({ user });
        } else {
          set({ user: null });
        }
      },
    }),
    {
      name: "ventureroot_auth_storage",
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
        // Refresh from prototypeStorage
        const current = prototypeStorage.getCurrentUser();
        if (current) {
          const profile = prototypeStorage.getProfile(current.id);
          const loc = profile?.location
            ? [profile.location.village, profile.location.district, profile.location.state].filter(Boolean).join(", ")
            : undefined;
          state?.login(`mock-token-${current.id}`, {
            id: current.id,
            name: current.name,
            email: current.email,
            roleLabel: current.roleLabel || "Entrepreneur",
            location: loc,
          });
        }
      },
    }
  )
);
