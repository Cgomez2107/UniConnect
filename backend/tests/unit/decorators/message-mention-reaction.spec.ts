import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { BaseMessage } from "../../../services/messaging/src/domain/decorators/BaseMessage";
import { FileDecorator } from "../../../services/messaging/src/domain/decorators/FileDecorator";
import type { FileMetadata } from "../../../services/messaging/src/domain/decorators/FileDecorator";
import { MentionDecorator } from "../../../services/messaging/src/domain/decorators/MentionDecorator";
import type { Mention } from "../../../services/messaging/src/domain/decorators/MentionDecorator";
import { ReactionDecorator } from "../../../services/messaging/src/domain/decorators/ReactionDecorator";
import type { Reaction } from "../../../services/messaging/src/domain/decorators/ReactionDecorator";

describe("US-T01 Tarea 3 - Mencion, Reaccion y Composicion", () => {
  it("render() debe resaltar menciones con **@displayName**", () => {
    const base = new BaseMessage({
      id: "msg-mention-001",
      content: "Hola @Carlos @Sofia",
      timestamp: new Date("2026-04-29T17:00:00Z"),
      senderId: "user-20",
    });

    const mentions: Mention[] = [
      { userId: "carlos-001", displayName: "Carlos", position: 5 },
      { userId: "sofia-002", displayName: "Sofia", position: 13 },
    ];

    const decorated = new MentionDecorator(base, mentions);
    const rendered = decorated.render();

    assert(rendered.includes("**@Carlos**"));
    assert(rendered.includes("**@Sofia**"));
  });

  it("composicion: MensajeConMencion(MensajeConArchivo(MensajeBase))", () => {
    const base = new BaseMessage({
      id: "msg-compose-001",
      content: "Revisa @Ana el archivo",
      timestamp: new Date("2026-04-29T17:10:00Z"),
      senderId: "user-21",
    });

    const file: FileMetadata = {
      filename: "plan.pdf",
      size: 1024 * 128,
      mimeType: "application/pdf",
      url: "https://cdn.example.com/plan.pdf",
    };

    const withFile = new FileDecorator(base, file);

    const mentions: Mention[] = [
      { userId: "ana-001", displayName: "Ana", position: 7 },
    ];

    const withMention = new MentionDecorator(withFile, mentions);

    const rendered = withMention.render();
    assert(rendered.includes("**@Ana**"));

    const metadata = withMention.getMetadata();
    assert(metadata.file);
    assert(metadata.mentions);
  });

  it("reaccion: debe mantener mapa de emojis y contadores", () => {
    const base = new BaseMessage({
      id: "msg-reaction-001",
      content: "Buen trabajo",
      timestamp: new Date("2026-04-29T17:20:00Z"),
      senderId: "user-22",
    });

    const reactions: Reaction[] = [
      { emoji: "👍", count: 2, users: ["user-1", "user-2"] },
    ];

    const decorated = new ReactionDecorator(base, reactions);
    const list = decorated.getReactions();

    assert.equal(list.length, 1);
    assert.equal(list[0].emoji, "👍");
    assert.equal(list[0].count, 2);
  });
});
