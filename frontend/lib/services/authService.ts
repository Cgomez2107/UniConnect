/**
 * lib/services/authService.ts
 * Autenticación con Supabase Auth
 * - Solo acepta correos @ucaldas.edu.co (validado en frontend + RLS)
 * - Al registrarse crea el perfil automáticamente via trigger en Supabase
 */

import { supabase } from "@/lib/supabase"

// ── Tipos ─────────────────────────────────────────────────────────────────────
export interface SignUpData {
  email: string
  password: string
  fullName: string
}

export interface SignInData {
  email: string
  password: string
}

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

// ── Validación de dominio ─────────────────────────────────────────────────────
export function isUcaldasEmail(email: string): boolean {
  return email.trim().toLowerCase().endsWith("@ucaldas.edu.co")
}

// ── Registro ──────────────────────────────────────────────────────────────────
export async function signUp({ email, password, fullName }: SignUpData) {
  if (!isUcaldasEmail(email)) {
    throw new Error("Solo se permiten correos institucionales @ucaldas.edu.co")
  }

  const { data, error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: {
      data: {
        full_name: fullName.trim(),  // lo usa el trigger handle_new_user
      },
    },
  })

  if (error) throw error
  return data
}

// ── Login ─────────────────────────────────────────────────────────────────────
export async function signIn({ email, password }: SignInData) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  })

  if (error) throw error
  return data
}

// ── Logout ────────────────────────────────────────────────────────────────────
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

// ── Sesión activa ─────────────────────────────────────────────────────────────
export async function getSession() {
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  return data.session
}

// ── Perfil del usuario autenticado ────────────────────────────────────────────
// Llama a esta función después del login para obtener el perfil completo
export async function getMyProfile(): Promise<AuthProfile | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  if (error) throw error
  return data as AuthProfile
}

// ── Escuchar cambios de sesión (para el store) ────────────────────────────────
export function onAuthStateChange(
  callback: (event: string, session: any) => void
) {
  return supabase.auth.onAuthStateChange(callback)
}