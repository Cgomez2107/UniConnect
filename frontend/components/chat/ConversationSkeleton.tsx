import { SkeletonLoader } from "@/components/shared/SkeletonLoader";
import { Colors } from "@/constants/Colors";
import { memo } from "react";
import { StyleSheet, useColorScheme, View } from "react-native";

export const ConversationSkeleton = memo(function ConversationSkeleton() {
  const scheme = useColorScheme() ?? "light";
  const C = Colors[scheme];

  return (
    <View style={[styles.row, { backgroundColor: C.surface, borderBottomColor: C.border }]}> 
      <SkeletonLoader width={50} height={50} borderRadius={25} />
      <View style={styles.content}>
        <SkeletonLoader width="58%" height={16} borderRadius={5} style={styles.nameLine} />
        <SkeletonLoader width="88%" height={12} borderRadius={5} />
      </View>
      <SkeletonLoader width={36} height={10} borderRadius={4} />
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  content: {
    flex: 1,
  },
  nameLine: {
    marginBottom: 9,
  },
});
