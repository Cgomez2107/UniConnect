/**
 * lib/services/pushService.ts
 * Registro del push token de Expo Notifications — US-011
 *
 * Flujo:
 *   1. Al hacer login, `registerAndSavePushToken()` pide permiso al SO.
 *   2. Si el usuario acepta, obtiene el token de Expo.
 *   3. Lo guarda en `profiles.push_token` en Supabase.
 *   4. La Edge Function `notifications` lo lee para enviar pushes.
 *
 * Importante: los push tokens físicos solo funcionan en dispositivos reales
 * (no en simuladores). En simulador el token se obtiene pero no llega el push.
 */

import { supabase } from "@/lib/supabase";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

// Cómo se muestra la notificación cuando la app está en primer plano
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Detectar Expo Go para no intentar obtener push token remoto
function isExpoGo(): boolean {
  try {
    // En Expo Go el Constants.appOwnership es 'expo'
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Constants = require("expo-constants").default;
    return Constants.appOwnership === "expo";
  } catch {
    return false;
  }
}

/**
 * Pide permisos, obtiene el Expo Push Token y lo guarda en Supabase.
 * Llama esta función justo después de que el usuario se autentica.
 *
 * @param userId ID del usuario autenticado
 */
export async function registerAndSavePushToken(userId: string): Promise<void> {
  // Los push no funcionan en web ni en Expo Go a partir de SDK 53
  if (Platform.OS === "web") return;
  if (isExpoGo()) {
    console.info("Push notifications: no disponibles en Expo Go (requiere development build).");
    return;
  }

  try {
    // Verificar / solicitar permiso
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      // El usuario rechazó los permisos — no hacemos nada
      console.info("Push notifications: permiso denegado.");
      return;
    }

    // Canal de Android (requerido desde Android 8+)
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "UniConnect",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#0d2852",
      });
    }

    // Obtener el token
    const tokenData = await Notifications.getExpoPushTokenAsync();
    const token = tokenData.data;

    // Guardar en Supabase (upsert silencioso)
    const { error } = await supabase
      .from("profiles")
      .update({ push_token: token })
      .eq("id", userId);

    if (error) {
      console.warn("No se pudo guardar push_token:", error.message);
    } else {
      console.info("Push token registrado correctamente.");
    }
  } catch (e) {
    // No es crítico — la app funciona sin push
    console.warn("Error registrando push token:", e);
  }
}
