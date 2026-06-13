import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  StyleProp,
  ViewStyle,
  TextStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Colors } from "@/constants/Colors";
import { useChatbotLogic, ChatMessage } from "@/hooks/application/useChatbotLogic";

interface ChatbotModalProps {
  visible: boolean;
  onClose: () => void;
}

export function ChatbotModal({ visible, onClose }: ChatbotModalProps) {
  const scheme = useColorScheme() ?? "light";
  const C = Colors[scheme];
  const { messages, isTyping, sendMessage, clearHistory } = useChatbotLogic();
  const [inputText, setInputText] = useState("");

  const handleSend = async () => {
    const trimmed = inputText.trim();
    if (!trimmed || isTyping) return;
    setInputText("");
    await sendMessage(trimmed);
  };

  const handleSuggestion = async (suggestion: string) => {
    if (isTyping) return;
    await sendMessage(suggestion);
  };

  const suggestions = [
    "¿Cómo puedo crear un grupo de estudio?",
    "¿Dónde veo mis próximos eventos?",
    "¿Cómo subir un recurso de estudio?",
  ];

  const renderItem = ({ item }: { item: ChatMessage }) => {
    const isUser = item.role === "user";
    return (
      <View
        style={[
          styles.messageRow,
          isUser ? styles.userRow : styles.assistantRow,
        ] as StyleProp<ViewStyle>}
      >
        <View
          style={[
            styles.bubble,
            isUser
              ? { backgroundColor: C.primary }
              : { backgroundColor: C.surfaceElevated, borderColor: C.border, borderWidth: 1 },
            isUser ? styles.userBubble : styles.assistantBubble,
          ] as StyleProp<ViewStyle>}
        >
          <Text
            style={[
              styles.messageText,
              { color: isUser ? C.textOnPrimary : C.text },
            ] as StyleProp<TextStyle>}
          >
            {item.content}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: C.background }] as StyleProp<ViewStyle>}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: C.border }] as StyleProp<ViewStyle>}>
          <View style={styles.headerLeft}>
            <View style={[styles.botIcon, { backgroundColor: C.primary }] as StyleProp<ViewStyle>}>
              <Ionicons name="hardware-chip-outline" size={20} color={C.textOnPrimary} />
            </View>
            <View>
              <Text style={[styles.headerTitle, { color: C.text }] as StyleProp<TextStyle>}>UniConnect AI</Text>
              <View style={styles.statusRow}>
                <View style={styles.statusDot} />
                <Text style={[styles.statusText, { color: C.textSecondary }] as StyleProp<TextStyle>}>En línea</Text>
              </View>
            </View>
          </View>
          <View style={styles.headerActions}>
            {messages.length > 0 && (
              <TouchableOpacity
                onPress={clearHistory}
                style={styles.headerButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="trash-outline" size={22} color={C.textSecondary} />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={onClose}
              style={styles.headerButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={24} color={C.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Messages */}
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 80}
        >
          {messages.length === 0 ? (
            <View style={styles.welcomeContainer}>
              <View style={[styles.welcomeBot, { backgroundColor: C.surfaceElevated }] as StyleProp<ViewStyle>}>
                <Ionicons name="logo-android" size={48} color={C.primary} />
              </View>
              <Text style={[styles.welcomeTitle, { color: C.text }] as StyleProp<TextStyle>}>
                ¡Hola! Soy tu asistente virtual de UniConnect
              </Text>
              <Text style={[styles.welcomeSubtitle, { color: C.textSecondary }] as StyleProp<TextStyle>}>
                ¿Tienes dudas sobre grupos de estudio, eventos o material académico? Pregúntame lo que quieras.
              </Text>
              
              <View style={styles.suggestionsContainer}>
                {suggestions.map((sug, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[styles.suggestionBtn, { backgroundColor: C.surfaceElevated, borderColor: C.border }] as StyleProp<ViewStyle>}
                    onPress={() => handleSuggestion(sug)}
                  >
                    <Text style={[styles.suggestionText, { color: C.textSecondary }] as StyleProp<TextStyle>}>{sug}</Text>
                    <Ionicons name="chevron-forward" size={14} color={C.textSecondary} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : (
            <FlatList
              data={messages}
              renderItem={renderItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContainer}
              inverted={true}
              ListHeaderComponent={
                isTyping ? (
                  <View style={[styles.messageRow, styles.assistantRow] as StyleProp<ViewStyle>}>
                    <View style={[styles.bubble, styles.assistantBubble, { backgroundColor: C.surfaceElevated, borderColor: C.border, borderWidth: 1, flexDirection: "row", alignItems: "center", gap: 6 }] as StyleProp<ViewStyle>}>
                      <ActivityIndicator size="small" color={C.primary} />
                      <Text style={{ color: C.textSecondary, fontSize: 13 }}>Escribiendo...</Text>
                    </View>
                  </View>
                ) : null
              }
            />
          )}

          {/* Footer Input */}
          <View style={[styles.footer, { borderTopColor: C.border, backgroundColor: C.surface }] as StyleProp<ViewStyle>}>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: C.background,
                  borderColor: C.border,
                  color: C.text,
                },
              ] as StyleProp<TextStyle>}
              placeholder="Haz una pregunta..."
              placeholderTextColor={C.textPlaceholder}
              value={inputText}
              onChangeText={setInputText}
              editable={!isTyping}
              onSubmitEditing={handleSend}
            />
            <TouchableOpacity
              onPress={handleSend}
              style={[
                styles.sendButton,
                { backgroundColor: inputText.trim() && !isTyping ? C.primary : C.border },
              ] as StyleProp<ViewStyle>}
              disabled={!inputText.trim() || isTyping}
            >
              <Ionicons name="send" size={18} color={inputText.trim() && !isTyping ? C.textOnPrimary : C.textSecondary} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  botIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10b981",
  },
  statusText: {
    fontSize: 10,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: "auto",
    gap: 12,
  },
  headerButton: {
    padding: 4,
  },
  keyboardView: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 24,
  },
  messageRow: {
    width: "100%",
    marginVertical: 6,
    flexDirection: "row",
  },
  userRow: {
    justifyContent: "flex-end",
  },
  assistantRow: {
    justifyContent: "flex-start",
  },
  bubble: {
    maxWidth: "80%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
  },
  userBubble: {
    borderBottomRightRadius: 2,
  },
  assistantBubble: {
    borderBottomLeftRadius: 2,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  welcomeContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  welcomeBot: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  welcomeTitle: {
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 24,
  },
  suggestionsContainer: {
    width: "100%",
    gap: 10,
  },
  suggestionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  suggestionText: {
    fontSize: 12,
    fontWeight: "500",
    flex: 1,
    marginRight: 10,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    gap: 12,
  },
  input: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    paddingHorizontal: 16,
    fontSize: 14,
    borderWidth: 1,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});
