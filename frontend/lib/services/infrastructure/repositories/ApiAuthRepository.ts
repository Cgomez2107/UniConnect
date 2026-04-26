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

  async signIn(input: SignInInput): Promise<SignInResult> {
    try {
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

  // Las siguientes operaciones delegan al fallback ya que el backend auth service
  // actual es un draft que no maneja sesiones persistentes ni OAuth aún.

  async signOut(): Promise<void> {
    setManualToken(null);
    return this.fallback.signOut();
  }

  async signOutLocal(): Promise<void> {
    setManualToken(null);
    return this.fallback.signOutLocal();
  }

  async getSession(): Promise<Session | null> {
    try {
      // Intentamos recuperar la sesión desde el backend basada en cookies (Criterio 2)
      const data = await fetchApi<any>("/auth/session");
      if (data.session) {
        setManualToken(data.session.access_token);
        return data.session as Session;
      }
      return null;
    } catch (error) {
      // Si el backend no tiene sesión, intentamos Supabase por si acaso
      return this.fallback.getSession();
    }
  }

  async getMyProfile(): Promise<AuthProfile | null> {
    const session = await this.getSession();
    if (!session?.user) return null;
    
    return {
      id: session.user.id,
      email: session.user.email ?? "",
      fullName: (session.user as any).fullName || "Usuario Institucional",
      role: (session.user as any).role || "student"
    };
  }

  async getOAuthSignInUrl(input: OAuthSignInUrlInput): Promise<string> {
    try {
      // Usamos el endpoint unificado del backend (Criterio 4)
      const data = await fetchApi<{ url: string }>("/auth/google");
      return data.url;
    } catch (error) {
      console.warn("[ApiAuthRepository] Fallback a Supabase para OAuth URL:", error);
      return this.fallback.getOAuthSignInUrl(input);
    }
  }

  async resolveSessionFromOAuthUrl(url: string): Promise<OAuthSessionResolutionMode> {
    return this.fallback.resolveSessionFromOAuthUrl(url);
  }

  onAuthStateChange(callback: AuthStateChangeCallback) {
    return this.fallback.onAuthStateChange(callback);
  }
}
