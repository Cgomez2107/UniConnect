/**
 * Camel Case to Snake Case Mapper
 * Pure function for recursive transformation of object keys
 */
function toSnakeCase(str) {
    return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}
/**
 * Recursively convert object keys from camelCase to snake_case
 * Handles nested objects, arrays, and primitives
 */
export function camelToSnake(obj) {
    if (obj === null || obj === undefined) {
        return obj;
    }
    if (Array.isArray(obj)) {
        return obj.map((item) => camelToSnake(item));
    }
    if (typeof obj !== "object" || obj instanceof Date) {
        return obj;
    }
    const transformed = {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const snakeKey = toSnakeCase(key);
            const value = obj[key];
            if (value !== null && typeof value === "object" && !(value instanceof Date)) {
                if (Array.isArray(value)) {
                    transformed[snakeKey] = value.map((item) => typeof item === "object" && item !== null && !(item instanceof Date)
                        ? camelToSnake(item)
                        : item);
                }
                else {
                    transformed[snakeKey] = camelToSnake(value);
                }
            }
            else {
                // Convert Date objects to ISO string for API
                if (value instanceof Date) {
                    transformed[snakeKey] = value.toISOString();
                }
                else {
                    transformed[snakeKey] = value;
                }
            }
        }
    }
    return transformed;
}
/**
 * Batch convert multiple objects
 */
export function camelToSnakeArray(arr) {
    return arr.map((item) => camelToSnake(item));
}
//# sourceMappingURL=camelToSnake.js.map