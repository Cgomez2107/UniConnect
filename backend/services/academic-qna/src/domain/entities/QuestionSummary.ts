export interface QuestionSummary {
  id: string;
  subjectId: string;
  authorId: string;
  title: string;
  status: string;
  answerCount: number;
  voteCount: number;
  createdAt: Date;
  updatedAt: Date;
}
