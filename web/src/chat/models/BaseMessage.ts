import type { ReactNode } from "react";
import type { IMessage, IRenderContext } from "./IMessage.js";

export class BaseMessage implements IMessage {
  readonly id: string;
  readonly content: string;
  readonly senderId: string;
  readonly timestamp: Date;

  constructor(id: string, content: string, senderId: string, timestamp: Date) {
    this.id = id;
    this.content = content;
    this.senderId = senderId;
    this.timestamp = timestamp;
  }

  getContent(): string {
    return this.content;
  }

  getMetadata(): Record<string, unknown> {
    return {
      id: this.id,
      senderId: this.senderId,
      timestamp: this.timestamp.toISOString(),
    };
  }

  render(_context?: IRenderContext): ReactNode {
    return this.content;
  }
}
