import { useStudySessions } from "@/hooks/useStudySessions";
import { useAuthStore } from "@/store/useAuthStore";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const DAY_NAMES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export default function StudySessionsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const { sessions, loading, error, loadSessions, cancelSession } =
    useStudySessions();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  useFocusEffect(
    useCallback(() => {
      const groupsString = (user as any)?.studyGroups ?? "[]";
      let groups: { id: string }[] = [];
      try {
        groups =
          typeof groupsString === "string"
            ? JSON.parse(groupsString)
            : groupsString;
      } catch {
        groups = [];
      }
      const startOfMonth = new Date(year, month, 1).toISOString();
      const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59).toISOString();

      for (const group of groups) {
        loadSessions(group.id, startOfMonth, endOfMonth);
      }
    }, [user, year, month]),
  );

  const sessionsByDate = useMemo(() => {
    const map: Record<string, typeof sessions> = {};
    for (const s of sessions) {
      if (s.cancelledAt) continue;
      const key = s.startTime.slice(0, 10);
      if (!map[key]) map[key] = [];
      map[key].push(s);
    }
    return map;
  }, [sessions]);

  const datesWithSessions = useMemo(
    () =>
      Object.keys(sessionsByDate)
        .filter((d) => d.startsWith(`${year}-${String(month + 1).padStart(2, "0")}`))
        .sort(),
    [sessionsByDate, year, month],
  );

  const sessionsForSelectedDay = useMemo(
    () => sessionsByDate[selectedDate] ?? [],
    [sessionsByDate, selectedDate],
  );

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);

  const handleCancelPress = (session: any) => {
    setSelectedSession(session);
    setShowCancelConfirm(true);
  };

  const handleConfirmCancel = async () => {
    if (!selectedSession) return;
    setShowCancelConfirm(false);
    const ok = await cancelSession(selectedSession.id);
    if (ok) {
      Alert.alert("Cancelada", "La sesión ha sido cancelada.");
    } else {
      Alert.alert("Error", "No se pudo cancelar la sesión.");
    }
    setSelectedSession(null);
  };

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingTop: Platform.OS === "android" ? insets.top + 8 : 8,
          paddingBottom: 12,
        }}
      >
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: "700", color: "#111827" }}>
          Calendario de Estudio
        </Text>
      </View>

      {/* Mini Calendar */}
      <View style={{ backgroundColor: "white", marginHorizontal: 16, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: "#E5E7EB" }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <TouchableOpacity onPress={prevMonth} style={{ padding: 4 }}>
            <Ionicons name="chevron-back" size={20} color="#6B7280" />
          </TouchableOpacity>
          <Text style={{ fontSize: 16, fontWeight: "600", color: "#111827" }}>
            {MONTH_NAMES[month]} {year}
          </Text>
          <TouchableOpacity onPress={nextMonth} style={{ padding: 4 }}>
            <Ionicons name="chevron-forward" size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: "row" }}>
          {DAY_NAMES.map((d) => (
            <View key={d} style={{ flex: 1, alignItems: "center", paddingVertical: 4 }}>
              <Text style={{ fontSize: 11, fontWeight: "600", color: "#9CA3AF" }}>
                {d.slice(0, 2)}
              </Text>
            </View>
          ))}
        </View>

        <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
          {calendarDays.map((day, i) => {
            if (day === null) {
              return <View key={`e-${i}`} style={{ width: "14.28%", aspectRatio: 1, padding: 2 }} />;
            }
            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const hasSession = !!sessionsByDate[dateStr];
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === selectedDate;

            return (
              <TouchableOpacity
                key={dateStr}
                onPress={() => setSelectedDate(dateStr)}
                style={{
                  width: "14.28%",
                  aspectRatio: 1,
                  padding: 2,
                }}
              >
                <View
                  style={{
                    flex: 1,
                    borderRadius: 8,
                    backgroundColor: isSelected ? "#4F46E5" : isToday ? "#EEF2FF" : "transparent",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: isSelected ? "700" : "500",
                      color: isSelected ? "white" : isToday ? "#4F46E5" : "#374151",
                    }}
                  >
                    {day}
                  </Text>
                  {hasSession && (
                    <View
                      style={{
                        width: 4,
                        height: 4,
                        borderRadius: 2,
                        backgroundColor: isSelected ? "white" : "#4F46E5",
                        marginTop: 2,
                      }}
                    />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Sessions for selected day */}
      <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 12 }}>
        <Text style={{ fontSize: 16, fontWeight: "600", color: "#374151", marginBottom: 8 }}>
          {new Date(selectedDate).toLocaleDateString("es-CO", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </Text>

        {loading && (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <ActivityIndicator size="large" color="#4F46E5" />
          </View>
        )}

        {error && (
          <View style={{ padding: 12, backgroundColor: "#FEF2F2", borderRadius: 8, marginBottom: 8 }}>
            <Text style={{ color: "#DC2626", fontSize: 14 }}>{error}</Text>
          </View>
        )}

        <FlatList
          data={sessionsForSelectedDay}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 24 }}
          ListEmptyComponent={
            !loading ? (
              <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 40 }}>
                <Ionicons name="calendar-outline" size={48} color="#D1D5DB" />
                <Text style={{ color: "#9CA3AF", fontSize: 16, marginTop: 8 }}>
                  Sin sesiones este día
                </Text>
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => handleCancelPress(item)}
              style={{
                backgroundColor: "white",
                borderRadius: 12,
                padding: 16,
                marginBottom: 8,
                borderWidth: 1,
                borderColor: "#E5E7EB",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 3,
                elevation: 2,
              }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: "600", color: "#111827" }}>
                    {item.title}
                  </Text>
                  {item.description ? (
                    <Text style={{ fontSize: 13, color: "#6B7280", marginTop: 2 }} numberOfLines={2}>
                      {item.description}
                    </Text>
                  ) : null}
                  <View style={{ flexDirection: "row", marginTop: 8, gap: 12 }}>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <Ionicons name="time-outline" size={14} color="#6B7280" />
                      <Text style={{ fontSize: 12, color: "#6B7280", marginLeft: 4 }}>
                        {new Date(item.startTime).toLocaleTimeString("es-CO", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {" - "}
                        {new Date(item.endTime).toLocaleTimeString("es-CO", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Text>
                    </View>
                    {item.rrule && (
                      <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <Ionicons name="repeat" size={14} color="#6B7280" />
                        <Text style={{ fontSize: 12, color: "#6B7280", marginLeft: 4 }}>
                          Semanal
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
                <Ionicons name="close-circle-outline" size={22} color="#EF4444" />
              </View>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Cancel Modal */}
      <Modal visible={showCancelConfirm} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <View
            style={{
              backgroundColor: "white",
              borderRadius: 16,
              padding: 24,
              margin: 32,
              width: "80%",
              maxWidth: 340,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "700", color: "#111827", marginBottom: 8 }}>
              Cancelar sesión
            </Text>
            <Text style={{ fontSize: 14, color: "#6B7280", marginBottom: 20 }}>
              ¿Estás seguro de cancelar &quot;{selectedSession?.title}&quot;? Esta acción
              solo afecta a esta sesión, no al resto de la serie.
            </Text>
            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity
                onPress={() => { setShowCancelConfirm(false); setSelectedSession(null); }}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                  alignItems: "center",
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: "600", color: "#374151" }}>
                  Volver
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleConfirmCancel}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 8,
                  backgroundColor: "#EF4444",
                  alignItems: "center",
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: "600", color: "white" }}>
                  Cancelar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
