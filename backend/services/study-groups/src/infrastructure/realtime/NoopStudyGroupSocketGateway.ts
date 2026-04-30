/**
 * NoopStudyGroupSocketGateway.ts
 *
 * Implementacion temporal para entornos sin WebSocket.
 */

import type { IStudyGroupSocketGateway } from "../../domain/events/index.js";

export class NoopStudyGroupSocketGateway implements IStudyGroupSocketGateway {
  async emitToUser(_userId: string, _event: string, _payload: Record<string, unknown>): Promise<void> {
    return;
  }
}
