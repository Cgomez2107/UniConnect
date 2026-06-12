import { useCallback, useRef } from "react"
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  useColorScheme,
  Platform,
  Alert,
} from "react-native"
import QRCode from "react-native-qrcode-svg"
import * as FileSystem from "expo-file-system/legacy"
import * as Sharing from "expo-sharing"
import { Colors } from "@/constants/Colors"

interface QrPassSheetProps {
  isOpen: boolean
  onClose: () => void
  qrContent: string
  eventTitle: string
}

export function QrPassSheet({ isOpen, onClose, qrContent, eventTitle }: QrPassSheetProps) {
  const scheme = useColorScheme() ?? "light"
  const C = Colors[scheme]
  const qrRef = useRef<any>(null)

  const handleSaveImage = useCallback(async () => {
    try {
      const svg = qrRef.current
      if (!svg) return

      const fileName = `pase-acceso-${eventTitle.replace(/\s+/g, "-")}.png`
      const fileUri = `${FileSystem.cacheDirectory}${fileName}`

      const imageDataBase64 = await new Promise<string>((resolve, reject) => {
        svg.toDataURL((data: string) => {
          resolve(data)
        })
      })

      const base64 = imageDataBase64.replace(/^data:image\/png;base64,/, "")
      await FileSystem.writeAsStringAsync(fileUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      })

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: "image/png",
          dialogTitle: "Compartir pase de acceso",
        })
      } else {
        Alert.alert("Guardado", `Imagen guardada en: ${fileUri}`)
      }
    } catch (err) {
      console.warn("[QrPassSheet] Error saving image:", err)
      Alert.alert("Error", "No se pudo guardar la imagen")
    }
  }, [eventTitle])

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: C.surface }]}>
          <View style={styles.handle} />

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            maximumZoomScale={3}
            minimumZoomScale={1}
            bouncesZoom
          >
            <Text style={[styles.title, { color: C.textPrimary }]}>
              Pase de Acceso
            </Text>
            <Text style={[styles.subtitle, { color: C.textSecondary }]}>
              {eventTitle}
            </Text>

            <View style={styles.qrContainer}>
              <QRCode
                value={qrContent}
                size={250}
                getRef={(ref) => { qrRef.current = ref }}
              />
            </View>

            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: C.primary }]}
              onPress={handleSaveImage}
              activeOpacity={0.85}
            >
              <Text style={styles.saveBtnText}>Guardar imagen</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.closeBtn, { borderColor: C.border }]}
              onPress={onClose}
              activeOpacity={0.85}
            >
              <Text style={[styles.closeBtnText, { color: C.textSecondary }]}>
                Cerrar
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
    maxHeight: "85%",
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#ccc",
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 8,
  },
  scrollContent: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  qrContainer: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtn: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  saveBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  closeBtn: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  closeBtnText: {
    fontSize: 16,
    fontWeight: "600",
  },
})

export default QrPassSheet
