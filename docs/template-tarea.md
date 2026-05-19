# Plantilla de Tareas por US

## Estructura por tarea

| Campo | Valor |
|---|---|
| **Tarea** | _Descripción corta de la tarea_ |
| **Responsable** | Gomez Posada, Carlos Alberto · Dev Front |
| **Horas** | _Número estimado_ |
| **Prompt IA principal** | _Prompt principal para el asistente_ |
| **Prompt IA** | _Prompts adicionales / refinamientos_ |
| **TDD** | _Tests / criterios de verificación_ |
| **Nombre del commit** | `feat(scope): descripción del cambio` |
| **Resultado** | Sin definir / OK / Pendiente |

## Reglas

- Al finalizar cada tarea se entregan:
  1. **Prompt IA principal** — texto completo del prompt usado
  2. **Nombre del commit** — con formato `tipo(scope): descripción`
- El `Resultado` se actualiza a `OK` solo cuando el código está commit y push.
- Si hay múltiples prompts, se listan bajo "Prompt IA".

## Historial de tareas

| Fecha | US | Tarea | Prompt IA principal | Commit | Resultado |
|---|---|---|---|---|---|---|
| _dd/mm_ | _US-XXX_ | _Descripción_ | _Prompt usado_ | _hash / msg_ | OK |
| 17/05 | US-D01 | Decorator de mensajes del chat grupal — UI web | Implementa el patrón Decorator en web/src/chat/models/ con IMessage, BaseMessage, MessageDecorator abstracto, FileDecorator, MentionDecorator y ReactionDecorator. Crea messageFactory.ts para composición. Agrega ReactionBar componente. Actualiza MessageBubble.tsx para usar render() del decorator. Actualiza enhancedMessages en GroupAdminPage y GroupChatPage para pasar mentions y reactions. Documenta con UML en README.md. | `feat(web): add Decorator pattern for chat messages with mentions and reactions` | OK |
