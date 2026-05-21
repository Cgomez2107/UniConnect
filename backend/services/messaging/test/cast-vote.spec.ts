import assert from "node:assert/strict";
import { describe, it, before } from "node:test";

import type { ChatEvent, ChatChannel } from "../src/domain/events/ChatEvents.js";
import { ChatSubject, type IChatObserver } from "../src/domain/events/ChatSubject.js";
import { CastVoteUseCase } from "../src/application/use-cases/CastVoteUseCase.js";
import { DuplicateVoteError } from "../src/domain/errors/DuplicateVoteError.js";
import { PollClosedError } from "../src/domain/errors/PollClosedError.js";
import { InMemoryMessagingRepository } from "../src/infrastructure/database/InMemoryMessagingRepository.js";
import type { CreatePollConfigInput, PollOptionResult } from "../src/interfaces/http/dto/PollDTOs.js";

class MockObserver implements IChatObserver {
  readonly name = "MockObserver";
  readonly received: Array<{ event: ChatEvent; channel: ChatChannel }> = [];

  async handle(event: ChatEvent, channel: ChatChannel): Promise<void> {
    this.received.push({ event, channel });
  }
}

const POLL_INPUT: CreatePollConfigInput = {
  messageId: "msg-poll-1",
  groupId: "group-test-1",
  createdBy: "user-creator",
  question: "¿Cuál es tu lenguaje favorito?",
  options: ["TypeScript", "Python", "Rust", "Go"],
  expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
};

describe("CastVoteUseCase", () => {
  describe("voto exitoso", () => {
    const repository = new InMemoryMessagingRepository();
    const subject = new ChatSubject("test-subject");
    const observer = new MockObserver();
    subject.subscribeAll(observer);
    const useCase = new CastVoteUseCase(repository, subject);

    let pollId: string;

    before(async () => {
      const config = await repository.createPollConfig(POLL_INPUT);
      pollId = config.pollId;
    });

    it("retorna resultados con porcentajes correctos tras el primer voto", async () => {
      const result = await useCase.execute(pollId, "user-a", 0);

      assert.equal(result.success, true);
      assert.equal(result.pollId, pollId);
      assert.equal(result.userId, "user-a");
      assert.equal(result.selectedOption, 0);
      assert.equal(result.totalVotes, 1);

      const ts = result.results[0];
      assert.equal(ts.option, "TypeScript");
      assert.equal(ts.count, 1);
      assert.equal(ts.percentage, 100);
    });

    it("calcula porcentajes correctos con múltiples votos", async () => {
      await useCase.execute(pollId, "user-b", 0);
      await useCase.execute(pollId, "user-c", 1);
      await useCase.execute(pollId, "user-d", 2);

      const result = await useCase.execute(pollId, "user-e", 0);
      assert.equal(result.totalVotes, 5);

      const ts = result.results[0];
      const py = result.results[1];
      const rs = result.results[2];
      const go = result.results[3];

      assert.equal(ts.option, "TypeScript");
      assert.equal(ts.count, 3);
      assert.equal(ts.percentage, 60);

      assert.equal(py.option, "Python");
      assert.equal(py.count, 1);
      assert.equal(py.percentage, 20);

      assert.equal(rs.option, "Rust");
      assert.equal(rs.count, 1);
      assert.equal(rs.percentage, 20);

      assert.equal(go.option, "Go");
      assert.equal(go.count, 0);
      assert.equal(go.percentage, 0);
    });

    it("emite evento POLL_VOTE_REGISTERED al observer via subscribeAll", async () => {
      assert.equal(observer.received.length, 5);
      const lastEvent = observer.received[observer.received.length - 1].event;
      if (lastEvent.type !== "POLL_VOTE_REGISTERED") {
        assert.fail("Se esperaba evento POLL_VOTE_REGISTERED");
      }
      assert.equal(lastEvent.pollId, pollId);
      assert.equal(lastEvent.userId, "user-e");
      assert.equal(lastEvent.selectedOption, 0);
      assert.equal(lastEvent.totalVotes, 5);
    });
  });

  describe("doble voto", () => {
    const repository = new InMemoryMessagingRepository();
    const subject = new ChatSubject("test-subject");
    const observer = new MockObserver();
    subject.subscribeAll(observer);
    const useCase = new CastVoteUseCase(repository, subject);

    let pollId: string;

    before(async () => {
      const config = await repository.createPollConfig(POLL_INPUT);
      pollId = config.pollId;
    });

    it("lanza DuplicateVoteError al votar dos veces el mismo usuario", async () => {
      await useCase.execute(pollId, "user-x", 1);

      await assert.rejects(
        async () => {
          await useCase.execute(pollId, "user-x", 2);
        },
        (error: unknown) => {
          assert.ok(error instanceof DuplicateVoteError);
          assert.equal((error as DuplicateVoteError).code, "DUPLICATE_VOTE");
          return true;
        },
      );
    });

    it("no altera los totales tras doble voto rechazado", async () => {
      const results = await repository.getPollResults(pollId);
      assert.equal(results.totalVotes, 1);
    });
  });

  describe("encuesta cerrada", () => {
    const repository = new InMemoryMessagingRepository();
    const subject = new ChatSubject("test-subject");
    const observer = new MockObserver();
    subject.subscribeAll(observer);
    const useCase = new CastVoteUseCase(repository, subject);

    let pollId: string;

    before(async () => {
      const config = await repository.createPollConfig({
        ...POLL_INPUT,
        expiresAt: new Date(Date.now() - 86_400_000).toISOString(),
      });
      pollId = config.pollId;
      await repository.closeExpiredPolls();
    });

    it("lanza PollClosedError al votar en encuesta cerrada", async () => {
      await assert.rejects(
        async () => {
          await useCase.execute(pollId, "user-new", 0);
        },
        (error: unknown) => {
          assert.ok(error instanceof PollClosedError);
          assert.equal((error as PollClosedError).code, "POLL_CLOSED");
          return true;
        },
      );
    });
  });
});
