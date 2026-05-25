import React from "react";
import type { IMessage, PollData, IRenderContext } from "./IMessage.js";
import { MessageDecorator } from "./MessageDecorator.js";

export class PollDecorator extends MessageDecorator {
  private readonly poll: PollData;

  constructor(message: IMessage, poll: PollData) {
    super(message);
    this.poll = poll;
  }

  getPoll(): PollData {
    return this.poll;
  }

  override getContent(): string {
    return this.message.getContent();
  }

  override getMetadata(): Record<string, unknown> {
    return {
      ...this.message.getMetadata(),
      poll: this.poll,
    };
  }

  override render(context?: IRenderContext): React.ReactNode {
    return (
      <React.Fragment key="poll-decorator">
        {this.message.render(context)}
      </React.Fragment>
    );
  }
}
