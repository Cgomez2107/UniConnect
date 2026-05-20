/**
 * Hook para autocompletado de menciones (@usuario)
 * Detecta cuando el usuario escribe @, lista usuarios, y completa la mención
 */

import { useCallback, useMemo, useState } from "react";

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
 * Hook para manejar autocompletado de menciones
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

  /**
   * Detecta si el usuario escribió @ y extrae el término de búsqueda
   */
  const handleInput = useCallback(
    (content: string, cursorPosition: number): void => {
      // Buscar @ antes de la posición del cursor
      const beforeCursor = content.substring(0, cursorPosition);
      const lastAtIndex = beforeCursor.lastIndexOf("@");

      if (lastAtIndex === -1) {
        setState((prev) => ({ ...prev, isActive: false }));
        return;
      }

      // Verificar que @ está al inicio de palabra (precedido por espacio o inicio)
      const charBeforeAt = lastAtIndex > 0 ? content[lastAtIndex - 1] : " ";
      if (charBeforeAt !== " " && charBeforeAt !== "\n") {
        setState((prev) => ({ ...prev, isActive: false }));
        return;
      }

      // Extraer término de búsqueda
      const searchTerm = content.substring(lastAtIndex + 1, cursorPosition);

      // Validar que no tenga caracteres inválidos
      if (!/^[a-zA-Z0-9._\s]*$/.test(searchTerm)) {
        setState((prev) => ({ ...prev, isActive: false }));
        return;
      }

      // Si el término es vacío, mostrar todos
      let suggestions: AutocompleteUser[] = [];
      
      // Agregar opción @all al inicio si hay más de un usuario
      const allOption: AutocompleteUser = {
        id: "@all",
        name: "all",
        email: "Menciona a todos los miembros",
      };

      if (searchTerm.length === 0) {
        suggestions = [allOption, ...users.slice(0, maxSuggestions - 1)];
      } else if (searchTerm.length >= minChars) {
        const lowerTerm = searchTerm.toLowerCase();
        
        // Filtrar usuarios
        const userSuggestions = users
          .filter(
            (user) =>
              user.name.toLowerCase().includes(lowerTerm) ||
              user.email?.toLowerCase().includes(lowerTerm)
          )
          .slice(0, maxSuggestions);

        // Incluir @all si coincide con la búsqueda
        if ("all".includes(lowerTerm)) {
          suggestions = [allOption, ...userSuggestions.slice(0, maxSuggestions - 1)];
        } else {
          suggestions = userSuggestions;
        }
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

  /**
   * Selecciona una sugerencia por índice
   */
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

  /**
   * Navega en las sugerencias con flechas
   */
  const moveSelection = useCallback((direction: "up" | "down"): void => {
    setState((prev) => {
      const newIndex =
        direction === "down"
          ? Math.min(prev.selectedIndex + 1, prev.suggestions.length - 1)
          : Math.max(prev.selectedIndex - 1, 0);

      return { ...prev, selectedIndex: newIndex };
    });
  }, []);

  /**
   * Desactiva el autocompletado
   */
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
 * Hook para selector de archivos con validación
 */
export interface FilePickerState {
  selectedFile: File | null;
  error?: string;
  isLoading: boolean;
}

export function useFilePicker(options: {
  allowedTypes?: string[];
  maxSizeMb?: number;
  onFileSelect?: (file: File) => void;
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

    // Crear input file temporal
    const input = document.createElement("input");
    input.type = "file";
    input.accept = allowedTypes.join(",");

    input.onchange = async (event: Event) => {
      const file = (event.target as HTMLInputElement).files?.[0];

      if (!file) {
        setState((prev) => ({ ...prev, isLoading: false }));
        return;
      }

      // Validar tipo
      if (!allowedTypes.includes(file.type)) {
        const error = "Tipo de archivo no permitido";
        setState((prev) => ({ ...prev, error, isLoading: false }));
        onError?.(error);
        return;
      }

      // Validar tamaño
      if (file.size / (1024 * 1024) > maxSizeMb) {
        const error = `Archivo demasiado grande (máximo ${maxSizeMb} MB)`;
        setState((prev) => ({ ...prev, error, isLoading: false }));
        onError?.(error);
        return;
      }

      setState({
        selectedFile: file,
        error: undefined,
        isLoading: false,
      });
      onFileSelect?.(file);
    };

    input.click();
  }, [allowedTypes, maxSizeMb, onFileSelect, onError]);

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
