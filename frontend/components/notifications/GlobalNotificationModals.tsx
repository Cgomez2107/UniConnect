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
import { supabase } from "@/lib/supabase";
import { fetchApi } from "@/lib/api/httpClient";

/**
 * GlobalNotificationModals
 * 
 * Centraliza la visualización de modales basados en una cola de notificaciones.
 * Muestra las notificaciones una por una.
 */
export function GlobalNotificationModals() {
  const { queue, popNotification } = useNotificationStore();
  const current = queue[0]; // La notificación al frente de la cola

  const handleClose = async () => {
    if (current?.id) {
      // ✅ Marcar como leída en la base de datos para que no reaparezca al recargar
      void supabase
        .from('user_notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', current.id);
    }
    popNotification();
  };

  if (!current) return null;

  // Determinar qué modal específico mostrar según el tipo
  switch (current.type) {
    case "transferencia_admin_solicitada":
      return <AdminTransferModal data={current} onClose={handleClose} />;
    case "solicitud_ingreso":
      return <JoinRequestModal data={current} onClose={handleClose} />;
    case "miembro_aceptado":
      return <WelcomeModal data={current} onClose={handleClose} />;
    default:
      console.warn("[GlobalNotificationModals] Tipo desconocido:", current.type);
      return null;
  }
}

// 1. Modal de Transferencia de Administración
function AdminTransferModal({ data, onClose }: { data: any, onClose: () => void }) {
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Lógica robusta para obtener el nombre del grupo
  const groupName = data.payload?.groupName || (data.title !== "transferencia_admin_solicitada" ? data.title : "un grupo");

  const handleAccept = async () => {
    setIsProcessing(true);
    try {
      await fetchApi(`/study-groups/transfers/${data.payload.transferId}/accept`, {
        method: "POST",
      });
      onClose();
      if (Platform.OS === 'web') window.location.reload();
    } catch (error) {
      console.error("Error al aceptar transferencia:", error);
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal transparent visible animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.icon}>🛡️</Text>
          <Text style={styles.title}>Invitación de Administración</Text>
          <Text style={styles.description}>
            Desean delegarte el control total del grupo <Text style={styles.boldWhite}>{groupName}</Text>. ¿Aceptas la responsabilidad?
          </Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={[styles.button, styles.acceptButton]} onPress={handleAccept} disabled={isProcessing}>
              {isProcessing ? <ActivityIndicator color="#0047AB" /> : <Text style={styles.acceptText}>ACEPTAR CARGO</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.rejectButton]} onPress={onClose} disabled={isProcessing}>
              <Text style={styles.rejectText}>RECHAZAR</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// 2. Modal de Solicitud de Ingreso (Para el Admin)
function JoinRequestModal({ data, onClose }: { data: any, onClose: () => void }) {
  // Evitar usar el título si es igual al tipo (basura de pruebas)
  const groupName = data.payload?.groupName || (data.title !== "solicitud_ingreso" ? data.title : "tu grupo");
  const applicantName = data.payload?.applicantName || "un estudiante";

  return (
    <Modal transparent visible animationType="fade">
      <View style={styles.overlay}>
        <View style={[styles.container, { borderColor: '#0047AB' }]}>
          <Text style={styles.icon}>👋</Text>
          <Text style={styles.title}>Nueva Solicitud</Text>
          <Text style={styles.description}>
            Tu grupo <Text style={styles.boldWhite}>{groupName}</Text> tiene una nueva solicitud de ingreso de {applicantName}.
          </Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={[styles.button, styles.acceptButton]} onPress={onClose}>
              <Text style={styles.acceptText}>VER SOLICITUDES</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.rejectButton]} onPress={onClose}>
              <Text style={styles.rejectText}>CERRAR</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// 3. Modal de Bienvenida (Para el Miembro)
function WelcomeModal({ data, onClose }: { data: any, onClose: () => void }) {
  const groupName = data.payload?.groupName || (data.title !== "miembro_aceptado" ? data.title : "un nuevo grupo");

  return (
    <Modal transparent visible animationType="fade">
      <View style={styles.overlay}>
        <View style={[styles.container, { borderColor: '#10B981' }]}>
          <Text style={styles.icon}>🎉</Text>
          <Text style={styles.title}>¡Bienvenido!</Text>
          <Text style={styles.description}>
            Tu solicitud para el grupo <Text style={styles.boldWhite}>{groupName}</Text> ha sido aceptada.
          </Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={[styles.button, { backgroundColor: '#10B981' }]} onPress={onClose}>
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
  boldWhite: { fontWeight: 'bold', color: 'white' },
  buttonContainer: { width: "100%", gap: 12 },
  button: { width: "100%", paddingVertical: 16, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  acceptButton: { backgroundColor: "#FFFFFF" },
  rejectButton: { backgroundColor: "transparent", borderWidth: 1, borderColor: "rgba(255, 255, 255, 0.1)" },
  acceptText: { color: "#0047AB", fontWeight: "900", fontSize: 12, letterSpacing: 1 },
  rejectText: { color: "#A3A3A3", fontWeight: "700", fontSize: 12, letterSpacing: 1 },
});
