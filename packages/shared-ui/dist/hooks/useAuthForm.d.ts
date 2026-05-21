/**
 * useAuthForm - Headless Hook
 *
 * Validación y manejo de estado de formulario de autenticación (login/signup)
 * SIN renderizar UI - solo lógica compartida entre Web y Mobile
 * Expone: valores, errores, handlers, métodos de validación
 */
export interface AuthFormState {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
}
export interface AuthFormErrors {
    email?: string;
    password?: string;
    firstName?: string;
    lastName?: string;
    form?: string;
}
export interface AuthFormHook {
    values: AuthFormState;
    errors: AuthFormErrors;
    isLoading: boolean;
    isValid: boolean;
    handleEmailChange: (email: string) => void;
    handlePasswordChange: (password: string) => void;
    handleFirstNameChange: (firstName: string) => void;
    handleLastNameChange: (lastName: string) => void;
    setError: (field: keyof AuthFormErrors, message: string) => void;
    clearError: (field: keyof AuthFormErrors) => void;
    clearAllErrors: () => void;
    reset: () => void;
    setIsLoading: (loading: boolean) => void;
    validate: (mode: "login" | "signup") => boolean;
    validateField: (field: keyof AuthFormState, value: string, mode: "login" | "signup") => string | undefined;
}
/**
 * useAuthForm Hook
 * Manejo de validación compartida para login y signup
 */
export declare function useAuthForm(initialValues?: Partial<AuthFormState>): AuthFormHook;
//# sourceMappingURL=useAuthForm.d.ts.map