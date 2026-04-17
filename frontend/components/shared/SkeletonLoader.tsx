/**
 * components/shared/SkeletonLoader.tsx
 * Skeleton loaders para listas y contenido mientras carga
 */

import { Colors } from "@/constants/Colors";
import { useEffect, useRef } from "react";
import {
  Animated,
  StyleSheet,
  useColorScheme,
  View,
} from "react-native";

interface SkeletonLoaderProps {
  width?: number | string;
  height: number;
  borderRadius?: number;
  style?: any;
}

export function SkeletonLoader({
  width = "100%",
  height,
  borderRadius = 8,
  style,
}: SkeletonLoaderProps) {
  const scheme = useColorScheme() ?? "light";
  const C = Colors[scheme];
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [shimmerAnim]);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 0.7, 0.3],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          backgroundColor: C.surface,
          opacity,
        },
        style,
      ]}
    />
  );
}

/**
 * Skeleton para un elemento de conversación (chat list)
 */
export function ConversationSkeletonLoader() {
  const scheme = useColorScheme() ?? "light";
  const C = Colors[scheme];

  return (
    <View style={[styles.conversationSkeleton, { backgroundColor: C.surface, borderBottomColor: C.border }]}>
      {/* Avatar placeholder */}
      <SkeletonLoader width={48} height={48} borderRadius={24} />

      {/* Content */}
      <View style={styles.skeletonContent}>
        <SkeletonLoader width="60%" height={16} borderRadius={4} style={{ marginBottom: 8 }} />
        <SkeletonLoader width="90%" height={12} borderRadius={4} />
      </View>

      {/* Timestamp placeholder */}
      <SkeletonLoader width={40} height={12} borderRadius={4} />
    </View>
  );
}

/**
 * Skeleton para un item del feed (publication card)
 */
export function FeedItemSkeletonLoader() {
  const scheme = useColorScheme() ?? "light";
  const C = Colors[scheme];

  return (
    <View style={[styles.feedItemSkeleton, { backgroundColor: C.surface, borderColor: C.border }]}>
      {/* Header: avatar + name + date */}
      <View style={styles.feedHeader}>
        <SkeletonLoader width={40} height={40} borderRadius={20} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <SkeletonLoader width="70%" height={14} borderRadius={4} style={{ marginBottom: 6 }} />
          <SkeletonLoader width="40%" height={11} borderRadius={4} />
        </View>
      </View>

      {/* Content */}
      <View style={styles.feedContent}>
        <SkeletonLoader width="100%" height={14} borderRadius={4} style={{ marginBottom: 8 }} />
        <SkeletonLoader width="90%" height={14} borderRadius={4} />
      </View>

      {/* Image placeholder */}
      <SkeletonLoader
        width="100%"
        height={200}
        borderRadius={8}
        style={{ marginVertical: 12 }}
      />

      {/* Footer: stats */}
      <View style={styles.feedFooter}>
        <SkeletonLoader width="30%" height={12} borderRadius={4} />
        <SkeletonLoader width="30%" height={12} borderRadius={4} />
        <SkeletonLoader width="30%" height={12} borderRadius={4} />
      </View>
    </View>
  );
}

/**
 * Skeleton para mensaje de chat
 */
export function MessageSkeletonLoader({ isOwn = false }) {
  const width = isOwn ? "60%" : "70%";
  const alignSelf = isOwn ? "flex-end" : "flex-start";

  return (
    <View style={[styles.messageSkeleton, { alignSelf }]}>
      <SkeletonLoader
        width={width}
        height={40}
        borderRadius={12}
      />
    </View>
  );
}

/**
 * Skeleton para perfil de estudiante
 */
export function ProfileSkeletonLoader() {
  const scheme = useColorScheme() ?? "light";
  const C = Colors[scheme];

  return (
    <View style={{ backgroundColor: C.background }}>
      {/* Avatar */}
      <View style={styles.profileHeader}>
        <SkeletonLoader width={88} height={88} borderRadius={44} />
        <View style={{ gap: 8, marginTop: 12 }}>
          <SkeletonLoader width="70%" height={18} borderRadius={4} />
          <SkeletonLoader width="50%" height={14} borderRadius={4} />
        </View>
      </View>

      {/* Section placeholders */}
      <View style={[styles.profileSection, { backgroundColor: C.surface, marginTop: 12 }]}>
        <SkeletonLoader width="40%" height={12} borderRadius={4} style={{ marginBottom: 12 }} />
        <View style={{ gap: 8 }}>
          <SkeletonLoader width="100%" height={40} borderRadius={6} />
          <SkeletonLoader width="100%" height={40} borderRadius={6} />
        </View>
      </View>

      {/* Another section */}
      <View style={[styles.profileSection, { backgroundColor: C.surface, marginTop: 12 }]}>
        <SkeletonLoader width="40%" height={12} borderRadius={4} style={{ marginBottom: 12 }} />
        <SkeletonLoader width="100%" height={60} borderRadius={6} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    // Shimmer effect is applied via Animated parent
  },

  conversationSkeleton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  skeletonContent: {
    flex: 1,
  },

  feedItemSkeleton: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    marginHorizontal: 12,
  },
  feedHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  feedContent: {
    gap: 8,
  },
  feedFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.1)",
  },

  messageSkeleton: {
    marginVertical: 6,
  },

  profileHeader: {
    alignItems: "center",
    paddingVertical: 24,
  },
  profileSection: {
    borderRadius: 12,
    padding: 12,
    margin: 12,
  },
});
