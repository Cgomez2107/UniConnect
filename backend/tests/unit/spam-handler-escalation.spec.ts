import { describe, it, expect, vi, beforeEach } from "vitest";
import { SpamHandler, type IModerationRepository } from "../../shared/patterns/chain/message/SpamHandler.js";

describe("SpamHandler Escalation Rules", () => {
  let mockRepo: IModerationRepository;

  beforeEach(() => {
    mockRepo = {
      isUserBlocked: vi.fn(),
      blockUser: vi.fn(),
      recordMessageTimestamp: vi.fn(),
      getUserBlockExpiration: vi.fn(),
      recordBlockEvent: vi.fn(),
      countBlocksInLastHour: vi.fn(),
    };
  });

  it("should return valido: true when user is not blocked and send count <= 5", async () => {
    (mockRepo.isUserBlocked as any).mockResolvedValue(false);
    (mockRepo.getUserBlockExpiration as any).mockResolvedValue(null);
    (mockRepo.recordMessageTimestamp as any).mockResolvedValue(3); // 3 messages in 30s
    (mockRepo.countBlocksInLastHour as any).mockResolvedValue(0);

    const handler = new SpamHandler(mockRepo);
    const result = await handler.manejar("hello world", { senderId: "user-1" });

    expect(result.valido).toBe(true);
    expect(mockRepo.blockUser).not.toHaveBeenCalled();
  });

  it("should block user and return MO_003 when messages exceed 5 and blocks < 3", async () => {
    (mockRepo.isUserBlocked as any).mockResolvedValue(false);
    (mockRepo.getUserBlockExpiration as any).mockResolvedValue(null);
    (mockRepo.recordMessageTimestamp as any).mockResolvedValue(6); // 6 messages in 30s
    (mockRepo.countBlocksInLastHour as any).mockResolvedValue(1); // 1 block overall after this event

    const handler = new SpamHandler(mockRepo);
    const result = await handler.manejar("hello world", { senderId: "user-1" });

    expect(result.valido).toBe(false);
    expect(result.codigoError).toBe("MO_003");
    expect(mockRepo.blockUser).toHaveBeenCalledWith("user-1", 5, expect.any(String));
    expect(mockRepo.recordBlockEvent).toHaveBeenCalledWith("user-1", expect.any(String));
  });

  it("should return MO_004 when user has >= 3 blocks in the last hour and triggers a block", async () => {
    (mockRepo.isUserBlocked as any).mockResolvedValue(false);
    (mockRepo.getUserBlockExpiration as any).mockResolvedValue(null);
    (mockRepo.recordMessageTimestamp as any).mockResolvedValue(6); // 6 messages in 30s
    (mockRepo.countBlocksInLastHour as any).mockResolvedValue(3); // 3 blocks

    const handler = new SpamHandler(mockRepo);
    const result = await handler.manejar("hello world", { senderId: "user-1" });

    expect(result.valido).toBe(false);
    expect(result.codigoError).toBe("MO_004");
    expect(result.mensajeError).toContain("escalado a revisión humana");
  });

  it("should return MO_004 directly if the user is already blocked and has >= 3 blocks in the last hour", async () => {
    const futureDate = new Date(Date.now() + 2 * 60 * 1000); // blocked for 2 more minutes
    (mockRepo.getUserBlockExpiration as any).mockResolvedValue(futureDate);
    (mockRepo.countBlocksInLastHour as any).mockResolvedValue(3); // 3 blocks

    const handler = new SpamHandler(mockRepo);
    const result = await handler.manejar("hello world", { senderId: "user-1" });

    expect(result.valido).toBe(false);
    expect(result.codigoError).toBe("MO_004");
  });
});
