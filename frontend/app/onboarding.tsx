/**
 * app/onboarding.tsx
 *
 * Pantalla de bienvenida con 3 slides.
 * ORQUESTADOR puro: gestiona el indice activo y la navegacion.
 *
 * Data       -> constants/onboarding.ts
 * SlideItem  -> components/onboarding/SlideItem.tsx
 * Dots       -> components/onboarding/DotsIndicator.tsx
 */

import { DotsIndicator } from "@/components/onboarding/DotsIndicator";
import { SlideItem } from "@/components/onboarding/SlideItem";
import { Colors } from "@/constants/Colors";
import { ONBOARDING_SLIDES } from "@/constants/onboarding";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
  ViewToken,
} from "react-native";

const { width: SCREEN_W } = Dimensions.get("window");

export default function OnboardingScreen() {
  const scheme = useColorScheme() ?? "light";
  const C = Colors[scheme];

  const [activeIndex, setActiveIndex] = useState(0);
  const flatRef = useRef<FlatList>(null);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0) {
        setActiveIndex(viewableItems[0].index ?? 0);
      }
    },
    []
  );

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 });

  const goToLogin = useCallback(() => {
    router.replace("/login" as any);
  }, []);

  const goNext = useCallback(() => {
    if (activeIndex < ONBOARDING_SLIDES.length - 1) {
      flatRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
    } else {
      goToLogin();
    }
  }, [activeIndex, goToLogin]);

  const renderSlide = useCallback(
    ({ item }: { item: (typeof ONBOARDING_SLIDES)[number] }) => <SlideItem slide={item} />,
    [],
  );

  const isLast = activeIndex === ONBOARDING_SLIDES.length - 1;

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />

      <View style={[styles.skipBtn, { opacity: isLast ? 0 : 1 }]}
            pointerEvents={isLast ? "none" : "auto"}>
        <TouchableOpacity
          onPress={goToLogin}
          activeOpacity={0.7}
        >
          <Text style={[styles.skipText, { color: C.textSecondary }]}>Saltar</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatRef}
        data={ONBOARDING_SLIDES}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig.current}
        scrollEventThrottle={16}
        renderItem={renderSlide}
      />

      <View style={styles.footer}>
        <DotsIndicator total={ONBOARDING_SLIDES.length} activeIndex={activeIndex} />

        <TouchableOpacity
          style={[styles.mainBtn, { backgroundColor: C.primary }]}
          onPress={goNext}
          activeOpacity={0.85}
        >
          <Text style={[styles.mainBtnText, { color: C.textOnPrimary }]}>
            {isLast ? "Comenzar" : "Siguiente"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  skipBtn: {
    position: "absolute",
    top: 56,
    right: 24,
    zIndex: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  skipText: { fontSize: 14, fontWeight: "500" },
  footer: {
    paddingHorizontal: 32,
    paddingBottom: 48,
    alignItems: "center",
    gap: 16,
  },
  mainBtn: {
    width: "100%",
    height: 52,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  mainBtnText: { fontSize: 16, fontWeight: "700", letterSpacing: 0.3 },
});