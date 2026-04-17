/**
 * components/feed/FeedFilterModal.tsx
 *
 * Bottom sheet modal para filtrar el feed por materias (multi-selección).
 * Solo muestra las materias que el usuario tiene registradas.
 */

import { Colors } from "@/constants/Colors"
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from "react-native"

interface SubjectOption {
  id: string
  name: string
}

interface Props {
  visible: boolean
  onClose: () => void
  selectedSubjects: string[]
  onSelectSubjects: (s: string[]) => void
  subjects: SubjectOption[]
  bottomInset: number
}

export function FeedFilterModal({
  visible,
  onClose,
  selectedSubjects,
  onSelectSubjects,
  subjects,
  bottomInset,
}: Props) {
  const scheme = useColorScheme() ?? "light"
  const C = Colors[scheme]

  const toggleSubject = (id: string) => {
    if (selectedSubjects.includes(id)) {
      onSelectSubjects(selectedSubjects.filter((s) => s !== id))
    } else {
      onSelectSubjects([...selectedSubjects, id])
    }
  }

  const handleClearAll = () => {
    onSelectSubjects([])
  }

  const handleSelectAll = () => {
    onSelectSubjects(subjects.map((s) => s.id))
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.overlay} onPress={onClose} activeOpacity={1}>
        <View
          style={[
            styles.sheet,
            { backgroundColor: C.surface, paddingBottom: bottomInset + 24 },
          ]}
          onStartShouldSetResponder={() => true}
        >
          <View style={[styles.handle, { backgroundColor: C.border }]} />

          <View style={styles.headerRow}>
            <Text style={[styles.title, { color: C.textPrimary }]}>Filtrar por materia</Text>
            {selectedSubjects.length > 0 && (
              <TouchableOpacity onPress={handleClearAll}>
                <Text style={[styles.clearText, { color: C.error }]}>Limpiar</Text>
              </TouchableOpacity>
            )}
          </View>

          <Text style={[styles.subtitle, { color: C.textSecondary }]}>
            {selectedSubjects.length === 0
              ? "Mostrando todas tus materias"
              : `${selectedSubjects.length} materia${selectedSubjects.length > 1 ? "s" : ""} seleccionada${selectedSubjects.length > 1 ? "s" : ""}`}
          </Text>

          <ScrollView style={{ maxHeight: 350 }} showsVerticalScrollIndicator={false}>
            {subjects.length === 0 ? (
              <Text style={[styles.emptyText, { color: C.textSecondary }]}>
                No tienes materias registradas.
              </Text>
            ) : (
              subjects.map((s) => {
                const isSelected = selectedSubjects.includes(s.id)
                return (
                  <TouchableOpacity
                    key={s.id}
                    style={[
                      styles.option,
                      {
                        backgroundColor: isSelected ? C.primary + "15" : "transparent",
                        borderColor: isSelected ? C.primary : C.border,
                      },
                    ]}
                    onPress={() => toggleSubject(s.id)}
                    activeOpacity={0.8}
                  >
                    <Text style={{ fontSize: 18, marginRight: 10 }}>
                      {isSelected ? "☑" : "☐"}
                    </Text>
                    <Text style={[styles.optionText, { color: isSelected ? C.primary : C.textPrimary }]}>
                      {s.name}
                    </Text>
                  </TouchableOpacity>
                )
              })
            )}
          </ScrollView>

          {/* Acciones */}
          <View style={styles.actionsRow}>
            {subjects.length > 1 && (
              <TouchableOpacity
                style={[styles.secondaryBtn, { borderColor: C.border }]}
                onPress={selectedSubjects.length === subjects.length ? handleClearAll : handleSelectAll}
                activeOpacity={0.85}
              >
                <Text style={[styles.secondaryBtnText, { color: C.textSecondary }]}>
                  {selectedSubjects.length === subjects.length ? "Quitar todas" : "Seleccionar todas"}
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.applyBtn, { backgroundColor: C.primary, flex: 1 }]}
              onPress={onClose}
              activeOpacity={0.85}
            >
              <Text style={[styles.applyBtnText, { color: C.textOnPrimary }]}>Aplicar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "#00000050",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  title: { fontSize: 17, fontWeight: "700" },
  clearText: { fontSize: 13, fontWeight: "600" },
  subtitle: { fontSize: 13, marginBottom: 16 },
  emptyText: { fontSize: 14, marginTop: 4, marginBottom: 8 },
  option: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
  },
  optionText: { fontSize: 14, fontWeight: "500", flex: 1 },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  secondaryBtn: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  secondaryBtnText: { fontSize: 13, fontWeight: "600" },
  applyBtn: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  applyBtnText: { fontSize: 15, fontWeight: "700" },
})
