type CamelCase<S extends string> = S extends `${infer T}_${infer U}`
  ? `${T}${Capitalize<CamelCase<U>>}`
  : S;

type SnakeCase<S extends string> = S extends `${infer T}${infer U}`
  ? T extends Lowercase<T>
    ? `${T}${SnakeCase<U>}`
    : `_${Lowercase<T>}${SnakeCase<U>}`
  : S;

export function snakeToCamel<T extends Record<string, unknown>>(
  obj: T,
): { [K in keyof T as CamelCase<string & K>]: T[K] } {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
    result[camelKey] = value;
  }
  return result as { [K in keyof T as CamelCase<string & K>]: T[K] };
}

export function camelToSnake<T extends Record<string, unknown>>(
  obj: T,
): { [K in keyof T as SnakeCase<string & K>]: T[K] } {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
    result[snakeKey] = value;
  }
  return result as { [K in keyof T as SnakeCase<string & K>]: T[K] };
}
