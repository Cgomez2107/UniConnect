/**
 * Snake Case to Camel Case Mapper
 * Pure function for recursive transformation of object keys
 */

function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, char) => char.toUpperCase());
}

function isCamelCaseKey(key: string): boolean {
  return !key.includes("_");
}

/**
 * Recursively convert object keys from snake_case to camelCase
 * Handles nested objects, arrays, and primitives
 */
export function snakeToCamel<T = any>(obj: any): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => snakeToCamel(item)) as T;
  }

  if (typeof obj !== "object" || obj instanceof Date) {
    return obj as T;
  }

  const transformed: Record<string, any> = {};

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const camelKey = toCamelCase(key);
      const value = obj[key];

      if (value !== null && typeof value === "object" && !(value instanceof Date)) {
        if (Array.isArray(value)) {
          transformed[camelKey] = value.map((item: any) =>
            typeof item === "object" && item !== null && !(item instanceof Date)
              ? snakeToCamel(item)
              : item
          );
        } else {
          transformed[camelKey] = snakeToCamel(value);
        }
      } else {
        transformed[camelKey] = value;
      }
    }
  }

  return transformed as T;
}

/**
 * Batch convert multiple objects
 */
export function snakeToCamelArray<T = any>(arr: any[]): T[] {
  return arr.map((item) => snakeToCamel<T>(item));
}
