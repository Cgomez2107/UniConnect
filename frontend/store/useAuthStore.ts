import {
  DIContainer,
} from "@/lib/services/di/container";
import { registerAndSavePushToken } from "@/lib/services/pushService";
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

const buildFallbackUser = (sessionUser: any): UserSession => ({
  id: sessionUser.id,
  email: sessionUser.email!,
  fullName: sessionUser.user_metadata?.full_name ?? "Estudiante",
  avatarUrl: sessionUser.user_metadata?.avatar_url ?? null,
  phoneNumber: null,
  role: "estudiante",
  semester: null,
  bio: null,
});

const HYDRATION_TIMEOUT_MS = 9000;
const SESSION_TIMEOUT_MS = 1800;
const PROFILE_TIMEOUT_MS = 2200;

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
    const container = DIContainer.getInstance()
    const getCurrentSession = container.getGetCurrentSession()
    const getMyAuthProfile = container.getGetMyAuthProfile()
    const subscribeAuthStateChanges = container.getSubscribeAuthStateChanges()
    const clearLocalSessionUseCase = container.getClearLocalSession()

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
        await clearLocalSessionUseCase.execute()
      } catch {
        // Si falla la limpieza remota/local, igual forzamos estado no autenticado.
      }

      set({ user: null, isAuthenticated: false, isHydrating: false });
    };

    const processSession = async (session: any) => {
      if (session?.user) {
        const fallbackUser = buildFallbackUser(session.user);
        try {
          const email = session.user.email?.toLowerCase();

          if (!email?.endsWith('@ucaldas.edu.co')) {
            console.warn("[authStore] Usuario rechazado: no es de ucaldas.edu.co -", email);
            await clearLocalSessionUseCase.execute()
            set({ user: null, isAuthenticated: false, isHydrating: false });
            return;
          }

          // Mientras resolvemos perfil, mantenemos hidratación activa para evitar
          // redirecciones tempranas a tabs cuando el usuario realmente es admin.
          set((state) => ({
            ...state,
            isHydrating: true,
          }));

          const profile = await withTimeout(getMyAuthProfile.execute(), PROFILE_TIMEOUT_MS).catch((error: unknown) => {
            console.warn("[authStore] No se pudo obtener perfil completo:", error);
            return null;
          });

          if (profile) {
            set((state) => ({
              user: state.user
                ? {
                    ...state.user,
                    fullName: profile.full_name,
                    avatarUrl: profile.avatar_url,
                    role: profile.role,
                    semester: profile.semester,
                    bio: profile.bio,
                  }
                : {
                    ...fallbackUser,
                    fullName: profile.full_name,
                    avatarUrl: profile.avatar_url,
                    role: profile.role,
                    semester: profile.semester,
                    bio: profile.bio,
                  },
              isAuthenticated: true,
              isHydrating: false,
            }));
          } else {
            set({
              user: fallbackUser,
              isAuthenticated: true,
              isHydrating: false,
            });

            // Reintento en segundo plano para no fijar rol incorrecto por timeout.
            getMyAuthProfile.execute()
              .then((profileRetry) => {
                if (!profileRetry) return;
                set((state) => ({
                  user: state.user
                    ? {
                        ...state.user,
                        fullName: profileRetry.full_name,
                        avatarUrl: profileRetry.avatar_url,
                        role: profileRetry.role,
                        semester: profileRetry.semester,
                        bio: profileRetry.bio,
                      }
                    : null,
                }));
              })
              .catch(() => {});
          }

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
            user: fallbackUser,
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
        const session = await withTimeout(getCurrentSession.execute(), SESSION_TIMEOUT_MS);
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

    const { data: { subscription } } = subscribeAuthStateChanges.execute(async (event, session) => {
      if (event === "SIGNED_OUT") {
        set({ user: null, isAuthenticated: false, isHydrating: false });
        return;
      }

      if (event === "SIGNED_IN") {
        await processSession(session);
        return;
      }

      // En OAuth (Google) pueden llegar eventos distintos a SIGNED_IN
      // como INITIAL_SESSION o TOKEN_REFRESHED con sesión ya válida.
      if (session?.user) {
        await processSession(session);
      }
    });

    return () => {
      clearTimeout(hydrationWatchdog);
      subscription.unsubscribe();
    };
  },

  signIn: async (email, password) => {
    const container = DIContainer.getInstance()
    const signInWithPassword = container.getSignInWithPassword()

    const normalizedEmail = email.trim().toLowerCase();
    set({ isLoading: true, isHydrating: true });

    try {
      const { user } = await signInWithPassword.execute({
        email: normalizedEmail,
        password,
      })
      if (!user) throw new Error("No se pudo iniciar sesión");
    } catch (error) {
      set({ user: null, isAuthenticated: false, isHydrating: false });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  signUp: async (email, password, fullName) => {
    const container = DIContainer.getInstance()
    const signUpWithPassword = container.getSignUpWithPassword()

    set({ isLoading: true });
    try {
      await signUpWithPassword.execute({ email, password, fullName })
    } finally {
      set({ isLoading: false });
    }
  },

  signOut: async () => {
    const container = DIContainer.getInstance()
    const signOutUser = container.getSignOutUser()

    set({ isLoading: true });
    try {
      await signOutUser.execute()
      set({ user: null, isAuthenticated: false, isHydrating: false });
    } finally {
      set({ isLoading: false });
    }
  },
}));