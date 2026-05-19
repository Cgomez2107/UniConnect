# @uniconnect/shared-api

HTTP API clients, transport layer, and data mappers for UniConnect.

## Overview

This package provides:

- **Transport Layer**: HTTP abstraction (`ITransport`) with `FetchTransport` implementation and WebSocket support
- **Mapper Layer**: Pure functions for transforming snake_case ↔ camelCase and Date conversions
- **HTTP Clients**: `AuthClient`, `BaseMessagingClient` with strict typing
- **Decorator Pattern**: `RealtimeChatDecorator` for adding WebSocket realtime to `BaseMessagingClient`

## Architecture

```
Transport Layer (ITransport)
    ↓
HTTP Clients (AuthClient, BaseMessagingClient)
    ↓
Mapper Layer (snakeToCamel, camelToSnake, dateMapper)
    ↓
Domain Types (via @uniconnect/shared-types)
```

## Key Features

### 1. Data Mapper (CRITICAL)

All data flowing through `shared-api` is transformed:

```typescript
// Backend sends snake_case strings
const apiResponse: MessageDTO = {
  id: "123",
  conversation_id: "conv-1",
  created_at: "2026-05-09T10:00:00Z", // ← ISO string
  sender_id: "user-1"
};

// Mapper transforms to camelCase Date objects
const domainMessage: Message = mapMessageDtoToDomain(apiResponse);
// Result:
// {
//   id: "123",
//   conversationId: "conv-1",
//   createdAt: Date(2026-05-09T10:00:00Z), // ← Date object
//   senderId: "user-1"
// }
```

### 2. Transport Abstraction

Agnóstic HTTP layer supporting Web and Mobile:

```typescript
const transport = new FetchTransport("http://localhost:3000");

// Set auth token injector
transport.setAuthProvider(async () => {
  const token = await authStore.getAccessToken();
  return token;
});

// Use in any client
const authClient = new AuthClient(transport);
const response = await authClient.getCurrentUser();
```

### 3. Decorator Pattern (Messaging)

**BaseMessagingClient** handles HTTP-only operations:

```typescript
const baseClient = new BaseMessagingClient(transport);

// HTTP methods only
const conversations = await baseClient.getConversations();
const message = await baseClient.sendMessage({
  conversationId: "conv-1",
  content: "Hello"
});
```

**RealtimeChatDecorator** adds WebSocket without modifying base client:

```typescript
const realtime = new RealtimeChatDecorator(
  baseClient,
  transport,
  "ws://localhost:3000/chat"
);

// Connect realtime
await realtime.connect();

// Subscribe to events (mapper applied automatically)
realtime.onMessage((message: Message) => {
  console.log(message); // ← Already camelCase Date objects
});

// Send typing indicator
realtime.sendTyping("conv-1");

// Base client methods still work
const freshConversations = await realtime.getBaseClient().getConversations();
```

## Usage Examples

### Authentication

```typescript
import { AuthClient, FetchTransport } from "@uniconnect/shared-api";

const transport = new FetchTransport("http://localhost:3000");
const authClient = new AuthClient(transport);

// Sign in
const loginResponse = await authClient.signIn({
  email: "user@example.com",
  password: "password123"
});

const { user, accessToken } = loginResponse;
// user is AuthProfile with camelCase fields and Date objects
```

### Messaging (HTTP only)

```typescript
import { BaseMessagingClient } from "@uniconnect/shared-api";

const messaging = new BaseMessagingClient(transport);

// Get conversations
const conversations = await messaging.getConversations({ limit: 20 });

// Send message
const message = await messaging.sendMessage({
  conversationId: "conv-1",
  content: "Hello!"
});
```

### Messaging (Realtime)

```typescript
import { RealtimeChatDecorator } from "@uniconnect/shared-api";

const realtime = new RealtimeChatDecorator(
  baseMessagingClient,
  transport,
  "ws://localhost:3000/chat"
);

// Connect
await realtime.connect();

// Listen for incoming messages
const subscription = realtime.onMessage((message) => {
  console.log(`New message: ${message.content}`);
});

// Emit typing indicator
realtime.sendTyping("conv-1");

// Unsubscribe
subscription.unsubscribe();

// Cleanup
realtime.disconnect();
```

## Mapper Functions

### Case Conversion

```typescript
import { snakeToCamel, camelToSnake } from "@uniconnect/shared-api";

// Snake to camel
const dto = { first_name: "John", created_at: "2026-05-09T10:00:00Z" };
const domain = snakeToCamel(dto);
// { firstName: "John", createdAt: "2026-05-09T10:00:00Z" }

// Camel to snake
const domain = { firstName: "John", createdAt: new Date() };
const dto = camelToSnake(domain);
// { first_name: "John", created_at: "2026-05-09T10:00:00Z" }
```

### Date Conversion

```typescript
import { parseStringDatesToObjects, formatDateObjectsToStrings } from "@uniconnect/shared-api";

// API response (strings) → Domain (Date objects)
const dto = { createdAt: "2026-05-09T10:00:00Z" };
const domain = parseStringDatesToObjects(dto);
// { createdAt: Date(2026-05-09T10:00:00Z) }

// Domain (Date objects) → API request (strings)
const domain = { createdAt: new Date() };
const dto = formatDateObjectsToStrings(domain);
// { createdAt: "2026-05-09T10:00:00Z" }
```

### Entity Mappers

```typescript
import { mapUserDtoToDomain, mapMessageDtoToDomain } from "@uniconnect/shared-api";

const userDTO = { first_name: "John", created_at: "2026-05-09T10:00:00Z" };
const user = mapUserDtoToDomain(userDTO);
// { firstName: "John", createdAt: Date(...) }

const messageDTO = { sender_id: "123", created_at: "2026-05-09T10:00:00Z" };
const message = mapMessageDtoToDomain(messageDTO);
// { senderId: "123", createdAt: Date(...) }
```

## Design Principles

### 1. Mapper Boundary

**Golden Rule**: No snake_case leaves this package.

All API responses are transformed to camelCase + Date objects before being returned to consumers.

### 2. Transport Agnnosticism

`ITransport` works in:
- Browser (fetch API)
- React Native (with appropriate polyfills)
- Node.js 18+

### 3. Decorator Pattern (OCP)

`RealtimeChatDecorator` respects Open/Closed Principle:
- ✅ Open for extension (add realtime capabilities)
- ✅ Closed for modification (base client unchanged)
- ✅ Transparent to callers (both base and decorator methods available)

### 4. Pure Functions

Mappers are pure functions:
- No side effects
- No mutations
- Predictable output
- Easily testable

## Type Safety

All clients are fully typed:

```typescript
// TypeScript knows the exact shape
const response: LoginResponse = await authClient.signIn(credentials);
const user: AuthProfile = response.user;
const token: string = response.accessToken;
```

## Building

```bash
# Type-check
pnpm typecheck

# Build and emit declarations
pnpm build

# Clean
pnpm clean
```

## Project References

This package references `@uniconnect/shared-types` via TypeScript Project References for proper build orchestration.

---

**Version**: 0.1.0  
**Last Updated**: May 9, 2026
