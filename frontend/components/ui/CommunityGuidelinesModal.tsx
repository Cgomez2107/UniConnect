import { Colors } from "@/constants/Colors";
import { Modal, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from "react-native";

interface Props {
  visible: boolean;
  onClose: () => void;
  errorCode: string | null;
}

export function CommunityGuidelinesModal({ visible, onClose, errorCode }: Props) {
  const scheme = useColorScheme() ?? "light";
  const C = Colors[scheme];

  const getGuidelinesDetails = (code: string | null) => {
    const cleanCode = code?.toUpperCase() || "";

    if (cleanCode.includes("MO_001") || cleanCode.includes("MESSAGE_TOO_LONG") || cleanCode.includes("LIMIT")) {
      return {
        title: "Límite de Longitud",
        guideline: "Los mensajes demasiado largos dificultan la lectura y la interacción. Mantén tus mensajes bajo el límite permitido de 1000 caracteres.",
        tip: "Intenta resumir tus ideas o enviar la información en múltiples partes más cortas.",
        icon: "📝",
      };
    }

    if (cleanCode.includes("MO_002") || cleanCode.includes("FORBIDDEN_WORDS") || cleanCode.includes("BANNED_CONTENT") || cleanCode.includes("PALABRA")) {
      return {
        title: "Lenguaje y Respeto",
        guideline: "No se permiten palabras ofensivas, de odio o contenido inapropiado en los canales de UniConnect. Fomentamos un ambiente de estudio y colaboración seguro.",
        tip: "Por favor, exprésate de manera constructiva y respetuosa con los demás estudiantes.",
        icon: "🤝",
      };
    }

    if (cleanCode.includes("MO_004") || cleanCode.includes("ESCALATED_TO_ADMIN") || cleanCode.includes("REVISION") || cleanCode.includes("HUMANA")) {
      return {
        title: "Revisión Humana",
        guideline: "Tras repetidas infracciones a nuestras normas de convivencia, tu cuenta ha sido temporalmente restringida y tu caso ha sido escalado a revisión por un administrador.",
        tip: "Un administrador del sistema revisará el historial para determinar el estado de tu cuenta de forma manual.",
        icon: "🚨",
      };
    }

    // Default to SPAM/MO_003 rules
    return {
      title: "Prevención de Spam",
      guideline: "El envío rápido y masivo de mensajes interrumpe la fluidez y satura el canal de chat. Por favor, modera la frecuencia de tus envíos.",
      tip: "El sistema limita los mensajes a un máximo de 5 mensajes en un lapso de 30 segundos.",
      icon: "⏳",
    };
  };

  const details = getGuidelinesDetails(errorCode);

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
            { backgroundColor: C.surface },
          ]}
          onStartShouldSetResponder={() => true}
        >
          <View style={[styles.handle, { backgroundColor: C.border }]} />

          <View style={styles.header}>
            <Text style={styles.icon}>{details.icon}</Text>
            <Text style={[styles.title, { color: C.textPrimary }]}>Normas de la Comunidad</Text>
            <Text style={[styles.subtitle, { color: C.textSecondary }]}>
              Regla afectada: <Text style={{ fontWeight: "700", color: C.primary }}>{details.title}</Text>
            </Text>
          </View>

          <View style={[styles.contentBox, { backgroundColor: C.surface, borderColor: C.border }]}>
            <Text style={[styles.guidelineText, { color: C.textPrimary }]}>
              {details.guideline}
            </Text>
          </View>

          <View style={[styles.tipBox, { backgroundColor: C.primary + "08", borderColor: C.primary + "30" }]}>
            <Text style={[styles.tipTitle, { color: C.primary }]}>Sugerencia:</Text>
            <Text style={[styles.tipText, { color: C.textSecondary }]}>
              {details.tip}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.closeBtn, { backgroundColor: C.primary }]}
            onPress={onClose}
            activeOpacity={0.85}
          >
            <Text style={[styles.closeBtnText, { color: "#fff" }]}>Entendido</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
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
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 36,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  icon: {
    fontSize: 40,
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 13,
    textAlign: "center",
  },
  contentBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  guidelineText: {
    fontSize: 14,
    lineHeight: 20,
  },
  tipBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 24,
  },
  tipTitle: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 4,
  },
  tipText: {
    fontSize: 13,
    lineHeight: 18,
  },
  closeBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  closeBtnText: {
    fontSize: 15,
    fontWeight: "700",
  },
});
