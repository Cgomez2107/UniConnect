# @uniconnect/shared-types

TypeScript type definitions and domain interfaces for the UniConnect monorepo.

## Overview

This package contains:

- **Domain Types** (`camelCase`): Canonical types used throughout the application (UI layer)
- **API DTOs** (`snake_case`): Raw data structures from the backend API that are transformed by the Mapper in `shared-api`
- **Error Types**: Standardized error structures for error handling

## Structure

```
src/
├── domain.ts      # Domain interfaces (UI layer, camelCase)
├── dto.ts         # API DTOs (Backend layer, snake_case)
├── errors.ts      # Error types and utilities
└── index.ts       # Main exports
```

## Installation

```bash
# Within the monorepo, this is managed via pnpm workspaces
pnpm install
```

## Usage

### Import Domain Types

```typescript
import type {
  User,
  AuthProfile,
  Message,
  Conversation,
  StudyGroup,
  Notification,
} from "@uniconnect/shared-types";

// Use in your code
const user: User = {
  id: "123",
  email: "user@example.com",
  firstName: "John",
  lastName: "Doe",
  role: "estudiante",
  isVerified: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};
```

### Import API DTOs

```typescript
import type { UserDTO, MessageDTO } from "@uniconnect/shared-types";

// These represent raw API responses before Mapper transformation
const userDTO: UserDTO = {
  id: "123",
  email: "user@example.com",
  first_name: "John",
  last_name: "Doe",
  role: "estudiante",
  is_verified: true,
  created_at: "2026-05-09T10:00:00Z",
  updated_at: "2026-05-09T10:00:00Z",
};
```

### Import Error Types

```typescript
import type { DomainError, ErrorCode } from "@uniconnect/shared-types";
import { ERROR_MESSAGES, ERROR_CODE_TO_HTTP_STATUS } from "@uniconnect/shared-types";

// Use for error handling
const error: DomainError = {
  code: "UNAUTHORIZED",
  message: ERROR_MESSAGES.UNAUTHORIZED,
  severity: "error",
  timestamp: new Date(),
};

const httpStatus = ERROR_CODE_TO_HTTP_STATUS["UNAUTHORIZED"]; // 401
```

## Design Principles

1. **Domain Types (UI Layer)**: Use `camelCase` and represent the canonical form used in the application
2. **API DTOs (Backend Layer)**: Use `snake_case` and represent the raw backend response format
3. **Mapper Responsibility**: The `shared-api` package contains mappers that transform snake_case DTOs to camelCase domain types
4. **No Logic**: This package contains only type definitions, no runtime logic or classes

## Type Safety

All types are strict by default:
- `strict: true` in `tsconfig.json`
- Null/undefined must be explicitly handled
- No `any` types in exported interfaces

## Conventions

### Naming

- Domain types: `User`, `Message`, `Conversation` (PascalCase)
- API DTOs: `UserDTO`, `MessageDTO`, `ConversationDTO` (PascalCase with DTO suffix)
- Type enums: lowercase with pipes, e.g., `"active" | "inactive"`
- Optional fields: marked with `?`, never use `| undefined` for external APIs

### Exports

Use named exports exclusively:

```typescript
// ✅ Good
export interface User { ... }
export type UserRole = "admin" | "user";

// ❌ Avoid
export default interface User { ... }
```

## Adding New Types

When adding new types to this package:

1. Create/update the appropriate file (`domain.ts`, `dto.ts`, or `errors.ts`)
2. Group related types with clear section comments
3. Export from `index.ts`
4. Update this README with examples
5. Run `pnpm typecheck` to ensure compilation
6. Run `pnpm build` to generate declarations

## Build

```bash
# Type-check only (no emit)
pnpm typecheck

# Build and emit .d.ts files
pnpm build

# Clean build artifacts
pnpm clean
```

## Version

Current version: **0.1.0**

---

**Last Updated**: May 9, 2026  
**Maintained By**: Architecture Team
