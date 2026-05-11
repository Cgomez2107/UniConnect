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

