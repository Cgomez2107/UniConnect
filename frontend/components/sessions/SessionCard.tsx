import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import type { StudySession, SessionAttendee } from "@/hooks/useStudySessions";

interface SessionCardProps {
  session: StudySession;
  attendees: SessionAttendee[];
  currentUserId: string;
  onPress: (session: StudySession) => void;
}

export function SessionCard({
  session,
  attendees,
  currentUserId,
  onPress,
}: SessionCardProps) {
  const currentUserAttendee = attendees.find((a) => a.userId === currentUserId);
  const userStatus = currentUserAttendee?.status || "pending";

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return "Hoy";
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return "Mañana";
    }
    return date.toLocaleDateString("es-PE", {
      day: "numeric",
      month: "short",
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("es-PE", {
      hour: "2-digit",
      minute: "2-digit",
    });
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
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(session)}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {session.title}
          </Text>
          {session.parentSeriesId && (
            <MaterialIcons name="repeat" size={16} color="#666" style={styles.icon} />
          )}
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(userStatus) }]}>
          <Text style={styles.statusText}>{getStatusText(userStatus)}</Text>
        </View>
      </View>

      <View style={styles.infoRow}>
        <MaterialIcons name="calendar-today" size={16} color="#666" />
        <Text style={styles.infoText}>{formatDate(session.startTime)}</Text>
        <MaterialIcons name="schedule" size={16} color="#666" style={styles.timeIcon} />
        <Text style={styles.infoText}>{formatTime(session.startTime)}</Text>
      </View>

      <View style={styles.footer}>
        <View style={styles.attendeesInfo}>
          <MaterialIcons name="people" size={16} color="#666" />
          <Text style={styles.attendeesText}>
            {attendees.length} {attendees.length === 1 ? "participante" : "participantes"}
          </Text>
        </View>
        <MaterialIcons name="chevron-right" size={20} color="#ccc" />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    flex: 1,
  },
  icon: {
    marginLeft: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 8,
  },
  timeIcon: {
    marginLeft: 16,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  attendeesInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  attendeesText: {
    fontSize: 13,
    color: "#666",
    marginLeft: 6,
  },
});
