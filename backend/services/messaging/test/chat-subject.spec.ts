import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { ChatChannel, ChatEvent } from "../src/domain/events/ChatEvents.js";
import { ChatSubject, type IChatObserver } from "../src/domain/events/ChatSubject.js";

class MockObserver implements IChatObserver {
  readonly name: string;

  readonly received: Array<{ event: ChatEvent; channel: ChatChannel }> = [];

  constructor(name: string = "MockObserver") {
    this.name = name;
  }

  async handle(event: ChatEvent, channel: ChatChannel): Promise<void> {
    this.received.push({ event, channel });
  }
}

describe("ChatSubject integration", () => {
  it("entrega el evento al observer del canal suscrito", async () => {
    const subject = new ChatSubject("ChatSubjectTest");
    const observer = new MockObserver("Observer-DM");

    const channel: ChatChannel = "dm:1:2";
    const event: ChatEvent = {
      type: "NUEVO_MENSAJE",
      version: "1.0",
      timestamp: new Date("2026-04-29T11:05:00.000Z"),
      messageId: "msg-int-1",
      conversationId: "dm-1-2",
      senderId: "1",
      senderName: "User One",
      content: "Hola desde test de integracion",
      conversationType: "dm",
      payload: {
        text: "Hola desde test de integracion",
      },
    };

    subject.subscribe(channel, observer);
    await subject.emit(channel, event);

    assert.equal(observer.received.length, 1);
    assert.deepEqual(observer.received[0].event, event);
    assert.equal(observer.received[0].channel, channel);
  });
});
