import { OnboardingSlide } from "@/constants/onboarding"
import { Colors } from "@/constants/Colors"
import { Dimensions, StyleSheet, Text, useColorScheme, View } from "react-native"

const { width: SCREEN_W } = Dimensions.get("window")

interface Props {
  slide: OnboardingSlide
}

export function SlideItem({ slide }: Props) {
  const scheme = useColorScheme() ?? "light"
  const C = Colors[scheme]

  return (
    <View style={[styles.slide, { width: SCREEN_W }]}>
      <View style={[styles.circle, { backgroundColor: C.primary + "12" }]} />

      <View
        style={[
          styles.emojiBox,
          {
            backgroundColor: C.primary + "15",
            borderColor: C.primary + "30",
          },
        ]}
      >
        <Text style={styles.emoji}>{slide.emoji}</Text>
      </View>

      <View style={[styles.goldBar, { backgroundColor: C.accent }]} />

      <Text style={[styles.title, { color: C.textPrimary }]}>{slide.title}</Text>
      <Text style={[styles.body, { color: C.textSecondary }]}>{slide.body}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  slide: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    paddingTop: 80,
    paddingBottom: 40,
  },
  circle: {
    position: "absolute",
    width: SCREEN_W * 0.9,
    height: SCREEN_W * 0.9,
    borderRadius: SCREEN_W * 0.45,
    top: -SCREEN_W * 0.2,
  },
  emojiBox: {
    width: 100,
    height: 100,
    borderRadius: 28,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emoji: { fontSize: 48 },
  goldBar: { width: 40, height: 4, borderRadius: 2, marginBottom: 24 },
  title: {
    fontSize: 26,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: -0.5,
    marginBottom: 16,
    lineHeight: 32,
  },
  body: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 24,
    maxWidth: 300,
  },
})
