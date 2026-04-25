import { DIContainer } from "@/lib/services/di/container"
import { useCallback, useState } from "react"
import { usePlatformAuth } from "@/hooks/application/usePlatformAuth"

const ALLOWED_DOMAIN = "ucaldas.edu.co"

export function useGoogleAuth() {
	const container = DIContainer.getInstance()
	const { getOAuthRedirectUrl, startOAuthSignIn } = usePlatformAuth()
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
			const result = await startOAuthSignIn(authUrl, redirectUrl)

			if (result.type === "callback") {
				await resolveSessionFromUrl(result.url)
				return
			}

			setLoading(false)
		} catch (e: any) {
			setError(`Error: ${e.message}`)
			setLoading(false)
		}
	}, [container, getOAuthRedirectUrl, resolveSessionFromUrl, startOAuthSignIn])

	return { loading, error, signInWithGoogle }
}