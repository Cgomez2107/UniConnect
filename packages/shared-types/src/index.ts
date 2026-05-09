/**
 * @uniconnect/shared-types
 * Canonical type definitions for UniConnect
 *
 * Exports domain types (camelCase UI layer), API DTOs (snake_case backend),
 * and error types used across all packages.
 */

// ============================================================================
// Domain Types (UI Layer - camelCase)
// ============================================================================
export * from "./domain";

// ============================================================================
// API DTOs (Backend Layer - snake_case)
// ============================================================================
export * from "./dto";

// ============================================================================
// Error Types
// ============================================================================
export * from "./errors";

// ============================================================================
// Version Info (for debugging)
// ============================================================================
export const SHARED_TYPES_VERSION = "0.1.0";
