/**
 * DECORATOR PATTERN - ENRIQUECIMIENTO DE MENSAJES
 * 
 * Este documento explica cómo funciona el patrón Decorator
 * para mensajes de chat (Tareas 55-58)
 */

// ============================================================================
// 1️⃣ PROBLEMA SIN DECORATOR
// ============================================================================

/**
 * Enfoque tradicional (❌ Acoplado):
 * 
 * class Message {
 *   id: string;
 *   content: string;
 *   file?: File;           // Opcional
 *   mentions?: Mention[];  // Opcional
 *   reactions?: Reaction[]; // Opcional
 *   // ... más y más opcional que vuelve la clase compleja
 * }
 * 
 * Problemas:
 * - Clase crece infinitamente
 * - Difícil testar cada característica
 * - Alto acoplamiento
 * - Validación distribuida
 */

// ============================================================================
// 2️⃣ SOLUCIÓN: DECORATOR PATTERN
// ============================================================================

/**
 * Enfoque con Decorator (✅ Desacoplado):
 * 
 * interface IMessage {
 *   id: string;
 *   content: string;
 *   toJSON(): ...
 * }
 * 
 * class BaseMessage implements IMessage {
 *   // Solo lo esencial
 * }
 * 
 * class FileDecorator extends MessageDecorator {
 *   // Solo agrega archivo
 * }
 * 
 * class MentionDecorator extends MessageDecorator {
 *   // Solo agrega menciones
 * }
 * 
 * class ReactionDecorator extends MessageDecorator {
 *   // Solo agrega reacciones
 * }
 * 
 * Ventajas:
 * ✅ Cada decorador es simple y enfocado
 * ✅ Fácil testar cada uno independiente
 * ✅ Bajo acoplamiento
 * ✅ Validación centralizada por decorador
 * ✅ Flexible: combina solo lo que necesitas
 */

// ============================================================================
// 3️⃣ CADENA DE DECORADORES
// ============================================================================

/**
 * Ejemplo: Mensaje simple a mensaje completo
 * 
 * 1. Crear mensaje base:
 *    const msg = new BaseMessage({
 *      id: "msg-1",
 *      content: "Hola @Carlos",
 *      timestamp: new Date(),
 *      senderId: "sofia-1"
 *    });
 *    
 * 2. Agregar menciones:
 *    const withMentions = new MentionDecorator(msg, [
 *      { userId: "carlos-1", displayName: "Carlos", position: 6 }
 *    ]);
 *    
 * 3. Agregar archivo:
 *    const withFile = new FileDecorator(withMentions, {
 *      filename: "resumen.pdf",
 *      size: 1024000,
 *      mimeType: "application/pdf",
 *      url: "https://..."
 *    });
 *    
 * 4. Agregar reacciones:
 *    const final = new ReactionDecorator(withFile, [
 *      { emoji: "👍", count: 3, users: ["user1", "user2", "user3"] }
 *    ]);
 * 
 * Resultado final:
 *   final.toJSON() = {
 *     id: "msg-1",
 *     content: "Hola @Carlos",
 *     mentions: [...],
 *     file: {...},
 *     reactions: [...]
 *   }
 */

// ============================================================================
// 4️⃣ ESTRUCTURA JERÁRQUICA
// ============================================================================

/**
 * Como un árbol de capas:
 * 
 *     ReactionDecorator
 *            ↓ (contains)
 *     FileDecorator
 *            ↓ (contains)
 *     MentionDecorator
 *            ↓ (contains)
 *     BaseMessage
 * 
 * Cada nivel:
 * - Implementa IMessage (contrato común)
 * - Delega propiedades base al nivel anterior
 * - Agrega sus propios datos
 */

// ============================================================================
// 5️⃣ CARACTERÍSTICAS DE CADA DECORADOR
// ============================================================================

/**
 * FileDecorator:
 * - Valida: filename, size, mimeType, url no vacíos
 * - Valida: size <= 100MB
 * - Propiedades: filename, size, mimeType, url
 * - Métodos: getFile()
 * 
 * MentionDecorator:
 * - Valida: no hay menciones duplicadas
 * - Valida: userId, displayName no vacíos
 * - Propiedades: mentions (readonly)
 * - Métodos: getMentions(), isMentioned(userId)
 * 
 * ReactionDecorator:
 * - Valida: count === users.length
 * - Valida: no hay usuarios duplicados por emoji
 * - Propiedades: reactions (Map<emoji, Reaction>)
 * - Métodos: getReactions(), getReaction(emoji), addReaction(), removeReaction()
 */

// ============================================================================
// 6️⃣ SERIALIZACIÓN COMPUESTA
// ============================================================================

/**
 * Cada decorador extiende toJSON() del anterior:
 * 
 * BaseMessage.toJSON():
 *   { id, content, timestamp, senderId }
 * 
 * MentionDecorator.toJSON():
 *   { ...super.toJSON(), mentions: [...] }
 *   = { id, content, timestamp, senderId, mentions }
 * 
 * FileDecorator.toJSON():
 *   { ...super.toJSON(), file: {...} }
 *   = { id, content, timestamp, senderId, mentions, file }
 * 
 * ReactionDecorator.toJSON():
 *   { ...super.toJSON(), reactions: [...] }
 *   = { id, content, timestamp, senderId, mentions, file, reactions }
 */

// ============================================================================
// 7️⃣ VENTAJAS DEL PATRÓN
// ============================================================================

/**
 * ✅ SEPARACIÓN DE RESPONSABILIDADES
 *    - FileDecorator solo maneja archivos
 *    - MentionDecorator solo maneja menciones
 *    - No se mezclan conceptos
 * 
 * ✅ EXTENSIBILIDAD
 *    - Agregar EmojiDecorator: 1 nueva clase
 *    - Agregar ThreadDecorator: 1 nueva clase
 *    - No modificar código existente
 * 
 * ✅ TESTABILIDAD
 *    - Testar BaseMessage aisladamente
 *    - Testar FileDecorator sin menciones
 *    - Testar composiciones (BaseMessage + File + Mention)
 * 
 * ✅ RENDIMIENTO
 *    - Crear solo los decoradores que necesitas
 *    - No gastas memoria en características sin usar
 * 
 * ✅ MANTENIBILIDAD
 *    - Cambios en FileDecorator no afectan MentionDecorator
 *    - Bug fix en reacciones, solo toca ReactionDecorator
 */

// ============================================================================
// 8️⃣ CASOS DE USO EN CHAT
// ============================================================================

/**
 * Mensaje simple:
 *   new BaseMessage({...})
 * 
 * Mensaje con archivo:
 *   new FileDecorator(new BaseMessage({...}), file)
 * 
 * Mensaje con menciones:
 *   new MentionDecorator(new BaseMessage({...}), mentions)
 * 
 * Mensaje completo (foto + menciones + reacciones):
 *   new ReactionDecorator(
 *     new MentionDecorator(
 *       new FileDecorator(
 *         new BaseMessage({...}),
 *         file
 *       ),
 *       mentions
 *     ),
 *     reactions
 *   )
 * 
 * ✅ Solo creas lo que necesitas
 */

// ============================================================================
// 9️⃣ CÓMO USARLO EN SENDMESSAGE (INTEGRACIÓN)
// ============================================================================

/**
 * En lugar de:
 *   return this.repository.createMessage(input);
 * 
 * Podrías hacer:
 * 
 *   let msg: IMessage = new BaseMessage({...});
 *   
 *   if (input.file) {
 *     msg = new FileDecorator(msg, input.file);
 *   }
 *   
 *   if (input.mentions && input.mentions.length > 0) {
 *     msg = new MentionDecorator(msg, input.mentions);
 *   }
 *   
 *   // Emitir el mensaje decorado
 *   const payload = msg.toJSON();
 *   return payload;
 */

export {};
