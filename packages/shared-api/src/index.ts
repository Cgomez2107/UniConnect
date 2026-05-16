/**
 * @uniconnect/shared-api
 * Main API client layer with mappers and transport abstractions
 */

export * from "./transport/index.js";
export * from "./mappers/index.js";
export * from "./clients/index.js";
export * from "./services/index.js";
export * from "./errors/index.js";
export * from "./types/index.js";

// Version info
export const SHARED_API_VERSION = "0.1.0";
