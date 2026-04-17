/**
 * lib/services/index.ts
 * 
 * Central export point for all service layers
 */

// Domain layer (business logic)
export * from "./domain"

// Infrastructure layer (data access)
export * from "./infrastructure"

// Application layer (DTOs)
export * from "./application"

// Dependency Injection
export { DIContainer } from "./di"
