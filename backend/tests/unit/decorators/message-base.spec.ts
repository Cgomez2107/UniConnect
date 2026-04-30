import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { BaseMessage } from "../../../services/messaging/src/domain/decorators/BaseMessage";

describe("US-T01 Tarea 1 - MensajeBase", () => {
  it("debe asignar content, userId y timestamp correctamente", () => {
    const timestamp = new Date("2026-04-29T15:00:00Z");
    const message = new BaseMessage({
      id: "msg-001",
      content: "Texto plano",
      timestamp,
      senderId: "user-001",
    });

    assert.equal(message.content, "Texto plano");
    assert.equal(message.senderId, "user-001");
    assert.equal(message.timestamp, timestamp);
  });

  it("getMetadata() debe retornar estructura base sin campos de decoradores", () => {
    const timestamp = new Date("2026-04-29T15:05:00Z");
    const message = new BaseMessage({
      id: "msg-002",
      content: "Solo contenido",
      timestamp,
      senderId: "user-002",
    });

    const metadata = message.getMetadata();

    assert.equal(metadata.id, "msg-002");
    assert.equal(metadata.senderId, "user-002");
    assert.equal(metadata.timestamp, "2026-04-29T15:05:00.000Z");
    assert.equal(metadata.content, "Solo contenido");

    assert.equal("file" in metadata, false);
    assert.equal("mentions" in metadata, false);
    assert.equal("reactions" in metadata, false);
  });

  it("render() debe retornar solo el texto plano", () => {
    const message = new BaseMessage({
      id: "msg-003",
      content: "Mensaje sin decoradores",
      timestamp: new Date("2026-04-29T15:10:00Z"),
      senderId: "user-003",
    });

    assert.equal(message.render(), "Mensaje sin decoradores");
  });
});
