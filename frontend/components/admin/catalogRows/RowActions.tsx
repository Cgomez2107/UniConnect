import { Colors } from "@/constants/Colors";
import * as Haptics from "expo-haptics";
import { Text, TouchableOpacity, View, useColorScheme } from "react-native";
import { styles } from "./shared";

interface RowActionsProps {
  onEdit: () => void;
  onDelete: () => void;
}

export function RowActions({ onEdit, onDelete }: RowActionsProps) {
  const scheme = useColorScheme() ?? "light";
  const C = Colors[scheme];

  return (
    <View style={styles.actions}>
      <TouchableOpacity
        style={[styles.actionBtn, { backgroundColor: C.primary + "15" }]}
        onPress={onEdit}
        activeOpacity={0.85}
      >
        <Text style={[styles.actionText, { color: C.primary }]}>Editar</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.actionBtn, { backgroundColor: C.errorBackground }]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onDelete();
        }}
        activeOpacity={0.85}
      >
        <Text style={[styles.actionText, { color: C.error }]}>Eliminar</Text>
      </TouchableOpacity>
    </View>
  );
}
