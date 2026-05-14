export interface ForumAnswer {
  id: string;
  questionId: string;
  authorId: string;
  body: string;
  voteCount: number;
  createdAt: Date;
  updatedAt: Date;
}
