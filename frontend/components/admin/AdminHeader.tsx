/**
 * components/admin/AdminHeader.tsx
 * Barra superior del panel de administración.
 */

import { Colors } from "@/constants/Colors"
import { Ionicons } from "@expo/vector-icons"
import { StyleSheet, Text, TouchableOpacity, View } from "react-native"

interface Props {
  userName: string
  onSignOut: () => void
  C: typeof Colors["light"]
}

export function AdminHeader({ userName, onSignOut, C }: Props) {
  return (
    <View style={[styles.header, { backgroundColor: C.primary }]}>
      <View>
        <Text style={styles.title}>Panel de Administración</Text>
        <View style={styles.subRow}>
          <Text style={styles.sub}>Hola, {userName.split(" ")[0]}</Text>
          <Ionicons name="settings-outline" size={13} color="rgba(255,255,255,0.8)" />
        </View>
      </View>
      <TouchableOpacity
        style={[styles.signOutBtn, { borderColor: "rgba(255,255,255,0.4)" }]}
        onPress={onSignOut}
        activeOpacity={0.8}
      >
        <Text style={styles.signOutText}>Salir</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  sub: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 13,
    marginTop: 2,
  },
  subRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  signOutBtn: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  signOutText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
})
