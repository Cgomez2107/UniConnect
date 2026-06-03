export interface ForumAnswer {
  id: string;
  questionId: string;
  authorId: string;
  authorName: string;
  body: string;
  voteCount: number;
  isSolution: boolean;
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
}
