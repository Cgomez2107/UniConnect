import { supabase } from "@/lib/supabase";
import { parseGroupError } from "./groupErrorInterceptor";
import { showToastBridge } from "./toastBridge";
import { useSpamStore } from "@/store/useSpamStore";
import { useNotificationStore } from "@/store/useNotificationStore";

const API_BASE_URL =
    process.env.EXPO_PUBLIC_API_BASE_URL ||
    process.env.VITE_API_URL;

const TOKEN_CACHE_TTL_MS = 10_000;
let cachedAccessToken: string | null = null;
let cachedAccessTokenAt = 0;
let inflightTokenPromise: Promise<string | null> | null = null;
let manualToken: string | null = null;

/**
 * Permite establecer un token de forma manual (ej: desde el microservicio de auth).
 * Si se establece, fetchApi priorizará este token sobre el de Supabase.
 */
export function setManualToken(token: string | null) {
    manualToken = token;
    cachedAccessToken = token;
    cachedAccessTokenAt = token ? Date.now() : 0;
}

async function getAccessTokenFast(): Promise<string | null> {
    if (manualToken) return manualToken;

    const now = Date.now();
    if (cachedAccessToken && now - cachedAccessTokenAt < TOKEN_CACHE_TTL_MS) {
        return cachedAccessToken;
    }

    if (!inflightTokenPromise) {
        inflightTokenPromise = supabase.auth
            .getSession()
            .then(({ data: { session } }) => {
                cachedAccessToken = session?.access_token ?? null;
                cachedAccessTokenAt = Date.now();
                return cachedAccessToken;
            })
            .catch(() => {
                cachedAccessToken = null;
                cachedAccessTokenAt = Date.now();
                return null;
            })
            .finally(() => {
                inflightTokenPromise = null;
            });
    }

    return inflightTokenPromise;
}

/**
 * Realiza una petición HTTP autenticada al API Gateway.
 *
 * El token JWT se obtiene de la sesión activa de Supabase y se adjunta
 * en el header `Authorization`. El gateway lo valida y, si es correcto,
 * inyecta el `x-user-id` antes de reenviar la solicitud al microservicio.
 *
 * Las peticiones GET y HEAD no pueden incluir cuerpo según HTTP/1.1 y HTTP/2.
 * El cliente elimina el campo `body` en esos métodos antes del dispatch para
 * evitar errores 502 por rechazo en el gateway o en el servicio downstream.
 *
 * Los errores HTTP se convierten en excepciones con el mensaje del campo
 * `error` de la respuesta JSON, manteniendo consistencia con el manejo
 * de errores de los use cases.
 */
export async function fetchApi<T>(
    endpoint: string,
    options: RequestInit = {},
): Promise<T> {
    const accessToken = await getAccessTokenFast();

    const headers = new Headers(options.headers);
    headers.set("Content-Type", "application/json");
    headers.set("bypass-tunnel-reminder", "true");
    headers.set("ngrok-skip-browser-warning", "true");

    if (accessToken) {
        headers.set("Authorization", `Bearer ${accessToken}`);
    }

    const method = (options.method ?? "GET").toUpperCase();
    const isPayloadMethod = method !== "GET" && method !== "HEAD";

    const fetchOptions: RequestInit = {
        ...options,
        method,
        headers,
        credentials: "omit",
        body: isPayloadMethod ? options.body : undefined,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, fetchOptions);

    let result: unknown = null;
    const text = await response.text();
    if (text) {
        try {
            result = JSON.parse(text);
        } catch {
            result = text;
        }
    }

    if (!response.ok) {
        const parsed = result as Record<string, unknown> | null;
        const rawMessage =
            (typeof parsed?.error === "string" ? parsed.error : null) ??
            (typeof parsed?.details === "string" ? parsed.details : null) ??
            `Error ${response.status} al conectar con el servidor.`;

        const status = response.status;
        if ([400, 403, 409, 422, 429].includes(status)) {
            const friendly = parseGroupError(parsed || rawMessage);
            const rawErrorStr = JSON.stringify(parsed || "");
            const errorCode = typeof parsed?.errorCode === "string" ? parsed.errorCode : null;
            const hasMo003 = errorCode === "SPAM_DETECTED" || errorCode === "ESCALATED_TO_ADMIN" || rawErrorStr.includes("MO_003") || rawErrorStr.includes("MO_004") || status === 429;
            if (hasMo003) {
                const remainingMs = typeof parsed?.remainingMs === "number"
                    ? parsed.remainingMs
                    : (5 * 60 * 1000);
                const code = errorCode === "ESCALATED_TO_ADMIN" ? "MO_004" : rawErrorStr.includes("MO_004") ? "MO_004" : "MO_003";
                useSpamStore.getState().setBlocked(remainingMs, code);

                // Add notification for spam block
                try {
                    const blockTitle = code === "MO_004"
                        ? "Caso escalado a revisión humana"
                        : "Chat suspendido temporalmente";
                    const blockMessage = code === "MO_004"
                        ? "Has acumulado múltiples infracciones. Tu caso fue escalado a revisión humana."
                        : "Has sido bloqueado por comportamiento de spam.";
                    useNotificationStore.getState().pushNotification({
                        id: `spam-block-${Date.now()}`,
                        type: "system",
                        title: blockTitle,
                        body: blockMessage,
                        payload: {
                            errorCode: code,
                            showWhyButton: true,
                        },
                        priority: "urgente",
                    });
                } catch (e) {
                    console.warn("[API] No se pudo mostrar notificación de bloqueo:", e);
                }
            }
            const isModerationError =
                errorCode === "MESSAGE_TOO_LONG" || errorCode === "BANNED_CONTENT" ||
                errorCode === "SPAM_DETECTED" || errorCode === "ESCALATED_TO_ADMIN" ||
                rawErrorStr.includes("MO_001") ||
                rawErrorStr.includes("MO_002") ||
                rawErrorStr.includes("MO_003") ||
                rawErrorStr.includes("MO_004");
            if (!isModerationError) {
                showToastBridge(friendly, "error");
            }
            const errObj = new Error(friendly);
            (errObj as any).code = parsed?.code || parsed?.error || null;
            throw errObj;
        }

        const rawErrObj = new Error(rawMessage);
        (rawErrObj as any).code = parsed?.code || parsed?.error || null;
        throw rawErrObj;
    }

    if (result !== null && typeof result === "object" && "data" in result) {
        return (result as { data: T }).data;
    }

    return result as T;
}

/**
 * Like fetchApi but returns the full response envelope (including meta) instead of unwrapping data.
 */
export async function fetchApiEnvelope<T = any>(
    path: string,
    init?: RequestInit,
): Promise<{ data: T; meta?: any }> {
    const API_URL =
        process.env.EXPO_PUBLIC_API_BASE_URL ||
        process.env.VITE_API_URL ||
        "http://localhost:3000/api/v1";

    const token = await getAccessTokenFast();

    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...((init?.headers as Record<string, string>) ?? {}),
    };

    try {
        const url = `${API_URL}${path}`;
        const response = await fetch(url, { ...init, headers });

        const text = await response.text();
        let parsed: any = null;
        if (text) {
            try { parsed = JSON.parse(text); } catch { parsed = text; }
        }

        if (!response.ok) {
            const errMsg =
                parsed?.error ||
                parsed?.message ||
                parsed?.details ||
                `HTTP ${response.status}`;
            const err = new Error(errMsg);
            (err as any).status = response.status;
            (err as any).data = parsed;
            throw err;
        }

        return parsed ?? { data: null };
    } catch (err: any) {
        if (err.status) throw err;
        throw new Error(err.message || "Network error");
    }
}