import type { ReactNode } from "react";

export interface MentionData {
  userId: string;
  displayName: string;
  position: number;
}

export interface ReactionData {
  emoji: string;
  count: number;
  users: string[];
}

export interface PollOptionData {
  text: string;
  votes: string[];
}

export interface PollData {
  question: string;
  options: PollOptionData[];
  isOpen: boolean;
  closesAt: string | null;
  createdAt: string;
}

export interface FileData {
  url: string;
  mimeType: string;
  filename: string;
  size: number;
}

export interface IRenderContext {
  currentUserId?: string;
  memberNameMap?: Map<string, string>;
  viewFile?: (file: FileData) => void;
}

export interface IMessage {
  readonly id: string;
  readonly content: string;
  readonly senderId: string;
  readonly timestamp: Date;
  getContent(): string;
  getMetadata(): Record<string, unknown>;
  render(context?: IRenderContext): ReactNode;
}
