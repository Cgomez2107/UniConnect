import { getStudentPublicProfile } from "@/lib/services/studentService"
import type { StudentPublicProfile } from "@/types"
import { useCallback, useEffect, useState } from "react"

interface UseStudentProfileReturn {
	profile: StudentPublicProfile | null
	loading: boolean
	error: string | null
	refresh: () => void
}

export function useStudentProfile(studentId: string): UseStudentProfileReturn {
	const [profile, setProfile] = useState<StudentPublicProfile | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	const load = useCallback(async () => {
		setLoading(true)
		setError(null)
		try {
			const data = await getStudentPublicProfile(studentId)
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
	}, [studentId])

	useEffect(() => {
		if (studentId) load()
	}, [studentId, load])

	return { profile, loading, error, refresh: load }
}
