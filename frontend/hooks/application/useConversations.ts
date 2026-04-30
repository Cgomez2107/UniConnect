import { DIContainer } from "@/lib/services/di/container"
import { useAuthStore } from "@/store/useAuthStore"
import { useConversationsStore } from "@/store/useConversationsStore"
import { useUnreadCountStore } from "@/store/unreadCountStore"
import type { Conversation } from "@/types"
import { useFocusEffect } from "expo-router"
import { useCallback, useMemo, useState } from "react"

interface UseConversationsReturn {
	conversations: Conversation[]
	hasHydrated: boolean
	loading: boolean
	refreshing: boolean
	error: string | null
	refresh: () => void
}

export function useConversations(): UseConversationsReturn {
	const container = useMemo(() => DIContainer.getInstance(), [])
	const user = useAuthStore((s) => s.user)
	const isHydrating = useAuthStore((s) => s.isHydrating)
	const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
	const conversations = useConversationsStore((s) => s.conversations)
	const hasHydrated = useConversationsStore((s) => s.hasHydrated)
	const setConversations = useConversationsStore((s) => s.setConversations)

	const [loading, setLoading] = useState(true)
	const [refreshing, setRefreshing] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const fetchData = useCallback(
		async (isRefresh = false) => {
			if (isHydrating) {
				return
			}

			if (!user?.id || !isAuthenticated) {
				setConversations([])
				setError("Tu sesión aún no está lista. Intenta recargar en unos segundos.")
				setLoading(false)
				setRefreshing(false)
				return
			}

			if (isRefresh) setRefreshing(true)
			else setLoading(true)
			setError(null)

			try {
				const useCase = container.getGetConversations()
				
				// Timeout de seguridad para mensajería (10s)
				const TIMEOUT_MS = 10000
				const fetchPromise = useCase.execute(user.id)
				const timeoutPromise = new Promise<never>((_, reject) =>
					setTimeout(() => reject(new Error("Timeout cargando mensajes")), TIMEOUT_MS)
				)

				const data = await Promise.race([fetchPromise, timeoutPromise])
				
				setConversations(data)
				await useUnreadCountStore.getState().refreshUnreadCount()
			} catch (e) {
				console.error("[useConversations] Error:", e)
				setError(e instanceof Error ? e.message : "Error al cargar mensajes")
			} finally {
				setLoading(false)
				setRefreshing(false)
			}
		},
		[container, isAuthenticated, isHydrating, setConversations, user?.id]
	)

	useFocusEffect(
		useCallback(() => {
			fetchData()
		}, [fetchData])
	)

	return {
		conversations,
		hasHydrated,
		loading,
		refreshing,
		error,
		refresh: () => fetchData(true),
	}
}
