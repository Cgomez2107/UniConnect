export function requireEnv(source, name) {
    const value = source[name]?.trim();
    if (!value) {
        throw new Error(`${name} is required`);
    }
    return value;
}
//# sourceMappingURL=requiredEnv.js.map