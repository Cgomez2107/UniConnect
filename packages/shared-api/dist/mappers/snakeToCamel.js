/**
 * Snake Case to Camel Case Mapper
 * Pure function for recursive transformation of object keys
 */
function toCamelCase(str) {
    return str.replace(/_([a-z])/g, (_, char) => char.toUpperCase());
}
function isCamelCaseKey(key) {
    return !key.includes("_");
}
/**
 * Recursively convert object keys from snake_case to camelCase
 * Handles nested objects, arrays, and primitives
 */
export function snakeToCamel(obj) {
    if (obj === null || obj === undefined) {
        return obj;
    }
    if (Array.isArray(obj)) {
        return obj.map((item) => snakeToCamel(item));
    }
    if (typeof obj !== "object" || obj instanceof Date) {
        return obj;
    }
    const transformed = {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const camelKey = toCamelCase(key);
            const value = obj[key];
            if (value !== null && typeof value === "object" && !(value instanceof Date)) {
                if (Array.isArray(value)) {
                    transformed[camelKey] = value.map((item) => typeof item === "object" && item !== null && !(item instanceof Date)
                        ? snakeToCamel(item)
                        : item);
                }
                else {
                    transformed[camelKey] = snakeToCamel(value);
                }
            }
            else {
                transformed[camelKey] = value;
            }
        }
    }
    return transformed;
}
/**
 * Batch convert multiple objects
 */
export function snakeToCamelArray(arr) {
    return arr.map((item) => snakeToCamel(item));
}
//# sourceMappingURL=snakeToCamel.js.map