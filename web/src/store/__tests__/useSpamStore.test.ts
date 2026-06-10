import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { useSpamStore } from "../useSpamStore";

vi.mock("zustand/middleware", async () => {
  const actual = await vi.importActual("zustand/middleware");
  return {
    ...actual,
    persist: (config: any, _options: any) => config,
    createJSONStorage: () => ({
      getItem: async () => null,
      setItem: async () => {},
      removeItem: async () => {},
    }),
  };
});

describe("useSpamStore", () => {
  beforeEach(() => {
    useSpamStore.setState({
      isBlocked: false,
      blockUntil: null,
      remainingTime: 0,
      blockReason: null,
    });
  });

  it("should initialize with unblocked state", () => {
    const state = useSpamStore.getState();
    expect(state.isBlocked).toBe(false);
    expect(state.blockUntil).toBeNull();
    expect(state.remainingTime).toBe(0);
    expect(state.blockReason).toBeNull();
  });

  it("should set blocked state with remaining time", () => {
    vi.useFakeTimers();
    const now = Date.now();
    vi.setSystemTime(now);

    useSpamStore.getState().setBlocked(300000, "MO_003");

    const state = useSpamStore.getState();
    expect(state.isBlocked).toBe(true);
    expect(state.blockUntil).toBe(now + 300000);
    expect(state.remainingTime).toBe(300);
    expect(state.blockReason).toBe("MO_003");

    vi.useRealTimers();
  });

  it("should set blocked state with MO_004 escalation code", () => {
    vi.useFakeTimers();
    vi.setSystemTime(Date.now());

    useSpamStore.getState().setBlocked(600000, "MO_004");

    const state = useSpamStore.getState();
    expect(state.isBlocked).toBe(true);
    expect(state.blockReason).toBe("MO_004");
    expect(state.remainingTime).toBe(600);

    vi.useRealTimers();
  });

  it("should default blockReason to MO_003 when not provided", () => {
    vi.useFakeTimers();
    vi.setSystemTime(Date.now());

    useSpamStore.getState().setBlocked(300000);

    const state = useSpamStore.getState();
    expect(state.blockReason).toBe("MO_003");

    vi.useRealTimers();
  });

  it("should round remaining time up to nearest second", () => {
    vi.useFakeTimers();
    vi.setSystemTime(Date.now());

    useSpamStore.getState().setBlocked(1500);

    expect(useSpamStore.getState().remainingTime).toBe(2);

    useSpamStore.setState({ isBlocked: false, blockUntil: null, remainingTime: 0, blockReason: null });
    useSpamStore.getState().setBlocked(1000);

    expect(useSpamStore.getState().remainingTime).toBe(1);

    vi.useRealTimers();
  });

  it("should clear block state", () => {
    vi.useFakeTimers();
    vi.setSystemTime(Date.now());

    useSpamStore.getState().setBlocked(300000, "MO_003");
    expect(useSpamStore.getState().isBlocked).toBe(true);

    useSpamStore.getState().clearBlock();

    const state = useSpamStore.getState();
    expect(state.isBlocked).toBe(false);
    expect(state.blockUntil).toBeNull();
    expect(state.remainingTime).toBe(0);
    expect(state.blockReason).toBeNull();

    vi.useRealTimers();
  });

  it("should recalculate remaining time on checkBlockStatus when block is active", () => {
    vi.useFakeTimers();
    const now = Date.now();
    vi.setSystemTime(now);

    useSpamStore.getState().setBlocked(300000, "MO_003");

    vi.advanceTimersByTime(10000);

    useSpamStore.getState().checkBlockStatus();

    const state = useSpamStore.getState();
    expect(state.isBlocked).toBe(true);
    expect(state.remainingTime).toBe(290);

    vi.useRealTimers();
  });

  it("should clear block on checkBlockStatus when block has expired", () => {
    vi.useFakeTimers();
    const now = Date.now();
    vi.setSystemTime(now);

    useSpamStore.getState().setBlocked(1000, "MO_003");

    vi.advanceTimersByTime(1500);

    useSpamStore.getState().checkBlockStatus();

    const state = useSpamStore.getState();
    expect(state.isBlocked).toBe(false);
    expect(state.blockUntil).toBeNull();
    expect(state.remainingTime).toBe(0);
    expect(state.blockReason).toBeNull();

    vi.useRealTimers();
  });

  it("should handle edge case where blockUntil is null but isBlocked is true", () => {
    useSpamStore.setState({
      isBlocked: true,
      blockUntil: null,
      remainingTime: 999,
      blockReason: "MO_003",
    });

    useSpamStore.getState().checkBlockStatus();

    const state = useSpamStore.getState();
    expect(state.isBlocked).toBe(false);
    expect(state.remainingTime).toBe(0);
  });
});
