/**
 * app/postular/[id].tsx
 * Pantalla de postulación a un grupo de estudio — US-007
 *
 * Recibe el requestId por parámetro de ruta.
 * Permite al usuario escribir un mensaje y enviar la postulación.
 */

import { Colors } from "@/constants/Colors";
import { usePostulationForm } from "@/hooks/application/usePostulationForm";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function PostularScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const scheme = useColorScheme() ?? "light";
  const C = Colors[scheme];
  const insets = useSafeAreaInsets();
  const {
    request,
    loadingRequest,
    message,
    setMessage,
    sending,
    isClosed,
    isSubmitDisabled,
    handlePostular,
  } = usePostulationForm({
    requestId: id,
    onApplied: () => router.back(),
  });

  if (loadingRequest) {
    return (
      <View style={[styles.centered, { backgroundColor: C.background }]}>
        <ActivityIndicator size="large" color={C.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: C.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />

      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + 8, borderBottomColor: C.border },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: C.surface, borderColor: C.border }]}
        >
          <Text style={{ fontSize: 20, color: C.textPrimary }}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: C.textPrimary }]}>
          Postularme
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 120 }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Info de la solicitud */}
        {request && (
          <View style={[styles.card, { backgroundColor: C.surface, borderColor: C.border }]}>
            <Text style={[styles.cardLabel, { color: C.textPlaceholder }]}>
              TE POSTULAS A
            </Text>
            <Text style={[styles.cardTitle, { color: C.textPrimary }]}>
              {request.title}
            </Text>
            <Text style={[styles.cardMeta, { color: C.textSecondary }]}>
              📚 {request.subject_name} · por {request.author_name}
            </Text>
            {isClosed ? (
              <Text style={[styles.closedNotice, { color: C.error }]}>Convocatoria cerrada</Text>
            ) : null}
          </View>
        )}

        {/* Mensaje de presentación */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: C.textPrimary }]}>
            Mensaje de presentación
          </Text>
          <Text style={[styles.hint, { color: C.textSecondary }]}>
            Cuéntale al creador por qué quieres unirte y cómo puedes aportar al grupo.
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: C.surface,
                borderColor: C.border,
                color: C.textPrimary,
              },
            ]}
            placeholder="Ej: Hola, estoy cursando la materia y me gustaría estudiar en grupo porque..."
            placeholderTextColor={C.textPlaceholder}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            maxLength={500}
            value={message}
            onChangeText={setMessage}
          />
          <Text style={[styles.counter, { color: C.textPlaceholder }]}>
            {message.length}/500
          </Text>
        </View>
      </ScrollView>

      {/* Botón flotante */}
      <View
        style={[
          styles.footer,
          {
            backgroundColor: C.background,
            borderTopColor: C.border,
            paddingBottom: insets.bottom + 12,
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.sendBtn,
            {
              backgroundColor:
                isSubmitDisabled
                  ? C.border
                  : C.primary,
            },
          ]}
          onPress={handlePostular}
          disabled={isSubmitDisabled}
          activeOpacity={0.85}
        >
          {sending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={[styles.sendBtnText, { color: C.textOnPrimary }]}>
              Enviar postulación
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 10, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: { fontSize: 16, fontWeight: "700" },

  scroll: { padding: 16, gap: 20 },

  card: {
    borderRadius: 14, borderWidth: 1,
    padding: 16, gap: 6,
  },
  cardLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 1 },
  cardTitle: { fontSize: 17, fontWeight: "700", lineHeight: 24 },
  cardMeta: { fontSize: 13 },
  closedNotice: { fontSize: 12, marginTop: 4, fontWeight: "700" },

  section: { gap: 8 },
  label: { fontSize: 15, fontWeight: "700" },
  hint: { fontSize: 13, lineHeight: 19 },

  input: {
    borderWidth: 1, borderRadius: 12,
    padding: 14, minHeight: 140,
    fontSize: 15, lineHeight: 22,
  },
  counter: { fontSize: 12, textAlign: "right" },

  footer: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1,
  },
  sendBtn: {
    borderRadius: 12, paddingVertical: 14,
    alignItems: "center",
  },
  sendBtnText: { fontSize: 16, fontWeight: "700" },
});
