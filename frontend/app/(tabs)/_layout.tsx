/**
 * app/(tabs)/_layout.tsx
 * Tab bar corregida — respeta el home indicator de Android e iOS
 */

import { Colors } from "@/constants/Colors";
import { SplashLoader } from "@/components/ui/SplashLoader";
import { useAuthStore } from "@/store/useAuthStore";
import { useUnreadCount } from "@/hooks/application/useUnreadCount";
import { Ionicons } from "@expo/vector-icons";
import { router, Tabs } from "expo-router";
import { useRef, useEffect } from "react";
import { Animated, useColorScheme, View, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function AnimatedTabIcon({ name, color, focused, badge }: { name: any; color: string; focused: boolean; badge?: number }) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: focused ? 1.2 : 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 10,
    }).start();
  }, [focused, scale]);

  return (
    <View>
      <Animated.View style={{ transform: [{ scale }] }}>
        <Ionicons name={name} size={22} color={color} />
      </Animated.View>
      {badge !== undefined && badge > 0 && (
        <View
          style={{
            position: "absolute",
            top: -6,
            right: -8,
            backgroundColor: "#dc3545",
            borderRadius: 12,
            minWidth: 24,
            height: 24,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 6,
          }}
        >
          <Text style={{ color: "white", fontSize: 10, fontWeight: "700" }}>
            {badge > 99 ? "99+" : badge}
          </Text>
        </View>
      )}
    </View>
  );
}

export default function TabLayout() {
  const scheme = useColorScheme() ?? "light";
  const C = Colors[scheme];
  const insets = useSafeAreaInsets(); // ✅ altura real del home indicator
  const role = useAuthStore((s) => s.user?.role);
  const isHydrating = useAuthStore((s) => s.isHydrating);
  const { unreadCount } = useUnreadCount();

  useEffect(() => {
    if (role === "admin") {
      router.replace("/(admin)" as any);
    }
  }, [role]);

  if (isHydrating) {
    return <SplashLoader message="Resolviendo sesión..." />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.primary,
        tabBarInactiveTintColor: C.tabIconDefault,
        tabBarStyle: {
          backgroundColor: C.surface,
          borderTopColor: C.border,
          borderTopWidth: 1,
          // altura que suma el home indicator del teléfono
          height: 56 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginBottom: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Feed",
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon name={focused ? "home" : "home-outline"} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="invitaciones"
        options={{
          title: "Solicitudes",
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon name={focused ? "notifications" : "notifications-outline"} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="mensajes"
        options={{
          title: "Mensajes",
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon 
              name={focused ? "chatbubble" : "chatbubble-outline"} 
              color={color} 
              focused={focused}
              badge={unreadCount}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="eventos"
        options={{
          title: "Eventos",
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon name={focused ? "calendar" : "calendar-outline"} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon name={focused ? "person" : "person-outline"} color={color} focused={focused} />
          ),
        }}
      />

      {/* Ocultar del tab bar */}
      <Tabs.Screen name="feed" options={{ href: null }} />
      <Tabs.Screen name="register" options={{ href: null }} />
    </Tabs>
  );
}