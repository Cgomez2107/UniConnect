# Plan de Corrección de Bugs — Web Frontend

**Fecha**: 2026-05-16  
**Versión**: 1.0

---

## Resumen de Bugs

| # | Bug | Prioridad | Archivos | Estado |
|---|-----|-----------|----------|--------|
| 1 | Chat grupal: mensajes en orden incorrecto al reingresar | 🔴 Alta | `GroupChatPage.tsx` | Pendiente |
| 2a | Subir recurso: botón "Subir" no funciona (isValid incompleto) | 🔴 Alta | `SubirRecursoPage.tsx` | Pendiente |
| 2b | Subir recurso: errores de Storage ocultos (catch vacío) | 🔴 Alta | `supabase.ts` | Pendiente |
| 2c | Subir recurso: MIME types inconsistentes frontend/Supabase | 🟡 Media | `SubirRecursoPage.tsx`, `StorageService.ts` | Pendiente |
| 2d | Subir recurso: file input no reseteado al remover archivo | 🟡 Media | `SubirRecursoPage.tsx` | Pendiente |
| 3a | Mensajes privados: WebSocket entrega snake_case, UI espera camelCase | 🔴 Alta | `ChatPage.tsx` | Pendiente |
| 3b | Mensajes privados: race condition WS + HTTP duplica mensajes | 🔴 Alta | `ChatPage.tsx` | Pendiente |
| 3c | Mensajes privados: lista de conversaciones no se actualiza | 🟡 Media | `ChatPage.tsx` | Pendiente |
| 4a | Perfil: número de teléfono no se guarda (phone vs phone_number) | 🔴 Alta | `ProfilesClient.ts` | Pendiente |
| 4b | Perfil: materias inscritas no aparecen (subject_id vs subjectId) | 🔴 Alta | `useEditProfileForm.ts` | Pendiente |

---

## Bug 1: Chat grupal — orden de mensajes incorrecto

### Causa Raíz
En `web/src/pages/GroupChatPage.tsx:45` se aplica `.reverse()` a la respuesta del servidor que **ya viene en orden ascendente** (`ORDER BY m.created_at ASC`). Esto invierte el array (nuevos → viejos), y luego los mensajes nuevos se agregan al final, rompiendo el orden cronológico.

### Flujo Actual (Roto)
```
Servidor DB:  [msg1(08:00), msg2(08:05), msg3(08:10)]   ← ASC
.reverse():   [msg3(08:10), msg2(08:05), msg1(08:00)]   ← Invertido
Nuevo msg:    [...prev, msg4(08:15)]                     ← Apéndice al final
Resultado:    [msg3, msg2, msg1, msg4]                   ← ¡INCORRECTO!
```

### Solución
Eliminar `.reverse()` de la línea 45 para mantener el orden ASC que devuelve el servidor.

```diff
- setMessages((msgs || []).reverse());
+ setMessages(msgs || []);
```

### Archivos a modificar
- `web/src/pages/GroupChatPage.tsx` — línea 45

---

## Bug 2a: Subir recurso — isValid no incluye programId ni userId

### Causa Raíz
En `web/src/pages/SubirRecursoPage.tsx:122`, la validación del botón (`isValid`) solo verifica `title`, `selectedSubjectId` y `pickedFile`. Pero `handleUpload` (línea 92) sí valida `programId` y `user?.id`. Cuando `programId` es `null` (ej. datos de programa vacíos), el botón se habilita pero hacer clic no hace nada.

```typescript
// Línea 122 — habilita el botón
const isValid = title.trim().length >= 3 && !!selectedSubjectId && !!pickedFile;

// Línea 92 — guarda silenciosamente
if (!user?.id || !pickedFile || !title.trim() || !selectedSubjectId || !programId) return;
```

### Solución
Agregar `!!programId` y `!!user?.id` a `isValid`, y cambiar el `return` silencioso por un error visible.

```diff
- const isValid = title.trim().length >= 3 && !!selectedSubjectId && !!pickedFile;
+ const isValid = title.trim().length >= 3 && !!selectedSubjectId && !!pickedFile && !!programId && !!user?.id;
```

Y en `handleUpload`:
```diff
- if (!user?.id || !pickedFile || !title.trim() || !selectedSubjectId || !programId) return;
+ if (!user?.id || !pickedFile || !title.trim() || !selectedSubjectId || !programId) {
+   setUploadError("Completa todos los campos requeridos antes de subir.");
+   return;
+ }
```

### Archivos a modificar
- `web/src/pages/SubirRecursoPage.tsx` — líneas 92, 122

---

## Bug 2b: Subir recurso — errores de Storage ocultos

### Causa Raíz
En `web/src/lib/supabase.ts:41-48`, el bloque `catch` está vacío, lo que traga todos los errores. El usuario solo ve "Error al subir el archivo al almacenamiento." sin detalles.

```typescript
catch {
  return null;  // ← Sin logging, sin detalles
}
```

### Solución
Agregar logging del error original en todos los `catch` vacíos del archivo.

```diff
- catch {
-   return null;
- }
+ catch (err) {
+   console.error("Storage upload failed:", err);
+   return null;
+ }
```

**Aplicar a las 3 funciones**: `uploadAvatarFile`, `uploadResourceFile`, `uploadChatImageFile`.

### Archivos a modificar
- `web/src/lib/supabase.ts` — líneas 35-36, 45-46, 55-56

---

## Bug 2c: Subir recurso — MIME types inconsistentes

### Causa Raíz
El frontend permite subir `.xlsx`, `.pptx`, `.txt` pero el bucket `RESOURCES` de Supabase no acepta esos MIME types. Los archivos pasan la validación frontend pero son rechazados por Supabase.

### Mismatch Actual
| Tipo | Frontend permite | Supabase acepta |
|------|-----------------|-----------------|
| PDF | ✅ | ✅ |
| DOCX | ✅ | ✅ |
| **XLSX** | ✅ | ❌ |
| **PPTX** | ✅ | ❌ |
| **TXT** | ✅ | ❌ |
| JPG/PNG | ✅ | ✅ |
| WebP | ❌ | ✅ |

### Solución
Agregar los MIME types faltantes en `StorageService.ts`:

```diff
allowedMimeTypes: [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
+ "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
+ "application/vnd.openxmlformats-officedocument.presentationml.presentation",
+ "text/plain",
  "image/jpeg",
  "image/png",
  "image/webp",
],
```

### Archivos a modificar
- `packages/shared-api/src/services/StorageService.ts` — líneas 43-51

---

## Bug 2d: Subir recurso — file input no reseteado

### Causa Raíz
Al hacer clic en "✕" para remover el archivo seleccionado, solo se ejecuta `setPickedFile(null)`. No se resetea `fileInputRef.current.value`. Si el usuario intenta seleccionar el mismo archivo de nuevo, el `onChange` del input no se dispara porque el valor interno no cambió.

### Solución
Crear un handler que también reseteé el input file.

```diff
- onClick={() => setPickedFile(null)}
+ onClick={handleRemoveFile}
```

Y agregar:
```typescript
const handleRemoveFile = () => {
  setPickedFile(null);
  if (fileInputRef.current) {
    fileInputRef.current.value = '';
  }
};
```

### Archivos a modificar
- `web/src/pages/SubirRecursoPage.tsx` — líneas 264-265

---

## Bug 3a: Mensajes privados — WebSocket entrega snake_case

### Causa Raíz
El `MessagingController.toApiMessage()` construye la respuesta en **snake_case** (`sender_id`, `conversation_id`, `created_at`, etc.). El Gateway transmite esto tal cual por WebSocket. Pero `ChatPage.tsx:123-127` agrega el payload directamente al estado sin convertirlo, y `MessageBubble` espera campos en **camelCase** (`senderId`, `conversationId`, `createdAt`).

### Solución
Importar `snakeToCamel` de `@uniconnect/shared-api` y aplicarlo al payload del WebSocket antes de agregarlo al estado.

```diff
+ import { snakeToCamel } from "@uniconnect/shared-api";

// En el handler del WebSocket:
if (data.event === "new_message") {
+ const mappedMsg = snakeToCamel(payload);
  setMessages((prev) => {
-   if (prev.some((m) => m.id === payload.id)) return prev;
-   return [...prev, { ...payload, clientStatus: "sent" }];
+   if (prev.some((m) => m.id === mappedMsg.id)) return prev;
+   return [...prev, { ...mappedMsg, clientStatus: "sent" }];
  });
}
```

### Archivos a modificar
- `web/src/pages/ChatPage.tsx` — líneas 1-9 (imports), 118-127 (WS handler)

---

## Bug 3b: Mensajes privados — race condition duplica mensajes

### Causa Raíz
Cuando se envía un mensaje:
1. Se agrega un mensaje optimista con `tempId` al estado
2. Se envía HTTP POST
3. El WebSocket puede entregar el mensaje real **antes** que la respuesta HTTP
4. El WebSocket agrega el mensaje con `id` real (no detecta duplicado porque `tempId ≠ realId`)
5. La respuesta HTTP reemplaza `tempId` con `realId` → **mensaje duplicado**

### Solución
Usar un `useRef` para trackear los `tempId` pendientes y evitar que el WebSocket agregue mensajes cuyo `tempId` aún está pendiente.

```typescript
const pendingTempIds = useRef<Set<string>>(new Set());

// Al enviar:
pendingTempIds.current.add(tempId);

// En WS handler:
if (data.event === "new_message") {
  const mappedMsg = snakeToCamel(payload);
  // Si hay un tempId pendiente, el HTTP response ya lo manejará
  setMessages((prev) => {
    if (prev.some((m) => m.id === mappedMsg.id)) return prev;
    return [...prev, { ...mappedMsg, clientStatus: "sent" }];
  });
}

// En HTTP response:
pendingTempIds.current.delete(tempId);
```

### Archivos a modificar
- `web/src/pages/ChatPage.tsx` — agregar `useRef`, modificar send y WS handler

---

## Bug 3c: Mensajes privados — conversaciones no actualizadas

### Causa Raíz
`ChatPage.tsx` maneja todo el estado localmente con `useState`. Nunca llama a `useConversationsStore` para actualizar la lista de conversaciones laterales después de enviar un mensaje.

### Solución
Después de enviar un mensaje exitosamente, refrescar la lista de conversaciones.

```typescript
import { useConversationsStore } from "@/store/useConversationsStore";

// Dentro del componente:
const loadConversations = useConversationsStore((s) => s.loadConversations);

// Después de enviar mensaje exitosamente:
await loadConversations();
```

### Archivos a modificar
- `web/src/pages/ChatPage.tsx` — importar store y llamar después de enviar

---

## Bug 4a: Perfil — número de teléfono no se guarda

### Causa Raíz
En `ProfilesClient.ts:83`, el body del PATCH envía `{ phone: data.phone }`, pero el backend (`ProfilesCatalogController.ts:225-233`) espera `phone_number`. Como `data.phone_number` es `undefined`, se envía `null`, **sobrescribiendo el valor existente con NULL**.

```typescript
// ProfilesClient.ts — envía phone (camelCase)
body: {
  ...(data.phone !== undefined && { phone: data.phone }),
}

// Backend — espera phone_number (snake_case)
const data = JSON.parse(body);
// data.phone_number → undefined → null → SET phone_number = NULL
```

### Solución
Cambiar la clave en el body de `phone` a `phone_number`:

```diff
- ...(data.phone !== undefined && { phone: data.phone }),
+ ...(data.phone !== undefined && { phone_number: data.phone }),
```

### Archivos a modificar
- `packages/shared-api/src/clients/ProfilesClient.ts` — línea 83

---

## Bug 4b: Perfil — materias inscritas no aparecen en edición

### Causa Raíz
En `useEditProfileForm.ts:94`, el código lee `s.subject_id` (snake_case), pero el mapper `snakeToCamel` en `mapUserSubjectDtoToDomain` ya convirtió la clave a `subjectId` (camelCase). Como `s.subject_id` es `undefined` para todos los elementos, el array `currentSubjects` queda vacío y la UI muestra "Aún no has registrado materias".

```typescript
// useEditProfileForm.ts:94 — busca snake_case
const currentSubjects = subjectsData.map((s) => s.subject_id).filter(Boolean);
//                                                        ^^^^^^^^^^
//                                                        undefined → []
```

### Solución
Cambiar `s.subject_id` a `s.subjectId`:

```diff
- const currentSubjects = subjectsData.map((s) => s.subject_id).filter(Boolean);
+ const currentSubjects = subjectsData.map((s) => s.subjectId).filter(Boolean);
```

### Archivos a modificar
- `web/src/hooks/useEditProfileForm.ts` — línea 94

---

## Orden de Implementación Sugerido

1. **Bug 4a** (ProfilesClient.ts) — fix simple, un cambio de clave
2. **Bug 4b** (useEditProfileForm.ts) — fix simple, un cambio de clave
3. **Bug 1** (GroupChatPage.tsx) — eliminar .reverse()
4. **Bug 2a** (SubirRecursoPage.tsx) — isValid + mensaje de error
5. **Bug 2d** (SubirRecursoPage.tsx) — reset file input
6. **Bug 2b** (supabase.ts) — logging en catch
7. **Bug 2c** (StorageService.ts) — agregar MIME types
8. **Bug 3a** (ChatPage.tsx) — snakeToCamel en WS
9. **Bug 3b** (ChatPage.tsx) — race condition
10. **Bug 3c** (ChatPage.tsx) — refrescar conversaciones
