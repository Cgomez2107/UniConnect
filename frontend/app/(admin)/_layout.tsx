/**
 * app/(admin)/_layout.tsx
 * Layout minimalista del panel admin — sin redirecciones en useEffect
 */

import { Stack } from "expo-router";

export default function AdminLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}