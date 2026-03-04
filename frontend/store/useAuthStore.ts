/**
 * store/useAuthStore.ts
 * Estado global de autenticación con Zustand
 * Conectado a Supabase real via authService
 * Soporta login con email/password y Google OAuth
 */

import {
  getMyProfile,
  onAuthStateChange,
  signIn as sbSignIn,
  signOut as sbSignOut,
  signUp as sbSignUp,
} from "@/lib/services/authService";
import { registerAndSavePushToken } from "@/lib/services/pushService";
import { create } from "zustand";

// ── Tipos ─────────────────────────────────────────────────────────────────────
export type UserRole = "estudiante" | "admin";

export interface UserSession {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string | null;
  role: UserRole;
  semester?: number | null;
  bio?: string | null;
}

interface AuthState {
  user: UserSession | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  setUser: (user: UserSession | null) => void;
  initialize: () => () => void;
}

// ── Store ─────────────────────────────────────────────────────────────────────
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  isAuthenticated: false,

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  // ── Inicializar: escucha cambios de sesión de Supabase ─────────────────────
  initialize: () => {
    const { data: { subscription } } = onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        try {
          // Intentar obtener perfil completo de la tabla profiles
          const profile = await getMyProfile();
          set({
            user: {
              id: session.user.id,
              email: session.user.email!,
              // Si hay perfil en DB úsalo, si no usa los datos de Google
              fullName: profile?.full_name
                ?? session.user.user_metadata?.full_name
                ?? "Estudiante",
              avatarUrl: profile?.avatar_url
                ?? session.user.user_metadata?.avatar_url
                ?? null,
              role: (profile?.role as UserRole) ?? "estudiante",
              semester: profile?.semester ?? null,
              bio: profile?.bio ?? null,
            },
            isAuthenticated: true,
          });
          // Registrar push token tras login exitoso (no bloquea)
          registerAndSavePushToken(session.user.id).catch(() => {});
        } catch (error) {
          // Fallback: si no hay perfil todavía (usuario nuevo con Google)
          // guardamos los datos básicos del token de Google
          console.warn("Perfil no encontrado, usando datos de sesión:", error);
          set({
            user: {
              id: session.user.id,
              email: session.user.email!,
              fullName: session.user.user_metadata?.full_name ?? "Estudiante",
              avatarUrl: session.user.user_metadata?.avatar_url ?? null,
              role: "estudiante",
              semester: null,
              bio: null,
            },
            isAuthenticated: true,
          });
        }
      }

      if (event === "SIGNED_OUT") {
        set({ user: null, isAuthenticated: false });
      }
    });

    return () => subscription.unsubscribe();
  },

  // ── Sign In email/password ─────────────────────────────────────────────────
  signIn: async (email, password) => {
    set({ isLoading: true });
    try {
      const { user } = await sbSignIn({ email, password });
      if (!user) throw new Error("No se pudo iniciar sesión");

      const profile = await getMyProfile();
      if (!profile) throw new Error("No se encontró el perfil del usuario");

      set({
        user: {
          id: profile.id,
          email: user.email!,
          fullName: profile.full_name,
          avatarUrl: profile.avatar_url,
          role: profile.role as UserRole,
          semester: profile.semester,
          bio: profile.bio,
        },
        isAuthenticated: true,
      });
      // Registrar push token tras login exitoso (no bloquea)
      registerAndSavePushToken(profile.id).catch(() => {});
    } finally {
      set({ isLoading: false });
    }
  },

  // ── Sign Up ────────────────────────────────────────────────────────────────
  signUp: async (email, password, fullName) => {
    set({ isLoading: true });
    try {
      await sbSignUp({ email, password, fullName });
    } finally {
      set({ isLoading: false });
    }
  },

  // ── Sign Out ───────────────────────────────────────────────────────────────
  signOut: async () => {
    set({ isLoading: true });
    try {
      await sbSignOut();
      set({ user: null, isAuthenticated: false });
    } finally {
      set({ isLoading: false });
    }
  },
}));