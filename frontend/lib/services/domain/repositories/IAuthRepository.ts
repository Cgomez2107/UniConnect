import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js"

export interface SignInInput {
  email: string
  password: string
}

export interface SignUpInput {
  email: string
  password: string
  fullName: string
}

export interface SignInResult {
  user: User | null
}

export interface SignUpResult {
  user: User | null
  session: Session | null
}

export interface AuthProfile {
  id: string
  full_name: string
  avatar_url: string | null
  bio: string | null
  role: "estudiante" | "admin"
  semester: number | null
  is_active: boolean
}

export interface OAuthSignInUrlInput {
  provider: "google"
  redirectTo: string
  allowedDomain?: string
}

export type OAuthSessionResolutionMode = "code" | "token" | "none"

export type AuthStateChangeCallback = (
  event: AuthChangeEvent,
  session: Session | null
) => void

export interface IAuthRepository {
  signIn(input: SignInInput): Promise<SignInResult>
  signUp(input: SignUpInput): Promise<SignUpResult>
  signOut(): Promise<void>
  signOutLocal(): Promise<void>
  getSession(): Promise<Session | null>
  getMyProfile(): Promise<AuthProfile | null>
  getOAuthSignInUrl(input: OAuthSignInUrlInput): Promise<string>
  resolveSessionFromOAuthUrl(url: string): Promise<OAuthSessionResolutionMode>
  onAuthStateChange(callback: AuthStateChangeCallback): {
    data: { subscription: { unsubscribe: () => void } }
  }
}
