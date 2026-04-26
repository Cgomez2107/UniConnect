import { SupabaseAuthRepository } from "./SupabaseAuthRepository";
import { fetchApi, setManualToken } from "@/lib/api/httpClient";
import type {
  AuthProfile,
  AuthStateChangeCallback,
  IAuthRepository,
  OAuthSessionResolutionMode,
  OAuthSignInUrlInput,
  SignInInput,
  SignInResult,
  SignUpInput,
  SignUpResult,
} from "../../domain/repositories/IAuthRepository";
import type { Session, User } from "@supabase/supabase-js";

/**
 * Repositorio de autenticación que delega al API Gateway.
 * 
 * Sigue el patrón Adapter/Fallback:
 * - Intenta usar los endpoints del backend via Gateway para login/signup.
 * - Delega en SupabaseAuthRepository para OAuth, persistencia y estado.
 * 
 * Esto cumple con el criterio de usar el mismo endpoint que mobile (el Gateway)
 * sin duplicar lógica en el frontend.
 */
export class ApiAuthRepository implements IAuthRepository {
  private readonly fallback = new SupabaseAuthRepository();
  private _cachedSession: Session | null = null;
  private _lastSessionFetch = 0;
  private readonly SESSION_CACHE_TTL = 5000; // 5 segundos de cache para evitar ráfagas

  async signIn(input: SignInInput): Promise<SignInResult> {
    try {
      this.clearCache();
      // Intentamos el login a través del Gateway
      const data = await fetchApi<any>("/auth/signin", {
        method: "POST",
        body: JSON.stringify({
          email: input.email.trim().toLowerCase(),
          password: input.password,
        }),
      });

      // Si el backend responde exitosamente, guardamos el token y devolvemos el usuario.
      if (data.accessToken) {
        setManualToken(data.accessToken);
      }

      return { user: data.user as User };
    } catch (error) {
      // Si falla el backend (ej: no implementado o error de red), 
      // caemos al flujo de Supabase para no bloquear al usuario.
      console.warn("[ApiAuthRepository] Fallback a Supabase para signIn:", error);
      return this.fallback.signIn(input);
    }
  }

  async signUp(input: SignUpInput): Promise<SignUpResult> {
    try {
      this.clearCache();
      const data = await fetchApi<any>("/auth/signup", {
        method: "POST",
        body: JSON.stringify({
          email: input.email.trim().toLowerCase(),
          password: input.password,
          fullName: input.fullName.trim(),
        }),
      });

      if (data.accessToken) {
        setManualToken(data.accessToken);
      }

      return { user: data.user as User, session: data.session as Session };
    } catch (error) {
      console.warn("[ApiAuthRepository] Fallback a Supabase para signUp:", error);
      return this.fallback.signUp(input);
    }
  }

  async signOut(): Promise<void> {
    this.clearCache();
    setManualToken(null);
    return this.fallback.signOut();
  }

  async signOutLocal(): Promise<void> {
    this.clearCache();
    setManualToken(null);
    return this.fallback.signOutLocal();
  }

  private clearCache() {
    this._cachedSession = null;
    this._lastSessionFetch = 0;
  }

  async getSession(): Promise<Session | null> {
    const now = Date.now();
    if (this._cachedSession && now - this._lastSessionFetch < this.SESSION_CACHE_TTL) {
      return this._cachedSession;
    }

    try {
      // Implementación Fail-Fast: compite contra un timeout de 1.5s
      const fetchPromise = fetchApi<any>("/auth/session");
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Backend timeout")), 1500)
      );

      const data = await Promise.race([fetchPromise, timeoutPromise]) as any;
      
      if (data.session) {
        setManualToken(data.session.access_token);
        this._cachedSession = data.session as Session;
        this._lastSessionFetch = now;
        return this._cachedSession;
      }
      return null;
    } catch (error) {
      // Si el backend es lento o falla, caemos a Supabase que es mucho más rápido (local storage)
      const session = await this.fallback.getSession();
      this._cachedSession = session;
      this._lastSessionFetch = now;
      return session;
    }
  }

  async getMyProfile(): Promise<AuthProfile | null> {
    // IMPORTANTE: Delegamos al fallback (Supabase) para obtener el perfil real
    // desde la base de datos (tabla 'profiles'), lo cual garantiza que el
    // 'role' sea correcto (admin vs estudiante) y no un mock 'student'.
    return this.fallback.getMyProfile();
  }

  async getOAuthSignInUrl(input: OAuthSignInUrlInput): Promise<string> {
    try {
      // Usamos el endpoint unificado del backend enviando el redirectTo dinámico
      const data = await fetchApi<{ url: string }>("/auth/google", {
        method: "POST",
        body: JSON.stringify({
          provider: input.provider,
          redirectTo: input.redirectTo,
          allowedDomain: input.allowedDomain,
        }),
      });
      return data.url;
    } catch (error) {
      console.warn("[ApiAuthRepository] Fallback a Supabase para OAuth URL:", error);
      return this.fallback.getOAuthSignInUrl(input);
    }
  }

  async resolveSessionFromOAuthUrl(url: string): Promise<OAuthSessionResolutionMode> {
    this.clearCache();
    return this.fallback.resolveSessionFromOAuthUrl(url);
  }

  onAuthStateChange(callback: AuthStateChangeCallback) {
    return this.fallback.onAuthStateChange(callback);
  }
}
