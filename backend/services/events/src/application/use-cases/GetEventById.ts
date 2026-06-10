import type { Event } from "../../domain/entities/Event.js";
import type { IEventRepository } from "../../domain/repositories/IEventRepository.js";

export class GetEventById {
  constructor(private readonly repository: IEventRepository) {}

  async execute(eventId: string): Promise<Event | null> {
    if (!eventId.trim()) {
      throw new Error("Event ID is required");
    }
    return this.repository.getById(eventId.trim());
  }

  async getWithRegistrationStatus(eventId: string, userId: string): Promise<{ event: Event; isRegistered: boolean } | null> {
    const event = await this.repository.getById(eventId.trim());
    if (!event) return null;

    const registeredUsers = await this.repository.getRegisteredUsers(eventId.trim());
    return {
      event,
      isRegistered: registeredUsers.includes(userId),
    };
  }
}