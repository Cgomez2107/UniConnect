import { DIContainer } from "@/lib/services/di/container"
import { useCallback, useState } from "react"
import { usePlatformAuth } from "@/hooks/application/usePlatformAuth"

const ALLOWED_DOMAIN = "ucaldas.edu.co"
const DOMAIN_REJECTED_ERROR = "Debes usar tu correo institucional (@ucaldas.edu.co) para ingresar con Google."
const OAUTH_CANCELLED_ERROR = "La autenticacion con Google fue cancelada."
const OAUTH_FAILED_ERROR = "La autenticacion con Google fallo. Intenta nuevamente."
const OAUTH_RESOLUTION_TIMEOUT_MS = 12000

const withTimeout = async <T,>(promise: Promise<T>, ms: number): Promise<T> => {
	let timeoutHandle: ReturnType<typeof setTimeout> | null = null

	try {
		return await Promise.race<T>([
			promise,
			new Promise<T>((_, reject) => {
				timeoutHandle = setTimeout(() => reject(new Error("OAuth timeout")), ms)
			}),
		])
	} finally {
		if (timeoutHandle) {
			clearTimeout(timeoutHandle)
		}
	}
}

const getParamFromUrl = (url: string, key: string) => {
	const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
	const pattern = new RegExp(`[?#&]${escapedKey}=([^&#]*)`, "i")
	const match = url.match(pattern)
	if (!match?.[1]) return null

	try {
		return decodeURIComponent(match[1])
	} catch {
		return match[1]
	}
}

const parseJwtPayload = (token: string): Record<string, unknown> | null => {
	const parts = token.split(".")
	if (parts.length < 2) return null

	const payload = parts[1]
	const normalized = payload.replace(/-/g, "+").replace(/_/g, "/")
	const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=")

	try {
		if (typeof atob !== "function") return null
		return JSON.parse(atob(padded)) as Record<string, unknown>
	} catch {
		return null
	}
}

const getEmailFromOAuthUrl = (url: string): string | null => {
	const idToken = getParamFromUrl(url, "id_token")
	if (idToken) {
		const payload = parseJwtPayload(idToken)
		const email = typeof payload?.email === "string" ? payload.email : null
		if (email) return email.toLowerCase()
	}

	const accessToken = getParamFromUrl(url, "access_token")
	if (accessToken) {
		const payload = parseJwtPayload(accessToken)
		const email = typeof payload?.email === "string" ? payload.email : null
		if (email) return email.toLowerCase()
	}

	return null
}

const getOAuthErrorMessage = (url: string): string | null => {
	const rawError = getParamFromUrl(url, "error")?.toLowerCase() ?? ""
	const rawDescription = getParamFromUrl(url, "error_description")?.toLowerCase() ?? ""

	if (!rawError && !rawDescription) {
		return null
	}

	if (rawError.includes("access_denied") || rawDescription.includes("cancel")) {
		return OAUTH_CANCELLED_ERROR
	}

	if (
		rawError.includes("domain") ||
		rawDescription.includes("domain") ||
		rawDescription.includes("hd") ||
		rawDescription.includes("ucaldas")
	) {
		return DOMAIN_REJECTED_ERROR
	}

	return OAUTH_FAILED_ERROR
}

export function useGoogleAuth() {
	const container = DIContainer.getInstance()
	const { getOAuthRedirectUrl, startOAuthSignIn } = usePlatformAuth()
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const resolveSessionFromUrl = useCallback(async (url: string) => {
		const useCase = container.getResolveSessionFromOAuthUrl()
		const resolutionMode = await withTimeout(useCase.execute(url), OAUTH_RESOLUTION_TIMEOUT_MS)

		if (resolutionMode === "none") {
			const oauthErrorMessage = getOAuthErrorMessage(url)
			throw new Error(oauthErrorMessage ?? OAUTH_FAILED_ERROR)
		}
	}, [container])

	const signInWithGoogle = useCallback(async () => {
		setError(null)
		setLoading(true)

		try {
			const redirectUrl = getOAuthRedirectUrl()
			const useCase = container.getGetOAuthSignInUrl()
			const authUrl = await useCase.execute({
				provider: "google",
				redirectTo: redirectUrl,
				allowedDomain: ALLOWED_DOMAIN,
			})
			const result = await startOAuthSignIn(authUrl, redirectUrl)

			if (result.type === "callback") {
				const oauthErrorMessage = getOAuthErrorMessage(result.url)
				if (oauthErrorMessage) {
					setError(oauthErrorMessage)
					return
				}

				const oauthEmail = getEmailFromOAuthUrl(result.url)
				if (oauthEmail && !oauthEmail.endsWith(`@${ALLOWED_DOMAIN}`)) {
					setError(DOMAIN_REJECTED_ERROR)
					return
				}

				await resolveSessionFromUrl(result.url)
				return
			}

			if (result.type === "cancelled") {
				setError(OAUTH_CANCELLED_ERROR)
			}
		} catch (e: any) {
			setError(e?.message ?? OAUTH_FAILED_ERROR)
		} finally {
			setLoading(false)
		}
	}, [container, getOAuthRedirectUrl, resolveSessionFromUrl, startOAuthSignIn])

	return { loading, error, signInWithGoogle }
}