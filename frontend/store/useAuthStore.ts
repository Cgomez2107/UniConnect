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
  programs?: any[];
  subjects?: any[];
}

function normalizeRole(role: unknown): UserRole {
  const value = String(role ?? "").trim().toLowerCase();
  if (value === "admin" || value === "administrador") {
    return "admin";
  }

  return "estudiante";
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
  role: normalizeRole(sessionUser.user_metadata?.role),
  semester: null,
  bio: null,
  programs: [],
  subjects: [],
});

const HYDRATION_TIMEOUT_MS = 10000; // 10s para dar margen a la latencia
const SESSION_TIMEOUT_MS = 6000;    // 6s para el check inicial de sesión
const PROFILE_TIMEOUT_MS = 4000;

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

    let hasProcessedInitial = false;

    const processSession = async (session: any) => {
      const userId = session?.user?.id;
      
      if (userId && userId !== "undefined" && userId !== "null") {
        const email = session.user.email?.toLowerCase();

        if (email && !email.endsWith('@ucaldas.edu.co')) {
          console.warn("[authStore] Dominio no permitido:", email);
          await clearLocalSessionUseCase.execute();
          set({ user: null, isAuthenticated: false, isHydrating: false });
          return;
        }

        const fallbackUser = buildFallbackUser(session.user);
        
        // Establecer estado autenticado DE INMEDIATO para evitar saltos al login
        set({
          user: fallbackUser,
          isAuthenticated: true,
          isHydrating: false,
        });

        // Carga de perfil en background
        getMyAuthProfile.execute().then(profile => {
          if (profile) {
            set(state => ({
              user: state.user ? {
                ...state.user,
                fullName: profile.full_name || state.user.fullName,
                avatarUrl: profile.avatar_url || state.user.avatarUrl,
                role: normalizeRole(profile.role),
                semester: profile.semester,
                bio: profile.bio,
              } : null
            }));
          }
        }).catch(() => {});

        // Carga de programas/materias en background
        const getMyPrograms = container.getGetMyPrograms();
        const getMySubjects = container.getGetMySubjects();
        Promise.all([
          getMyPrograms.execute(userId),
          getMySubjects.execute(userId)
        ]).then(([progs, subs]) => {
          set(state => ({
            user: state.user ? { ...state.user, programs: progs, subjects: subs } : null
          }));
        }).catch(() => {});

        registerAndSavePushToken(userId).catch(() => {});
      } else {
        // Solo marcar como no hidratado si no hay sesión y no estamos esperando a OAuth
        set({ user: null, isAuthenticated: false, isHydrating: false });
      }
      hasProcessedInitial = true;
    };

    // Watchdog de seguridad final (15s)
    const watchdog = setTimeout(() => {
      if (get().isHydrating) {
        console.warn("[authStore] Watchdog final. Liberando UI.");
        set({ isHydrating: false });
      }
    }, 15000);

    // UNICO PUNTO DE VERDAD: Escuchar cambios de estado de Supabase.
    // Supabase dispara 'INITIAL_SESSION' automáticamente al inicializarse si hay sesión guardada.
    const { data: { subscription } } = subscribeAuthStateChanges.execute(async (event, session) => {
      console.log("[authStore] Cambio de estado detectado:", event);
      
      if (event === "SIGNED_OUT" || event === "USER_DELETED") {
        set({ user: null, isAuthenticated: false, isHydrating: false });
        return;
      }

      if (session?.user) {
        await processSession(session);
      } else {
        // Si no hay sesión inicial, marcamos como hidratado para que el usuario pueda ver el login
        if (event === "INITIAL_SESSION" || event === "SIGNED_OUT") {
          set({ user: null, isAuthenticated: false, isHydrating: false });
        }
      }
    });

    return () => {
      clearTimeout(watchdog);
      subscription.unsubscribe();
    };
  },

  signIn: async (email, password) => {
    const container = DIContainer.getInstance()
    const signInWithPassword = container.getSignInWithPassword()

    const normalizedEmail = email.trim().toLowerCase();
    set({ isLoading: true });

    try {
      const { user } = await signInWithPassword.execute({
        email: normalizedEmail,
        password,
      })
      if (!user) throw new Error("No se pudo iniciar sesión");
    } catch (error) {
      set({ user: null, isAuthenticated: false });
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