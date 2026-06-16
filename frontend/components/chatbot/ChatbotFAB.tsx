import React, { useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Colors } from "@/constants/Colors";
import { ChatbotModal } from "./ChatbotModal";

export function ChatbotFAB() {
  const scheme = useColorScheme() ?? "light";
  const C = Colors[scheme];
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <>
      <TouchableOpacity
        style={[
          styles.fab,
          {
            backgroundColor: C.primary,
            shadowColor: scheme === "dark" ? C.primary : "#000",
          },
        ]}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.85}
      >
        <Ionicons name="chatbubble-ellipses" size={26} color={C.textOnPrimary} />
        <View style={[styles.dot, { backgroundColor: C.accent }]} />
      </TouchableOpacity>

      <ChatbotModal visible={modalVisible} onClose={() => setModalVisible(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    bottom: 90,
    left: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  dot: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#fff",
  },
});
