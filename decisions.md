# Decisiones Arquitectónicas

## Decorator Pattern para Mensajes de Chat

**Fecha:** 2026-05-08
**Contexto:** Necesidad de añadir capacidades modulares a los mensajes de chat (menciones, archivos, reacciones) sin modificar la clase base del mensaje. Esto permite cumplir con el Principio de Abierto/Cerrado (OCP) y el Principio de Responsabilidad Única (SRP).

**Decisión:** Implementar el patrón Decorator (GoF) puro en `domain/decorators/`.

**Estructura:**

```
IMessage (interfaz contrato)
  ├── BaseMessage (componente concreto)
  └── MessageDecorator (abstracto)
       ├── FileDecorator     — url, mimeType, tamaño
       ├── MentionDecorator  — array de userIds, render() resalta @menciones
       └── ReactionDecorator — mapa {emoji, count, users}
```

**Alternativas consideradas:**
- Herencia directa: Crear subtipos de Message para cada variante → viola OCP, explosión combinatoria
- Composición plana: Un solo Message con campos opcionales nullables → acoplamiento, viola SRP
- Mixins: Reutilización via composición TS → menos explícito, difícil de serializar

**Ventajas obtenidas:**
- Componibilidad en cualquier orden (FileDecorator → MentionDecorator → ReactionDecorator)
- Interfaz uniforme IMessage para todos los casos
- Cada decorador encapsula su propia lógica de validación y presentación
- Sin impacto en la entidad `Message` de persistencia ni en repositorios existentes

**Implementación:**
- `MentionDecorator.render()` busca @menciones por posición y las envuelve en `**@displayName**`
- `ReactionDecorator.getMetadata()` usa spread operator para preservar timestamp original
- Composición usada en producción en `SendMessage.ts` para construir payload de eventos

## Decorator Pattern para Perfiles de Estudiante

**Fecha:** 2026-05-08
**Contexto:** El perfil de estudiante (`Student`) solo contenía datos estáticos. Se necesitaba extenderlo con estadísticas dinámicas (grupos, mensajes) e insignias sin modificar la entidad base ni agregar acoplamiento temporal.

**Decisión:** Implementar el patrón Decorator (GoF) en `profiles-catalog/domain/decorators/`, siguiendo el mismo approach que messaging.

**Estructura:**

```
IPerfil (interfaz contrato)
  ├── PerfilBase (componente concreto)
  └── PerfilDecorator (abstracto)
       ├── EstadisticasDecorator  — gruposCreados, gruposParticipa, mensajesEnviados
       └── InsigniasDecorator     — array de insignias por hitos
```

**Desacoplamiento de datos externos:**
- Se creó `IIndicadoresRepository` como puerto en `domain/repositories/`
- `PostgresIndicadoresRepository` en infraestructura consulta tablas compartidas (messages, study_requests, applications) — solo lectura
- El decorador nunca consulta directamente; recibe datos inyectados vía constructor
- Si el repositorio falla, `GetPerfilCompleto` retorna `PerfilBase` sin decorar (degradación graceful)

**Control de activación:**
- `GET /api/v1/students/:id?vista=completa` → dispara decoradores
- `GET /api/v1/students/:id` (sin parámetro) → solo PerfilBase, sin invocar repositorio

## US-S01: user_notification_preferences — Esquema JSONB

**Fecha:** 2026-05-11
**Contexto:** Implementar almacenamiento de preferencias de canales de notificación por usuario y tipo de evento. Se requiere flexibilidad para agregar nuevos canales y tipos de evento sin migraciones de esquema.

**Decisión:** Tabla separada `user_notification_preferences` con columna `channels_config JSONB`.

**Estructura del JSONB:**
```json
{
  "SOLICITUD_INGRESO": ["email_institucional", "in_app_websocket"],
  "MIEMBRO_ACEPTADO": ["in_app_websocket", "push_movil"]
}
```

- **Clave:** `eventType` (string, corresponde al `type` del evento de dominio)
- **Valor:** arreglo de strings con los nombres de canal activos para ese tipo de evento
- **Ausencia de clave:** default = todos los canales activos (graceful degradation)
- **Arreglo vacío:** ningún canal activo para ese tipo de evento

**Alternativas consideradas:**
- Columnas booleanas en `profiles`: no escala con nuevos canales, no permite granularidad por tipo de evento
- Mapa anidado `{ eventType: { canal: bool } }`: más verboso, consultas más complejas con JSONB
- Tabla normalizada `(user_id, event_type, canal, activo)`: joins adicionales, más filas, sin ventaja real sobre JSONB para este volumen

**Ventajas obtenidas:**
- Agregar nuevo canal: solo se usa el nuevo nombre en el arreglo — sin migración
- Agregar nuevo tipo de evento: solo se usa la nueva clave — sin migración
- Consulta eficiente via `channels_config->eventType` (índice GIN disponible)
- `get_active_notification_channels()` RPC retorna `null` cuando no hay fila → el servicio aplica default

**Implementación:**
- `IPreferenceRepository` en `shared/patterns/strategy/`:
  - `getCanalesActivos(userId, eventType): Promise<string[] | null>`
  - `setCanalActivo(userId, eventType, canal, activo): Promise<void>`
- `PostgresPreferenceRepository` en `study-groups/infrastructure/database/`:
  - Delega en RPCs `get_active_notification_channels()` y `set_notification_channel_active()`
- `PreferenceService` en `study-groups/application/services/`:
  - Implementa `IPreferenceService`
  - Si repositorio retorna `null`, devuelve `["in_app_websocket", "email_institucional", "push_movil"]`

