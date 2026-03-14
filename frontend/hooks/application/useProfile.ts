import { DIContainer } from "@/lib/services/di/container"
import { useAuthStore } from "@/store/useAuthStore"
import type { StudyRequest, UserProgram, UserSubject } from "@/types"
import { useFocusEffect } from "expo-router"
import { useCallback, useState } from "react"

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
	const container = DIContainer.getInstance()
	const user = useAuthStore((s) => s.user)

	const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
	const [phoneNumber, setPhoneNumber] = useState<string | null>(null)
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
					const getProfileByUserId = container.getGetProfileByUserId()
					const getMyProgramsUseCase = container.getGetMyPrograms()
					const getMySubjectsUseCase = container.getGetMySubjects()
					const getRequestsByAuthor = container.getGetStudyRequestsByAuthor()

					const [profile, progs, subs, reqs] = await Promise.all([
						getProfileByUserId.execute(user.id),
						getMyProgramsUseCase.execute(user.id),
						getMySubjectsUseCase.execute(user.id),
						getRequestsByAuthor.execute(user.id),
					])
					setAvatarUrl(profile?.avatar_url ?? null)
					setPhoneNumber(profile?.phone_number ?? null)
					setUserPrograms(progs)
					setUserSubjects(subs)
					setMyRequests(reqs)
				} finally {
					setIsLoading(false)
				}
			}

			load()
		}, [container, user?.id])
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
