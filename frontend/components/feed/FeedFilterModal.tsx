/**
 * components/feed/FeedFilterModal.tsx
 *
 * Bottom sheet modal para filtrar el feed por facultad.
 * Las facultades disponibles se derivan del feed actual (sin llamada extra).
 */

import { Colors } from "@/constants/Colors"
import { Modal, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from "react-native"

interface Props {
  visible: boolean
  onClose: () => void
  selectedFaculty: string | null
  onSelectFaculty: (f: string | null) => void
  faculties: string[]
  bottomInset: number
}

export function FeedFilterModal({
  visible,
  onClose,
  selectedFaculty,
  onSelectFaculty,
  faculties,
  bottomInset,
}: Props) {
  const scheme = useColorScheme() ?? "light"
  const C = Colors[scheme]

  const handleSelect = (faculty: string | null) => {
    onSelectFaculty(faculty)
    onClose()
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

          <Text style={[styles.title, { color: C.textPrimary }]}>
            Filtrar por Facultad
          </Text>

          {/* Opción "Todas" */}
          <FacultyOption
            label="Todas las facultades"
            isActive={!selectedFaculty}
            onPress={() => handleSelect(null)}
            C={C}
          />

          {faculties.length === 0 ? (
            <Text style={[styles.emptyText, { color: C.textSecondary }]}>
              No hay facultades disponibles.
            </Text>
          ) : (
            faculties.map((f) => (
              <FacultyOption
                key={f}
                label={f}
                isActive={selectedFaculty === f}
                onPress={() => handleSelect(f)}
                C={C}
              />
            ))
          )}
        </View>
      </TouchableOpacity>
    </Modal>
  )
}

// ── Opción individual ──────────────────────────────────────────────────────────
function FacultyOption({
  label,
  isActive,
  onPress,
  C,
}: {
  label: string
  isActive: boolean
  onPress: () => void
  C: ReturnType<typeof Colors.light extends infer T ? () => T : never> | any
}) {
  return (
    <TouchableOpacity
      style={[
        styles.option,
        {
          backgroundColor: isActive ? C.primary + "15" : "transparent",
          borderColor: isActive ? C.primary : C.border,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[styles.optionText, { color: isActive ? C.primary : C.textPrimary }]}>
        {label}
      </Text>
    </TouchableOpacity>
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
  title: { fontSize: 17, fontWeight: "700", marginBottom: 16 },
  emptyText: { fontSize: 14, marginTop: 8 },
  option: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
  },
  optionText: { fontSize: 14, fontWeight: "500" },
})
