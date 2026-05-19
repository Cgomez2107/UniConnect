import type { ReactNode } from "react";
import type { IMessage, IRenderContext } from "./IMessage.js";

export abstract class MessageDecorator implements IMessage {
  protected readonly wrapper: IMessage;

  constructor(wrapper: IMessage) {
    this.wrapper = wrapper;
  }

  get id(): string {
    return this.wrapper.id;
  }

  get content(): string {
    return this.wrapper.content;
  }

  get senderId(): string {
    return this.wrapper.senderId;
  }

  get timestamp(): Date {
    return this.wrapper.timestamp;
  }

  getContent(): string {
    return this.wrapper.getContent();
  }

  getMetadata(): Record<string, unknown> {
    return {
      ...this.wrapper.getMetadata(),
    };
  }

  abstract render(context?: IRenderContext): ReactNode;
}
