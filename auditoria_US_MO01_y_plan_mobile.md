# Auditoría y Plan de Implementación Móvil: US-MO01 (Moderación de Chat)

## 1. Auditoría del Estado Actual (Backend & Web)

La historia de usuario **US-MO01** exige implementar un patrón *Chain of Responsibility* para moderar mensajes en el chat y asegurar que el frontend aplique las sanciones de interfaz (como el bloqueo de 5 minutos). 

A continuación, el resumen de la auditoría sobre la implementación en el `backend` y el aplicativo web (`web`):

### 1.1 Backend: Pipeline de Moderación
El backend implementa de forma correcta el patrón y cubre todos los criterios de aceptación:
- **Secuencia (Criterio 1):** Configurada en `ValidatorFactory.ts` (`LongitudHandler` → `PalabrasProhibidasHandler` → `SpamHandler` → `EnlacesExternosHandler`).
- **Límite de Longitud (Criterio 2):** `LongitudHandler` detiene mensajes de más de 1000 caracteres devolviendo el código `MO_001`.
- **Palabras Prohibidas (Criterio 3):** `PalabrasProhibidasHandler` intercepta términos prohibidos, registra la alerta en los logs internos y devuelve al cliente el código `MO_002` con un mensaje genérico ("Mensaje rechazado por contener palabras no permitidas"), protegiendo el listado de reglas.
- **Spam y Bloqueo (Criterio 4):** `SpamHandler` detecta ráfagas de mensajes (>5 en 30s) y devuelve el código `MO_003` para notificar al cliente.

### 1.2 Web (Frontend React): Consumo y UI
La interfaz web consume de forma excepcional las directrices del backend:
- **Interceptores:** `groupErrorInterceptor.ts` y `client.ts` capturan los errores `MO_001`, `MO_002` y `MO_003`, traduciéndolos a mensajes amigables para el usuario.
- **Estado Global:** `useSpamStore.ts` (Zustand) guarda la penalización en `localStorage` e inicia el cronómetro.
- **UI Reactiva:** En `MentionInput.tsx`, si el store de spam indica bloqueo (`isBlocked === true`), la UI muestra un banner de advertencia rojo con el temporizador y deshabilita (disable) por completo la entrada de texto y el envío de adjuntos/encuestas.

---

## 2. Plan de Implementación para Mobile (Expo / React Native)

Para replicar esta misma experiencia de moderación y bloqueo en la aplicación móvil (carpeta `frontend`), se debe seguir el siguiente plan de acción estructurado, adaptando las tecnologías web al ecosistema de React Native.

### Fase 1: Estado Global Persistente (Spam Store)
En móvil, no podemos usar `localStorage`. Necesitamos persistir el estado del bloqueo (para que no se quite si el usuario cierra y abre la app).

1. **Crear/Actualizar `store/useSpamStore.ts`:**
   - Usar `zustand`.
   - Utilizar el middleware de persistencia `persist` de Zustand combinado con `@react-native-async-storage/async-storage` (o `expo-secure-store`) como `storage`.
   - El store debe tener las propiedades: `isBlocked` (boolean), `blockUntil` (timestamp), y métodos `activateBlock()` y `checkBlockStatus()`.

### Fase 2: Interceptor y Cliente HTTP Móvil
La capa de red de la app móvil debe detectar los códigos de infracción y comunicarse con el estado y con la UI.

1. **Adaptar el cliente API (ej. `lib/api/httpClient.ts`):**
   - Interceptar las respuestas con error `400/429`.
   - Si la respuesta incluye el código `MO_001`, lanzar un Toast/Alerta indicando que el mensaje es muy largo.
   - Si la respuesta incluye el código `MO_002`, lanzar un Toast/Alerta indicando que el mensaje contiene palabras inapropiadas.
   - Si la respuesta incluye el código `MO_003` o el status es `429`, llamar a `useSpamStore.getState().activateBlock()` para aplicar la sanción de 5 minutos, e informar mediante Toast.

### Fase 3: Componente del Chat Input (`components/chat/ChatInput.tsx`)
La interfaz del teclado virtual debe reaccionar inmediatamente al bloqueo.

1. **Suscribirse al estado:** Importar y usar `const { isBlocked, remainingTime, checkBlockStatus } = useSpamStore()`.
2. **Ciclo de vida del temporizador:** Implementar un `useEffect` con un `setInterval` de 1 segundo que llame a `checkBlockStatus()` para actualizar `remainingTime` en tiempo real.
3. **Bloqueo de UI:**
   - Enlazar la prop `editable={!isBlocked}` en el `TextInput` de React Native.
   - Deshabilitar `onPress` o pasar `disabled={isBlocked}` a los botones de enviar mensaje (`TouchableOpacity` o `Pressable`) y de adjuntar medios.
4. **Banner de Advertencia:**
   - Crear un renderizado condicional arriba del `TextInput`:
   ```tsx
   {isBlocked && (
     <View style={styles.spamBannerContainer}>
       <Ionicons name="warning" size={20} color="red" />
       <View>
         <Text style={styles.spamBannerTitle}>Chat suspendido</Text>
         <Text style={styles.spamBannerText}>
           Podrás enviar mensajes en: {Math.floor(remainingTime / 60)}:
           {String(remainingTime % 60).padStart(2, "0")}
         </Text>
       </View>
     </View>
   )}
   ```

### Fase 4: Pruebas en Dispositivo
1. Enviar un mensaje de texto superior a 1000 caracteres para validar el Toast/Alerta (MO_001).
2. Enviar la palabra "spam" u "odio" para validar el Toast sin bloqueo (MO_002).
3. Enviar 6 mensajes rápidos para forzar el código MO_003 y verificar que el `TextInput` pierde foco, queda gris, y aparece el contador regresivo sobreviviendo a recargas de la app.
