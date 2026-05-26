export interface EnvVarSpec {
    key: string;
    label: string;
    required: boolean;
    type: "string" | "url";
    forbidProductionUrlInDev?: boolean;
}
export interface ValidationEntry {
    var: string;
    reason: string;
}
export interface EnvValidationResult {
    valid: boolean;
    missing: string[];
    invalid: ValidationEntry[];
}
export declare const WEB_ENV_VARS: EnvVarSpec[];
export declare const BACKEND_ENV_VARS: EnvVarSpec[];
export declare function validateWebEnv(env: Record<string, string | undefined>, options?: {
    isDev?: boolean;
}): EnvValidationResult;
export declare function validateBackendEnv(env: Record<string, string | undefined>, options?: {
    isDev?: boolean;
    supabaseOptional?: boolean;
}): EnvValidationResult;
export declare function formatValidationErrors(result: EnvValidationResult): string;
//# sourceMappingURL=envValidator.d.ts.map