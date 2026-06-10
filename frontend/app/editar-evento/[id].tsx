import { FieldLabel } from "@/components/admin/CrudModal"
import { Colors } from "@/constants/Colors"
import { DIContainer } from "@/lib/services/di/container"
import { useAuthStore } from "@/store/useAuthStore"
import { useEventCategories } from "@/hooks/useEventCategories"
import type { CampusEvent } from "@/types"
import { Ionicons } from "@expo/vector-icons"
import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker"
import { router, useLocalSearchParams } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useEffect, useState, useCallback } from "react"
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

export default function EditEventScreen() {
  const scheme = useColorScheme() ?? "light"
  const C = Colors[scheme]
  const insets = useSafeAreaInsets()
  const userId = useAuthStore((s) => s.user?.id)
  const { id } = useLocalSearchParams<{ id?: string }>()
  const { categories } = useEventCategories()

  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [eventDate, setEventDate] = useState("")
  const [location, setLocation] = useState("")
  const [category, setCategory] = useState("")
  const [maxCapacity, setMaxCapacity] = useState("")
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showTimePicker, setShowTimePicker] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!id) { setLoading(false); return }
    const load = async () => {
      try {
        const useCase = DIContainer.getInstance().getGetEventById()
        const event = await useCase.execute(id)
        if (event) {
          setTitle(event.title)
          setDescription(event.description ?? "")
          setEventDate(event.event_date)
          setLocation(event.location ?? "")
          setCategory(event.category)
          setMaxCapacity(event.capacity ? String(event.capacity) : "")
        }
      } catch (e: any) {
        setError(e?.message ?? "Error al cargar el evento")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const parsedDate = eventDate ? new Date(eventDate) : new Date()

  const formatDisplayDate = (iso: string): string => {
    if (!iso) return "Seleccionar fecha y hora"
    const d = new Date(iso)
    return d.toLocaleDateString("es-CO", {
      year: "numeric", month: "long", day: "2-digit",
    }) + " " + d.toLocaleTimeString("es-CO", {
      hour: "2-digit", minute: "2-digit",
    })
  }

  const onDateChange = (_: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(false)
    if (!selectedDate) return
    const current = eventDate ? new Date(eventDate) : new Date()
    current.setFullYear(selectedDate.getFullYear())
    current.setMonth(selectedDate.getMonth())
    current.setDate(selectedDate.getDate())
    setEventDate(current.toISOString())
    setTimeout(() => setShowTimePicker(true), 300)
  }

  const onTimeChange = (_: DateTimePickerEvent, selectedDate?: Date) => {
    setShowTimePicker(false)
    if (!selectedDate) return
    const current = eventDate ? new Date(eventDate) : new Date()
    current.setHours(selectedDate.getHours())
    current.setMinutes(selectedDate.getMinutes())
    setEventDate(current.toISOString())
  }

  const handleSubmit = useCallback(async () => {
    if (!title.trim()) { setError("El título no puede estar vacío."); return }
    if (!eventDate) { setError("La fecha del evento es obligatoria."); return }
    if (!category) { setError("Selecciona una categoría."); return }
    if (!userId || !id) { setError("Debes iniciar sesión."); return }

    setSubmitting(true)
    setError("")

    try {
      const payload: any = {
        title: title.trim(),
        description: description.trim() || undefined,
        startAt: new Date(eventDate).toISOString(),
        location: location.trim() || undefined,
        category,
      }
      if (maxCapacity.trim()) {
        const cap = parseInt(maxCapacity.trim(), 10)
        if (!isNaN(cap) && cap > 0) {
          payload.maxCapacity = cap
        }
      }

      const repo = DIContainer.getInstance().getEventRepository()
      await repo.update(id, userId, payload)
      Alert.alert("Evento actualizado", "Los cambios se guardaron correctamente.", [
        { text: "OK", onPress: () => router.back() },
      ])
    } catch (e: any) {
      setError(e?.message ?? "Error al actualizar el evento")
    } finally {
      setSubmitting(false)
    }
  }, [title, description, eventDate, location, category, maxCapacity, userId, id])

  if (loading) {
    return (
      <View style={[styles.safe, { backgroundColor: C.background, paddingTop: insets.top, justifyContent: "center", alignItems: "center" }]}>
        <Text style={{ color: C.textSecondary }}>Cargando evento...</Text>
      </View>
    )
  }

  return (
    <View style={[styles.safe, { backgroundColor: C.background, paddingTop: insets.top }]}>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />

      <View style={[styles.header, { borderBottomColor: C.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.75}>
          <Ionicons name="arrow-back" size={22} color={C.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: C.textPrimary }]}>Editar Evento</Text>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <FieldLabel text="Título *" />
          <TextInput
            style={[styles.input, { backgroundColor: C.background, borderColor: C.border, color: C.textPrimary }]}
            placeholder="Ej: Semana de la Ingeniería"
            placeholderTextColor={C.textPlaceholder}
            value={title}
            autoCapitalize="sentences"
            autoFocus
            onChangeText={(v) => { setTitle(v); setError("") }}
          />

          <FieldLabel text="Descripción (opcional)" style={{ marginTop: 14 }} />
          <TextInput
            style={[styles.input, { backgroundColor: C.background, borderColor: C.border, color: C.textPrimary, height: 80 }]}
            placeholder="Breve descripción del evento..."
            placeholderTextColor={C.textPlaceholder}
            value={description}
            multiline
            numberOfLines={3}
            onChangeText={(v) => { setDescription(v); setError("") }}
          />

          <FieldLabel text="Fecha y hora *" style={{ marginTop: 14 }} />
          <TouchableOpacity
            style={[styles.input, { backgroundColor: C.background, borderColor: C.border, justifyContent: "center" }]}
            onPress={() => setShowDatePicker(true)}
            activeOpacity={0.8}
          >
            <Text style={{ color: eventDate ? C.textPrimary : C.textPlaceholder, fontSize: 15 }}>
              {formatDisplayDate(eventDate)}
            </Text>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={parsedDate}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={onDateChange}
            />
          )}
          {showTimePicker && (
            <DateTimePicker
              value={parsedDate}
              mode="time"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={onTimeChange}
            />
          )}

          <FieldLabel text="Lugar (opcional)" style={{ marginTop: 14 }} />
          <TextInput
            style={[styles.input, { backgroundColor: C.background, borderColor: C.border, color: C.textPrimary }]}
            placeholder="Ej: Auditorio Central"
            placeholderTextColor={C.textPlaceholder}
            value={location}
            autoCapitalize="sentences"
            onChangeText={(v) => { setLocation(v); setError("") }}
          />

          <FieldLabel text="Categoría *" style={{ marginTop: 14 }} />
          {categories.length === 0 ? (
            <Text style={{ color: C.textSecondary, fontSize: 13, marginTop: 4 }}>
              No hay categorías disponibles.
            </Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 2 }}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: category === cat.slug ? C.primary : C.background,
                      borderColor: category === cat.slug ? C.primary : C.border,
                    },
                  ]}
                  onPress={() => { setCategory(cat.slug); setError("") }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.chipText, { color: category === cat.slug ? "#fff" : C.textSecondary }]}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          <FieldLabel text="Capacidad máxima (opcional)" style={{ marginTop: 14 }} />
          <TextInput
            style={[styles.input, { backgroundColor: C.background, borderColor: C.border, color: C.textPrimary }]}
            placeholder="Ej: 100"
            placeholderTextColor={C.textPlaceholder}
            value={maxCapacity}
            keyboardType="number-pad"
            onChangeText={(v) => { setMaxCapacity(v); setError("") }}
          />

          {error ? (
            <Text style={[styles.errorText, { color: C.error }]}>{error}</Text>
          ) : null}

          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: C.primary, opacity: submitting ? 0.6 : 1 }]}
            onPress={handleSubmit}
            disabled={submitting}
            activeOpacity={0.85}
          >
            <Ionicons name="save-outline" size={20} color="#fff" />
            <Text style={styles.submitText}>
              {submitting ? "Guardando..." : "Guardar cambios"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    height: 56,
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    gap: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 17, fontWeight: "700" },
  content: { padding: 16, gap: 4 },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    height: 48,
    fontSize: 15,
    marginTop: 4,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 8,
  },
  chipText: { fontSize: 13, fontWeight: "500" },
  errorText: { fontSize: 13, marginTop: 8 },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 12,
  },
  submitText: { color: "#fff", fontSize: 16, fontWeight: "700" },
})
