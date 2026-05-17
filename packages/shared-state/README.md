# @uniconnect/shared-state

State management layer with Zustand factories, storage adapters, and Observer pattern for notifications.

## Overview

This package provides:

- **Store Factories**: `createAuthStore`, `createNotificationStore`, `createConversationsStore` (not singletons)
- **Storage Adapters**: `WebStorageAdapter`, `SessionStorageAdapter`, `NoopStorageAdapter` for persistent state
- **Observer Pattern**: `NotificationSubject` for event distribution across Web and Mobile
- **Dependency Injection**: All stores receive `StoreDeps` for decoupled architecture

## Architecture

```
StoreDeps (DI Container)
    ├── apiClients (from shared-api)
    ├── storage (IStorageAdapter)
    └── logger (optional)
         ↓
Store Factories
    ├── createAuthStore
    ├── createNotificationStore
    └── createConversationsStore
         ↓
Zustand Stores (with persistence)
         ↓
NotificationSubject (Observer for events)
```

## Key Features

### 1. Factory Pattern (Not Singletons)

```typescript
// ✅ GOOD: Multiple instances (testing, multi-tenant, etc.)
const authStore1 = createAuthStore(deps1);
const authStore2 = createAuthStore(deps2);

// ❌ AVOID: Global singleton
const authStore = useAuthStore(); // Don't do this!
```

### 2. Dependency Injection

All stores receive their dependencies explicitly:

```typescript
interface StoreDeps {
  apiClients: {
    auth: AuthClient;
    messaging: BaseMessagingClient;
    messagingRealtime: RealtimeChatDecorator;
  };
  storage: IStorageAdapter;
  logger?: Logger;
}
```

### 3. Storage Adapters

Use platform-specific adapters:

```typescript
import { WebStorageAdapter, NoopStorageAdapter } from "@uniconnect/shared-state";

// Web
const storage = new WebStorageAdapter(window.localStorage);

// Mobile (with AsyncStorage)
// const storage = new AsyncStorageAdapter();

// Testing
const storage = new NoopStorageAdapter();
```

### 4. Observer Pattern for Notifications

Identical subscription interface for Web and Mobile:

```typescript
import { notificationSubject } from "@uniconnect/shared-state";

// Subscribe to all notifications
const sub = notificationSubject.subscribe((event) => {
  console.log(event.type); // "notification:received", "notification:read", etc.
});

// Or subscribe to specific type
const typeSub = notificationSubject.subscribeToType("notification:received", (event) => {
  console.log(event.notification);
});

// Unsubscribe
sub.unsubscribe();
typeSub.unsubscribe();
```

## Usage Examples

### Initialization (Web)

```typescript
import {
  createAuthStore,
  createNotificationStore,
  createConversationsStore,
  WebStorageAdapter,
  ConsoleLogger,
} from "@uniconnect/shared-state";
import { FetchTransport, AuthClient, BaseMessagingClient, RealtimeChatDecorator } from "@uniconnect/shared-api";

// 1. Setup transport
const transport = new FetchTransport("http://localhost:3000");

// 2. Setup clients
const authClient = new AuthClient(transport);
const messagingClient = new BaseMessagingClient(transport);
const realtimeChat = new RealtimeChatDecorator(
  messagingClient,
  transport,
  "ws://localhost:3000/chat"
);

// 3. Setup storage
const storage = new WebStorageAdapter(window.localStorage);

// 4. Create dependency container
const deps = {
  apiClients: {
    auth: authClient,
    messaging: messagingClient,
    messagingRealtime: realtimeChat,
  },
  storage,
  logger: new ConsoleLogger(),
};

// 5. Create stores
const authStore = createAuthStore(deps);
const notificationStore = createNotificationStore(deps);
const conversationsStore = createConversationsStore(deps);

// 6. Hydrate on app startup
await authStore.getState().hydrate();
await notificationStore.getState().hydrate();
await conversationsStore.getState().hydrate();
```

### Auth Store Usage

```typescript
// Sign in
await authStore.getState().signIn("user@example.com", "password123");

// Get state
const { user, isAuthenticated, accessToken } = authStore.getState();

// Subscribe to changes
const unsubscribe = authStore.subscribe(
  (state) => state.user,
  (user) => {
    console.log("User changed:", user);
  }
);

// Sign out
await authStore.getState().logout();
```

### Conversations Store Usage

```typescript
// Load all conversations
await conversationsStore.getState().loadConversations();

// Select conversation
await conversationsStore.getState().selectConversation("conv-123");

// Get current messages
const messages = conversationsStore
  .getState()
  .messages.get("conv-123");

// Add incoming message
conversationsStore.getState().addMessage("conv-123", incomingMessage);

// Update message (e.g., after edit)
conversationsStore.getState().updateMessage("conv-123", updatedMessage);
```

### Notifications Store with Observer

```typescript
import { notificationSubject } from "@uniconnect/shared-state";

const notificationStore = createNotificationStore(deps);

// Subscribe to notification events
notificationSubject.subscribe((event) => {
  switch (event.type) {
    case "notification:received":
      console.log("New notification:", event.notification);
      break;
    case "notification:read":
      console.log("Notification marked as read");
      break;
  }
});

// WebSocket listener adds notification
notificationStore.getState().addNotification({
  id: "notif-123",
  type: "message",
  title: "New message",
  description: "from John",
  read: false,
  createdAt: new Date(),
  userId: "user-123",
});

// Automatically notifies all subscribers
// Subscribers see exactly the same event shape in Web and Mobile
```

## Store Persistence

All stores persist their state to storage automatically:

```typescript
// Auth store persists:
// - user
// - accessToken
// - refreshToken
// - isAuthenticated

// Notifications store persists:
// - notifications[]
// - unreadCount

// Conversations store persists:
// - conversations[]
// - messages (per conversation)
```

## Hydration

Restore state on app startup:

```typescript
// Restore from persistent storage
await authStore.getState().hydrate();
await notificationStore.getState().hydrate();
await conversationsStore.getState().hydrate();

// Now stores have data from last session
```

## Testing

Easy to test with `NoopStorageAdapter`:

```typescript
import { NoopStorageAdapter } from "@uniconnect/shared-state";

// Create mock clients
const mockAuthClient = { signIn: jest.fn() };
const mockStorage = new NoopStorageAdapter();

// Create store with mocks
const testDeps = {
  apiClients: {
    auth: mockAuthClient,
    // ...
  },
  storage: mockStorage,
};

const authStore = createAuthStore(testDeps);

// Test
mockAuthClient.signIn.mockResolvedValue({
  user: { id: "123", email: "test@example.com" },
  accessToken: "token",
  refreshToken: "refresh",
});

await authStore.getState().signIn("test@example.com", "password");
expect(authStore.getState().user?.email).toBe("test@example.com");
```

## Storage Adapters

### WebStorageAdapter

For web browsers using `localStorage` or `sessionStorage`:

```typescript
const storage = new WebStorageAdapter(window.localStorage);
// or
const sessionStorage = new SessionStorageAdapter();
```

### AsyncStorageAdapter (Mobile)

For React Native:

```typescript
import AsyncStorage from "@react-native-async-storage/async-storage";

// Would be implemented in shared-state/src/adapters/asyncStorageAdapter.ts
// const storage = new AsyncStorageAdapter(AsyncStorage);
```

### NoopStorageAdapter

For testing, CI, or SSR:

```typescript
const storage = new NoopStorageAdapter();
// Stores everything in memory, never persists
```

## Reactive Subscriptions

Zustand stores are reactive:

```typescript
// Subscribe to specific field
const unsubAuth = authStore.subscribe(
  (state) => state.user?.email,
  (email) => {
    console.log("Email changed:", email);
  }
);

// Subscribe to entire state changes
const unsubAll = authStore.subscribe(
  (state) => state,
  (state) => {
    console.log("Auth state changed", state);
  }
);

// Unsubscribe
unsubAuth();
unsubAll();
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

This package references:
- `@uniconnect/shared-types` - Domain types
- `@uniconnect/shared-api` - API clients

Via TypeScript Project References for proper build orchestration.

---

**Version**: 0.1.0  
**Last Updated**: May 9, 2026
