/**
 * us-d01-decorator-pattern.spec.ts
 *
 * Suite de Unit Tests para US-D01: Decorator Pattern en Mensajes del Chat Grupal
 *
 * Criterios de Aceptación a Validar:
 * - CA1-CA2: BaseMessage debe renderizar texto plano con userId y timestamp
 * - CA3: FileDecorator debe añadir url, mimeType y tamaño sin perder texto original
 * - CA4: MentionDecorator debe resaltar los userIds en el método render()
 * - CA5: ReactionDecorator debe gestionar un mapa de emojis y contadores
 * - CA6: Componibilidad - Un mensaje puede envolverse en múltiples decoradores
 *
 * Patrón de Test: node:test + node:assert/strict (sin infraestructura externa)
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { FileDecorator } from "../../services/messaging/src/domain/decorators/FileDecorator.js";
import type { FileMetadata } from "../../services/messaging/src/domain/decorators/FileDecorator.js";
import { MentionDecorator } from "../../services/messaging/src/domain/decorators/MentionDecorator.js";
import type { Mention } from "../../services/messaging/src/domain/decorators/MentionDecorator.js";
import { ReactionDecorator } from "../../services/messaging/src/domain/decorators/ReactionDecorator.js";
import type { Reaction } from "../../services/messaging/src/domain/decorators/ReactionDecorator.js";
import type { IMessage } from "../../services/messaging/src/domain/decorators/IMessage.js";

/**
 * Helper: Crear un mensaje base para tests sin depender de BaseMessage
 */
function createTestMessage(overrides?: Partial<{
  id: string;
  content: string;
  timestamp: Date;
  senderId: string;
}>): IMessage {
  const message = {
    id: overrides?.id ?? "msg-1",
    content: overrides?.content ?? "Hola mundo",
    timestamp: overrides?.timestamp ?? new Date("2026-04-29T10:00:00Z"),
    senderId: overrides?.senderId ?? "user-123",
    getContent(): string {
      return this.content;
    },
    getMetadata(): Record<string, unknown> {
      return {
        id: this.id,
        senderId: this.senderId,
        timestamp: this.timestamp.toISOString(),
        content: this.content,
      };
    },
    render(): string {
      return this.content;
    },
    toJSON(): Record<string, unknown> {
      return this.getMetadata();
    },
  };

  return message as IMessage;
}

describe("US-D01 - Decorator Pattern para Mensajes del Chat Grupal", () => {
  describe("CA1-CA2: BaseMessage - Renderización de Texto Plano", () => {
    it("debe crear un mensaje base con contenido, userId y timestamp", () => {
      const message = createTestMessage({
        id: "msg-base-1",
        content: "Mensaje de prueba",
        senderId: "carlos-123",
      });

      assert.equal(message.id, "msg-base-1");
      assert.equal(message.content, "Mensaje de prueba");
      assert.equal(message.senderId, "carlos-123");
      assert(message.timestamp instanceof Date);
    });

    it("debe implementar IMessage con getContent(), getMetadata(), render()", () => {
      const message = createTestMessage({
        content: "Test content",
      });

      // Validar interfaz IMessage
      assert.equal(typeof message.getContent(), "string");
      assert.equal(typeof message.getMetadata, "function");
      assert.equal(typeof message.render, "function");
      assert.equal(typeof message.toJSON, "function");
    });

    it("debe retornar contenido plano en getContent()", () => {
      const message = createTestMessage({
        content: "Contenido sin decoradores",
      });

      assert.equal(message.getContent(), "Contenido sin decoradores");
    });

    it("debe retornar metadatos con id, senderId, timestamp en getMetadata()", () => {
      const timestamp = new Date("2026-04-29T12:00:00Z");
      const message = createTestMessage({
        id: "msg-meta-1",
        content: "Contenido",
        senderId: "sofia-456",
        timestamp,
      });

      const metadata = message.getMetadata();

      assert.equal(metadata.id, "msg-meta-1");
      assert.equal(metadata.senderId, "sofia-456");
      assert.equal(metadata.timestamp, "2026-04-29T12:00:00.000Z");
      assert.equal(metadata.content, "Contenido");
    });

    it("debe renderizar contenido plano sin cambios en render()", () => {
      const message = createTestMessage({
        content: "Texto sin formato",
      });

      assert.equal(message.render(), "Texto sin formato");
    });

    it("debe serializar a JSON incluyendo todos los metadatos en toJSON()", () => {
      const message = createTestMessage({
        id: "msg-json-1",
        content: "Contenido JSON",
        senderId: "natalia-789",
      });

      const json = message.toJSON();

      assert.equal(json.id, "msg-json-1");
      assert.equal(json.content, "Contenido JSON");
      assert.equal(json.senderId, "natalia-789");
      assert(json.timestamp);
    });
  });

  describe("CA3: FileDecorator - Adjuntar Archivo sin Perder Contenido", () => {
    it("debe envolver un mensaje base y conservar su contenido", () => {
      const baseMessage = createTestMessage({
        content: "Adjunto documento importante",
      });

      const fileMetadata: FileMetadata = {
        filename: "documento.pdf",
        size: 1024 * 512, // 512KB
        mimeType: "application/pdf",
        url: "https://s3.example.com/files/documento.pdf",
      };

      const decorated = new FileDecorator(baseMessage, fileMetadata);

      assert.equal(decorated.getContent(), "Adjunto documento importante");
      assert.equal(decorated.render(), "Adjunto documento importante");
    });

    it("debe añadir metadata de archivo a getMetadata()", () => {
      const baseMessage = createTestMessage({
        id: "msg-file-1",
        content: "Descarga el reporte",
        senderId: "admin-001",
      });

      const fileMetadata: FileMetadata = {
        filename: "reporte-2026.pdf",
        size: 2048 * 1024, // 2MB
        mimeType: "application/pdf",
        url: "https://cdn.example.com/reporte.pdf",
      };

      const decorated = new FileDecorator(baseMessage, fileMetadata);
      const metadata = decorated.getMetadata();

      // Debe conservar metadatos base
      assert.equal(metadata.id, "msg-file-1");
      assert.equal(metadata.senderId, "admin-001");
      assert.equal(metadata.content, "Descarga el reporte");

      // Debe incluir metadatos de archivo
      assert(metadata.file);
      const file = metadata.file as any;
      assert.equal(file.filename, "reporte-2026.pdf");
      assert.equal(file.size, 2048 * 1024);
      assert.equal(file.mimeType, "application/pdf");
      assert.equal(file.url, "https://cdn.example.com/reporte.pdf");
    });

    it("debe validar que el archivo tenga filename válido", () => {
      const baseMessage = createTestMessage();

      const invalidFile: FileMetadata = {
        filename: "", // Inválido
        size: 1024,
        mimeType: "text/plain",
        url: "https://example.com/file.txt",
      };

      assert.throws(
        () => new FileDecorator(baseMessage, invalidFile),
        /filename no puede estar vacío/,
      );
    });

    it("debe validar que el tamaño esté en rango válido (>0 y <100MB)", () => {
      const baseMessage = createTestMessage();

      const tooLarge: FileMetadata = {
        filename: "huge.bin",
        size: 101 * 1024 * 1024, // 101MB
        mimeType: "application/octet-stream",
        url: "https://example.com/huge.bin",
      };

      assert.throws(
        () => new FileDecorator(baseMessage, tooLarge),
        /size debe estar entre 0 y 100MB/,
      );
    });

    it("debe validar que el mimeType sea válido", () => {
      const baseMessage = createTestMessage();

      const noMimeType: FileMetadata = {
        filename: "file.txt",
        size: 1024,
        mimeType: "", // Inválido
        url: "https://example.com/file.txt",
      };

      assert.throws(
        () => new FileDecorator(baseMessage, noMimeType),
        /mimeType no puede estar vacío/,
      );
    });

    it("debe validar que la URL sea válida", () => {
      const baseMessage = createTestMessage();

      const noUrl: FileMetadata = {
        filename: "file.txt",
        size: 1024,
        mimeType: "text/plain",
        url: "", // Inválido
      };

      assert.throws(
        () => new FileDecorator(baseMessage, noUrl),
        /url no puede estar vacía/,
      );
    });
  });

  describe("CA4: MentionDecorator - Resaltar Menciones en render()", () => {
    it("debe envolver un mensaje y resaltar menciones con **@displayName**", () => {
      const baseMessage = createTestMessage({
        content: "Hola @Carlos @Sofia",
      });

      const mentions: Mention[] = [
        {
          userId: "carlos-123",
          displayName: "Carlos",
          position: 5,
        },
        {
          userId: "sofia-456",
          displayName: "Sofia",
          position: 13,
        },
      ];

      const decorated = new MentionDecorator(baseMessage, mentions);

      // render() debe resaltar menciones
      const rendered = decorated.render();
      assert(rendered.includes("**@Carlos**"));
      assert(rendered.includes("**@Sofia**"));
    });

    it("debe conservar getContent() del mensaje base sin modificar", () => {
      const baseMessage = createTestMessage({
        content: "Mensaje con @Carlos",
      });

      const mentions: Mention[] = [
        {
          userId: "carlos-123",
          displayName: "Carlos",
          position: 11,
        },
      ];

      const decorated = new MentionDecorator(baseMessage, mentions);

      // getContent() NO debe resaltar (eso es render)
      assert.equal(decorated.getContent(), "Mensaje con @Carlos");
    });

    it("debe incluir menciones en getMetadata()", () => {
      const baseMessage = createTestMessage({
        id: "msg-mention-1",
        content: "Hola @Alice @Bob",
      });

      const mentions: Mention[] = [
        {
          userId: "alice-001",
          displayName: "Alice",
          position: 5,
        },
        {
          userId: "bob-002",
          displayName: "Bob",
          position: 11,
        },
      ];

      const decorated = new MentionDecorator(baseMessage, mentions);
      const metadata = decorated.getMetadata();

      assert(metadata.mentions);
      const metionArray = metadata.mentions as Mention[];
      assert.equal(metionArray.length, 2);
      assert.equal(metionArray[0].userId, "alice-001");
      assert.equal(metionArray[1].userId, "bob-002");
    });

    it("debe detectar menciones con isMentioned()", () => {
      const baseMessage = createTestMessage({
        content: "@Alice @Bob @Carlos",
      });

      const mentions: Mention[] = [
        { userId: "alice-001", displayName: "Alice", position: 0 },
        { userId: "bob-002", displayName: "Bob", position: 7 },
        { userId: "carlos-003", displayName: "Carlos", position: 12 },
      ];

      const decorated = new MentionDecorator(baseMessage, mentions);

      assert(decorated.isMentioned("alice-001"));
      assert(decorated.isMentioned("bob-002"));
      assert(decorated.isMentioned("carlos-003"));
      assert(!decorated.isMentioned("unknown-user"));
    });

    it("debe validar que no haya menciones duplicadas", () => {
      const baseMessage = createTestMessage();

      const duplicateMentions: Mention[] = [
        {
          userId: "carlos-123",
          displayName: "Carlos",
          position: 5,
        },
        {
          userId: "carlos-123", // Duplicado
          displayName: "Carlos",
          position: 10,
        },
      ];

      assert.throws(
        () => new MentionDecorator(baseMessage, duplicateMentions),
        /Mención duplicada/,
      );
    });

    it("debe validar que userId no sea vacío", () => {
      const baseMessage = createTestMessage();

      const invalidMention: Mention[] = [
        {
          userId: "", // Inválido
          displayName: "User",
          position: 0,
        },
      ];

      assert.throws(
        () => new MentionDecorator(baseMessage, invalidMention),
        /userId no puede estar vacío/,
      );
    });

    it("debe validar que displayName no sea vacío", () => {
      const baseMessage = createTestMessage();

      const invalidMention: Mention[] = [
        {
          userId: "user-123",
          displayName: "", // Inválido
          position: 0,
        },
      ];

      assert.throws(
        () => new MentionDecorator(baseMessage, invalidMention),
        /displayName no puede estar vacío/,
      );
    });

    it("debe validar que position sea >= 0", () => {
      const baseMessage = createTestMessage();

      const invalidMention: Mention[] = [
        {
          userId: "user-123",
          displayName: "User",
          position: -1, // Inválido
        },
      ];

      assert.throws(
        () => new MentionDecorator(baseMessage, invalidMention),
        /position debe ser >= 0/,
      );
    });
  });

  describe("CA5: ReactionDecorator - Gestionar Emojis y Contadores", () => {
    it("debe envolver un mensaje y gestionar reacciones (emojis)", () => {
      const baseMessage = createTestMessage({
        content: "¡Excelente trabajo!",
      });

      const reactions: Reaction[] = [
        {
          emoji: "👍",
          count: 3,
          users: ["user-1", "user-2", "user-3"],
        },
        {
          emoji: "❤️",
          count: 2,
          users: ["user-4", "user-5"],
        },
      ];

      const decorated = new ReactionDecorator(baseMessage, reactions);

      const retrieved = decorated.getReactions();
      assert.equal(retrieved.length, 2);
      assert.equal(retrieved[0].emoji, "👍");
      assert.equal(retrieved[0].count, 3);
      assert.equal(retrieved[1].emoji, "❤️");
      assert.equal(retrieved[1].count, 2);
    });

    it("debe mantener count = users.length consistentemente", () => {
      const baseMessage = createTestMessage();

      const reactions: Reaction[] = [
        {
          emoji: "👍",
          count: 3, // Igual a users.length
          users: ["user-1", "user-2", "user-3"],
        },
      ];

      const decorated = new ReactionDecorator(baseMessage, reactions);
      const reaction = decorated.getReaction("👍");

      assert(reaction);
      assert.equal(reaction.count, reaction.users.length);
    });

    it("debe rechazar reacciones con count inconsistente", () => {
      const baseMessage = createTestMessage();

      const invalidReactions: Reaction[] = [
        {
          emoji: "👍",
          count: 5, // No coincide con users.length
          users: ["user-1", "user-2"],
        },
      ];

      assert.throws(
        () => new ReactionDecorator(baseMessage, invalidReactions),
        /Inconsistencia en reacción/,
      );
    });

    it("debe rechazar usuarios duplicados en una reacción", () => {
      const baseMessage = createTestMessage();

      const invalidReactions: Reaction[] = [
        {
          emoji: "👍",
          count: 2,
          users: ["user-1", "user-1"], // Duplicado
        },
      ];

      assert.throws(
        () => new ReactionDecorator(baseMessage, invalidReactions),
        /Usuarios duplicados/,
      );
    });

    it("debe permitir agregar nueva reacción con addReaction()", () => {
      const baseMessage = createTestMessage();
      const decorated = new ReactionDecorator(baseMessage, []);

      const reaction = decorated.addReaction("👍", "user-1");

      assert.equal(reaction.emoji, "👍");
      assert.equal(reaction.count, 1);
      assert.deepEqual(reaction.users, ["user-1"]);
    });

    it("debe incrementar contador cuando otro usuario reacciona con mismo emoji", () => {
      const baseMessage = createTestMessage();
      const existing: Reaction[] = [
        {
          emoji: "👍",
          count: 1,
          users: ["user-1"],
        },
      ];

      const decorated = new ReactionDecorator(baseMessage, existing);
      const updated = decorated.addReaction("👍", "user-2");

      assert.equal(updated.count, 2);
      assert.deepEqual(updated.users, ["user-1", "user-2"]);
    });

    it("debe evitar duplicados cuando el mismo usuario reacciona dos veces", () => {
      const baseMessage = createTestMessage();
      const existing: Reaction[] = [
        {
          emoji: "👍",
          count: 1,
          users: ["user-1"],
        },
      ];

      const decorated = new ReactionDecorator(baseMessage, existing);
      const result = decorated.addReaction("👍", "user-1"); // user-1 intenta reaccionar de nuevo

      assert.equal(result.count, 1); // No cambia
      assert.deepEqual(result.users, ["user-1"]); // Sin duplicados
    });

    it("debe remover reacción de un usuario específico", () => {
      const baseMessage = createTestMessage();
      const existing: Reaction[] = [
        {
          emoji: "👍",
          count: 2,
          users: ["user-1", "user-2"],
        },
      ];

      const decorated = new ReactionDecorator(baseMessage, existing);
      decorated.removeReaction("👍", "user-1");

      const remaining = decorated.getReaction("👍");
      assert(remaining);
      assert.equal(remaining.count, 1);
      assert.deepEqual(remaining.users, ["user-2"]);
    });

    it("debe eliminar reacción cuando no queda ningún usuario", () => {
      const baseMessage = createTestMessage();
      const existing: Reaction[] = [
        {
          emoji: "👍",
          count: 1,
          users: ["user-1"],
        },
      ];

      const decorated = new ReactionDecorator(baseMessage, existing);
      decorated.removeReaction("👍", "user-1");

      const remaining = decorated.getReaction("👍");
      assert.equal(remaining, undefined);
    });

    it("debe incluir reacciones en getMetadata()", () => {
      const baseMessage = createTestMessage({
        id: "msg-reaction-1",
      });

      const reactions: Reaction[] = [
        {
          emoji: "👍",
          count: 2,
          users: ["user-1", "user-2"],
        },
      ];

      const decorated = new ReactionDecorator(baseMessage, reactions);
      const metadata = decorated.getMetadata();

      assert(metadata.reactions);
    });
  });

  describe("CA6: Componibilidad - Múltiples Decoradores Ensamblados", () => {
    it("debe permitir un mensaje con archivo + mención", () => {
      // Base
      const base = createTestMessage({
        id: "msg-composed-1",
        content: "Revisa @Sofia el documento",
      });

      // Layer 1: Archivo
      const fileMetadata: FileMetadata = {
        filename: "proyecto.pdf",
        size: 1024 * 512,
        mimeType: "application/pdf",
        url: "https://example.com/proyecto.pdf",
      };
      const withFile = new FileDecorator(base, fileMetadata);

      // Layer 2: Mención
      const mentions: Mention[] = [
        {
          userId: "sofia-456",
          displayName: "Sofia",
          position: 7,
        },
      ];
      const withMention = new MentionDecorator(withFile, mentions);

      // Validar capas
      assert.equal(withMention.getContent(), "Revisa @Sofia el documento");
      assert(withMention.render().includes("**@Sofia**"));

      const metadata = withMention.getMetadata();
      assert(metadata.file);
      assert(metadata.mentions);
    });

    it("debe permitir un mensaje con archivo + mención + reacción", () => {
      // Base
      const base = createTestMessage({
        id: "msg-triple-1",
        content: "Mensaje a @Carlos",
      });

      // Layer 1: Archivo
      const fileMetadata: FileMetadata = {
        filename: "data.json",
        size: 2048,
        mimeType: "application/json",
        url: "https://example.com/data.json",
      };
      const withFile = new FileDecorator(base, fileMetadata);

      // Layer 2: Mención
      const mentions: Mention[] = [
        {
          userId: "carlos-123",
          displayName: "Carlos",
          position: 10,
        },
      ];
      const withMention = new MentionDecorator(withFile, mentions);

      // Layer 3: Reacción
      const reactions: Reaction[] = [
        {
          emoji: "👍",
          count: 1,
          users: ["user-reactions"],
        },
      ];
      const final = new ReactionDecorator(withMention, reactions);

      // Validar triple composición
      assert.equal(final.getContent(), "Mensaje a @Carlos");
      assert(final.render().includes("**@Carlos**"));

      const metadata = final.getMetadata();
      assert(metadata.file);
      assert(metadata.mentions);
      assert(metadata.reactions);

      const fileData = metadata.file as any;
      assert.equal(fileData.filename, "data.json");

      const mentionData = metadata.mentions as Mention[];
      assert.equal(mentionData[0].userId, "carlos-123");

      const reactionData = metadata.reactions as Reaction[];
      assert.equal(reactionData[0].emoji, "👍");
    });

    it("debe preservar tipo IMessage en todas las capas", () => {
      let message: IMessage = createTestMessage({
        content: "Base",
      });

      // Asegurarse de que cada decorador retorna IMessage
      assert(message.getContent);
      assert(message.getMetadata);
      assert(message.render);
      assert(message.toJSON);

      // Envolver con FileDecorator
      const fileMetadata: FileMetadata = {
        filename: "test.txt",
        size: 512,
        mimeType: "text/plain",
        url: "https://example.com/test.txt",
      };
      message = new FileDecorator(message, fileMetadata);

      assert(message.getContent);
      assert(message.getMetadata);
      assert(message.render);
      assert(message.toJSON);

      // Envolver con MentionDecorator
      message = new MentionDecorator(message, [
        {
          userId: "user-1",
          displayName: "User",
          position: 0,
        },
      ]);

      assert(message.getContent);
      assert(message.getMetadata);
      assert(message.render);
      assert(message.toJSON);

      // Envolver con ReactionDecorator
      message = new ReactionDecorator(message, [
        {
          emoji: "😀",
          count: 1,
          users: ["user-1"],
        },
      ]);

      assert(message.getContent);
      assert(message.getMetadata);
      assert(message.render);
      assert(message.toJSON);
    });

    it("debe manejar stacking completo: Base -> Archivo -> Mención -> Reacción", () => {
      // Caso de uso real: Mensaje grupal con todas las capas

      // 1. Crear mensaje base
      const base = createTestMessage({
        id: "msg-complete-1",
        content: "Equipo, revisen @Carlos @Sofia el archivo de requisitos",
        timestamp: new Date("2026-04-29T14:00:00Z"),
        senderId: "project-manager-001",
      });

      // 2. Adjuntar archivo
      const fileMetadata: FileMetadata = {
        filename: "requisitos-v2.pdf",
        size: 1024 * 256, // 256KB
        mimeType: "application/pdf",
        url: "https://s3.uniconnect.com/files/requisitos-v2.pdf",
      };
      const withFile = new FileDecorator(base, fileMetadata);

      // 3. Marcar menciones
      const mentions: Mention[] = [
        {
          userId: "carlos-frontend",
          displayName: "Carlos",
          position: 16,
        },
        {
          userId: "sofia-backend",
          displayName: "Sofia",
          position: 24,
        },
      ];
      const withMentions = new MentionDecorator(withFile, mentions);

      // 4. Agregar reacciones
      const reactions: Reaction[] = [
        {
          emoji: "👍",
          count: 3,
          users: ["carlos-frontend", "sofia-backend", "reviewer-001"],
        },
        {
          emoji: "📌",
          count: 1,
          users: ["admin-001"],
        },
      ];
      const final = new ReactionDecorator(withMentions, reactions);

      // Validaciones de stacking completo
      assert.equal(final.id, "msg-complete-1");
      assert.equal(final.senderId, "project-manager-001");

      // Content sin cambios
      assert(
        final
          .getContent()
          .includes(
            "Equipo, revisen @Carlos @Sofia el archivo de requisitos",
          ),
      );

      // Render con menciones resaltadas
      const rendered = final.render();
      assert(rendered.includes("**@Carlos**"));
      assert(rendered.includes("**@Sofia**"));

      // Metadata completa
      const metadata = final.getMetadata();
      assert.equal(metadata.id, "msg-complete-1");
      assert.equal(metadata.senderId, "project-manager-001");

      const file = metadata.file as any;
      assert.equal(file.filename, "requisitos-v2.pdf");
      assert.equal(file.size, 1024 * 256);

      const metasMentions = metadata.mentions as Mention[];
      assert.equal(metasMentions.length, 2);
      assert(metasMentions.some((m) => m.userId === "carlos-frontend"));
      assert(metasMentions.some((m) => m.userId === "sofia-backend"));

      const metasReactions = metadata.reactions as Reaction[];
      assert.equal(metasReactions.length, 2);
      const thumbsUp = metasReactions.find((r) => r.emoji === "👍");
      assert(thumbsUp);
      assert.equal(thumbsUp.count, 3);

      // toJSON debe serializar todo correctamente
      const json = final.toJSON();
      assert(json.file);
      assert(json.mentions);
      assert(json.reactions);
    });

    it("debe permitir agregar reacciones después del stacking", () => {
      // Crear mensaje compl_base
      const base = createTestMessage({
        content: "@Alice revisa esto",
      });

      // Decorar con mención
      const withMention = new MentionDecorator(base, [
        {
          userId: "alice-001",
          displayName: "Alice",
          position: 0,
        },
      ]);

      // Decorar con reacciones
      const withReactions = new ReactionDecorator(withMention, [
        {
          emoji: "👍",
          count: 1,
          users: ["user-1"],
        },
      ]);

      // Agregar más reacciones después del stacking
      withReactions.addReaction("❤️", "user-2");
      withReactions.addReaction("👍", "user-3"); // Incrementar contador

      const reactions = withReactions.getReactions();
      assert.equal(reactions.length, 2);

      const thumbsUp = reactions.find((r) => r.emoji === "👍");
      assert(thumbsUp);
      assert.equal(thumbsUp.count, 2);
      assert.deepEqual(thumbsUp.users, ["user-1", "user-3"]);

      const heart = reactions.find((r) => r.emoji === "❤️");
      assert(heart);
      assert.equal(heart.count, 1);
    });
  });
});
