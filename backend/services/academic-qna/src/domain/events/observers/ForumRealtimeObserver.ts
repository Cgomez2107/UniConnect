import type { Observer, DomainEvent } from '../../../../../../shared/patterns/observer/EventEmitter.js';
import type { SupabaseRealtimeGateway } from '../../../infrastructure/realtime/SupabaseRealtimeGateway.js';

export class ForumRealtimeObserver implements Observer {
  readonly name = 'ForumRealtimeObserver';

  constructor(private readonly realtimeGateway: SupabaseRealtimeGateway) {}

  getName(): string {
    return this.name;
  }

  getInterestedEvents(): string[] {
    return ['VOTO_RECIBIDO'];
  }

  async handle(event: DomainEvent): Promise<void> {
    const targetAuthorId = event.aggregateId;
    const payload = event.data;

    await this.realtimeGateway.emitToUser(targetAuthorId, 'VOTE_RECEIVED', {
      targetType: payload.targetType,
      targetId: payload.targetId,
      voteType: payload.voteType,
      newVoteCount: payload.newVoteCount,
      voterId: payload.voterId,
      timestamp: event.timestamp.toISOString(),
    });
  }
}
