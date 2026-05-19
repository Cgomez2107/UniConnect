/**
 * Hook para autocompletado de menciones en React Native
 */

import { useCallback, useState } from "react";

export interface AutocompleteUser {
  id: string;
  name: string;
  avatar?: string;
  email?: string;
}

export interface AutocompleteState {
  isActive: boolean;
  searchTerm: string;
  selectedIndex: number;
  suggestions: AutocompleteUser[];
}

interface UseMessageAutocompleteOptions {
  users?: AutocompleteUser[];
  minChars?: number;
  maxSuggestions?: number;
  onSelect?: (user: AutocompleteUser) => void;
}

/**
 * Hook para manejar autocompletado de menciones en React Native
 */
export function useMessageAutocomplete(
  options: UseMessageAutocompleteOptions = {}
): {
  autocompleteState: AutocompleteState;
  handleInput: (content: string, cursorPosition: number) => void;
  selectSuggestion: (index: number) => AutocompleteUser | null;
  moveSelection: (direction: "up" | "down") => void;
  deactivate: () => void;
} {
  const {
    users = [],
    minChars = 1,
    maxSuggestions = 5,
    onSelect,
  } = options;

  const [state, setState] = useState<AutocompleteState>({
    isActive: false,
    searchTerm: "",
    selectedIndex: 0,
    suggestions: [],
  });

  const handleInput = useCallback(
    (content: string, cursorPosition: number): void => {
      const beforeCursor = content.substring(0, cursorPosition);
      const lastAtIndex = beforeCursor.lastIndexOf("@");

      if (lastAtIndex === -1) {
        setState((prev) => ({ ...prev, isActive: false }));
        return;
      }

      const charBeforeAt = lastAtIndex > 0 ? content[lastAtIndex - 1] : " ";
      if (charBeforeAt !== " " && charBeforeAt !== "\n") {
        setState((prev) => ({ ...prev, isActive: false }));
        return;
      }

      const searchTerm = content.substring(lastAtIndex + 1, cursorPosition);

      if (!/^[a-zA-Z0-9._\s]*$/.test(searchTerm)) {
        setState((prev) => ({ ...prev, isActive: false }));
        return;
      }

      let suggestions: AutocompleteUser[] = [];
      if (searchTerm.length === 0) {
        suggestions = users.slice(0, maxSuggestions);
      } else if (searchTerm.length >= minChars) {
        const lowerTerm = searchTerm.toLowerCase();
        suggestions = users
          .filter(
            (user) =>
              user.name.toLowerCase().includes(lowerTerm) ||
              user.email?.toLowerCase().includes(lowerTerm)
          )
          .slice(0, maxSuggestions);
      }

      setState({
        isActive: searchTerm.length >= 0 && suggestions.length > 0,
        searchTerm,
        selectedIndex: 0,
        suggestions,
      });
    },
    [users, minChars, maxSuggestions]
  );

  const selectSuggestion = useCallback(
    (index: number): AutocompleteUser | null => {
      if (index < 0 || index >= state.suggestions.length) {
        return null;
      }

      const selected = state.suggestions[index];
      onSelect?.(selected);
      setState((prev) => ({ ...prev, isActive: false }));
      return selected;
    },
    [state.suggestions, onSelect]
  );

  const moveSelection = useCallback((direction: "up" | "down"): void => {
    setState((prev) => {
      const newIndex =
        direction === "down"
          ? Math.min(prev.selectedIndex + 1, prev.suggestions.length - 1)
          : Math.max(prev.selectedIndex - 1, 0);

      return { ...prev, selectedIndex: newIndex };
    });
  }, []);

  const deactivate = useCallback((): void => {
    setState({
      isActive: false,
      searchTerm: "",
      selectedIndex: 0,
      suggestions: [],
    });
  }, []);

  return {
    autocompleteState: state,
    handleInput,
    selectSuggestion,
    moveSelection,
    deactivate,
  };
}

/**
 * Hook para selector de archivos en React Native
 */
export interface FilePickerState {
  selectedFile: { uri: string; name: string; size: number; type: string } | null;
  error?: string;
  isLoading: boolean;
}

export function useFilePicker(options: {
  allowedTypes?: string[];
  maxSizeMb?: number;
  onFileSelect?: (file: { uri: string; name: string; size: number; type: string }) => void;
  onError?: (error: string) => void;
} = {}): {
  state: FilePickerState;
  pickFile: () => Promise<void>;
  clearFile: () => void;
} {
  const {
    allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "application/pdf",
    ],
    maxSizeMb = 50,
    onFileSelect,
    onError,
  } = options;

  const [state, setState] = useState<FilePickerState>({
    selectedFile: null,
    isLoading: false,
  });

  const pickFile = useCallback(async (): Promise<void> => {
    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      // Este sería el lugar para usar expo-document-picker en una implementación real
      // Por ahora es un placeholder
      setState((prev) => ({ ...prev, isLoading: false }));
    } catch (error) {
      const errorMessage = "Error al seleccionar archivo";
      setState((prev) => ({
        ...prev,
        error: errorMessage,
        isLoading: false,
      }));
      onError?.(errorMessage);
    }
  }, [onError]);

  const clearFile = useCallback((): void => {
    setState({
      selectedFile: null,
      error: undefined,
      isLoading: false,
    });
  }, []);

  return {
    state,
    pickFile,
    clearFile,
  };
}
