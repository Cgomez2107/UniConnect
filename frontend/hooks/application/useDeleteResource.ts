import { deleteResource } from "@/lib/services/resourceService"
import { useCallback, useState } from "react"

interface UseDeleteResourceReturn {
	deleting: boolean
	error: string | null
	remove: (resourceId: string, fileUrl: string) => Promise<boolean>
}

export function useDeleteResource(): UseDeleteResourceReturn {
	const [deleting, setDeleting] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const remove = useCallback(
		async (resourceId: string, fileUrl: string): Promise<boolean> => {
			setDeleting(true)
			setError(null)

			try {
				await deleteResource(resourceId, fileUrl)
				return true
			} catch (e: unknown) {
				const msg = e instanceof Error ? e.message : "Error al eliminar recurso."
				setError(msg)
				return false
			} finally {
				setDeleting(false)
			}
		},
		[]
	)

	return { deleting, error, remove }
}
