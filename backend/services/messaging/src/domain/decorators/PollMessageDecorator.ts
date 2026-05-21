import type { IMessage } from "./IMessage.js";
import { MessageDecorator } from "./MessageDecorator.js";

export type PollStatus = 'active' | 'closed';

export interface PollConfigInput {
  readonly question: string;
  readonly options: string[];
  readonly expiresAt: string;
}

export interface PollConfigData extends PollConfigInput {
  readonly pollId: string;
  readonly status: PollStatus;
}

export class PollMessageDecorator extends MessageDecorator {
  private readonly pollConfig: PollConfigData;

  constructor(message: IMessage, input: PollConfigData) {
    super(message);

    if (!input.pollId || input.pollId.trim().length === 0) {
      throw new Error("pollId es requerido");
    }

    if (!input.question || input.question.trim().length === 0) {
      throw new Error("question no puede estar vacía");
    }

    if (!input.options || input.options.length < 2 || input.options.length > 10) {
      throw new Error("options debe tener entre 2 y 10 opciones");
    }

    const uniqueOptions = new Set(input.options);
    if (uniqueOptions.size !== input.options.length) {
      throw new Error("options no puede tener valores duplicados");
    }

    if (!input.status || !['active', 'closed'].includes(input.status)) {
      throw new Error("status debe ser 'active' o 'closed'");
    }

    if (!input.expiresAt || isNaN(Date.parse(input.expiresAt))) {
      throw new Error("expiresAt debe ser una fecha ISO 8601 válida");
    }

    this.pollConfig = {
      pollId: input.pollId,
      question: input.question.trim(),
      options: [...input.options],
      expiresAt: input.expiresAt,
      status: input.status,
    };
  }

  getPollConfig(): PollConfigData {
    return { ...this.pollConfig };
  }

  getQuestion(): string {
    return this.pollConfig.question;
  }

  getOptions(): readonly string[] {
    return this.pollConfig.options;
  }

  getExpiresAt(): string {
    return this.pollConfig.expiresAt;
  }

  getPollId(): string {
    return this.pollConfig.pollId;
  }

  getStatus(): PollStatus {
    return this.pollConfig.status;
  }

  isExpired(): boolean {
    return new Date(this.pollConfig.expiresAt) <= new Date();
  }

  override getContent(): string {
    return this.message.getContent();
  }

  override getMetadata(): Record<string, unknown> {
    return {
      ...this.message.getMetadata(),
      poll: {
        pollId: this.pollConfig.pollId,
        question: this.pollConfig.question,
        options: [...this.pollConfig.options],
        expiresAt: this.pollConfig.expiresAt,
        status: this.pollConfig.status,
      },
    };
  }

  override toJSON(): Record<string, unknown> {
    return this.getMetadata();
  }
}
