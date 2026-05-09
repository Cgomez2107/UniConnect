/**
 * Wire shared-api + shared-state: createAuthStore factory
 * This module constructs the transport + clients + storage adapter
 * and exports a ready-to-use Zustand hook created by the factory.
 */

import { FetchTransport, AuthClient, BaseMessagingClient, RealtimeChatDecorator } from "@uniconnect/shared-api";
import { createAuthStore, WebStorageAdapter, ConsoleLogger } from "@uniconnect/shared-state";

// Build transport pointing to gateway
const GATEWAY_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1";
const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:3000";
const AUTH_SESSION_KEY = "uniconnect-auth-session";

const transport = new FetchTransport(GATEWAY_URL);

transport.setAuthProvider(async () => {
  try {
    const raw = window.localStorage.getItem(AUTH_SESSION_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as { state?: { accessToken?: string | null } };
    return parsed?.state?.accessToken ?? null;
  } catch {
    return null;
  }
});

// API clients
const authClient = new AuthClient(transport);
const messagingClient = new BaseMessagingClient(transport);
const realtimeChat = new RealtimeChatDecorator(messagingClient, transport, WS_URL);

// Storage adapter (web)
const storageAdapter = new WebStorageAdapter(window.localStorage);

// Logger
const logger = new ConsoleLogger();

// DI container
const deps = {
  apiClients: {
    auth: authClient,
    messaging: messagingClient,
    messagingRealtime: realtimeChat,
  },
  storage: storageAdapter,
  logger,
};

// Export Zustand hook created by factory
export const useAuthStore = createAuthStore(deps);
