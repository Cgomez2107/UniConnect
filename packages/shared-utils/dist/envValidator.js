export const WEB_ENV_VARS = [
    {
        key: "VITE_SUPABASE_URL",
        label: "Supabase URL",
        required: true,
        type: "url",
    },
    {
        key: "VITE_SUPABASE_ANON_KEY",
        label: "Supabase Anon Key",
        required: true,
        type: "string",
    },
    {
        key: "VITE_API_URL",
        label: "API Gateway URL",
        required: true,
        type: "url",
        forbidProductionUrlInDev: true,
    },
];
export const BACKEND_ENV_VARS = [
    {
        key: "SUPABASE_URL",
        label: "Supabase URL",
        required: false,
        type: "url",
    },
    {
        key: "SUPABASE_SERVICE_ROLE_KEY",
        label: "Supabase Service Role Key",
        required: false,
        type: "string",
    },
    {
        key: "JWT_ACCESS_SECRET",
        label: "JWT Access Secret",
        required: true,
        type: "string",
    },
    {
        key: "DB_HOST",
        label: "Database Host",
        required: true,
        type: "string",
    },
    {
        key: "DB_NAME",
        label: "Database Name",
        required: true,
        type: "string",
    },
    {
        key: "DB_USER",
        label: "Database User",
        required: true,
        type: "string",
    },
    {
        key: "DB_PASSWORD",
        label: "Database Password",
        required: true,
        type: "string",
    },
];
const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "[::1]", "0.0.0.0"]);
function isLocalhostUrl(url) {
    try {
        const parsed = new URL(url);
        return LOCAL_HOSTNAMES.has(parsed.hostname);
    }
    catch {
        return false;
    }
}
function isValidUrl(url) {
    try {
        const parsed = new URL(url);
        return parsed.protocol === "http:" || parsed.protocol === "https:";
    }
    catch {
        return false;
    }
}
function looksLikeProductionUrl(url) {
    try {
        const parsed = new URL(url);
        return !LOCAL_HOSTNAMES.has(parsed.hostname) && parsed.hostname.includes(".");
    }
    catch {
        return false;
    }
}
function validateVar(env, spec, isDev) {
    const value = env[spec.key];
    if (value === undefined || value === null || value.trim() === "") {
        if (spec.required) {
            return { var: spec.key, reason: `Falta la variable requerida "${spec.label}" (${spec.key})` };
        }
        return null;
    }
    const trimmed = value.trim();
    if (spec.type === "url") {
        if (!isValidUrl(trimmed)) {
            return {
                var: spec.key,
                reason: `"${spec.label}" no es una URL válida: "${trimmed}". Debe ser http:// o https://`,
            };
        }
        if (spec.forbidProductionUrlInDev && isDev && looksLikeProductionUrl(trimmed)) {
            return {
                var: spec.key,
                reason: `"${spec.label}" apunta a un entorno de producción (${trimmed}) en modo desarrollo. ` +
                    `Usa http://localhost:... para desarrollo. ` +
                    (looksLikeProductionUrl(trimmed)
                        ? `Si necesitas una URL externa, verifica tu configuración en .env.local`
                        : ""),
            };
        }
    }
    return null;
}
export function validateWebEnv(env, options) {
    const isDev = options?.isDev ?? true;
    const missing = [];
    const invalid = [];
    for (const spec of WEB_ENV_VARS) {
        const entry = validateVar(env, spec, isDev);
        if (entry) {
            if (entry.reason.startsWith("Falta la variable")) {
                missing.push(spec.key);
            }
            invalid.push(entry);
        }
    }
    return {
        valid: missing.length === 0 && invalid.length === 0,
        missing,
        invalid,
    };
}
export function validateBackendEnv(env, options) {
    const isDev = options?.isDev ?? env.NODE_ENV !== "production";
    const supabaseOptional = options?.supabaseOptional ?? true;
    const missing = [];
    const invalid = [];
    for (const spec of BACKEND_ENV_VARS) {
        if (!spec.required && supabaseOptional && (spec.key === "SUPABASE_URL" || spec.key === "SUPABASE_SERVICE_ROLE_KEY")) {
            continue;
        }
        const entry = validateVar(env, spec, isDev);
        if (entry) {
            if (entry.reason.startsWith("Falta la variable")) {
                missing.push(spec.key);
            }
            invalid.push(entry);
        }
    }
    return {
        valid: missing.length === 0 && invalid.length === 0,
        missing,
        invalid,
    };
}
export function formatValidationErrors(result) {
    const lines = [];
    if (result.missing.length > 0) {
        lines.push("Variables de entorno faltantes:");
        for (const key of result.missing) {
            lines.push(`  - ${key}`);
        }
        lines.push("");
    }
    if (result.invalid.length > 0) {
        lines.push("Errores de validación:");
        for (const entry of result.invalid) {
            lines.push(`  - ${entry.var}: ${entry.reason}`);
        }
        lines.push("");
    }
    lines.push("Revisa tu archivo .env.local (.env para backend) o .env.example para referencia.");
    return lines.join("\n");
}
//# sourceMappingURL=envValidator.js.map