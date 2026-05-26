export interface AnswerForOrdering {
  id: string;
  isPinned: boolean;
  isSolution: boolean;
  voteCount: number;
  createdAt: string;
}

export function ordenarRespuestas<T extends AnswerForOrdering>(answers: T[]): T[] {
  return [...answers].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    if (a.isSolution && !b.isSolution) return -1;
    if (!a.isSolution && b.isSolution) return 1;
    return b.voteCount - a.voteCount;
  });
}