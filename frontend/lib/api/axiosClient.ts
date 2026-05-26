import axios from "axios"
import type { AxiosError, InternalAxiosRequestConfig } from "axios"

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL

const client = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    "bypass-tunnel-reminder": "true",
    "ngrok-skip-browser-warning": "true",
  },
})

client.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      const req = error.request as XMLHttpRequest | undefined
      const cookieHeader = (error.config as InternalAxiosRequestConfig | undefined)?.headers?.Cookie

      const hasCookie = Boolean(cookieHeader) || Boolean(
        typeof navigator !== "undefined" && document?.cookie
      )

      const body = error.response.data as Record<string, unknown> | string | undefined
      const message =
        (typeof body === "object" && body !== null
          ? (body as Record<string, unknown>).error ?? (body as Record<string, unknown>).message
          : body) ?? ""
      const messageStr = typeof message === "string" ? message : ""

      const isExpired =
        /expir|venci|invalid.*token|token.*invalid/i.test(messageStr)
      const isMissingCookie =
        !hasCookie || /no.auth|unauthorized|missing.*credential/i.test(messageStr)

      console.groupCollapsed(
        "%c[Axios 401]",
        "color: #ef4444; font-weight: bold",
        error.config?.url,
      )
      if (isMissingCookie) {
        console.warn("Cookie no enviada — el backend no pudo autenticar la solicitud")
        console.info("withCredentials:", true)
        console.info("Cookies del documento:", document?.cookie || "(ninguna)")
      } else if (isExpired) {
        console.warn("Token/cookie expirada — el backend rechazó la sesión")
        console.info("Respuesta del servidor:", messageStr)
      } else {
        console.warn("401 sin clasificación")
        console.info("Respuesta:", messageStr)
      }
      console.info("URL:", `${error.config?.baseURL ?? ""}${error.config?.url ?? ""}`)
      console.info("Status:", error.response.status)
      if (req?.getAllResponseHeaders) {
        console.info("Response Headers:", req.getAllResponseHeaders())
      }
      console.groupEnd()
    }
    return Promise.reject(error)
  },
)

export default client
