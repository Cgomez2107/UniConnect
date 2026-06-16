import { useState, useCallback, useEffect, useRef } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  SafeAreaView,
} from "react-native"
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from "expo-camera"
import { router } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import { ScanResultCard } from "@/components/events/ScanResultCard"
import { fetchApi } from "@/lib/api/httpClient"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useAuthStore } from "@/store/useAuthStore"

type ScanStatus = "valid" | "used" | "invalid" | null

interface ScanResult {
  status: ScanStatus
  fullName?: string
  avatarUrl?: string | null
  reason?: string
  scannedAt?: string | null
}

export default function EscanearScreen() {
  const scheme = useColorScheme() ?? "light"
  const insets = useSafeAreaInsets()
  const isHydrating = useAuthStore((s) => s.isHydrating)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const [permission, requestPermission] = useCameraPermissions()
  const [scanning, setScanning] = useState(true)
  const [result, setResult] = useState<ScanResult>({ status: null })
  const scanningRef = useRef(true)

  useEffect(() => {
    if (!isHydrating && !isAuthenticated) {
      router.replace("/(tabs)" as any)
    }
  }, [isHydrating, isAuthenticated])

  const handleBarCodeScanned = useCallback(async (scanResult: BarcodeScanningResult) => {
    if (!scanningRef.current) return
    scanningRef.current = false
    setScanning(false)

    try {
      const response = await fetchApi<{
        valid: boolean
        user?: { fullName: string; avatarUrl: string | null }
        reason?: string
        scannedAt?: string | null
      }>("/registration/verify", {
        method: "POST",
        body: JSON.stringify({ qrData: scanResult.data }),
      })

      if (response.valid) {
        setResult({
          status: "valid",
          fullName: response.user?.fullName,
          avatarUrl: response.user?.avatarUrl,
        })
      } else if (response.reason === "Ya verificado") {
        setResult({
          status: "used",
          reason: response.reason,
          scannedAt: response.scannedAt,
        })
      } else {
        setResult({
          status: "invalid",
          reason: response.reason ?? "QR no válido",
        })
      }
    } catch (err: any) {
      setResult({
        status: "invalid",
        reason: err?.message || "Error de conexión",
      })
    }
  }, [])

  const handleContinueScanning = useCallback(() => {
    setResult({ status: null })
    scanningRef.current = true
    setScanning(true)
  }, [])

  const handleClose = useCallback(() => {
    router.back()
  }, [])

  if (!permission) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: "#000" }]}>
        <View style={styles.centerContent}>
          <Text style={styles.permissionText}>Solicitando permiso de cámara...</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: "#000" }]}>
        <View style={styles.centerContent}>
          <Ionicons name="camera-outline" size={48} color="#fff" />
          <Text style={styles.permissionText}>Permiso de cámara requerido</Text>
          <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
            <Text style={styles.permissionBtnText}>Conceder permiso</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
            <Text style={styles.closeBtnText}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: "#000" }]}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
        onBarcodeScanned={scanning ? handleBarCodeScanned : undefined}
      >
        {/* Viewfinder overlay */}
        <View style={styles.overlay}>
          <View style={styles.viewfinder}>
            <View style={styles.cornerTL} />
            <View style={styles.cornerTR} />
            <View style={styles.cornerBL} />
            <View style={styles.cornerBR} />
          </View>
          <Text style={styles.hintText}>Coloca el código QR en el centro</Text>
        </View>
      </CameraView>

      {/* Close button */}
      <TouchableOpacity
        style={[styles.closeScanBtn, { top: insets.top + 12 }]}
        onPress={handleClose}
        activeOpacity={0.85}
      >
        <Ionicons name="close" size={24} color="#fff" />
      </TouchableOpacity>

      {/* Scan result card */}
      {result.status && (
        <ScanResultCard
          status={result.status}
          fullName={result.fullName}
          avatarUrl={result.avatarUrl}
          reason={result.reason}
          scannedAt={result.scannedAt}
          onContinue={handleContinueScanning}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 32,
  },
  permissionText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  permissionBtn: {
    backgroundColor: "#4f46e5",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  permissionBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  closeBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  closeBtnText: {
    color: "#9ca3af",
    fontSize: 15,
    fontWeight: "600",
  },
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  viewfinder: {
    width: 250,
    height: 250,
    position: "relative",
  },
  cornerTL: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 30,
    height: 30,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: "#fff",
    borderTopLeftRadius: 8,
  },
  cornerTR: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 30,
    height: 30,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: "#fff",
    borderTopRightRadius: 8,
  },
  cornerBL: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: 30,
    height: 30,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: "#fff",
    borderBottomLeftRadius: 8,
  },
  cornerBR: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: "#fff",
    borderBottomRightRadius: 8,
  },
  hintText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
    marginTop: 24,
    opacity: 0.8,
  },
  closeScanBtn: {
    position: "absolute",
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
})
