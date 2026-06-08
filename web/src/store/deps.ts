import {
  FetchTransport,
  AuthClient,
  BaseMessagingClient,
  RealtimeChatDecorator,
  StudyGroupsClient,
  ProfilesClient,
  ResourcesClient,
  EventsClient,
  NotificationsClient,
  AdminClient,
  ForumClient,
  StudySessionsClient,
} from "@uniconnect/shared-api";
import { WebStorageAdapter, ConsoleLogger } from "@uniconnect/shared-state";
import { getWsUrl } from "@/lib/wsUrl";
import { useSpamStore } from "@/store/useSpamStore";

const GATEWAY_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1";
const WS_URL = getWsUrl();
const AUTH_SESSION_KEY = "uniconnect-auth-session";

const transport = new FetchTransport(GATEWAY_URL);

transport.setAuthProvider(async () => {
  try {
    const raw = window.localStorage.getItem(AUTH_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      state?: { accessToken?: string | null; refreshToken?: string | null };
    };
    return parsed?.state?.accessToken ?? null;
  } catch {
    return null;
  }
});

transport.setTokenRefreshProvider(async () => {
  try {
    const raw = window.localStorage.getItem(AUTH_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      state?: { accessToken?: string | null; refreshToken?: string | null };
    };
    const refreshToken = parsed?.state?.refreshToken;
    if (!refreshToken) return null;

    const response = await fetch(
      `${GATEWAY_URL}/auth/refresh`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      }
    );
    if (!response.ok) return null;

    const data = await response.json();
    const payload = data?.data ?? data;
    const newToken = payload?.accessToken ?? null;
    const newRefreshToken = payload?.refreshToken ?? null;

    // Update localStorage with new tokens
    if (newToken && parsed?.state) {
      parsed.state.accessToken = newToken;
      if (newRefreshToken) parsed.state.refreshToken = newRefreshToken;
      window.localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(parsed));
    }

    return newToken;
  } catch {
    return null;
  }
});

transport.setOnSessionExpired(() => {
  try {
    const hadSession = !!window.localStorage.getItem(AUTH_SESSION_KEY);
    window.localStorage.removeItem(AUTH_SESSION_KEY);
    window.localStorage.removeItem("accessToken");
    window.localStorage.removeItem("user");
    if (hadSession) {
      window.location.href = "/login";
    }
  } catch {
    // ignore
  }
});

transport.setOnError((error) => {
  console.log("[deps] Error callback invoked:", error);
  if (error.status === 429) {
    const data = error.data as any;
    if (data?.code === "MO_003") {
      console.log("[deps] Spam detected (MO_003), activating block for 5 minutes");
      useSpamStore.getState().setBlocked(5 * 60 * 1000);
    }
  }
});

const authClient = new AuthClient(transport);
const messagingClient = new BaseMessagingClient(transport);
const realtimeChat = new RealtimeChatDecorator(messagingClient, transport, WS_URL);
const studyGroupsClient = new StudyGroupsClient(transport);
const profilesClient = new ProfilesClient(transport);
const resourcesClient = new ResourcesClient(transport);
const eventsClient = new EventsClient(transport);
const notificationsClient = new NotificationsClient(transport);
const adminClient = new AdminClient(transport);
const forumClient = new ForumClient(transport);
const studySessionsClient = new StudySessionsClient(transport);

const storageAdapter = new WebStorageAdapter(window.localStorage);
const logger = new ConsoleLogger();

export const deps = {
  apiClients: {
    auth: authClient,
    messaging: messagingClient,
    messagingRealtime: realtimeChat,
    studyGroups: studyGroupsClient,
    profiles: profilesClient,
    resources: resourcesClient,
    events: eventsClient,
    notifications: notificationsClient,
    admin: adminClient,
    forum: forumClient,
    studySessions: studySessionsClient,
  },
  transport,
  storage: storageAdapter,
  logger,
};

export { AUTH_SESSION_KEY };
