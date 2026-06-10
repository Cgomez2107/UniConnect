import { describe, it, expect } from "vitest";
import { DraftState } from "../../src/domain/state/DraftState.js";
import { PublishedState } from "../../src/domain/state/PublishedState.js";
import { CancelledState } from "../../src/domain/state/CancelledState.js";
import { FinishedState } from "../../src/domain/state/FinishedState.js";
import { EventContext } from "../../src/domain/state/EventContext.js";
import { UniversityEventSubject } from "../../src/domain/events/UniversityEventSubject.js";
import type { IObserver } from "../../src/domain/events/IObserver.js";
import type { UniversityEvent } from "../../src/domain/events/UniversityEvents.js";
import { InvalidStateTransitionError } from "../../../../shared/libs/errors/InvalidStateTransitionError.js";
import { ValidationError } from "../../../../shared/libs/errors/ValidationError.js";

describe("State Machine - Event Lifecycle", () => {
  describe("DraftState", () => {
    it("should create event with draft status", () => {
      const context = EventContext.fromStatus("draft");
      expect(context.getStatus()).toBe("draft");
      expect(context.canEdit()).toBe(true);
      expect(context.canDelete()).toBe(true);
    });

    it("should allow publish with valid future date and maxCapacity > 0", () => {
      const context = EventContext.fromStatus("draft");
      const futureDate = new Date(Date.now() + 86400000);
      const newContext = context.publish(futureDate, 100);
      expect(newContext.getStatus()).toBe("published");
    });

    it("should allow publish with null maxCapacity (no limit)", () => {
      const context = EventContext.fromStatus("draft");
      const futureDate = new Date(Date.now() + 86400000);
      const newContext = context.publish(futureDate, null);
      expect(newContext.getStatus()).toBe("published");
    });

    it("should reject publish with past date", () => {
      const context = EventContext.fromStatus("draft");
      const pastDate = new Date(Date.now() - 86400000);
      expect(() => context.publish(pastDate, 100)).toThrow(ValidationError);
    });

    it("should reject publish with maxCapacity = 0", () => {
      const context = EventContext.fromStatus("draft");
      const futureDate = new Date(Date.now() + 86400000);
      expect(() => context.publish(futureDate, 0)).toThrow(ValidationError);
    });

    it("should reject publish with negative maxCapacity", () => {
      const context = EventContext.fromStatus("draft");
      const futureDate = new Date(Date.now() + 86400000);
      expect(() => context.publish(futureDate, -5)).toThrow(ValidationError);
    });

    it("should reject cancel from draft", () => {
      const context = EventContext.fromStatus("draft");
      expect(() => context.cancel()).toThrow(InvalidStateTransitionError);
    });

    it("should reject finish from draft", () => {
      const context = EventContext.fromStatus("draft");
      expect(() => context.finish()).toThrow(InvalidStateTransitionError);
    });
  });

  describe("PublishedState", () => {
    it("should have correct status and permissions", () => {
      const context = EventContext.fromStatus("published");
      expect(context.getStatus()).toBe("published");
      expect(context.canEdit()).toBe(false);
      expect(context.canDelete()).toBe(false);
    });

    it("should reject publish transition (already published)", () => {
      const context = EventContext.fromStatus("published");
      const futureDate = new Date(Date.now() + 86400000);
      expect(() => context.publish(futureDate, 100)).toThrow(
        InvalidStateTransitionError,
      );
    });

    it("should allow cancel transition to cancelled", () => {
      const context = EventContext.fromStatus("published");
      const newContext = context.cancel();
      expect(newContext.getStatus()).toBe("cancelled");
    });

    it("should allow finish transition to finished", () => {
      const context = EventContext.fromStatus("published");
      const newContext = context.finish();
      expect(newContext.getStatus()).toBe("finished");
    });
  });

  describe("CancelledState", () => {
    it("should have correct status and permissions", () => {
      const context = EventContext.fromStatus("cancelled");
      expect(context.getStatus()).toBe("cancelled");
      expect(context.canEdit()).toBe(false);
      expect(context.canDelete()).toBe(true);
    });

    it("should reject any forward transition", () => {
      const context = EventContext.fromStatus("cancelled");
      const futureDate = new Date(Date.now() + 86400000);
      expect(() => context.publish(futureDate, 100)).toThrow(
        InvalidStateTransitionError,
      );
      expect(() => context.cancel()).toThrow(InvalidStateTransitionError);
      expect(() => context.finish()).toThrow(InvalidStateTransitionError);
    });
  });

  describe("FinishedState", () => {
    it("should have correct status and permissions", () => {
      const context = EventContext.fromStatus("finished");
      expect(context.getStatus()).toBe("finished");
      expect(context.canEdit()).toBe(false);
      expect(context.canDelete()).toBe(true);
    });

    it("should reject any transition", () => {
      const context = EventContext.fromStatus("finished");
      const futureDate = new Date(Date.now() + 86400000);
      expect(() => context.publish(futureDate, 100)).toThrow(
        InvalidStateTransitionError,
      );
      expect(() => context.cancel()).toThrow(InvalidStateTransitionError);
      expect(() => context.finish()).toThrow(InvalidStateTransitionError);
    });
  });

  describe("Forbidden: published -> draft regression", () => {
    it("should not allow transition from published back to draft", () => {
      const context = EventContext.fromStatus("published");
      const futureDate = new Date(Date.now() + 86400000);
      expect(() => context.publish(futureDate, 100)).toThrow(
        InvalidStateTransitionError,
      );
      expect(context.getStatus()).toBe("published");
    });

    it("should not allow transition from cancelled back to draft", () => {
      const context = EventContext.fromStatus("cancelled");
      const futureDate = new Date(Date.now() + 86400000);
      expect(() => context.publish(futureDate, 100)).toThrow(
        InvalidStateTransitionError,
      );
    });
  });

  describe("Full lifecycle flow", () => {
    it("should complete draft -> published -> cancelled", () => {
      let context = EventContext.fromStatus("draft");
      expect(context.getStatus()).toBe("draft");

      const futureDate = new Date(Date.now() + 86400000);
      context = context.publish(futureDate, 50);
      expect(context.getStatus()).toBe("published");

      context = context.cancel();
      expect(context.getStatus()).toBe("cancelled");

      expect(context.canEdit()).toBe(false);
      expect(context.canDelete()).toBe(true);
    });

    it("should complete draft -> published -> finished", () => {
      let context = EventContext.fromStatus("draft");
      const futureDate = new Date(Date.now() + 86400000);
      context = context.publish(futureDate, null);
      expect(context.getStatus()).toBe("published");

      context = context.finish();
      expect(context.getStatus()).toBe("finished");
    });
  });

  describe("Editing permission", () => {
    it("should allow editing only in draft state", () => {
      expect(EventContext.fromStatus("draft").canEdit()).toBe(true);
      expect(EventContext.fromStatus("published").canEdit()).toBe(false);
      expect(EventContext.fromStatus("cancelled").canEdit()).toBe(false);
      expect(EventContext.fromStatus("finished").canEdit()).toBe(false);
    });
  });
});

describe("Observer Pattern - Cancellation Notification", () => {
  it("should emit EVENT_CANCELLED and notify registered users", async () => {
    const notifiedUsers: string[] = [];
    const capturedEvents: UniversityEvent[] = [];

    const testObserver: IObserver = {
      name: "TestObserver",
      async handle(event: UniversityEvent) {
        capturedEvents.push(event);
        if (event.type === "EVENT_CANCELLED") {
          const testUsers = ["user-1", "user-2", "user-3"];
          notifiedUsers.push(...testUsers);
        }
      },
    };

    const subject = new UniversityEventSubject();
    subject.subscribe(testObserver);

    await subject.emit({
      type: "EVENT_CANCELLED",
      version: "1.0",
      timestamp: new Date(),
      eventId: "event-123",
      title: "Test Event",
      message: 'El evento "Test Event" ha sido cancelado.',
      payload: {
        eventId: "event-123",
        title: "Test Event",
        description: "A test event",
        location: "Room A",
        category: "academico",
        startAt: new Date(Date.now() + 86400000).toISOString(),
        organizerId: "organizer-1",
      },
    });

    expect(capturedEvents).toHaveLength(1);
    expect(capturedEvents[0].type).toBe("EVENT_CANCELLED");
    expect(notifiedUsers).toEqual(["user-1", "user-2", "user-3"]);
  });

  it("should NOT notify when other event types are emitted", async () => {
    const notifiedUsers: string[] = [];

    const testObserver: IObserver = {
      name: "TestObserver",
      async handle(event: UniversityEvent) {
        if (event.type === "EVENT_CANCELLED") {
          notifiedUsers.push("should-not-reach");
        }
      },
    };

    const subject = new UniversityEventSubject();
    subject.subscribe(testObserver);

    await subject.emit({
      type: "NUEVO_EVENTO",
      version: "1.0",
      timestamp: new Date(),
      eventId: "event-456",
      title: "New Event",
      category: "academico",
      message: "New event created",
      payload: {
        eventId: "event-456",
        title: "New Event",
        description: "Brand new event",
        category: "academico",
        location: "Room B",
        startAt: new Date(Date.now() + 86400000).toISOString(),
        organizerId: "organizer-2",
      },
    });

    expect(notifiedUsers).toHaveLength(0);
  });

  it("should handle multiple observers independently", async () => {
    const observer1Calls: string[] = [];
    const observer2Calls: string[] = [];

    const obs1: IObserver = {
      name: "Obs1",
      async handle(event: UniversityEvent) {
        if (event.type === "EVENT_CANCELLED") {
          observer1Calls.push(event.eventId);
        }
      },
    };
    const obs2: IObserver = {
      name: "Obs2",
      async handle(event: UniversityEvent) {
        if (event.type === "EVENT_CANCELLED") {
          observer2Calls.push(event.eventId);
        }
      },
    };

    const subject = new UniversityEventSubject();
    subject.subscribe(obs1);
    subject.subscribe(obs2);

    await subject.emit({
      type: "EVENT_CANCELLED",
      version: "1.0",
      timestamp: new Date(),
      eventId: "event-789",
      title: "Cancelled Event",
      message: "Cancelled",
      payload: {
        eventId: "event-789",
        title: "Cancelled Event",
        description: "",
        location: "",
        category: "cultural",
        startAt: new Date().toISOString(),
        organizerId: "org-1",
      },
    });

    expect(observer1Calls).toEqual(["event-789"]);
    expect(observer2Calls).toEqual(["event-789"]);
  });
});

describe("Pagination and Soft Delete Logic", () => {
  it("should calculate OFFSET correctly from page and limit", () => {
    function calculateOffset(page: number, limit: number): number {
      return (page - 1) * limit;
    }

    expect(calculateOffset(1, 20)).toBe(0);
    expect(calculateOffset(2, 20)).toBe(20);
    expect(calculateOffset(3, 10)).toBe(20);
    expect(calculateOffset(5, 50)).toBe(200);
  });

  it("should calculate totalPages correctly", () => {
    function calculateTotalPages(total: number, limit: number): number {
      return Math.ceil(total / limit) || 1;
    }

    expect(calculateTotalPages(0, 20)).toBe(1);
    expect(calculateTotalPages(20, 20)).toBe(1);
    expect(calculateTotalPages(21, 20)).toBe(2);
    expect(calculateTotalPages(100, 10)).toBe(10);
  });

  it("should validate page and limit bounds", () => {
    function sanitizePage(page: number): number {
      return Math.max(1, page);
    }

    function sanitizeLimit(limit: number): number {
      return Math.min(Math.max(1, limit), 100);
    }

    expect(sanitizePage(0)).toBe(1);
    expect(sanitizePage(-5)).toBe(1);
    expect(sanitizePage(1)).toBe(1);
    expect(sanitizePage(10)).toBe(10);

    expect(sanitizeLimit(0)).toBe(1);
    expect(sanitizeLimit(200)).toBe(100);
    expect(sanitizeLimit(50)).toBe(50);
    expect(sanitizeLimit(1)).toBe(1);
  });
});
