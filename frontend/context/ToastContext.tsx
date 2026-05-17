/**
 * context/ToastContext.tsx
 * 
 * Sistema de notificaciones toast no-intrusivas
 * Reemplaza Alert.alert() para mejor UX
 * 
 * Tipos de notificaciones:
 * - success: ✅ Operación exitosa (verde)
 * - error:   ❌ Error (rojo)
 * - info:    ℹ️ Información (azul)
 * - warning: ⚠️ Advertencia (naranja)
 */

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { View, Text, StyleSheet, useColorScheme, Animated, Platform } from "react-native";
import { Colors } from "@/constants/Colors";

export type ToastType = "success" | "error" | "info" | "warning";

interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, type: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

/**
 * Hook para usar el sistema de Toast
 * 
 * Uso:
 * const { showToast } = useToast();
 * showToast("Archivo enviado", "success");
 */
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast debe usarse dentro de ToastProvider");
  }
  return context;
}

interface ToastProviderProps {
  children: React.ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const timeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const showToast = useCallback(
    (message: string, type: ToastType = "info", duration = 3000) => {
      const id = `${Date.now()}-${Math.random()}`;

      setToasts((prev) => [...prev, { id, message, type, duration }]);

      // Auto-remover después de duration
      const timeout = setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
        timeoutsRef.current.delete(id);
      }, duration);

      timeoutsRef.current.set(id, timeout);
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    const timeout = timeoutsRef.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      timeoutsRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastStack toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

interface ToastStackProps {
  toasts: ToastMessage[];
  onRemove: (id: string) => void;
}

function ToastStack({ toasts, onRemove }: ToastStackProps) {
  return (
    <View style={styles.stack} pointerEvents="box-none">
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onDismiss={() => onRemove(toast.id)}
        />
      ))}
    </View>
  );
}

interface ToastItemProps {
  toast: ToastMessage;
  onDismiss: () => void;
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const scheme = useColorScheme() ?? "light";
  const C = Colors[scheme];
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const getToastStyle = () => {
    switch (toast.type) {
      case "success":
        return {
          backgroundColor: "#10b981", // Emerald green
          icon: "✓",
        };
      case "error":
        return {
          backgroundColor: "#ef4444", // Red
          icon: "✕",
        };
      case "warning":
        return {
          backgroundColor: "#f59e0b", // Amber
          icon: "⚠",
        };
      case "info":
      default:
        return {
          backgroundColor: C.primary, // UC Blue
          icon: "ℹ",
        };
    }
  };

  const toastStyle = getToastStyle();

  return (
    <Animated.View
      style={[
        styles.toast,
        {
          backgroundColor: toastStyle.backgroundColor,
          opacity: fadeAnim,
        },
      ]}
    >
      <Text style={styles.toastIcon}>{toastStyle.icon}</Text>
      <Text style={styles.toastMessage}>{toast.message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  stack: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 9999,
    paddingBottom: 20,
    pointerEvents: "none",
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginVertical: 8,
    maxWidth: "90%",
    // Web-compatible: usar boxShadow en lugar de shadow props
    ...(Platform.OS === 'web' ? {
      boxShadow: "0 2px 12px rgba(0, 0, 0, 0.25)",
    } : {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3,
      elevation: 5,
    }),
  },
  toastIcon: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginRight: 8,
  },
  toastMessage: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
});
