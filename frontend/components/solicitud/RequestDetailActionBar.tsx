import { Colors } from "@/constants/Colors";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface Props {
  C: (typeof Colors)["light"];
  insetsBottom: number;
  isOwnPost: boolean;
  canManageRequest: boolean;
  applicationStatus: "aceptada" | "pendiente" | "rechazada" | null;
  requestStatus: string;
  requestId: string;
  requestAuthorName: string;
  chatLoading: boolean;
  cancelingAction: boolean;
  onOpenChat: () => void;
  onCancelRequest: () => void;
  onCancelMyApplication: () => void;
  onOpenPostulate: (requestId: string) => void;
}

export function RequestDetailActionBar({
  C,
  insetsBottom,
  isOwnPost,
  canManageRequest,
  applicationStatus,
  requestStatus,
  requestId,
  requestAuthorName,
  chatLoading,
  cancelingAction,
  onOpenChat,
  onCancelRequest,
  onCancelMyApplication,
  onOpenPostulate,
}: Props) {
  return (
    <View
      style={[
        styles.floatingBar,
        {
          backgroundColor: C.background,
          borderTopColor: C.border,
          paddingBottom: insetsBottom + 12,
        },
      ]}
    >
      {isOwnPost ? (
        <View style={{ gap: 8 }}>
          <View style={[styles.ownPostBanner, { backgroundColor: C.surface, borderColor: C.border }]}>
            <Text style={[styles.ownPostText, { color: C.textSecondary }]}>✏️ Esta es tu solicitud</Text>
          </View>
          <TouchableOpacity
            style={[styles.secondaryDangerBtn, { borderColor: C.error }]}
            onPress={onCancelRequest}
            disabled={cancelingAction}
            activeOpacity={0.85}
          >
            <Text style={[styles.secondaryDangerText, { color: C.error }]}>Cancelar solicitud</Text>
          </TouchableOpacity>
        </View>
      ) : canManageRequest ? (
        <View style={{ gap: 8 }}>
          <View style={[styles.ownPostBanner, { backgroundColor: C.surface, borderColor: C.border }]}>
            <Text style={[styles.ownPostText, { color: C.textSecondary }]}>🛠 Eres administrador de esta solicitud</Text>
          </View>
          <TouchableOpacity
            style={[styles.secondaryDangerBtn, { borderColor: C.error }]}
            onPress={onCancelRequest}
            disabled={cancelingAction}
            activeOpacity={0.85}
          >
            <Text style={[styles.secondaryDangerText, { color: C.error }]}>Cancelar solicitud</Text>
          </TouchableOpacity>
        </View>
      ) : applicationStatus === "aceptada" ? (
        <View style={{ gap: 8 }}>
          <TouchableOpacity
            style={[styles.postulateBtn, { backgroundColor: chatLoading ? C.border : C.primary }]}
            onPress={onOpenChat}
            disabled={chatLoading}
            activeOpacity={0.85}
          >
            <Text style={[styles.postulateBtnText, { color: C.textOnPrimary }]}> 
              {chatLoading ? "Abriendo chat..." : `💬 Mensaje a ${requestAuthorName.split(" ")[0]}`}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryDangerBtn, { borderColor: C.error }]}
            onPress={onCancelMyApplication}
            disabled={cancelingAction}
            activeOpacity={0.85}
          >
            <Text style={[styles.secondaryDangerText, { color: C.error }]}>Salir del grupo</Text>
          </TouchableOpacity>
        </View>
      ) : applicationStatus === "pendiente" ? (
        <View style={{ gap: 8 }}>
          <View style={[styles.ownPostBanner, { backgroundColor: C.surface, borderColor: C.border }]}>
            <Text style={[styles.ownPostText, { color: C.textSecondary }]}>⏳ Tu postulación está en revisión</Text>
          </View>
          <TouchableOpacity
            style={[styles.secondaryDangerBtn, { borderColor: C.error }]}
            onPress={onCancelMyApplication}
            disabled={cancelingAction}
            activeOpacity={0.85}
          >
            <Text style={[styles.secondaryDangerText, { color: C.error }]}>Retirar postulación</Text>
          </TouchableOpacity>
        </View>
      ) : applicationStatus === "rechazada" ? (
        <View style={[styles.closedBanner, { backgroundColor: C.surface, borderColor: C.error + "40" }]}>
          <Text style={[styles.closedText, { color: C.error }]}>❌ Tu postulación fue rechazada</Text>
        </View>
      ) : requestStatus === "abierta" ? (
        <TouchableOpacity
          style={[styles.postulateBtn, { backgroundColor: C.primary }]}
          onPress={() => onOpenPostulate(requestId)}
          activeOpacity={0.85}
        >
          <Text style={[styles.postulateBtnText, { color: C.textOnPrimary }]}>Postularme a este grupo</Text>
        </TouchableOpacity>
      ) : (
        <View style={[styles.closedBanner, { backgroundColor: C.surface, borderColor: C.border }]}>
          <Text style={[styles.closedText, { color: C.textSecondary }]}>🔒 Esta solicitud ya está cerrada</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  floatingBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  postulateBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  postulateBtnText: { fontSize: 16, fontWeight: "700" },
  ownPostBanner: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
  },
  ownPostText: { fontSize: 14, fontWeight: "600" },
  secondaryDangerBtn: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  secondaryDangerText: {
    fontSize: 14,
    fontWeight: "700",
  },
  closedBanner: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
  },
  closedText: { fontSize: 14, fontWeight: "600" },
});
