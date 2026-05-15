import type { Observer, DomainEvent } from '../../../../../../shared/patterns/observer/EventEmitter.js';
import type { SupabaseRealtimeGateway } from '../../../infrastructure/realtime/SupabaseRealtimeGateway.js';

export class ForumRealtimeObserver implements Observer {
  readonly name = 'ForumRealtimeObserver';

  constructor(private readonly realtimeGateway: SupabaseRealtimeGateway) {}

  getName(): string {
    return this.name;
  }

  getInterestedEvents(): string[] {
    return ['VOTO_RECIBIDO', 'SOLUCION_MARCADA'];
  }

  async handle(event: DomainEvent): Promise<void> {
    const targetAuthorId = event.aggregateId;
    const payload = event.data;

    switch (event.eventType) {
      case 'VOTO_RECIBIDO':
        await this.realtimeGateway.emitToUser(targetAuthorId, 'VOTE_RECEIVED', {
          targetType: payload.targetType,
          targetId: payload.targetId,
          voteType: payload.voteType,
          newVoteCount: payload.newVoteCount,
          voterId: payload.voterId,
          timestamp: event.timestamp.toISOString(),
        });
        break;

      case 'SOLUCION_MARCADA':
        await this.realtimeGateway.emitToUser(targetAuthorId, 'ANSWER_MARKED_AS_SOLUTION', {
          questionId: payload.questionId,
          answerId: payload.answerId,
          marcadoPor: payload.marcadoPor,
          timestamp: event.timestamp.toISOString(),
        });
        break;
    }
  }
}
