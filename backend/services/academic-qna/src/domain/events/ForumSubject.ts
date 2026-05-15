import { EventEmitter, type DomainEvent } from '../../../../../shared/patterns/observer/EventEmitter.js';
import type { VotoRecibidoEvent, RespuestaMarcadaSolucionEvent } from './ForumEvents.js';

export class ForumSubject extends EventEmitter {
  async emitVoteEvent(event: VotoRecibidoEvent): Promise<void> {
    const domainEvent: DomainEvent = {
      eventType: event.type,
      timestamp: event.timestamp,
      aggregateId: event.targetAuthorId,
      aggregateType: 'ForumVote',
      data: {
        targetType: event.targetType,
        targetId: event.targetId,
        voteType: event.voteType,
        newVoteCount: event.newVoteCount,
        voterId: event.voterId,
      },
    };

    await this.emit(domainEvent);
  }

  async emitSolucionEvent(event: RespuestaMarcadaSolucionEvent): Promise<void> {
    const domainEvent: DomainEvent = {
      eventType: event.type,
      timestamp: event.timestamp,
      aggregateId: event.answerAuthorId,
      aggregateType: 'ForumAnswer',
      data: {
        questionId: event.questionId,
        answerId: event.answerId,
        marcadoPor: event.marcadoPor,
      },
    };

    await this.emit(domainEvent);
  }
}
