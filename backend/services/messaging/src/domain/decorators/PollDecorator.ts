import type { IMessage } from "./IMessage.js";
import { MessageDecorator } from "./MessageDecorator.js";

export interface PollOption {
  readonly text: string;
  readonly votes: readonly string[];
}

export interface PollMetadata {
  readonly question: string;
  readonly options: readonly PollOption[];
  readonly isOpen: boolean;
  readonly closesAt: string | null;
  readonly createdAt: string;
}

export class PollDecorator extends MessageDecorator {
  private readonly poll: PollMetadata;

  constructor(message: IMessage, poll: PollMetadata) {
    super(message);

    if (!poll.question || poll.question.trim().length === 0) {
      throw new Error("poll question cannot be empty");
    }

    if (!poll.options || poll.options.length < 2) {
      throw new Error("poll must have at least 2 options");
    }

    for (const option of poll.options) {
      if (!option.text || option.text.trim().length === 0) {
        throw new Error("poll option text cannot be empty");
      }
    }

    this.poll = {
      question: poll.question,
      options: Object.freeze(
        poll.options.map((o) => ({
          text: o.text,
          votes: Object.freeze([...o.votes]),
        })),
      ),
      isOpen: poll.isOpen,
      closesAt: poll.closesAt,
      createdAt: poll.createdAt,
    };
  }

  getPoll(): PollMetadata {
    return this.poll;
  }

  hasVoted(userId: string): boolean {
    return this.poll.options.some((opt) => opt.votes.includes(userId));
  }

  getUserVote(userId: string): number | null {
    for (let i = 0; i < this.poll.options.length; i++) {
      if (this.poll.options[i].votes.includes(userId)) {
        return i;
      }
    }
    return null;
  }

  getTotalVotes(): number {
    return this.poll.options.reduce((sum, opt) => sum + opt.votes.length, 0);
  }

  getVotePercentage(optionIndex: number): number {
    const total = this.getTotalVotes();
    if (total === 0) return 0;
    return (this.poll.options[optionIndex].votes.length / total) * 100;
  }

  override getContent(): string {
    return this.message.getContent();
  }

  override getMetadata(): Record<string, unknown> {
    return {
      ...this.message.getMetadata(),
      poll: {
        question: this.poll.question,
        options: this.poll.options.map((o) => ({
          text: o.text,
          votes: [...o.votes],
        })),
        isOpen: this.poll.isOpen,
        closesAt: this.poll.closesAt,
        createdAt: this.poll.createdAt,
      },
    };
  }

  override render(): string {
    return this.message.render();
  }

  override toJSON(): Record<string, unknown> {
    return this.getMetadata();
  }
}
