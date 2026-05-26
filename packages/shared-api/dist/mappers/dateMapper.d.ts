/**
 * Date Mapper
 * Converts between ISO strings (backend) and Date objects (domain)
 */
/**
 * Convert ISO string to Date object
 */
export declare function parseDate(value: string | null | undefined): Date | null;
/**
 * Convert Date object to ISO string
 */
export declare function formatDate(value: Date | null | undefined): string | null;
/**
 * Recursively convert date string fields to Date objects
 */
export declare function parseStringDatesToObjects<T = any>(obj: any): T;
/**
 * Recursively convert Date objects to ISO strings
 */
export declare function formatDateObjectsToStrings<T = any>(obj: any): T;
//# sourceMappingURL=dateMapper.d.ts.map