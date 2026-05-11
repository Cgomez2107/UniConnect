import type { EventCategory } from "../../entities/Event.js";

export interface ISubscriptionRepository {
  subscribe(userId: string, category: EventCategory): Promise<void>;
  unsubscribe(userId: string, category: EventCategory): Promise<void>;
  getSubscribersByCategory(category: EventCategory): Promise<string[]>;
  getUserSubscriptions(userId: string): Promise<EventCategory[]>;
}
