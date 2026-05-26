export interface ForumAnswer {
  id: string;
  questionId: string;
  authorId: string;
  authorName: string;
  body: string;
  voteCount: number;
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
}
