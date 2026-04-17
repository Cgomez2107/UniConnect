import { DIContainer } from "@/lib/services/di/container"
import { useAuthStore } from "@/store/useAuthStore"
import type { StudentPublicProfile } from "@/types"
import { useCallback, useEffect, useMemo, useState } from "react"

interface UseStudentProfileReturn {
	profile: StudentPublicProfile | null
	loading: boolean
	error: string | null
	refresh: () => void
}

export function useStudentProfile(studentId: string): UseStudentProfileReturn {
	const container = useMemo(() => DIContainer.getInstance(), [])
	const user = useAuthStore((s) => s.user)
	const [profile, setProfile] = useState<StudentPublicProfile | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	const load = useCallback(async () => {
		if (!user?.id) {
			setProfile(null)
			setError("Sesión no válida.")
			setLoading(false)
			return
		}

		setLoading(true)
		setError(null)
		try {
			const useCase = container.getGetStudentPublicProfile()
			const data = await useCase.execute(studentId, user.id)
			if (!data) {
				setError("No se encontró el perfil del estudiante.")
			}
			setProfile(data)
		} catch (e: unknown) {
			setError(
				e instanceof Error ? e.message : "Error al cargar perfil."
			)
		} finally {
			setLoading(false)
		}
	}, [container, studentId, user?.id])

	useEffect(() => {
		if (studentId) load()
	}, [studentId, load])

	return { profile, loading, error, refresh: load }
}
