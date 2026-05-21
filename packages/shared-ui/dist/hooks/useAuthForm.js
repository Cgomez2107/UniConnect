/**
 * useAuthForm - Headless Hook
 *
 * Validación y manejo de estado de formulario de autenticación (login/signup)
 * SIN renderizar UI - solo lógica compartida entre Web y Mobile
 * Expone: valores, errores, handlers, métodos de validación
 */
import { useState, useCallback } from "react";
/**
 * Email validation regex
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/**
 * useAuthForm Hook
 * Manejo de validación compartida para login y signup
 */
export function useAuthForm(initialValues) {
    const [values, setValues] = useState({
        email: initialValues?.email ?? "",
        password: initialValues?.password ?? "",
        firstName: initialValues?.firstName ?? "",
        lastName: initialValues?.lastName ?? "",
    });
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    // Validators
    const validateEmail = useCallback((email) => {
        if (!email.trim()) {
            return "Email is required";
        }
        if (!EMAIL_REGEX.test(email)) {
            return "Email format is invalid";
        }
        return undefined;
    }, []);
    const validatePassword = useCallback((password) => {
        if (!password) {
            return "Password is required";
        }
        if (password.length < 8) {
            return "Password must be at least 8 characters";
        }
        if (!/[A-Z]/.test(password)) {
            return "Password must contain at least one uppercase letter";
        }
        if (!/[0-9]/.test(password)) {
            return "Password must contain at least one number";
        }
        return undefined;
    }, []);
    const validateFirstName = useCallback((firstName) => {
        if (!firstName.trim()) {
            return "First name is required";
        }
        if (firstName.trim().length < 2) {
            return "First name must be at least 2 characters";
        }
        return undefined;
    }, []);
    const validateLastName = useCallback((lastName) => {
        if (!lastName.trim()) {
            return "Last name is required";
        }
        if (lastName.trim().length < 2) {
            return "Last name must be at least 2 characters";
        }
        return undefined;
    }, []);
    // Field change handlers
    const handleEmailChange = useCallback((email) => {
        setValues((prev) => ({ ...prev, email }));
        // Clear error on change
        setErrors((prev) => ({ ...prev, email: undefined }));
    }, []);
    const handlePasswordChange = useCallback((password) => {
        setValues((prev) => ({ ...prev, password }));
        setErrors((prev) => ({ ...prev, password: undefined }));
    }, []);
    const handleFirstNameChange = useCallback((firstName) => {
        setValues((prev) => ({ ...prev, firstName }));
        setErrors((prev) => ({ ...prev, firstName: undefined }));
    }, []);
    const handleLastNameChange = useCallback((lastName) => {
        setValues((prev) => ({ ...prev, lastName }));
        setErrors((prev) => ({ ...prev, lastName: undefined }));
    }, []);
    // Error management
    const setError = useCallback((field, message) => {
        setErrors((prev) => ({ ...prev, [field]: message }));
    }, []);
    const clearError = useCallback((field) => {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
    }, []);
    const clearAllErrors = useCallback(() => {
        setErrors({});
    }, []);
    // Reset form
    const reset = useCallback(() => {
        setValues({
            email: "",
            password: "",
            firstName: "",
            lastName: "",
        });
        clearAllErrors();
    }, [clearAllErrors]);
    // Validate single field
    const validateField = useCallback((field, value, mode) => {
        switch (field) {
            case "email":
                return validateEmail(value);
            case "password":
                return validatePassword(value);
            case "firstName":
                return mode === "signup" ? validateFirstName(value) : undefined;
            case "lastName":
                return mode === "signup" ? validateLastName(value) : undefined;
            default:
                return undefined;
        }
    }, [validateEmail, validatePassword, validateFirstName, validateLastName]);
    // Validate entire form
    const validate = useCallback((mode) => {
        const newErrors = {};
        // Email
        const emailError = validateEmail(values.email);
        if (emailError)
            newErrors.email = emailError;
        // Password
        const passwordError = validatePassword(values.password);
        if (passwordError)
            newErrors.password = passwordError;
        // First name (signup only)
        if (mode === "signup") {
            const firstNameError = validateFirstName(values.firstName ?? "");
            if (firstNameError)
                newErrors.firstName = firstNameError;
            const lastNameError = validateLastName(values.lastName ?? "");
            if (lastNameError)
                newErrors.lastName = lastNameError;
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [validateEmail, validatePassword, validateFirstName, validateLastName, values]);
    const isValid = Object.keys(errors).length === 0 && !!values.email && !!values.password;
    return {
        values,
        errors,
        isLoading,
        isValid,
        handleEmailChange,
        handlePasswordChange,
        handleFirstNameChange,
        handleLastNameChange,
        setError,
        clearError,
        clearAllErrors,
        reset,
        setIsLoading,
        validate,
        validateField,
    };
}
//# sourceMappingURL=useAuthForm.js.map