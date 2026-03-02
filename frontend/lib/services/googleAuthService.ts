/**
 * lib/services/googleAuthService.ts
 * Autenticación con Google — integrado con Supabase
 * Restringe el acceso exclusivamente a cuentas @ucaldas.edu.co
 */

import { supabase } from "@/lib/supabase"
import * as AuthSession from "expo-auth-session"
import * as Google from "expo-auth-session/providers/google"
import { router } from "expo-router"
import * as WebBrowser from "expo-web-browser"
import { useEffect, useState } from "react"

WebBrowser.maybeCompleteAuthSession()

const ALLOWED_DOMAIN = "ucaldas.edu.co"

// Al no pasarle configuración, Expo genera la URI automáticamente 
// basada en el entorno (Web, Expo Go o Nativo).
const REDIRECT_URI = AuthSession.makeRedirectUri();

export function useGoogleAuth() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS
  const androidClientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: webClientId,
    webClientId,
    androidClientId,
    iosClientId,
    redirectUri: REDIRECT_URI,
    extraParams: {
      hd: ALLOWED_DOMAIN,
    },
  })

  useEffect(() => {
    if (response?.type === "success") {
      const token = response.params?.id_token || response.authentication?.idToken
      handleGoogleSuccess(token)
    } else if (response?.type === "error") {
      setLoading(false)
      setError("Error en la autenticación con Google")
    } else if (response?.type === "cancel" || response?.type === "dismiss") {
      setLoading(false)
      setError("Inicio de sesión cancelado")
    }
  }, [response])

  const handleGoogleSuccess = async (idToken?: string) => {
    if (!idToken) {
      setError("No se recibió el token de Google")
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      // 1. Crear sesión en Supabase con el idToken de Google
      const { data, error: supabaseError } = await supabase.auth.signInWithIdToken({
        provider: "google",
        token: idToken,
      })

      if (supabaseError) throw supabaseError

      // 2. Validar dominio institucional (segunda capa de seguridad)
      if (data.user && !data.user.email?.endsWith(`@${ALLOWED_DOMAIN}`)) {
        await supabase.auth.signOut()
        setError("Solo se permiten cuentas @ucaldas.edu.co")
        return
      }

      // 3. Redirección exitosa al Feed/Tabs
      setTimeout(() => {
        router.replace("/(tabs)" as any)
      }, 500)

    } catch (e: any) {
      setError(`Error: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  const signInWithGoogle = () => {
    if (!webClientId) {
      setError("Falta Client ID en .env")
      return
    }
    setError(null)
    setLoading(true)
    promptAsync({ showInRecents: true })
  }

  return { request, loading, error, signInWithGoogle }
}