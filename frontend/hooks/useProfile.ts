/**
 * hooks/useProfile.ts
 *
 * Encapsula TODA la lógica de datos de la pantalla de perfil:
 * - Carga paralela de perfil, programas, materias y solicitudes propias
 * - Refresco al entrar a la pantalla (useFocusEffect)
 * - Derivados: iniciales, programa principal, facultad del programa
 *
 * La pantalla perfil.tsx solo orquesta UI — cero lógica de negocio allí.
 */

import { getMyRequests } from "@/lib/services/careerService"
import {
  getMyPrograms,
  getMySubjects,
  getProfile,
} from "@/lib/services/profileService"
import type { StudyRequest, UserProgram, UserSubject } from "@/types"
import { useAuthStore } from "@/store/useAuthStore"
import { useFocusEffect } from "expo-router"
import { useCallback, useState } from "react"

interface UseProfileReturn {
  // Datos
  avatarUrl: string | null
  userPrograms: UserProgram[]
  userSubjects: UserSubject[]
  myRequests: StudyRequest[]
  // Derivados
  initials: string
  primaryProgramName: string
  primaryFacultyName: string
  hasPrimaryProgram: boolean
  // Estado
  isLoading: boolean
}

export function useProfile(): UseProfileReturn {
  const user = useAuthStore((s) => s.user)

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [userPrograms, setUserPrograms] = useState<UserProgram[]>([])
  const [userSubjects, setUserSubjects] = useState<UserSubject[]>([])
  const [myRequests, setMyRequests] = useState<StudyRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useFocusEffect(
    useCallback(() => {
      if (!user?.id) return

      const load = async () => {
        setIsLoading(true)
        try {
          const [profile, progs, subs, reqs] = await Promise.all([
            getProfile(user.id),
            getMyPrograms(user.id),
            getMySubjects(user.id),
            getMyRequests(user.id),
          ])
          setAvatarUrl(profile?.avatar_url ?? null)
          setUserPrograms(progs)
          setUserSubjects(subs)
          setMyRequests(reqs)
        } catch (e: unknown) {
          console.error(
            "useProfile: error cargando datos:",
            e instanceof Error ? e.message : e
          )
        } finally {
          setIsLoading(false)
        }
      }

      load()
    }, [user?.id])
  )

  // ── Derivados ──────────────────────────────────────────────────────────────
  const initials = (user?.fullName ?? "UC")
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase()

  const primaryProgram =
    userPrograms.find((p) => p.is_primary) ?? userPrograms[0]

  const primaryProgramName = primaryProgram?.programs?.name ?? "—"
  const primaryFacultyName =
    (primaryProgram?.programs as any)?.faculties?.name ?? "—"

  return {
    avatarUrl,
    userPrograms,
    userSubjects,
    myRequests,
    initials,
    primaryProgramName,
    primaryFacultyName,
    hasPrimaryProgram: !!primaryProgram,
    isLoading,
  }
}
