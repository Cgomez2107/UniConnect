import type { IEventRepository } from "../../domain/repositories/IEventRepository.js";

interface RegisterForEventInput {
  eventId: string;
  userId: string;
}

export class RegisterForEvent {
  constructor(private readonly repository: IEventRepository) {}

  async execute(input: RegisterForEventInput): Promise<void> {
    const { eventId, userId } = input;
    await this.repository.registerForEvent(eventId, userId);
  }
}