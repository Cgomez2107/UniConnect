import React, { useState } from "react";
import type { ReactNode } from "react";
import type { IRenderContext, ReactionData } from "./IMessage.js";
import { MessageDecorator } from "./MessageDecorator.js";

const EMOJI_LIST = ["👍", "❤️", "😂", "😮", "🎉", "🔥"];

export class ReactionDecorator extends MessageDecorator {
  private readonly reactions: ReactionData[];

  constructor(wrapper: MessageDecorator, reactions: ReactionData[]) {
    super(wrapper);
    this.reactions = reactions;
  }

  getReactions(): ReactionData[] {
    return this.reactions;
  }

  getMetadata(): Record<string, unknown> {
    return {
      ...super.getMetadata(),
      reactions: this.reactions,
    };
  }

  render(context?: IRenderContext): ReactNode {
    const inner = this.wrapper.render(context);
    const currentUserId = context?.currentUserId;

    return (
      <>
        {inner}
        <ReactionBar
          reactions={this.reactions}
          currentUserId={currentUserId}
          messageId={this.id}
        />
      </>
    );
  }
}

interface ReactionBarProps {
  reactions: ReactionData[];
  currentUserId?: string;
  messageId: string;
}

function ReactionBar({ reactions, currentUserId, messageId }: ReactionBarProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [localReactions, setLocalReactions] = useState<ReactionData[]>(reactions);

  const handleAddReaction = (emoji: string) => {
    const existing = localReactions.find((r) => r.emoji === emoji);
    if (existing) {
      if (existing.users.includes(currentUserId ?? "")) {
        setLocalReactions((prev) =>
          prev
            .map((r) =>
              r.emoji === emoji
                ? { ...r, count: r.count - 1, users: r.users.filter((u) => u !== currentUserId) }
                : r,
            )
            .filter((r) => r.count > 0),
        );
      } else {
        setLocalReactions((prev) =>
          prev.map((r) =>
            r.emoji === emoji
              ? { ...r, count: r.count + 1, users: [...r.users, currentUserId ?? ""] }
              : r,
          ),
        );
      }
    } else {
      setLocalReactions((prev) => [
        ...prev,
        { emoji, count: 1, users: currentUserId ? [currentUserId] : [] },
      ]);
    }
    setShowPicker(false);
  };

  const hasReactions = localReactions.length > 0;

  return (
    <div className="flex flex-wrap items-center gap-1 mt-2">
      {localReactions.map((reaction) => {
        const isActive = currentUserId
          ? reaction.users.includes(currentUserId)
          : false;

        return (
          <button
            key={reaction.emoji}
            onClick={() => handleAddReaction(reaction.emoji)}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-all ${
              isActive
                ? "bg-primary-100 border-primary-300 text-primary-700"
                : "bg-neutral-100 border-neutral-200 text-neutral-600 hover:bg-neutral-200"
            }`}
          >
            <span>{reaction.emoji}</span>
            <span className="font-medium tabular-nums">{reaction.count}</span>
          </button>
        );
      })}

      <div className="relative">
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="inline-flex items-center justify-center w-6 h-6 rounded-full text-sm border border-neutral-200 text-neutral-400 hover:text-neutral-600 hover:border-neutral-300 transition-all"
          title="Agregar reacción"
        >
          +
        </button>

        {showPicker && (
          <div className="absolute bottom-full left-0 mb-1 flex gap-1 p-1.5 bg-white rounded-lg shadow-lg border border-neutral-200 z-10">
            {EMOJI_LIST.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleAddReaction(emoji)}
                className="w-7 h-7 flex items-center justify-center rounded hover:bg-neutral-100 text-base transition-colors"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
