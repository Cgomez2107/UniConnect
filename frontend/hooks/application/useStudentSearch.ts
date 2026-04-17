import { DIContainer } from "@/lib/services/di/container"
import { useAuthStore } from "@/store/useAuthStore"
import type { StudentSearchResult } from "@/types"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

const PAGE_SIZE = 20

interface UseStudentSearchReturn {
	students: StudentSearchResult[]
	userSubjects: { id: string; name: string }[]
	selectedSubjectId: string | null
	selectSubject: (subjectId: string | null) => void
	loading: boolean
	loadingMore: boolean
	error: string | null
	hasMore: boolean
	loadMore: () => void
	refresh: () => void
}

export function useStudentSearch(): UseStudentSearchReturn {
	const container = useMemo(() => DIContainer.getInstance(), [])
	const user = useAuthStore((s) => s.user)
	const [students, setStudents] = useState<StudentSearchResult[]>([])
	const [userSubjects, setUserSubjects] = useState<{ id: string; name: string }[]>([])
	const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null)
	const [loading, setLoading] = useState(false)
	const [loadingMore, setLoadingMore] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const pageRef = useRef(0)
	const hasMoreRef = useRef(false)

	useEffect(() => {
		if (!user?.id) {
			setUserSubjects([])
			return
		}

		const useCase = container.getGetEnrolledSubjectsForUser()
		useCase
			.execute(user.id)
			.then((subjects) => setUserSubjects(subjects))
			.catch(() => setUserSubjects([]))
	}, [container, user?.id])

	const fetchStudents = useCallback(
		async (subjectId: string, isRefresh = false) => {
			if (!user?.id) {
				setError("Sesión no válida.")
				setStudents([])
				hasMoreRef.current = false
				return
			}

			if (!isRefresh) setLoading(true)
			setError(null)
			pageRef.current = 0

			try {
				const useCase = container.getSearchStudentsBySubject()
				const data = await useCase.execute(subjectId, user.id, 0, PAGE_SIZE)
				setStudents(data)
				hasMoreRef.current = data.length >= PAGE_SIZE
			} catch (e: unknown) {
				setError(
					e instanceof Error ? e.message : "Error al buscar compañeros."
				)
				setStudents([])
				hasMoreRef.current = false
			} finally {
				setLoading(false)
			}
		},
		[container, user?.id]
	)

	const selectSubject = useCallback(
		(subjectId: string | null) => {
			setSelectedSubjectId(subjectId)
			if (subjectId) {
				fetchStudents(subjectId)
			} else {
				setStudents([])
				hasMoreRef.current = false
			}
		},
		[fetchStudents]
	)

	const loadMore = useCallback(async () => {
		if (loadingMore || !hasMoreRef.current || !selectedSubjectId || !user?.id) return
		setLoadingMore(true)

		try {
			const nextPage = pageRef.current + 1
			const useCase = container.getSearchStudentsBySubject()
			const data = await useCase.execute(selectedSubjectId, user.id, nextPage, PAGE_SIZE)
			if (data.length > 0) {
				setStudents((prev) => [...prev, ...data])
				pageRef.current = nextPage
			}
			hasMoreRef.current = data.length >= PAGE_SIZE
		} finally {
			setLoadingMore(false)
		}
	}, [container, loadingMore, selectedSubjectId, user?.id])

	const refresh = useCallback(() => {
		if (selectedSubjectId) {
			fetchStudents(selectedSubjectId, true)
		}
	}, [selectedSubjectId, fetchStudents])

	return {
		students,
		userSubjects,
		selectedSubjectId,
		selectSubject,
		loading,
		loadingMore,
		error,
		hasMore: hasMoreRef.current,
		loadMore,
		refresh,
	}
}
