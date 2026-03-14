import { supabase } from "@/lib/supabase"
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
} from "../../domain/repositories/IAuthRepository"

export class SupabaseAuthRepository implements IAuthRepository {
  async signIn(input: SignInInput): Promise<SignInResult> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: input.email.trim().toLowerCase(),
      password: input.password,
    })

    if (error) throw error
    return { user: data.user }
  }

  async signUp(input: SignUpInput): Promise<SignUpResult> {
    const { data, error } = await supabase.auth.signUp({
      email: input.email.trim().toLowerCase(),
      password: input.password,
      options: {
        data: {
          full_name: input.fullName.trim(),
        },
      },
    })

    if (error) throw error
    return { user: data.user, session: data.session }
  }

  async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  async signOutLocal(): Promise<void> {
    const { error } = await supabase.auth.signOut({ scope: "local" as any })
    if (error) throw error
  }

  async getSession() {
    const { data, error } = await supabase.auth.getSession()
    if (error) throw error
    return data.session
  }

  async getMyProfile(): Promise<AuthProfile | null> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return null

      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, bio, role, semester, is_active")
        .eq("id", user.id)
        .single()

      if (error) {
        console.warn("[authRepository] Error al obtener perfil:", error.message)
        return null
      }

      return data as AuthProfile
    } catch (error) {
      console.warn(
        "[authRepository] Excepción en getMyProfile:",
        error instanceof Error ? error.message : String(error)
      )
      return null
    }
  }

  async getOAuthSignInUrl(input: OAuthSignInUrlInput): Promise<string> {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: input.provider,
      options: {
        redirectTo: input.redirectTo,
        queryParams: {
          ...(input.allowedDomain ? { hd: input.allowedDomain } : {}),
          prompt: "select_account",
        },
        skipBrowserRedirect: true,
      },
    })

    if (error) throw error
    if (!data.url) throw new Error("No se recibió URL de autenticación")
    return data.url
  }

  async resolveSessionFromOAuthUrl(url: string): Promise<OAuthSessionResolutionMode> {
    const queryParams = this.extractQueryParams(url)
    const hashParams = this.extractHashParams(url)

    if (queryParams.code) {
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(queryParams.code)
      if (exchangeError) throw exchangeError
      return "code"
    }

    if (hashParams.access_token && hashParams.refresh_token) {
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: hashParams.access_token,
        refresh_token: hashParams.refresh_token,
      })
      if (sessionError) throw sessionError
      return "token"
    }

    return "none"
  }

  onAuthStateChange(callback: AuthStateChangeCallback) {
    return supabase.auth.onAuthStateChange(callback)
  }

  private extractQueryParams(url: string): Record<string, string> {
    const params: Record<string, string> = {}
    const questionIndex = url.indexOf("?")
    if (questionIndex === -1) return params

    let queryString = url.substring(questionIndex + 1)
    const hashIndex = queryString.indexOf("#")
    if (hashIndex !== -1) queryString = queryString.substring(0, hashIndex)

    for (const pair of queryString.split("&")) {
      const [key, value] = pair.split("=")
      if (key && value) {
        params[decodeURIComponent(key)] = decodeURIComponent(value)
      }
    }

    return params
  }

  private extractHashParams(url: string): Record<string, string> {
    const params: Record<string, string> = {}
    const hashIndex = url.indexOf("#")
    if (hashIndex === -1) return params

    const hash = url.substring(hashIndex + 1)
    for (const pair of hash.split("&")) {
      const [key, value] = pair.split("=")
      if (key && value) {
        params[decodeURIComponent(key)] = decodeURIComponent(value)
      }
    }

    return params
  }
}
