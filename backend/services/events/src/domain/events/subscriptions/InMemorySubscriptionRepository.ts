import type { EventCategory } from "../../entities/Event.js";
import type { ISubscriptionRepository } from "./ISubscriptionRepository.js";

export class InMemorySubscriptionRepository implements ISubscriptionRepository {
  private readonly subs: Map<string, Set<EventCategory>> = new Map();

  async subscribe(userId: string, category: EventCategory): Promise<void> {
    if (!this.subs.has(userId)) {
      this.subs.set(userId, new Set());
    }
    this.subs.get(userId)!.add(category);
  }

  async unsubscribe(userId: string, category: EventCategory): Promise<void> {
    this.subs.get(userId)?.delete(category);
  }

  async getSubscribersByCategory(category: EventCategory): Promise<string[]> {
    const result: string[] = [];
    for (const [userId, categories] of this.subs) {
      if (categories.has(category)) {
        result.push(userId);
      }
    }
    return result;
  }

  async getUserSubscriptions(userId: string): Promise<EventCategory[]> {
    return [...(this.subs.get(userId) ?? [])];
  }
}
