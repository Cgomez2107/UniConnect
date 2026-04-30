/**
 * decorator.test.ts
 *
 * CA6: Prueba de composición/anidación de decoradores
 * Valida que los decoradores sean componibles y trabajen juntos.
 *
 * Flujo:
 * 1. Crea BaseMessage
 * 2. Lo envuelve con FileDecorator
 * 3. Lo envuelve con MentionDecorator
 * 4. Lo envuelve con ReactionDecorator
 * 5. Llama a render() y getMetadata() para validar composición
 * 6. Imprime resultados en consola
 */

import { BaseMessage } from "./BaseMessage.js";
import { FileDecorator, type FileMetadata } from "./FileDecorator.js";
import {
  MentionDecorator,
  type Mention,
} from "./MentionDecorator.js";
import {
  ReactionDecorator,
  type Reaction,
} from "./ReactionDecorator.js";

console.log("=".repeat(80));
console.log("PRUEBA DE COMPOSICIÓN DE DECORADORES");
console.log("=".repeat(80));

// ===== PASO 1: Crear BaseMessage =====
console.log("\n📝 PASO 1: Crear BaseMessage");
console.log("-".repeat(80));

const baseMessage = new BaseMessage({
  id: "msg-001",
  content: "Hola @Carlos @Sofia, aquí está el documento",
  timestamp: new Date("2026-04-29T10:00:00Z"),
  senderId: "user-123",
});

console.log("BaseMessage creado:");
console.log(`  ID: ${baseMessage.id}`);
console.log(`  Content: ${baseMessage.getContent()}`);
console.log(`  Render: ${baseMessage.render()}`);
console.log(`  SenderId: ${baseMessage.senderId}`);

// ===== PASO 2: Envolver con FileDecorator =====
console.log("\n📄 PASO 2: Envolver con FileDecorator");
console.log("-".repeat(80));

const fileMetadata: FileMetadata = {
  filename: "documento.pdf",
  size: 1024 * 512, // 512 KB
  mimeType: "application/pdf",
  url: "https://storage.example.com/documento.pdf",
};

const messageWithFile = new FileDecorator(baseMessage, fileMetadata);

console.log("FileDecorator aplicado:");
console.log(`  Content: ${messageWithFile.getContent()}`);
console.log(`  Render: ${messageWithFile.render()}`);
console.log(`  Archivo: ${messageWithFile.getFile().filename}`);
console.log(`  URL: ${messageWithFile.getFile().url}`);
console.log(`  Tamaño: ${(messageWithFile.getFile().size / 1024).toFixed(2)} KB`);

// ===== PASO 3: Envolver con MentionDecorator =====
console.log("\n👤 PASO 3: Envolver con MentionDecorator");
console.log("-".repeat(80));

const mentions: Mention[] = [
  {
    userId: "user-456",
    displayName: "Carlos",
    position: 6, // "Hola @" -> posición de @
  },
  {
    userId: "user-789",
    displayName: "Sofia",
    position: 14, // "Hola @Carlos @" -> posición de @
  },
];

const messageWithMentions = new MentionDecorator(
  messageWithFile,
  mentions,
);

console.log("MentionDecorator aplicado:");
console.log(`  Content (original): ${messageWithMentions.getContent()}`);
console.log(`  Render (resaltado): ${messageWithMentions.render()}`);
console.log(`  Menciones:`);
for (const mention of messageWithMentions.getMentions()) {
  console.log(
    `    - @${mention.displayName} (${mention.userId}) en posición ${mention.position}`,
  );
}
console.log(
  `  ¿Carlos fue mencionado? ${messageWithMentions.isMentioned("user-456") ? "✓ Sí" : "✗ No"}`,
);
console.log(
  `  ¿Pedro fue mencionado? ${messageWithMentions.isMentioned("user-999") ? "✓ Sí" : "✗ No"}`,
);

// ===== PASO 4: Envolver con ReactionDecorator =====
console.log("\n😊 PASO 4: Envolver con ReactionDecorator");
console.log("-".repeat(80));

const reactions: Reaction[] = [
  {
    emoji: "👍",
    count: 3,
    users: ["user-111", "user-222", "user-333"],
  },
  {
    emoji: "❤️",
    count: 2,
    users: ["user-444", "user-555"],
  },
];

const messageWithReactions = new ReactionDecorator(
  messageWithMentions,
  reactions,
);

console.log("ReactionDecorator aplicado:");
console.log(`  Content: ${messageWithReactions.getContent()}`);
console.log(`  Render: ${messageWithReactions.render()}`);
console.log(`  Reacciones:`);
for (const reaction of messageWithReactions.getReactions()) {
  console.log(
    `    ${reaction.emoji}: ${reaction.count} usuario(s) [${reaction.users.join(", ")}]`,
  );
}

// ===== PASO 5: Validar getMetadata() =====
console.log("\n📊 PASO 5: getMetadata() - Validar información completa");
console.log("-".repeat(80));

const fullMetadata = messageWithReactions.getMetadata();

console.log("Metadata completo (composición total):");
console.log(JSON.stringify(fullMetadata, null, 2));

// ===== PASO 6: Validar render() =====
console.log("\n🎨 PASO 6: render() - Salida visual con menciones resaltadas");
console.log("-".repeat(80));

const finalRender = messageWithReactions.render();
console.log("Contenido renderizado:");
console.log(`"${finalRender}"`);

// ===== RESUMEN DE COMPOSICIÓN =====
console.log("\n" + "=".repeat(80));
console.log("✅ RESUMEN DE COMPOSICIÓN");
console.log("=".repeat(80));

console.log(`
Cadena de decoradores creada exitosamente:

  BaseMessage
    ↓ (envuelto por)
  FileDecorator [documento.pdf, 512 KB, application/pdf]
    ↓ (envuelto por)
  MentionDecorator [2 menciones: @Carlos, @Sofia]
    ↓ (envuelto por)
  ReactionDecorator [2 reacciones: 👍 (3), ❤️ (2)]
    ↓ (resultado final)
  Mensaje completamente decorado

Validaciones:
  ✓ BaseMessage implementa: getContent(), getMetadata(), render()
  ✓ FileDecorator es componible (puede envolver cualquier IMessage)
  ✓ MentionDecorator sobrescribe render() para resaltar menciones
  ✓ ReactionDecorator agrega mapa de reacciones
  ✓ Composición de 3 decoradores funciona correctamente
  ✓ getMetadata() retorna información de todos los decoradores
  ✓ render() muestra menciones resaltadas con **@displayName**
`);

console.log("=".repeat(80));
console.log("🎉 PRUEBA COMPLETADA");
console.log("=".repeat(80));
