/**
 * Date Mapper
 * Converts between ISO strings (backend) and Date objects (domain)
 */

/**
 * Known date field patterns
 */
const DATE_FIELD_PATTERNS = [
  /At$/i, // createdAt, updatedAt, deletedAt, etc.
  /Date$/i, // eventDate, birthDate, etc.
  /_at$/i, // created_at, updated_at, etc.
  /_date$/i, // event_date, birth_date, etc.
];

/**
 * Check if a field name likely contains a date
 */
function isDateField(fieldName: string): boolean {
  return DATE_FIELD_PATTERNS.some((pattern) => pattern.test(fieldName));
}

/**
 * Convert ISO string to Date object
 */
export function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  try {
    return new Date(value);
  } catch {
    return null;
  }
}

/**
 * Convert Date object to ISO string
 */
export function formatDate(value: Date | null | undefined): string | null {
  if (!value) return null;
  if (!(value instanceof Date)) return null;
  return value.toISOString();
}

/**
 * Recursively convert date string fields to Date objects
 */
export function parseStringDatesToObjects<T = any>(obj: any): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => parseStringDatesToObjects(item)) as T;
  }

  if (obj instanceof Date) {
    return obj as T;
  }

  if (typeof obj !== "object") {
    return obj as T;
  }

  const result: Record<string, any> = {};

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];

      if (isDateField(key) && typeof value === "string") {
        result[key] = parseDate(value);
      } else if (Array.isArray(value)) {
        result[key] = value.map((item) =>
          typeof item === "object" && item !== null
            ? parseStringDatesToObjects(item)
            : item
        );
      } else if (typeof value === "object" && value !== null && !(value instanceof Date)) {
        result[key] = parseStringDatesToObjects(value);
      } else {
        result[key] = value;
      }
    }
  }

  return result as T;
}

/**
 * Recursively convert Date objects to ISO strings
 */
export function formatDateObjectsToStrings<T = any>(obj: any): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => formatDateObjectsToStrings(item)) as T;
  }

  if (obj instanceof Date) {
    return formatDate(obj) as any;
  }

  if (typeof obj !== "object") {
    return obj as T;
  }

  const result: Record<string, any> = {};

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];

      if (value instanceof Date) {
        result[key] = formatDate(value);
      } else if (Array.isArray(value)) {
        result[key] = value.map((item) =>
          item instanceof Date
            ? formatDate(item)
            : typeof item === "object" && item !== null
              ? formatDateObjectsToStrings(item)
              : item
        );
      } else if (typeof value === "object" && value !== null && !(value instanceof Date)) {
        result[key] = formatDateObjectsToStrings(value);
      } else {
        result[key] = value;
      }
    }
  }

  return result as T;
}
