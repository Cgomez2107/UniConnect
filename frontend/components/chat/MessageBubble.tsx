/**
 * components/chat/MessageBubble.tsx
 *
 * Burbuja de mensaje individual.
 * - Burbuja propia (derecha, color primario)
 * - Burbuja ajena (izquierda, gris)
 * - Timestamp
 * - Indicador de leído (✓✓ azul / ✓ gris)
 */

import { Colors } from "@/constants/Colors";
import type { Message } from "@/types";
import { memo } from "react";
import { StyleSheet, Text, useColorScheme, View } from "react-native";

interface Props {
  message: Message;
  isOwn: boolean;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
}

export const MessageBubble = memo(function MessageBubble({ message, isOwn }: Props) {
  const scheme = useColorScheme() ?? "light";
  const C = Colors[scheme];

  return (
    <View style={[styles.row, isOwn ? styles.rowOwn : styles.rowOther]}>
      <View
        style={[
          styles.bubble,
          isOwn
            ? [styles.bubbleOwn, { backgroundColor: C.primary }]
            : [styles.bubbleOther, { backgroundColor: C.surface, borderColor: C.border }],
        ]}
      >
        <Text
          style={[
            styles.content,
            { color: isOwn ? "#fff" : C.text },
          ]}
        >
          {message.content}
        </Text>

        {/* Meta: hora + estado de lectura */}
        <View style={styles.meta}>
          <Text style={[styles.time, { color: isOwn ? "rgba(255,255,255,0.7)" : C.textSecondary }]}>
            {formatTime(message.created_at)}
          </Text>
          {isOwn && (
            <Text style={styles.readDot}>
              {message.read_at ? "✓✓" : "✓"}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    marginVertical: 3,
    paddingHorizontal: 12,
  },
  rowOwn: {
    justifyContent: "flex-end",
  },
  rowOther: {
    justifyContent: "flex-start",
  },

  bubble: {
    maxWidth: "75%",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  bubbleOwn: {
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    borderWidth: 1,
    borderBottomLeftRadius: 4,
  },

  content: {
    fontSize: 15,
    lineHeight: 21,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 3,
    marginTop: 3,
  },
  time: {
    fontSize: 11,
  },
  readDot: {
    fontSize: 11,
    color: "rgba(255,255,255,0.7)",
  },
});
