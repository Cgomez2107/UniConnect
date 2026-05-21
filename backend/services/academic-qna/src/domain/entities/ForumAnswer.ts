export interface ForumAnswer {
  id: string;
  questionId: string;
  authorId: string;
  body: string;
  voteCount: number;
  isSolution: boolean;
  createdAt: Date;
  updatedAt: Date;
}
