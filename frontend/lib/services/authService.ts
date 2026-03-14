import { supabase } from "@/lib/supabase"

export interface SignUpData {
  email: string
  password: string
  fullName: string
}

export interface SignInData {
  email: string
  password: string
}

/**
 * Complete user profile from the profiles table.
 */
export interface AuthProfile {
  id: string
  email: string
  full_name: string
  avatar_url: string | null
  bio: string | null
  role: "estudiante" | "admin"
  semester: number | null
  is_active: boolean
  created_at: string
  updated_at: string
}

/**
 * Validates that email belongs to @ucaldas.edu.co domain.
 */
export function isUcaldasEmail(email: string): boolean {
  return email.trim().toLowerCase().endsWith("@ucaldas.edu.co")
}

/**
 * Registers a new user with email/password authentication.
 * Validates @ucaldas.edu.co domain before creating account.
 */
export async function signUp({ email, password, fullName }: SignUpData) {
  if (!isUcaldasEmail(email)) {
    throw new Error("Solo se permiten correos institucionales @ucaldas.edu.co")
  }

  const { data, error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: {
      data: {
        full_name: fullName.trim(),
      },
    },
  })

  if (error) throw error
  return data
}

/**
 * Authenticates user with email and password.
 */
export async function signIn({ email, password }: SignInData) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  })

  if (error) throw error
  return data
}

/**
 * Signs out the current user and clears session.
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

/**
 * Retrieves the current active session.
 */
export async function getSession() {
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  return data.session
}

/**
 * Fetches complete profile data for the authenticated user.
 * Returns null on error to support non-blocking authentication flows.
 */
export async function getMyProfile(): Promise<AuthProfile | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url, bio, role, semester, is_active")
      .eq("id", user.id)
      .single()

    if (error) {
      console.warn("[authService] Error al obtener perfil:", error.message)
      return null
    }

    return data as AuthProfile
  } catch (error) {
    console.warn("[authService] Excepción en getMyProfile:", error instanceof Error ? error.message : String(error))
    return null
  }
}

/**
 * Subscribes to authentication state changes.
 */
export function onAuthStateChange(
  callback: (event: string, session: any) => void
) {
  return supabase.auth.onAuthStateChange(callback)
}