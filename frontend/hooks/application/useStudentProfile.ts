import { DIContainer } from "@/lib/services/di/container"
import { useAuthStore } from "@/store/useAuthStore"
import type { StudentPublicProfile, PerfilCompleto, IndicadoresEstadisticas, Insignia } from "@/types"
import { useCallback, useEffect, useMemo, useState } from "react"

interface UseStudentProfileReturn {
	profile: StudentPublicProfile | null
	loading: boolean
	error: string | null
	refresh: () => void
	// D02 — Decoradores opcionales (viene del endpoint con ?vista=completa)
	perfilDecorado: PerfilCompleto | null
	indicadores?: IndicadoresEstadisticas
	insignias?: Insignia[]
}

export function useStudentProfile(studentId: string, vistaCompleta = false): UseStudentProfileReturn {
	const container = useMemo(() => DIContainer.getInstance(), [])
	const user = useAuthStore((s) => s.user)
	const [profile, setProfile] = useState<StudentPublicProfile | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [perfilDecorado, setPerfilDecorado] = useState<PerfilCompleto | null>(null)

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

			// D02: Cargar perfil decorado si vistaCompleta es true
			if (vistaCompleta) {
				try {
					const decoratedUseCase = container.getGetDecoratedStudentProfile()
					const decorated = await decoratedUseCase.execute(studentId)
					setPerfilDecorado(decorated)
				} catch {
					// Best-effort: no rompe la UI si falla el decorado
				}
			}
		} catch (e: unknown) {
			setError(
				e instanceof Error ? e.message : "Error al cargar perfil."
			)
		} finally {
			setLoading(false)
		}
	}, [container, studentId, user?.id, vistaCompleta])

	useEffect(() => {
		if (studentId) load()
	}, [studentId, load])

	const indicadoresVal = perfilDecorado?.indicadores
	const insigniasVal = perfilDecorado?.insignias

	return {
		profile,
		loading,
		error,
		refresh: load,
		perfilDecorado,
		indicadores: indicadoresVal,
		insignias: insigniasVal,
	}
}
