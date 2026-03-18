import { DIContainer } from "@/lib/services/di/container"
import { useCallback, useState } from "react"
import * as WebBrowser from "expo-web-browser"
import * as AuthSession from "expo-auth-session"
import Constants from "expo-constants"

WebBrowser.maybeCompleteAuthSession()

const ALLOWED_DOMAIN = "ucaldas.edu.co"

function getOAuthRedirectUrl() {
	if (Constants.appOwnership === "expo" || Constants.appOwnership === "guest") {
		return AuthSession.makeRedirectUri({ path: "oauth-callback" })
	}

	return AuthSession.makeRedirectUri({
		scheme: "com.juanse108.uniconnet",
		path: "oauth-callback",
	})
}

export function useGoogleAuth() {
	const container = DIContainer.getInstance()
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const resolveSessionFromUrl = useCallback(async (url: string) => {
		try {
			const useCase = container.getResolveSessionFromOAuthUrl()
			await useCase.execute(url)
			setLoading(false)
		} catch (e: any) {
			setError(`Error: ${e.message}`)
			setLoading(false)
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

			const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl)

			if (result.type === "success" && result.url) {
				await resolveSessionFromUrl(result.url)
			} else {
				setLoading(false)
			}
		} catch (e: any) {
			setError(`Error: ${e.message}`)
			setLoading(false)
		}
	}, [container, resolveSessionFromUrl])

	return { loading, error, signInWithGoogle }
}