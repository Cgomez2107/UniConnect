export interface CreatePollConfigInput {
  readonly messageId: string;
  readonly groupId: string;
  readonly createdBy: string;
  readonly question: string;
  readonly options: string[];
  readonly expiresAt: string;
}

export interface PollOptionResult {
  readonly option: string;
  readonly count: number;
  readonly percentage: number;
}

export interface PollConfigDTO {
  readonly pollId: string;
  readonly messageId: string;
  readonly groupId: string;
  readonly createdBy: string;
  readonly question: string;
  readonly options: string[];
  readonly expiresAt: string;
  readonly status: 'active' | 'closed';
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly results: PollOptionResult[];
  readonly totalVotes: number;
}

export interface VoteInputDTO {
  readonly userId: string;
  readonly selectedOption: number;
}

export interface VoteResultDTO {
  readonly success: boolean;
  readonly pollId: string;
  readonly userId: string;
  readonly selectedOption: number;
  readonly results: PollOptionResult[];
  readonly totalVotes: number;
}

export interface PollResultsDTO {
  readonly pollId: string;
  readonly question: string;
  readonly status: 'active' | 'closed';
  readonly results: PollOptionResult[];
  readonly totalVotes: number;
}

export interface CloseExpiredPollsResultDTO {
  readonly closedCount: number;
  readonly closedPollIds: string[];
}
