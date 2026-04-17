import { DIContainer } from "@/lib/services/di/container"
import { useAuthStore } from "@/store/useAuthStore"
import { useCallback, useState } from "react"

interface UseDeleteResourceReturn {
	deleting: boolean
	error: string | null
	remove: (resourceId: string, fileUrl: string) => Promise<boolean>
}

export function useDeleteResource(): UseDeleteResourceReturn {
	const container = DIContainer.getInstance()
	const user = useAuthStore((s) => s.user)
	const [deleting, setDeleting] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const remove = useCallback(
		async (resourceId: string, fileUrl: string): Promise<boolean> => {
			void fileUrl

			if (!user?.id) {
				setError("Sesión no válida.")
				return false
			}

			setDeleting(true)
			setError(null)

			try {
				const useCase = container.getDeleteStudyResource()
				await useCase.execute(resourceId, user.id)
				return true
			} catch (e: unknown) {
				const msg = e instanceof Error ? e.message : "Error al eliminar recurso."
				setError(msg)
				return false
			} finally {
				setDeleting(false)
			}
		},
		[container, user?.id]
	)

	return { deleting, error, remove }
}
