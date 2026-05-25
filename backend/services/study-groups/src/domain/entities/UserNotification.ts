export interface UserNotification {
  readonly id: string;
  readonly userId: string;
  readonly type: string;
  readonly title: string;
  readonly body: string;
  readonly payload: Record<string, unknown> | null;
  readonly createdAt: string;
  readAt: string | null;
  readonly priority?: "normal" | "urgente" | "critica";
  readonly action?: { label: string; endpoint: string; method?: "GET" | "POST" | "PUT" | "DELETE" };
}
