/**
 * Unit tests para useMessageAutocomplete hook
 */

import { renderHook, act } from "@testing-library/react";
import { useMessageAutocomplete, AutocompleteUser } from "../useMessageAutocomplete";

const mockUsers: AutocompleteUser[] = [
  { id: "1", name: "Alice Garcia", email: "alice@example.com" },
  { id: "2", name: "Bob Lopez", email: "bob@example.com" },
  { id: "3", name: "Carlos Martín", email: "carlos@example.com" },
];

describe("useMessageAutocomplete Hook", () => {
  describe("Mention Detection", () => {
    it("should detect @ mention", () => {
      const { result } = renderHook(() =>
        useMessageAutocomplete({ users: mockUsers })
      );

      act(() => {
        result.current.handleInput("Hello @alic", 11);
      });

      expect(result.current.autocompleteState.isActive).toBe(true);
      expect(result.current.autocompleteState.searchTerm).toBe("alic");
    });

    it("should not activate if @ not at word boundary", () => {
      const { result } = renderHook(() =>
        useMessageAutocomplete({ users: mockUsers })
      );

      act(() => {
        result.current.handleInput("hello@world.com", 15);
      });

      expect(result.current.autocompleteState.isActive).toBe(false);
    });

    it("should filter suggestions based on search term", () => {
      const { result } = renderHook(() =>
        useMessageAutocomplete({ users: mockUsers })
      );

      act(() => {
        result.current.handleInput("@ali", 4);
      });

      expect(result.current.autocompleteState.suggestions.length).toBe(1);
      expect(result.current.autocompleteState.suggestions[0].name).toBe(
        "Alice Garcia"
      );
    });

    it("should show all users if search term is empty", () => {
      const { result } = renderHook(() =>
        useMessageAutocomplete({ users: mockUsers, maxSuggestions: 5 })
      );

      act(() => {
        result.current.handleInput("@ ", 2);
      });

      expect(result.current.autocompleteState.suggestions.length).toBe(3);
    });

    it("should limit suggestions to maxSuggestions", () => {
      const { result } = renderHook(() =>
        useMessageAutocomplete({ users: mockUsers, maxSuggestions: 2 })
      );

      act(() => {
        result.current.handleInput("@", 1);
      });

      expect(result.current.autocompleteState.suggestions.length).toBe(2);
    });
  });

  describe("Navigation", () => {
    it("should move selection down", () => {
      const { result } = renderHook(() =>
        useMessageAutocomplete({ users: mockUsers })
      );

      act(() => {
        result.current.handleInput("@", 1);
      });

      expect(result.current.autocompleteState.selectedIndex).toBe(0);

      act(() => {
        result.current.moveSelection("down");
      });

      expect(result.current.autocompleteState.selectedIndex).toBe(1);
    });

    it("should move selection up", () => {
      const { result } = renderHook(() =>
        useMessageAutocomplete({ users: mockUsers })
      );

      act(() => {
        result.current.handleInput("@", 1);
      });

      act(() => {
        result.current.moveSelection("down");
        result.current.moveSelection("down");
        result.current.moveSelection("up");
      });

      expect(result.current.autocompleteState.selectedIndex).toBe(1);
    });

    it("should not go below 0", () => {
      const { result } = renderHook(() =>
        useMessageAutocomplete({ users: mockUsers })
      );

      act(() => {
        result.current.handleInput("@", 1);
      });

      act(() => {
        result.current.moveSelection("up");
      });

      expect(result.current.autocompleteState.selectedIndex).toBe(0);
    });

    it("should not go beyond suggestions length", () => {
      const { result } = renderHook(() =>
        useMessageAutocomplete({ users: mockUsers, maxSuggestions: 2 })
      );

      act(() => {
        result.current.handleInput("@", 1);
      });

      act(() => {
        result.current.moveSelection("down");
        result.current.moveSelection("down");
        result.current.moveSelection("down");
      });

      expect(result.current.autocompleteState.selectedIndex).toBe(1);
    });
  });

  describe("Selection", () => {
    it("should select suggestion by index", () => {
      const onSelect = jest.fn();
      const { result } = renderHook(() =>
        useMessageAutocomplete({ users: mockUsers, onSelect })
      );

      act(() => {
        result.current.handleInput("@alic", 5);
      });

      act(() => {
        result.current.selectSuggestion(0);
      });

      expect(onSelect).toHaveBeenCalledWith(mockUsers[0]);
      expect(result.current.autocompleteState.isActive).toBe(false);
    });

    it("should return null for invalid index", () => {
      const { result } = renderHook(() =>
        useMessageAutocomplete({ users: mockUsers })
      );

      act(() => {
        result.current.handleInput("@alic", 5);
      });

      const selected = act(() => {
        return result.current.selectSuggestion(99);
      });

      expect(selected).toBe(null);
    });
  });

  describe("Deactivation", () => {
    it("should deactivate autocomplete", () => {
      const { result } = renderHook(() =>
        useMessageAutocomplete({ users: mockUsers })
      );

      act(() => {
        result.current.handleInput("@alic", 5);
      });

      expect(result.current.autocompleteState.isActive).toBe(true);

      act(() => {
        result.current.deactivate();
      });

      expect(result.current.autocompleteState.isActive).toBe(false);
      expect(result.current.autocompleteState.suggestions).toEqual([]);
    });
  });

  describe("Edge Cases", () => {
    it("should handle special characters in search", () => {
      const { result } = renderHook(() =>
        useMessageAutocomplete({ users: mockUsers })
      );

      act(() => {
        result.current.handleInput("@alic#$%", 8);
      });

      // Special chars should deactivate
      expect(result.current.autocompleteState.isActive).toBe(false);
    });

    it("should be case-insensitive", () => {
      const { result } = renderHook(() =>
        useMessageAutocomplete({ users: mockUsers })
      );

      act(() => {
        result.current.handleInput("@ALIC", 5);
      });

      expect(result.current.autocompleteState.suggestions.length).toBe(1);
      expect(result.current.autocompleteState.suggestions[0].name).toBe(
        "Alice Garcia"
      );
    });

    it("should search by email too", () => {
      const { result } = renderHook(() =>
        useMessageAutocomplete({ users: mockUsers })
      );

      act(() => {
        result.current.handleInput("@bob@", 5);
      });

      expect(result.current.autocompleteState.suggestions.length).toBe(1);
      expect(result.current.autocompleteState.suggestions[0].name).toBe(
        "Bob Lopez"
      );
    });
  });
});
