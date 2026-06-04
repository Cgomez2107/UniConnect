import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import type { StudySession, SessionAttendee } from "@/hooks/useStudySessions";

interface SessionDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  session: StudySession | null;
  attendees: SessionAttendee[];
  currentUserId: string;
  currentUserName?: string;
  onConfirmAttendance: (sessionId: string) => Promise<void>;
  onDeclineAttendance: (sessionId: string) => Promise<void>;
  loading?: boolean;
}

export function SessionDetailsModal({
  visible,
  onClose,
  session,
  attendees,
  currentUserId,
  currentUserName,
  onConfirmAttendance,
  onDeclineAttendance,
  loading = false,
}: SessionDetailsModalProps) {
  const [actionLoading, setActionLoading] = useState(false);

  if (!session) return null;

  const currentUserAttendee = attendees.find((a) => a.userId === currentUserId);
  const userStatus = currentUserAttendee?.status || "pending";

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-PE", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("es-PE", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleConfirm = async () => {
    setActionLoading(true);
    try {
      await onConfirmAttendance(session.id);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDecline = async () => {
    setActionLoading(true);
    try {
      await onDeclineAttendance(session.id);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "#4CAF50";
      case "declined":
        return "#F44336";
      default:
        return "#FF9800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "confirmed":
        return "Confirmado";
      case "declined":
        return "Declinado";
      default:
        return "Pendiente";
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Detalles de Sesión</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            <View style={styles.section}>
              <Text style={styles.sessionTitle}>{session.title}</Text>
              {session.description && (
                <Text style={styles.description}>{session.description}</Text>
              )}
            </View>

            <View style={styles.section}>
              <View style={styles.infoRow}>
                <MaterialIcons name="calendar-today" size={20} color="#666" />
                <Text style={styles.infoText}>{formatDate(session.startTime)}</Text>
              </View>
              <View style={styles.infoRow}>
                <MaterialIcons name="schedule" size={20} color="#666" />
                <Text style={styles.infoText}>
                  {formatTime(session.startTime)} - {formatTime(session.endTime)}
                </Text>
              </View>
              {session.parentSeriesId && (
                <View style={styles.infoRow}>
                  <MaterialIcons name="repeat" size={20} color="#666" />
                  <Text style={styles.infoText}>Sesión recurrente</Text>
                </View>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Tu asistencia</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(userStatus) }]}>
                <Text style={styles.statusText}>{getStatusText(userStatus)}</Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Participantes ({attendees.length})</Text>
              {attendees.map((attendee) => (
                <View key={attendee.id} style={styles.attendeeRow}>
                  <View style={styles.attendeeInfo}>
                    <Text style={styles.attendeeName}>
                      {attendee.fullName || "Usuario"}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.attendeeStatus,
                      { backgroundColor: getStatusColor(attendee.status) },
                    ]}
                  >
                    <Text style={styles.attendeeStatusText}>
                      {getStatusText(attendee.status)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>

          <View style={styles.footer}>
            {userStatus !== "confirmed" && (
              <TouchableOpacity
                style={[styles.button, styles.confirmButton]}
                onPress={handleConfirm}
                disabled={actionLoading || loading}
              >
                {actionLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Confirmar Asistencia</Text>
                )}
              </TouchableOpacity>
            )}
            {userStatus !== "declined" && (
              <TouchableOpacity
                style={[styles.button, styles.declineButton]}
                onPress={handleDecline}
                disabled={actionLoading || loading}
              >
                {actionLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Declinar Asistencia</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  closeButton: {
    padding: 5,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sessionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: "#666",
    lineHeight: 24,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  infoText: {
    fontSize: 16,
    color: "#666",
    marginLeft: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  statusText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  attendeeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  attendeeInfo: {
    flex: 1,
  },
  attendeeName: {
    fontSize: 16,
    color: "#333",
  },
  attendeeStatus: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  attendeeStatusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    gap: 12,
  },
  button: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  confirmButton: {
    backgroundColor: "#4CAF50",
  },
  declineButton: {
    backgroundColor: "#F44336",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
