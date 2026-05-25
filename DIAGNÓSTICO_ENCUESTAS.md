# 🔍 DIAGNÓSTICO: Encuestas No Se Renderizan Correctamente

## **PASO 1: Verificar que la migración SQL se ejecutó**

### En Supabase Dashboard:
1. Ve a **SQL Editor**
2. Ejecuta esta consulta para verificar que la columna existe:
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'messages' AND column_name = 'poll_data';
   ```
3. **Deberías ver:** Una fila con `poll_data | jsonb`
4. Si NO aparece nada → **ejecuta la migración:**
   ```sql
   ALTER TABLE messages
     ADD COLUMN IF NOT EXISTS poll_data JSONB DEFAULT NULL;
   ```

---

## **PASO 2: Verificar que el backend GUARDA la encuesta en BD**

### En la consola del navegador (F12 → Console):
1. Abre el chat
2. Crea una encuesta: pregunta="test", opciones=["a", "b"]
3. Copia este código y pégalo en la consola:
   ```javascript
   // Ver el último mensaje enviado en la red
   const messages = document.querySelectorAll('[class*="MessageBubble"]');
   console.log("Total mensajes:", messages.length);
   console.log("Último elemento HTML:", messages[messages.length - 1]?.textContent);
   ```

4. **Luego verifica en Network (F12 → Network):**
   - Filtra por `POST /api/v1/messages`
   - Haz clic en esa petición
   - Pestaña **Response** → Debería mostrar:
     ```json
     {
       "data": {
         "id": "...",
         "poll": {
           "question": "tu pregunta",
           "options": [{"text": "a", "votes": []}, ...],
           "isOpen": true,
           "closesAt": "...",
           "createdAt": "..."
         }
       }
     }
     ```

---

## **PASO 3: Verificar que el Frontend RECIBE la encuesta**

### En la consola del navegador:
```javascript
// 1. Verificar que message.poll existe
const messages = JSON.parse(localStorage.getItem('chat_messages') || '{}');
const lastMsg = Object.values(messages)[Object.keys(messages).length - 1];
console.log("Último mensaje en localStorage:", lastMsg);
console.log("¿Tiene poll?", lastMsg?.poll ? "✅ SÍ" : "❌ NO");

// 2. Si tiene poll, verificar su estructura
if (lastMsg?.poll) {
  console.log("Poll Question:", lastMsg.poll.question);
  console.log("Poll Options:", lastMsg.poll.options);
  console.log("Poll isOpen:", lastMsg.poll.isOpen);
}
```

---

## **PASO 4: Verificar que MessageBubble RENDERIZA PollMessage**

### Observa el inspector (F12 → Elements):
1. Busca el mensaje con la encuesta
2. Verifica que contenga uno de estos elementos:
   - ✅ `<div class="...border border-neutral-200 rounded-lg...">` (contenedor PollMessage)
   - ✅ Botones con opciones O barras de progreso
3. Si NO lo ve → **El componente `PollMessage` no se está renderizando**

---

## **PASO 5: Debug Detallado**

### Si el poll NO se renderiza, añade logs temporales:

**Archivo:** `web/src/components/chat/MessageBubble.tsx`

Busca esta línea (alrededor de 97):
```typescript
{message.poll && (
  <PollMessage
```

Cámbialo a:
```typescript
{(() => {
  console.log("[DEBUG] Poll render check:", {
    hasPoll: !!message.poll,
    pollValue: message.poll,
    messageId: message.id
  });
  return null;
})()}
{message.poll && (
  <PollMessage
```

Luego:
1. **Recarga el navegador** (Ctrl+Shift+R)
2. Abre la consola
3. Crea una encuesta
4. **En la consola deberías ver:**
   ```
   [DEBUG] Poll render check: {
     hasPoll: true,
     pollValue: {question: "...", options: [...]},
     messageId: "..."
   }
   ```

Si ves `hasPoll: false` → El poll no llegó al componente desde messageFactory

---

## **PASO 6: Si aún no funciona, verifica el mapeo**

### En `web/src/chat/models/messageFactory.ts`:

Busca `if (raw.poll)` (línea ~43) y asegúrate que diga:
```typescript
if (raw.poll) {
  decorated = new PollDecorator(decorated, raw.poll);
}
```

Si no está → **el decorador no se está aplicando**

---

## **RESUMEN DE VERIFICACIONES:**

| Paso | Verificación | Resultado Esperado |
|------|-------------|------------------|
| 1 | Columna `poll_data` existe en BD | ✅ Aparece en query |
| 2 | Backend retorna `poll` en respuesta HTTP | ✅ Aparece en Network |
| 3 | Frontend recibe `poll` en el mensaje | ✅ Aparece en localStorage |
| 4 | MessageBubble renderiza PollMessage | ✅ Aparece elemento HTML |
| 5 | Console.logs muestran `hasPoll: true` | ✅ Sin errores |
| 6 | messageFactory aplica PollDecorator | ✅ Código existe |

---

## **AYUDA RÁPIDA: Copia y Pega en Consola**

```javascript
// Verificación todo-en-uno
(async () => {
  console.log("=== DIAGNÓSTICO ENCUESTAS ===");
  
  // 1. Ver último mensaje
  const response = await fetch('/api/v1/messages?conversationId=YOUR_CONV_ID&limit=1');
  const data = await response.json();
  const lastMsg = data[0];
  
  console.log("1. Respuesta HTTP:", lastMsg);
  console.log("2. ¿Tiene poll?", !!lastMsg?.poll);
  console.log("3. ¿Poll tiene question?", !!lastMsg?.poll?.question);
  console.log("4. ¿Poll tiene options?", !!lastMsg?.poll?.options);
  
  if (lastMsg?.poll) {
    console.log("✅ ENCUESTA ENCONTRADA EN BACKEND");
  } else {
    console.log("❌ BACKEND NO DEVUELVE poll");
  }
})();
```

---

## **Espera que veas:**

✅ **Correcto:**
```
=== DIAGNÓSTICO ENCUESTAS ===
1. Respuesta HTTP: {id: "...", poll: {...}}
2. ¿Tiene poll? true
3. ¿Poll tiene question? true
4. ¿Poll tiene options? true
✅ ENCUESTA ENCONTRADA EN BACKEND
```

❌ **Incorrecto:**
```
1. Respuesta HTTP: {id: "...", poll: null}
2. ¿Tiene poll? false
❌ BACKEND NO DEVUELVE poll
```

---

**Si ves "Incorrecto" → El problema está en la BD o en cómo el backend guarda/recupera la encuesta.**
