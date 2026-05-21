export function zodErrorToApiError(error) {
    const flattened = error.flatten();
    return {
        error: "VALIDATION_ERROR",
        message: "El cuerpo de la solicitud no cumple el contrato",
        details: {
            fieldErrors: flattened.fieldErrors,
            formErrors: flattened.formErrors,
        },
    };
}
//# sourceMappingURL=errors.js.map