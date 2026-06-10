export const EVENT_STATUSES = ["draft", "published", "cancelled", "finished"] as const;

export type EventStatus = (typeof EVENT_STATUSES)[number];
