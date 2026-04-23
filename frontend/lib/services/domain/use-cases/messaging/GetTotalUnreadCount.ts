import type { IMessageRepository } from "../../repositories/IMessageRepository";

export class GetTotalUnreadCount {
  constructor(private repository: IMessageRepository) {}

  async execute(): Promise<number> {
    return this.repository.getTotalUnreadCount();
  }
}
