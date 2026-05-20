/**
 * Unit tests para useMessageValidation hook (Web)
 */

import { renderHook, act, waitFor } from "@testing-library/react";
import { useMessageValidation } from "../useMessageValidation";
import { ValidationErrorCode } from "@uniconnect/shared-types";

describe("useMessageValidation Hook", () => {
  describe("Basic Validation", () => {
    it("should initialize with valid state", () => {
      const { result } = renderHook(() => useMessageValidation());
      expect(result.current.validationState.isValid).toBe(true);
      expect(result.current.validationState.isValidating).toBe(false);
    });

    it("should detect message too long", async () => {
      const { result } = renderHook(() => useMessageValidation());
      const longMessage = "x".repeat(5001);

      await act(async () => {
        await result.current.validateMessage(longMessage);
      });

      expect(result.current.validationState.isValid).toBe(false);
      expect(result.current.validationState.error?.code).toBe(
        ValidationErrorCode.MESSAGE_TOO_LONG
      );
    });

    it("should warn when approaching character limit", async () => {
      const { result } = renderHook(() => useMessageValidation());
      const almostFullMessage = "x".repeat(4600);

      await act(async () => {
        await result.current.validateMessage(almostFullMessage);
      });

      expect(result.current.validationState.isValid).toBe(true);
      expect(result.current.validationState.warnings?.length).toBeGreaterThan(0);
    });

    it("should detect forbidden words", async () => {
      const { result } = renderHook(() => useMessageValidation());

      await act(async () => {
        await result.current.validateMessage("esto es spam");
      });

      expect(result.current.validationState.isValid).toBe(false);
      expect(result.current.validationState.error?.code).toBe(
        ValidationErrorCode.BANNED_CONTENT
      );
    });
  });

  describe("Empty Message Handling", () => {
    it("should allow empty message (requires file in real scenario)", async () => {
      const { result } = renderHook(() => useMessageValidation());

      await act(async () => {
        await result.current.validateMessage("");
      });

      // Empty message is valid - requires file attached
      expect(result.current.validationState.isValid).toBe(true);
    });
  });

  describe("Debouncing", () => {
    it("should debounce validation", async () => {
      const { result } = renderHook(() =>
        useMessageValidation({ debounceMs: 100 })
      );

      await act(async () => {
        const promise1 = result.current.validateMessage("test 1");
        const promise2 = result.current.validateMessage("test 2");

        await Promise.all([promise1, promise2]);
      });

      // Only last validation should matter
      expect(result.current.validationState.isValid).toBe(true);
    });
  });

  describe("Cleanup", () => {
    it("should clear validation state", async () => {
      const { result } = renderHook(() => useMessageValidation());

      await act(async () => {
        await result.current.validateMessage("x".repeat(5001));
      });

      expect(result.current.validationState.isValid).toBe(false);

      act(() => {
        result.current.clearValidation();
      });

      expect(result.current.validationState.isValid).toBe(true);
      expect(result.current.validationState.error).toBeUndefined();
    });
  });
});

/**
 * Unit tests para useFileValidation hook
 */

describe("useFileValidation Hook", () => {
  it("should validate file type", async () => {
    const { result } = renderHook(() => useFileValidation());

    const validFile = new File(["content"], "test.pdf", {
      type: "application/pdf",
    });

    const validation = await act(async () => {
      return result.current.validateFile(validFile);
    });

    expect(validation.isValid).toBe(true);
  });

  it("should reject unsupported file type", async () => {
    const { result } = renderHook(() => useFileValidation());

    const invalidFile = new File(["content"], "test.exe", {
      type: "application/x-executable",
    });

    const validation = await act(async () => {
      return result.current.validateFile(invalidFile);
    });

    expect(validation.isValid).toBe(false);
    expect(validation.error).toBeDefined();
  });

  it("should reject files that are too large", async () => {
    const { result } = renderHook(() => useFileValidation({ maxSizeMb: 1 }));

    // Create file > 1 MB
    const largeFile = new File([new ArrayBuffer(2 * 1024 * 1024)], "large.pdf", {
      type: "application/pdf",
    });

    const validation = await act(async () => {
      return result.current.validateFile(largeFile);
    });

    expect(validation.isValid).toBe(false);
    expect(validation.error).toContain("demasiado grande");
  });
});
