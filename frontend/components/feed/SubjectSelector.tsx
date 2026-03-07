/**
 * components/feed/SubjectSelector.tsx
 * Selector de materia para búsqueda de compañeros — US-005
 *
 * Muestra un dropdown con las materias del usuario.
 * Al seleccionar una materia, dispara la búsqueda de estudiantes
 * inscritos en la misma.
 */

import { Colors } from "@/constants/Colors"
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native"
import { useState } from "react"

interface SubjectOption {
  id: string
  name: string
}

interface Props {
  subjects: SubjectOption[]
  selectedId: string | null
  onSelect: (subjectId: string | null) => void
}

export function SubjectSelector({ subjects, selectedId, onSelect }: Props) {
  const scheme = useColorScheme() ?? "light"
  const C = Colors[scheme]
  const [visible, setVisible] = useState(false)

  // Nombre de la materia seleccionada para mostrar en el botón
  const selectedName =
    subjects.find((s) => s.id === selectedId)?.name ?? "Seleccionar materia"

  const handleSelect = (subjectId: string) => {
    onSelect(subjectId)
    setVisible(false)
  }

  const handleClear = () => {
    onSelect(null)
    setVisible(false)
  }

  return (
    <>
      {/* Botón que abre el selector */}
      <TouchableOpacity
        style={[
          styles.trigger,
          {
            backgroundColor: selectedId ? C.primary + "12" : C.surface,
            borderColor: selectedId ? C.primary : C.border,
          },
        ]}
        onPress={() => setVisible(true)}
        activeOpacity={0.8}
      >
        <Text style={[styles.triggerIcon]}>📚</Text>
        <Text
          style={[
            styles.triggerText,
            { color: selectedId ? C.primary : C.textSecondary },
          ]}
          numberOfLines={1}
        >
          {selectedName}
        </Text>
        <Text style={{ color: C.textSecondary, fontSize: 12 }}>▼</Text>
      </TouchableOpacity>

      {/* Modal con la lista de materias */}
      <Modal
        visible={visible}
        animationType="slide"
        transparent
        onRequestClose={() => setVisible(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          onPress={() => setVisible(false)}
          activeOpacity={1}
        >
          <View
            style={[styles.sheet, { backgroundColor: C.surface }]}
            onStartShouldSetResponder={() => true}
          >
            <View style={[styles.handle, { backgroundColor: C.border }]} />

            <Text style={[styles.title, { color: C.textPrimary }]}>
              Buscar compañeros en...
            </Text>

            <Text style={[styles.subtitle, { color: C.textSecondary }]}>
              Selecciona una materia para encontrar estudiantes inscritos
            </Text>

            <ScrollView
              style={{ maxHeight: 350 }}
              showsVerticalScrollIndicator={false}
            >
              {subjects.length === 0 ? (
                <Text
                  style={[styles.emptyText, { color: C.textSecondary }]}
                >
                  No tienes materias registradas.
                </Text>
              ) : (
                subjects.map((s) => {
                  const isSelected = s.id === selectedId
                  return (
                    <TouchableOpacity
                      key={s.id}
                      style={[
                        styles.option,
                        {
                          backgroundColor: isSelected
                            ? C.primary + "15"
                            : "transparent",
                          borderColor: isSelected ? C.primary : C.border,
                        },
                      ]}
                      onPress={() => handleSelect(s.id)}
                      activeOpacity={0.8}
                    >
                      <Text style={{ fontSize: 18, marginRight: 10 }}>
                        {isSelected ? "✅" : "📖"}
                      </Text>
                      <Text
                        style={[
                          styles.optionText,
                          {
                            color: isSelected
                              ? C.primary
                              : C.textPrimary,
                          },
                        ]}
                      >
                        {s.name}
                      </Text>
                    </TouchableOpacity>
                  )
                })
              )}
            </ScrollView>

            {/* Limpiar selección */}
            {selectedId && (
              <TouchableOpacity
                style={[styles.clearBtn, { borderColor: C.border }]}
                onPress={handleClear}
                activeOpacity={0.8}
              >
                <Text style={[styles.clearBtnText, { color: C.textSecondary }]}>
                  Limpiar selección
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  // Trigger button
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  triggerIcon: { fontSize: 16 },
  triggerText: { flex: 1, fontSize: 14, fontWeight: "500" },

  // Modal
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  title: { fontSize: 18, fontWeight: "700", marginBottom: 4 },
  subtitle: { fontSize: 13, marginBottom: 16 },
  emptyText: { fontSize: 14, textAlign: "center", paddingVertical: 24 },
  option: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  optionText: { fontSize: 14, fontWeight: "500", flex: 1 },
  clearBtn: {
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
  },
  clearBtnText: { fontSize: 14, fontWeight: "500" },
})
