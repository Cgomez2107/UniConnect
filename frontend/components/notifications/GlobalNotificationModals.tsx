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

/**
 * GlobalNotificationModals
 * 
 * Centraliza todos los modales disparados por el sistema de notificaciones Realtime.
 */
export function GlobalNotificationModals() {
  return (
    <>
      <AdminTransferModal />
      <JoinRequestModal />
      <WelcomeModal />
    </>
  );
}

// 1. Modal de Transferencia de Administración
function AdminTransferModal() {
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
      if (Platform.OS === 'web') window.location.reload();
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isTransferModalOpen || !activeTransfer) return null;

  return (
    <Modal transparent visible={isTransferModalOpen} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.icon}>🛡️</Text>
          <Text style={styles.title}>Invitación de Administración</Text>
          <Text style={styles.description}>
            Desean delegarte el control total del grupo. ¿Aceptas la responsabilidad?
          </Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={[styles.button, styles.acceptButton]} onPress={handleAccept} disabled={isProcessing}>
              {isProcessing ? <ActivityIndicator color="#0047AB" /> : <Text style={styles.acceptText}>ACEPTAR CARGO</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.rejectButton]} onPress={clearTransfer} disabled={isProcessing}>
              <Text style={styles.rejectText}>RECHAZAR</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// 2. Modal de Solicitud de Ingreso (Para el Admin)
function JoinRequestModal() {
  const { activeJoinRequest, isJoinRequestModalOpen, clearJoinRequest } = useNotificationStore();

  if (!isJoinRequestModalOpen || !activeJoinRequest) return null;

  return (
    <Modal transparent visible={isJoinRequestModalOpen} animationType="fade">
      <View style={styles.overlay}>
        <View style={[styles.container, { borderColor: '#0047AB' }]}>
          <Text style={styles.icon}>👋</Text>
          <Text style={styles.title}>Nueva Solicitud</Text>
          <Text style={styles.description}>
            Tu grupo <Text style={{ fontWeight: 'bold', color: 'white' }}>{activeJoinRequest.groupName}</Text> tiene una nueva solicitud de ingreso de {activeJoinRequest.applicantName}.
          </Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={[styles.button, styles.acceptButton]} onPress={clearJoinRequest}>
              <Text style={styles.acceptText}>VER SOLICITUDES</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.rejectButton]} onPress={clearJoinRequest}>
              <Text style={styles.rejectText}>CERRAR</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// 3. Modal de Bienvenida (Para el Miembro)
function WelcomeModal() {
  const { activeWelcome, isWelcomeModalOpen, clearWelcome } = useNotificationStore();

  if (!isWelcomeModalOpen || !activeWelcome) return null;

  return (
    <Modal transparent visible={isWelcomeModalOpen} animationType="fade">
      <View style={styles.overlay}>
        <View style={[styles.container, { borderColor: '#10B981' }]}>
          <Text style={styles.icon}>🎉</Text>
          <Text style={styles.title}>¡Bienvenido!</Text>
          <Text style={styles.description}>
            Tu solicitud para el grupo <Text style={{ fontWeight: 'bold', color: 'white' }}>{activeWelcome.groupName}</Text> ha sido aceptada.
          </Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={[styles.button, { backgroundColor: '#10B981' }]} onPress={clearWelcome}>
              <Text style={[styles.acceptText, { color: 'white' }]}>¡EXCELENTE!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0, 0, 0, 0.85)", justifyContent: "center", alignItems: "center", padding: 20 },
  container: { backgroundColor: "#1A1A1A", borderRadius: 32, padding: 32, width: "100%", maxWidth: 400, borderWidth: 1, borderColor: "rgba(255, 255, 255, 0.1)", alignItems: "center" },
  icon: { fontSize: 40, marginBottom: 20 },
  title: { color: "#FFFFFF", fontSize: 22, fontWeight: "900", textAlign: "center", marginBottom: 12 },
  description: { color: "#A3A3A3", fontSize: 14, textAlign: "center", lineHeight: 20, marginBottom: 32 },
  buttonContainer: { width: "100%", gap: 12 },
  button: { width: "100%", paddingVertical: 16, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  acceptButton: { backgroundColor: "#FFFFFF" },
  rejectButton: { backgroundColor: "transparent", borderWidth: 1, borderColor: "rgba(255, 255, 255, 0.1)" },
  acceptText: { color: "#0047AB", fontWeight: "900", fontSize: 12, letterSpacing: 1 },
  rejectText: { color: "#A3A3A3", fontWeight: "700", fontSize: 12, letterSpacing: 1 },
});
