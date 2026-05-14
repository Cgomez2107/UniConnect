export interface VotoRecibidoEvent {
  readonly type: 'VOTO_RECIBIDO';
  readonly version: '1.0';
  readonly timestamp: Date;
  readonly targetType: string;
  readonly targetId: string;
  readonly voteType: string;
  readonly newVoteCount: number;
  readonly voterId: string;
  readonly targetAuthorId: string;
}
