import {
  getMyProfile,
  onAuthStateChange,
  signIn as sbSignIn,
  signOut as sbSignOut,
  signUp as sbSignUp,
} from "@/lib/services/authService";
import { registerAndSavePushToken } from "@/lib/services/pushService";
import { supabase } from "@/lib/supabase";
import { create } from "zustand";

export type UserRole = "estudiante" | "admin";

export interface UserSession {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string | null;
  phoneNumber?: string | null;
  role: UserRole;
  semester?: number | null;
  bio?: string | null;
}

interface AuthState {
  user: UserSession | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isHydrating: boolean;

  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  setUser: (user: UserSession | null) => void;
  initialize: () => () => void;
}

const HYDRATION_TIMEOUT_MS = 9000;
const SESSION_TIMEOUT_MS = 1800;
const VALIDATE_USER_TIMEOUT_MS = 1200;
const PROFILE_TIMEOUT_MS = 3200;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error("Auth timeout")), ms);
    }),
  ]);
}

function isAuthTimeoutError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return message.toLowerCase().includes("auth timeout");
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: false,
  isAuthenticated: false,
  isHydrating: true,

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  initialize: () => {
    const hydrationWatchdog = setTimeout(() => {
      if (get().isHydrating) {
        console.warn("[authStore] Hydration timeout. Forzando salida de estado de carga.");
        set({ isHydrating: false });
      }
    }, HYDRATION_TIMEOUT_MS);

    const isInvalidRefreshTokenError = (error: unknown) => {
      const message =
        error instanceof Error ? error.message : String(error ?? "");
      return message.toLowerCase().includes("invalid refresh token");
    };

    const clearCorruptedSession = async () => {
      try {
        await supabase.auth.signOut({ scope: "local" as any });
      } catch {
        // Si falla la limpieza remota/local, igual forzamos estado no autenticado.
      }

      set({ user: null, isAuthenticated: false, isHydrating: false });
    };

    const processSession = async (session: any) => {
      if (session?.user) {
        try {
          const email = session.user.email?.toLowerCase();

          let validatedUser = session.user;
          try {
            const {
              data: { user: authUser },
              error: validateError,
            } = await withTimeout(supabase.auth.getUser(), VALIDATE_USER_TIMEOUT_MS);

            if (validateError) {
              if (isInvalidRefreshTokenError(validateError)) {
                console.warn("[authStore] Sesion local invalida. Limpiando token...");
                await clearCorruptedSession();
                return;
              }
              throw validateError;
            }

            if (authUser) validatedUser = authUser;
          } catch (validateErr) {
            // En Expo Go puede tardar el bridge de auth; continuamos con session.user.
            if (!isAuthTimeoutError(validateErr)) throw validateErr;
          }

          if (!email?.endsWith('@ucaldas.edu.co')) {
            console.warn("[authStore] Usuario rechazado: no es de ucaldas.edu.co -", email);
            await supabase.auth.signOut();
            set({ user: null, isAuthenticated: false, isHydrating: false });
            return;
          }

          const profile = await withTimeout(getMyProfile(), PROFILE_TIMEOUT_MS).catch((error) => {
            console.warn("[authStore] No se pudo obtener perfil completo:", error);
            return null;
          });

          set({
            user: {
              id: validatedUser.id,
              email: validatedUser.email ?? session.user.email!,
              fullName: profile?.full_name ?? validatedUser.user_metadata?.full_name ?? "Estudiante",
              avatarUrl: profile?.avatar_url ?? validatedUser.user_metadata?.avatar_url ?? null,
              phoneNumber: null,
              role: profile?.role ?? "estudiante",
              semester: profile?.semester ?? null,
              bio: profile?.bio ?? null,
            },
            isAuthenticated: true,
            isHydrating: false,
          });

          registerAndSavePushToken(session.user.id).catch(() => {});
        } catch (error) {
          if (isInvalidRefreshTokenError(error)) {
            console.warn("[authStore] Refresh token invalido durante hidratacion. Cerrando sesion local.");
            await clearCorruptedSession();
            return;
          }

          if (!isAuthTimeoutError(error)) {
            console.warn("[authStore] Error al procesar sesión:", error);
          }
          set({
            user: {
              id: session.user.id,
              email: session.user.email!,
              fullName: session.user.user_metadata?.full_name ?? "Estudiante",
              avatarUrl: session.user.user_metadata?.avatar_url ?? null,
              phoneNumber: null,
              role: "estudiante",
              semester: null,
              bio: null,
            },
            isAuthenticated: true,
            isHydrating: false,
          });
        }
      } else {
        set({ user: null, isAuthenticated: false, isHydrating: false });
      }
    };

    (async () => {
      try {
        const { data: { session } } = await withTimeout(supabase.auth.getSession(), SESSION_TIMEOUT_MS);
        await processSession(session);
      } catch (error) {
        if (isInvalidRefreshTokenError(error)) {
          console.warn("[authStore] Refresh token invalido en getSession inicial. Limpiando sesion local.");
          await clearCorruptedSession();
          return;
        }

        console.error("[authStore] Error al verificar sesión inicial:", error);
        set({ user: null, isAuthenticated: false, isHydrating: false });
      }
    })();

    const { data: { subscription } } = onAuthStateChange(async (event, session) => {
      if (
        event === "INITIAL_SESSION" ||
        event === "SIGNED_IN" ||
        event === "TOKEN_REFRESHED" ||
        event === "USER_UPDATED"
      ) {
        await processSession(session);
      }
      if (event === "SIGNED_OUT") {
        set({ user: null, isAuthenticated: false, isHydrating: false });
      }
    });

    return () => {
      clearTimeout(hydrationWatchdog);
      subscription.unsubscribe();
    };
  },

  signIn: async (email, password) => {
    set({ isLoading: true });
    try {
      const { user } = await sbSignIn({ email, password });
      if (!user) throw new Error("No se pudo iniciar sesión");
      const profile = await withTimeout(getMyProfile(), PROFILE_TIMEOUT_MS).catch(() => {
        console.warn("[authStore] No se pudo obtener perfil completo (continuando)");
        return null;
      });

      set({
        user: {
          id: user.id!,
          email: user.email!,
          fullName: profile?.full_name ?? user.user_metadata?.full_name ?? "Estudiante",
          avatarUrl: profile?.avatar_url ?? user.user_metadata?.avatar_url ?? null,
          phoneNumber: null,
          role: profile?.role ?? "estudiante",
          semester: profile?.semester ?? null,
          bio: profile?.bio ?? null,
        },
        isAuthenticated: true,
      });

      registerAndSavePushToken(profile?.id ?? user.id!).catch(() => {});
    } finally {
      set({ isLoading: false });
    }
  },

  signUp: async (email, password, fullName) => {
    set({ isLoading: true });
    try {
      await sbSignUp({ email, password, fullName });
    } finally {
      set({ isLoading: false });
    }
  },

  signOut: async () => {
    set({ isLoading: true });
    try {
      await sbSignOut();
      set({ user: null, isAuthenticated: false, isHydrating: false });
    } finally {
      set({ isLoading: false });
    }
  },
}));