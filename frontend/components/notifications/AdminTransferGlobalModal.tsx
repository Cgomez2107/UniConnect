import React, { useState } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal, 
  ActivityIndicator,
  Platform 
} from "react-native";
import { useNotificationStore } from "@/store/useNotificationStore";
import { fetchApi } from "@/lib/api/httpClient";
import { Colors } from "@/constants/Colors";

/**
 * AdminTransferGlobalModal
 * 
 * Modal global para aceptar/rechazar transferencias de administración.
 * Se muestra basándose en el estado de useNotificationStore.
 */
export function AdminTransferGlobalModal() {
  const { activeTransfer, isTransferModalOpen, clearTransfer } = useNotificationStore();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAccept = async () => {
    if (!activeTransfer) return;
    setIsProcessing(true);
    try {
      await fetchApi(`/study-groups/transfers/${activeTransfer.transferId}/accept`, {
        method: "POST",
      });
      clearTransfer();
      
      // Forzar recarga si estamos en web para actualizar permisos RLS inmediatamente
      if (Platform.OS === 'web') {
        window.location.reload();
      }
    } catch (error) {
      console.error("Error al aceptar transferencia:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!activeTransfer) return;
    setIsProcessing(true);
    try {
      // Usar endpoint de rechazo si existe, o silenciar
      await fetchApi(`/study-groups/transfers/${activeTransfer.transferId}/reject`, {
        method: "POST",
      }).catch(() => {});
      
      clearTransfer();
    } catch (error) {
      console.error("Error al rechazar transferencia:", error);
      clearTransfer();
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isTransferModalOpen || !activeTransfer) return null;

  return (
    <Modal
      transparent
      visible={isTransferModalOpen}
      animationType="fade"
      onRequestClose={clearTransfer}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>🛡️</Text>
          </View>

          <Text style={styles.title}>Invitación de Administración</Text>
          <Text style={styles.description}>
            Desean delegarte el control total de un grupo de estudio. ¿Aceptas la responsabilidad?
          </Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.acceptButton]}
              onPress={handleAccept}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator color="#0047AB" />
              ) : (
                <Text style={styles.acceptText}>ACEPTAR CARGO</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.rejectButton]}
              onPress={handleReject}
              disabled={isProcessing}
            >
              <Text style={styles.rejectText}>RECHAZAR</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  container: {
    backgroundColor: "#1A1A1A",
    borderRadius: 32,
    padding: 32,
    width: "100%",
    maxWidth: 400,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: "rgba(0, 71, 171, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(0, 71, 171, 0.2)",
  },
  icon: {
    fontSize: 32,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 12,
  },
  description: {
    color: "#A3A3A3",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 32,
  },
  buttonContainer: {
    width: "100%",
    gap: 12,
  },
  button: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  acceptButton: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#0047AB",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  rejectButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  acceptText: {
    color: "#0047AB",
    fontWeight: "900",
    fontSize: 12,
    letterSpacing: 1,
  },
  rejectText: {
    color: "#A3A3A3",
    fontWeight: "700",
    fontSize: 12,
    letterSpacing: 1,
  },
});
