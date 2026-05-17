import { ForumSubject } from "../../../src/domain/events/ForumSubject.js";
import { ForumRealtimeObserver } from "../../../src/domain/events/observers/ForumRealtimeObserver.js";
import type { SupabaseRealtimeGateway } from "../../../src/infrastructure/realtime/SupabaseRealtimeGateway.js";

describe("ForumObserver — notificación de votos", () => {
  it("al emitir un voto, el ForumRealtimeObserver recibe los datos correctos", async () => {
    const emitToUser = jest.fn().mockResolvedValue(undefined);
    const mockGateway: SupabaseRealtimeGateway = {
      emitToUser,
      dispose: jest.fn(),
    } as unknown as SupabaseRealtimeGateway;

    const subject = new ForumSubject();
    const observer = new ForumRealtimeObserver(mockGateway);
    subject.subscribe(observer);

    const voteEvent = {
      type: "VOTO_RECIBIDO" as const,
      version: "1.0" as const,
      timestamp: new Date("2026-05-13T12:00:00Z"),
      targetType: "question",
      targetId: "q-123",
      voteType: "upvote",
      newVoteCount: 5,
      voterId: "voter-1",
      targetAuthorId: "author-1",
    };

    await subject.emitVoteEvent(voteEvent);

    expect(emitToUser).toHaveBeenCalledTimes(1);
    expect(emitToUser).toHaveBeenCalledWith("author-1", "VOTE_RECEIVED", {
      targetType: "question",
      targetId: "q-123",
      voteType: "upvote",
      newVoteCount: 5,
      voterId: "voter-1",
      timestamp: "2026-05-13T12:00:00.000Z",
    });
  });
});
