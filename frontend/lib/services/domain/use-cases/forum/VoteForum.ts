import type { IForumRepository } from "../../repositories/IForumRepository";

export class VoteForum {
  constructor(private forumRepo: IForumRepository) {}

  async execute(targetType: "question" | "answer", targetId: string, voteType: "upvote" | "downvote"): Promise<{ voteCount: number }> {
    return this.forumRepo.castVote({ target_type: targetType, target_id: targetId, vote_type: voteType });
  }
}
