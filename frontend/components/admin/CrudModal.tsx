/**
 * components/admin/CrudModal.tsx
 * Modal genérico de creación / edición para el panel admin.
 * Acepta cualquier formulario como children.
 */

import { Colors } from "@/constants/Colors"
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native"

interface Props {
  visible: boolean
  title: string
  error: string
  isSubmitting: boolean
  onClose: () => void
  onSave: () => void
  children: React.ReactNode
  C: typeof Colors["light"]
}

/**
 * Modal reutilizable para operaciones CRUD del panel admin.
 *
 * @param visible Controla la visibilidad del modal.
 * @param title Título principal mostrado en la cabecera.
 * @param error Mensaje de error de validación o persistencia.
 * @param isSubmitting Indica si hay una operación de guardado en curso.
 * @param onClose Cierra el modal.
 * @param onSave Ejecuta la acción de guardado.
 * @param children Contenido del formulario renderizado dentro del modal.
 * @param C Paleta de colores activa de la aplicación.
 */
export function CrudModal({
  visible, title, error, isSubmitting, onClose, onSave, children, C,
}: Props) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <TouchableOpacity style={styles.overlay} onPress={onClose} activeOpacity={1}>
          <View
            style={[styles.sheet, { backgroundColor: C.surface }]}
            onStartShouldSetResponder={() => true}
          >
            <View style={[styles.handle, { backgroundColor: C.border }]} />
            <Text style={[styles.title, { color: C.textPrimary }]}>{title}</Text>

            {!!error && (
              <View
                style={[
                  styles.errorBox,
                  { backgroundColor: C.errorBackground, borderColor: C.borderError },
                ]}
              >
                <Text style={{ fontSize: 13, color: C.error }}>{error}</Text>
              </View>
            )}

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {children}
            </ScrollView>

            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.cancelBtn, { borderColor: C.border }]}
                onPress={onClose}
                activeOpacity={0.8}
              >
                <Text style={[styles.cancelText, { color: C.textSecondary }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: C.primary }]}
                onPress={onSave}
                disabled={isSubmitting}
                activeOpacity={0.85}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveText}>Guardar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  )
}

/** Etiqueta de campo del formulario */
export function FieldLabel({
  text,
  style,
}: {
  text: string
  style?: StyleProp<TextStyle>
}) {
  const scheme = useColorScheme() ?? "light"
  const C = Colors[scheme]

  return (
    <Text
      style={[{ fontSize: 13, fontWeight: "500", marginBottom: 8, color: C.textSecondary }, style]}
    >
      {text}
    </Text>
  )
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.45)" },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 32,
    maxHeight: "85%",
  },
  handle: { alignSelf: "center", width: 36, height: 4, borderRadius: 2, marginBottom: 16 },
  title: { fontSize: 18, fontWeight: "700", marginBottom: 16 },
  errorBox: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  actions: { flexDirection: "row", gap: 10, marginTop: 20 },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: "center",
  },
  cancelText: { fontSize: 15, fontWeight: "600" },
  saveBtn: { flex: 1, borderRadius: 10, paddingVertical: 13, alignItems: "center" },
  saveText: { color: "#fff", fontSize: 15, fontWeight: "700" },
})
