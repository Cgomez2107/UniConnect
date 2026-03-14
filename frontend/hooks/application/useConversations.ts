import { DIContainer } from "@/lib/services/di/container"
import { useAuthStore } from "@/store/useAuthStore"
import type { Conversation } from "@/types"
import { useFocusEffect } from "expo-router"
import { useCallback, useState } from "react"

interface UseConversationsReturn {
	conversations: Conversation[]
	loading: boolean
	refreshing: boolean
	error: string | null
	refresh: () => void
}

export function useConversations(): UseConversationsReturn {
	const container = DIContainer.getInstance()
	const user = useAuthStore((s) => s.user)

	const [conversations, setConversations] = useState<Conversation[]>([])
	const [loading, setLoading] = useState(true)
	const [refreshing, setRefreshing] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const fetchData = useCallback(
		async (isRefresh = false) => {
			if (!user?.id) return
			isRefresh ? setRefreshing(true) : setLoading(true)
			setError(null)
			try {
				const useCase = container.getGetConversations()
				const data = await useCase.execute(user.id)
				setConversations(data)
			} catch (e) {
				setError(e instanceof Error ? e.message : "Error al cargar mensajes")
			} finally {
				setLoading(false)
				setRefreshing(false)
			}
		},
		[container, user?.id]
	)

	useFocusEffect(
		useCallback(() => {
			fetchData()
		}, [fetchData])
	)

	return {
		conversations,
		loading,
		refreshing,
		error,
		refresh: () => fetchData(true),
	}
}
