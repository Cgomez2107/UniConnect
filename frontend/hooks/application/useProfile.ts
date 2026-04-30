import { DIContainer } from "@/lib/services/di/container"
import { useAuthStore } from "@/store/useAuthStore"
import type { StudyRequest, UserProgram, UserSubject } from "@/types"
import { useFocusEffect } from "expo-router"
import { useCallback, useMemo, useState } from "react"

interface UseProfileReturn {
	avatarUrl: string | null
	phoneNumber: string | null
	userPrograms: UserProgram[]
	userSubjects: UserSubject[]
	myRequests: StudyRequest[]
	initials: string
	primaryProgramName: string
	primaryFacultyName: string
	hasPrimaryProgram: boolean
	isLoading: boolean
}

export function useProfile(): UseProfileReturn {
	const user = useAuthStore((s) => s.user)

	const [avatarUrl, setAvatarUrl] = useState<string | null>(user?.avatarUrl ?? null)
	const [phoneNumber, setPhoneNumber] = useState<string | null>(user?.phoneNumber ?? null)
	const [userPrograms, setUserPrograms] = useState<UserProgram[]>(user?.programs ?? [])
	const [userSubjects, setUserSubjects] = useState<UserSubject[]>(user?.subjects ?? [])
	const [myRequests, setMyRequests] = useState<StudyRequest[]>([])
	const [isLoading, setIsLoading] = useState(!user?.programs?.length && !user?.subjects?.length)

	useFocusEffect(
		useCallback(() => {
			if (!user?.id) {
				setIsLoading(false)
				return
			}

			const load = async () => {
				const container = DIContainer.getInstance()
				const userId = user.id

				// Si ya tenemos datos básicos, no mostramos el loader gigante,
				// pero igual refrescamos en background para asegurar consistencia.
				const hasBasicData = !!(user?.programs?.length || user?.subjects?.length)
				if (!hasBasicData) {
					setIsLoading(true)
				}

				let completed = 0
				const total = 4
				const markDone = () => {
					completed++
					if (completed >= total) setIsLoading(false)
				}

				// 1. Perfil básico (Avatar, Teléfono)
				container.getGetProfileByUserId().execute(userId)
					.then(p => {
						if (p) {
							setAvatarUrl(p.avatar_url ?? null)
							setPhoneNumber(p.phone_number ?? null)
						}
					})
					.catch(e => console.warn("[useProfile] Error perfil:", e))
					.finally(markDone)

				// 2. Programas
				container.getGetMyPrograms().execute(userId)
					.then(setUserPrograms)
					.catch(e => console.warn("[useProfile] Error programas:", e))
					.finally(markDone)

				// 3. Materias
				container.getGetMySubjects().execute(userId)
					.then(setUserSubjects)
					.catch(e => console.warn("[useProfile] Error materias:", e))
					.finally(markDone)

				// 4. Mis Solicitudes
				container.getGetStudyRequestsByAuthor().execute(userId)
					.then(setMyRequests)
					.catch(e => console.warn("[useProfile] Error solicitudes:", e))
					.finally(markDone)
				
				// Timeout de seguridad
				setTimeout(() => {
					setIsLoading(false)
				}, 5000)
			}

			load()
		}, [user?.id])
	)

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
		phoneNumber,
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
