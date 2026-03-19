import { Colors } from "@/constants/Colors";
import { Image as ExpoImage } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { StatusBar } from "expo-status-bar";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { WebView } from "react-native-webview";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function guessIsImage(fileType: string, url: string): boolean {
  const ext = (fileType || url.split("?")[0].split(".").pop() || "").toLowerCase();
  return ["jpg", "jpeg", "png", "webp", "gif", "heic"].includes(ext);
}

function getExtension(url: string, fileType: string): string {
  const ext = (fileType || url.split("?")[0].split(".").pop() || "").toLowerCase();
  return ext || "archivo";
}

export default function ViewerScreen() {
  const params = useLocalSearchParams<{
    url?: string;
    title?: string;
    fileName?: string;
    fileType?: string;
  }>();

  const scheme = useColorScheme() ?? "light";
  const C = Colors[scheme];
  const insets = useSafeAreaInsets();
  const [downloading, setDownloading] = useState(false);

  const fileUrl = typeof params.url === "string" ? decodeURIComponent(params.url) : "";
  const title = typeof params.title === "string" ? decodeURIComponent(params.title) : "Archivo";
  const fileName = typeof params.fileName === "string" ? decodeURIComponent(params.fileName) : "archivo";
  const fileType = typeof params.fileType === "string" ? decodeURIComponent(params.fileType) : "";

  const isImage = useMemo(() => guessIsImage(fileType, fileUrl), [fileType, fileUrl]);
  const extension = useMemo(() => getExtension(fileUrl, fileType), [fileType, fileUrl]);

  const handleDownload = async () => {
    if (!fileUrl) return;

    setDownloading(true);
    try {
      const localPath = FileSystem.cacheDirectory + fileName;
      const { uri } = await FileSystem.downloadAsync(fileUrl, localPath);
      const canShare = await Sharing.isAvailableAsync();

      if (canShare) {
        await Sharing.shareAsync(uri);
      } else {
        Alert.alert("Descargado", `Guardado en: ${uri}`);
      }
    } catch {
      Alert.alert("Error", "No se pudo descargar el archivo.");
    } finally {
      setDownloading(false);
    }
  };

  if (!fileUrl) {
    return (
      <View style={[styles.screen, { backgroundColor: C.background, paddingTop: insets.top }]}>
        <Text style={[styles.errorText, { color: C.error }]}>No hay archivo para visualizar.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: C.background }]}>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />

      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { borderColor: C.border }]}>
          <Text style={[styles.backText, { color: C.textPrimary }]}>Volver</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 18 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.heroCard, { backgroundColor: C.surface, borderColor: C.border }]}>
          <Text numberOfLines={2} style={[styles.title, { color: C.textPrimary }]}>
            {title}
          </Text>
          <View style={styles.metaRow}>
            <View style={[styles.pill, { backgroundColor: C.background, borderColor: C.border }]}>
              <Text style={[styles.pillText, { color: C.textSecondary }]}>{extension.toUpperCase()}</Text>
            </View>
            <View style={[styles.pill, { backgroundColor: C.background, borderColor: C.border }]}>
              <Text style={[styles.pillText, { color: C.textSecondary }]}>{isImage ? "Imagen" : "Documento"}</Text>
            </View>
          </View>
        </View>

        <View style={[styles.viewerCard, { borderColor: C.border, backgroundColor: C.surface }]}>
          {isImage ? (
            <View style={styles.imageWrap}>
              <ExpoImage source={{ uri: fileUrl }} style={styles.image} contentFit="contain" />
            </View>
          ) : (
            <View style={styles.webWrap}>
              <WebView
                source={{ uri: fileUrl }}
                startInLoadingState
                renderLoading={() => (
                  <View style={[styles.loaderWrap, { backgroundColor: C.background }]}>
                    <ActivityIndicator size="large" color={C.primary} />
                  </View>
                )}
              />
            </View>
          )}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: C.primary }]}
            onPress={handleDownload}
            disabled={downloading}
          >
            <Text style={styles.actionText}>{downloading ? "Descargando..." : "Descargar o compartir"}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtnSecondary, { borderColor: C.border, backgroundColor: C.surface }]}
            onPress={() => Linking.openURL(fileUrl).catch(() => Alert.alert("Error", "No se pudo abrir externamente."))}
          >
            <Text style={[styles.actionTextSecondary, { color: C.textPrimary }]}>Abrir en navegador</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  content: {
    paddingHorizontal: 12,
    gap: 12,
  },
  backBtn: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  backText: { fontSize: 14, fontWeight: "700" },
  heroCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  title: { fontSize: 18, fontWeight: "800", lineHeight: 24 },
  metaRow: {
    flexDirection: "row",
    gap: 8,
  },
  pill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  pillText: {
    fontSize: 11,
    fontWeight: "700",
  },
  viewerCard: {
    borderWidth: 1,
    borderRadius: 16,
    overflow: "hidden",
  },
  imageWrap: {
    width: "100%",
    height: 460,
    backgroundColor: "#0b1320",
  },
  image: { flex: 1 },
  webWrap: {
    width: "100%",
    height: 560,
  },
  loaderWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  actions: {
    gap: 8,
  },
  actionBtn: {
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  actionBtnSecondary: {
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  actionText: { color: "#fff", fontWeight: "700" },
  actionTextSecondary: { fontWeight: "700" },
  errorText: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 30,
  },
});
