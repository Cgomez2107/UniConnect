type CamelCase<S extends string> = S extends `${infer T}_${infer U}` ? `${T}${Capitalize<CamelCase<U>>}` : S;
type SnakeCase<S extends string> = S extends `${infer T}${infer U}` ? T extends Lowercase<T> ? `${T}${SnakeCase<U>}` : `_${Lowercase<T>}${SnakeCase<U>}` : S;
export declare function snakeToCamel<T extends Record<string, unknown>>(obj: T): {
    [K in keyof T as CamelCase<string & K>]: T[K];
};
export declare function camelToSnake<T extends Record<string, unknown>>(obj: T): {
    [K in keyof T as SnakeCase<string & K>]: T[K];
};
export {};
//# sourceMappingURL=mappers.d.ts.map