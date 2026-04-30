import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { BaseMessage } from "../../../services/messaging/src/domain/decorators/BaseMessage";
import { FileDecorator } from "../../../services/messaging/src/domain/decorators/FileDecorator";
import type { FileMetadata } from "../../../services/messaging/src/domain/decorators/FileDecorator";
import { MentionDecorator } from "../../../services/messaging/src/domain/decorators/MentionDecorator";
import type { Mention } from "../../../services/messaging/src/domain/decorators/MentionDecorator";
import { ReactionDecorator } from "../../../services/messaging/src/domain/decorators/ReactionDecorator";
import type { Reaction } from "../../../services/messaging/src/domain/decorators/ReactionDecorator";
import type { IMessage } from "../../../services/messaging/src/domain/decorators/IMessage";

function acceptsMessage(message: IMessage): string {
  const metadata = message.getMetadata();
  assert(metadata.id);
  return message.render();
}

describe("US-T01 Tarea 4 - Cobertura y transparencia de IMessage", () => {
  it("debe aceptar BaseMessage donde se espera IMessage", () => {
    const base = new BaseMessage({
      id: "msg-cov-001",
      content: "Texto base",
      timestamp: new Date("2026-04-29T18:00:00Z"),
      senderId: "user-30",
    });

    const result = acceptsMessage(base);
    assert.equal(result, "Texto base");
  });

  it("debe aceptar mensaje decorado sin romper el contrato", () => {
    const base = new BaseMessage({
      id: "msg-cov-002",
      content: "Hola @Ana",
      timestamp: new Date("2026-04-29T18:05:00Z"),
      senderId: "user-31",
    });

    const file: FileMetadata = {
      filename: "notes.txt",
      size: 512,
      mimeType: "text/plain",
      url: "https://cdn.example.com/notes.txt",
    };

    const mentions: Mention[] = [
      { userId: "ana-001", displayName: "Ana", position: 5 },
    ];

    const reactions: Reaction[] = [
      { emoji: ":+1:", count: 1, users: ["user-31"] },
    ];

    const decorated = new ReactionDecorator(
      new MentionDecorator(new FileDecorator(base, file), mentions),
      reactions,
    );

    const result = acceptsMessage(decorated);
    assert(result.includes("**@Ana**"));
  });
});
