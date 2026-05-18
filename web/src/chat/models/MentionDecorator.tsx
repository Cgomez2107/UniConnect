import React from "react";
import type { ReactNode } from "react";
import type { IMessage, IRenderContext, MentionData } from "./IMessage.js";
import { MessageDecorator } from "./MessageDecorator.js";

export class MentionDecorator extends MessageDecorator {
  private readonly mentions: MentionData[];

  constructor(wrapper: IMessage, mentions: MentionData[]) {
    super(wrapper);
    this.mentions = mentions;
  }

  getMentions(): MentionData[] {
    return this.mentions;
  }

  getMetadata(): Record<string, unknown> {
    return {
      ...super.getMetadata(),
      mentions: this.mentions,
    };
  }

  render(context?: IRenderContext): ReactNode {
    const content = this.wrapper.getContent();
    const parts: ReactNode[] = [];
    const regex = /@\[([^\]]+)\]\(user:([^)]+)\)/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    let key = 0;
    const currentUserId = context?.currentUserId;

    while ((match = regex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push(<span key={key++}>{content.slice(lastIndex, match.index)}</span>);
      }
      const name = match[1];
      const userId = match[2];
      const isCurrentUser = userId === currentUserId;

      parts.push(
        <span
          key={key++}
          className={`font-semibold cursor-pointer hover:underline ${
            isCurrentUser
              ? "text-amber-500 dark:text-amber-400"
              : "text-primary-500 dark:text-primary-400"
          }`}
          onClick={(e) => {
            e.stopPropagation();
            window.open(`/perfil-estudiante/${userId}`, "_blank");
          }}
        >
          @{name}
        </span>,
      );
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      parts.push(<span key={key++}>{content.slice(lastIndex)}</span>);
      void key;
    }

    return parts.length > 0 ? <>{parts}</> : content;
  }
}
