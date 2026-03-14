import { DIContainer } from "@/lib/services/di/container"

export async function signIn(input: { email: string; password: string }) {
	const container = DIContainer.getInstance()
	const useCase = container.getSignInWithPassword()
	return useCase.execute(input)
}

export async function signUp(input: { email: string; password: string; fullName: string }) {
	const container = DIContainer.getInstance()
	const useCase = container.getSignUpWithPassword()
	return useCase.execute(input)
}
