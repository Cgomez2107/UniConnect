import { searchStudentsBySubject } from "@/lib/services/studentService"
import {
	getEnrolledSubjectsForUser,
	Subject as FeedSubject,
} from "@/lib/services/studyRequestsService"
import type { StudentSearchResult } from "@/types"
import { useCallback, useEffect, useRef, useState } from "react"

const PAGE_SIZE = 20

interface UseStudentSearchReturn {
	students: StudentSearchResult[]
	userSubjects: FeedSubject[]
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
	const [students, setStudents] = useState<StudentSearchResult[]>([])
	const [userSubjects, setUserSubjects] = useState<FeedSubject[]>([])
	const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null)
	const [loading, setLoading] = useState(false)
	const [loadingMore, setLoadingMore] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const pageRef = useRef(0)
	const hasMoreRef = useRef(false)

	useEffect(() => {
		getEnrolledSubjectsForUser()
			.then((subjects) => setUserSubjects(subjects))
			.catch(() => setUserSubjects([]))
	}, [])

	const fetchStudents = useCallback(
		async (subjectId: string, isRefresh = false) => {
			if (!isRefresh) setLoading(true)
			setError(null)
			pageRef.current = 0

			try {
				const data = await searchStudentsBySubject(subjectId, 0, PAGE_SIZE)
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
		[]
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
		if (loadingMore || !hasMoreRef.current || !selectedSubjectId) return
		setLoadingMore(true)

		try {
			const nextPage = pageRef.current + 1
			const data = await searchStudentsBySubject(
				selectedSubjectId,
				nextPage,
				PAGE_SIZE
			)
			if (data.length > 0) {
				setStudents((prev) => [...prev, ...data])
				pageRef.current = nextPage
			}
			hasMoreRef.current = data.length >= PAGE_SIZE
		} finally {
			setLoadingMore(false)
		}
	}, [loadingMore, selectedSubjectId])

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
