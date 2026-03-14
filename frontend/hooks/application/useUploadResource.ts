import { DIContainer } from "@/lib/services/di/container"
import { useAuthStore } from "@/store/useAuthStore"
import type { CreateStudyResourcePayload, StudyResource } from "@/types"
import { useCallback, useState } from "react"

interface UseUploadResourceReturn {
	uploading: boolean
	error: string | null
	upload: (
		payload: CreateStudyResourcePayload & {
			file_name: string
			file_size_bytes: number
		}
	) => Promise<StudyResource | null>
	validateFile: (fileName: string, sizeBytes: number) => string | null
}

export function useUploadResource(): UseUploadResourceReturn {
	const container = DIContainer.getInstance()
	const user = useAuthStore((s) => s.user)
	const [uploading, setUploading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const validateFile = useCallback(
		(fileName: string, sizeBytes: number): string | null => {
			const useCase = container.getUploadResourceFromDevice()
			if (!useCase.validateFileFormat(fileName)) {
				return "Formato no permitido. Usa: pdf, docx, xlsx, pptx, txt, jpg, png."
			}
			if (!useCase.validateFileSize(sizeBytes)) {
				return "El archivo excede el máximo de 10 MB."
			}
			return null
		},
		[container]
	)

	const upload = useCallback(
		async (
			payload: CreateStudyResourcePayload & {
				file_name: string
				file_size_bytes: number
			}
		): Promise<StudyResource | null> => {
			if (!user) {
				setError("Sesión no válida.")
				return null
			}

			setUploading(true)
			setError(null)

			try {
				const useCase = container.getUploadResourceFromDevice()
				const resource = await useCase.execute(user.id, payload)
				return resource
			} catch (e: unknown) {
				const msg = e instanceof Error ? e.message : "Error al subir recurso."
				setError(msg)
				return null
			} finally {
				setUploading(false)
			}
		},
		[container, user]
	)

	return { uploading, error, upload, validateFile }
}
