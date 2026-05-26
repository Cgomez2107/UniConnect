## INF07 — Builds firmados con EAS

**Objetivo**
Generar builds firmados de la app móvil mediante EAS Build para distribuirla al docente y a los pares evaluadores sin depender de Expo Go.

### Criterios de aceptación

1. **Perfiles de build configurados**
   - Dado que el proyecto móvil tiene un archivo `eas.json` configurado con perfiles `development`, `preview` y `production`
   - Cuando se valida el requerimiento en el flujo correspondiente
   - Entonces el sistema cumple la condición descrita

2. **APK firmado generado**
   - Dado que se ejecuta `eas build --profile preview --platform android`
   - Cuando termina el build
   - Entonces se genera un APK firmado descargable desde la URL pública del build

3. **App preview funcional contra backend real**
   - Dado que el APK preview se instala en un dispositivo Android real
   - Cuando el usuario abre la app
   - Entonces puede autenticarse, ver sus grupos y enviar mensajes contra el backend de producción en Fly.io

4. **Variables sensibles protegidas**
   - Dado que las variables sensibles (clientId de OAuth, URL del backend) se inyectan en build
   - Cuando se inspecciona el bundle
   - Entonces no aparecen credenciales hardcodeadas en código fuente del repositorio

5. **Documentación de distribución en README**
   - Dado que el README del proyecto móvil
   - Cuando se documenta la distribución
   - Entonces incluye el enlace al último APK preview y las instrucciones para instalarlo
