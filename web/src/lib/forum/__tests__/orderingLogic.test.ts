import { describe, it, expect } from "vitest";
import { ordenarRespuestas } from "../orderingLogic";

describe("ordenarRespuestas", () => {
  it("should return empty array when given empty array", () => {
    expect(ordenarRespuestas([])).toEqual([]);
  });

  it("should place solution first regardless of vote count", () => {
    const answers = [
      { id: "1", isSolution: false, voteCount: 10, createdAt: "2024-01-01" },
      { id: "2", isSolution: true, voteCount: 2, createdAt: "2024-01-02" },
    ];
    const result = ordenarRespuestas(answers);
    expect(result[0].id).toBe("2");
    expect(result[1].id).toBe("1");
  });

  it("should sort non-solution answers by vote count descending", () => {
    const answers = [
      { id: "1", isSolution: false, voteCount: 5, createdAt: "2024-01-01" },
      { id: "2", isSolution: false, voteCount: 15, createdAt: "2024-01-02" },
      { id: "3", isSolution: false, voteCount: 1, createdAt: "2024-01-03" },
    ];
    const result = ordenarRespuestas(answers);
    expect(result.map((a) => a.id)).toEqual(["2", "1", "3"]);
  });

  it("should handle multiple solutions (all at top, then by votes)", () => {
    const answers = [
      { id: "1", isSolution: true, voteCount: 1, createdAt: "2024-01-01" },
      { id: "2", isSolution: false, voteCount: 99, createdAt: "2024-01-02" },
      { id: "3", isSolution: true, voteCount: 50, createdAt: "2024-01-03" },
    ];
    const result = ordenarRespuestas(answers);
    expect(result[0].id).toBe("1");
    expect(result[1].id).toBe("3");
    expect(result[2].id).toBe("2");
  });

  it("should sort by vote count when both are (non) solutions", () => {
    const answers = [
      { id: "a", isSolution: false, voteCount: 10, createdAt: "2024-01-01" },
      { id: "b", isSolution: false, voteCount: 30, createdAt: "2024-01-02" },
      { id: "c", isSolution: false, voteCount: 20, createdAt: "2024-01-03" },
    ];
    const result = ordenarRespuestas(answers);
    expect(result.map((a) => a.id)).toEqual(["b", "c", "a"]);
  });

  it("should not mutate the original array", () => {
    const answers = [
      { id: "1", isSolution: false, voteCount: 1, createdAt: "2024-01-01" },
      { id: "2", isSolution: true, voteCount: 99, createdAt: "2024-01-02" },
    ];
    const original = [...answers];
    ordenarRespuestas(answers);
    expect(answers).toEqual(original);
  });
});
