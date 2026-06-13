import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native"
import { Ionicons } from "@expo/vector-icons"

type ScanStatus = "valid" | "used" | "invalid"

interface ScanResultCardProps {
  status: ScanStatus
  fullName?: string
  avatarUrl?: string | null
  reason?: string
  scannedAt?: string | null
  onContinue: () => void
}

const CONFIG: Record<ScanStatus, { bg: string; icon: keyof typeof Ionicons.glyphMap; title: string; textColor: string }> = {
  valid: { bg: "#16a34a", icon: "checkmark-circle", title: "Acceso Válido", textColor: "#fff" },
  used: { bg: "#ca8a04", icon: "time-outline", title: "Ya verificado", textColor: "#fff" },
  invalid: { bg: "#dc2626", icon: "close-circle", title: "No válido", textColor: "#fff" },
}

export function ScanResultCard({ status, fullName, avatarUrl, reason, scannedAt, onContinue }: ScanResultCardProps) {
  const config = CONFIG[status]

  return (
    <View style={[styles.container, { backgroundColor: config.bg }]}>
      <Ionicons name={config.icon} size={48} color="#fff" />

      <Text style={[styles.title, { color: config.textColor }]}>
        {config.title}
      </Text>

      {status === "valid" && (
        <>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Ionicons name="person" size={28} color="#fff" />
            </View>
          )}
          {fullName && (
            <Text style={[styles.subtitle, { color: config.textColor }]}>
              {fullName}
            </Text>
          )}
        </>
      )}

      {reason && (
        <Text style={[styles.reason, { color: config.textColor }]}>
          {reason}
        </Text>
      )}

      {scannedAt && (
        <Text style={[styles.timestamp, { color: config.textColor }]}>
          Primer escaneo: {new Date(scannedAt).toLocaleString("es-CO")}
        </Text>
      )}

      <TouchableOpacity
        style={styles.continueBtn}
        onPress={onContinue}
        activeOpacity={0.85}
      >
        <Text style={styles.continueBtnText}>Continuar escaneando</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 40,
    left: 16,
    right: 16,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    gap: 8,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  reason: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
    opacity: 0.9,
  },
  timestamp: {
    fontSize: 12,
    fontWeight: "400",
    textAlign: "center",
    opacity: 0.8,
  },
  continueBtn: {
    backgroundColor: "rgba(255,255,255,0.25)",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    marginTop: 8,
    width: "100%",
    alignItems: "center",
  },
  continueBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.5)",
    marginBottom: 4,
  },
  avatarFallback: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
})

export default ScanResultCard
