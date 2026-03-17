import { supabase } from "@/lib/supabase";

const API_BASE_URL =
    process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api/v1";

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
    const {
        data: { session },
    } = await supabase.auth.getSession();

    const headers = new Headers(options.headers);
    headers.set("Content-Type", "application/json");
    headers.set("bypass-tunnel-reminder", "true");

    if (session?.access_token) {
        headers.set("Authorization", `Bearer ${session.access_token}`);
    }

    const method = (options.method ?? "GET").toUpperCase();
    const isPayloadMethod = method !== "GET" && method !== "HEAD";

    const fetchOptions: RequestInit = {
        ...options,
        method,
        headers,
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
        const message =
            (typeof parsed?.error === "string" ? parsed.error : null) ??
            (typeof parsed?.details === "string" ? parsed.details : null) ??
            `Error ${response.status} al conectar con el servidor.`;
        throw new Error(message);
    }

    if (result !== null && typeof result === "object" && "data" in result) {
        return (result as { data: T }).data;
    }

    return result as T;
}