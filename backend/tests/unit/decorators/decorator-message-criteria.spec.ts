import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { BaseMessage } from "../../../services/messaging/src/domain/decorators/BaseMessage.js";
import { FileDecorator } from "../../../services/messaging/src/domain/decorators/FileDecorator.js";
import type { FileMetadata } from "../../../services/messaging/src/domain/decorators/FileDecorator.js";
import { MentionDecorator } from "../../../services/messaging/src/domain/decorators/MentionDecorator.js";
import type { Mention } from "../../../services/messaging/src/domain/decorators/MentionDecorator.js";
import { ReactionDecorator } from "../../../services/messaging/src/domain/decorators/ReactionDecorator.js";
import type { Reaction } from "../../../services/messaging/src/domain/decorators/ReactionDecorator.js";

const ts = new Date("2026-05-18T10:00:00Z");

describe("Decorator Pattern - Mensajes (Criterios C1 a C5)", () => {
  describe("C1: MensajeBase.render() retorna texto plano sin metadatos", () => {
    it("C1: render() debe retornar solo el contenido textual, sin formato ni metadatos extra", () => {
      const msg = new BaseMessage({
        id: "c1-001",
        content: "Hola, ¿cómo están?",
        timestamp: ts,
        senderId: "user-01",
      });

      assert.equal(msg.render(), "Hola, ¿cómo están?");
    });

    it("C1: getContent() debe retornar el mismo texto que se pasó al constructor", () => {
      const msg = new BaseMessage({
        id: "c1-002",
        content: "Solo texto plano",
        timestamp: ts,
        senderId: "user-02",
      });

      assert.equal(msg.getContent(), "Solo texto plano");
    });
  });

  describe("C2: MensajeConArchivo(MensajeBase).render() incluye campos de archivo", () => {
    it("C2: getMetadata() debe incluir filename, size, mimeType y url del archivo", () => {
      const base = new BaseMessage({
        id: "c2-001",
        content: "Adjunto el reporte",
        timestamp: ts,
        senderId: "user-10",
      });

      const file: FileMetadata = {
        filename: "reporte.pdf",
        size: 2048 * 1024,
        mimeType: "application/pdf",
        url: "https://cdn.test.com/reporte.pdf",
      };

      const decorated = new FileDecorator(base, file);
      const metadata = decorated.getMetadata();
      const f = metadata.file as FileMetadata;

      assert.equal(f.filename, "reporte.pdf");
      assert.equal(f.size, 2048 * 1024);
      assert.equal(f.mimeType, "application/pdf");
      assert.equal(f.url, "https://cdn.test.com/reporte.pdf");
    });

    it("C2: getContent() y render() deben delegar al mensaje interno sin perder el texto original", () => {
      const base = new BaseMessage({
        id: "c2-002",
        content: "Mira el documento adjunto",
        timestamp: ts,
        senderId: "user-11",
      });

      const file: FileMetadata = {
        filename: "doc.txt",
        size: 512,
        mimeType: "text/plain",
        url: "https://cdn.test.com/doc.txt",
      };

      const decorated = new FileDecorator(base, file);

      assert.equal(decorated.getContent(), "Mira el documento adjunto");
      assert.equal(decorated.render(), "Mira el documento adjunto");
    });
  });

  describe("C3: Composicion MentionDecorator(FileDecorator(BaseMessage))", () => {
    it("C3: getMetadata() debe incluir tanto file como mentions simultáneamente", () => {
      const base = new BaseMessage({
        id: "c3-001",
        content: "@Carlos revisa el documento",
        timestamp: ts,
        senderId: "user-20",
      });

      const file: FileMetadata = {
        filename: "plan.pdf",
        size: 1024 * 256,
        mimeType: "application/pdf",
        url: "https://cdn.test.com/plan.pdf",
      };

      const mentions: Mention[] = [
        { userId: "carlos-01", displayName: "Carlos", position: 0 },
      ];

      const decorated = new MentionDecorator(new FileDecorator(base, file), mentions);
      const metadata = decorated.getMetadata();

      assert(metadata.file !== undefined);
      assert(metadata.mentions !== undefined);

      const m = metadata.mentions as Mention[];
      assert.equal(m.length, 1);
      assert.equal(m[0].userId, "carlos-01");
    });

    it("C3: render() debe resaltar menciones con **@displayName** y preservar el contenido base", () => {
      const base = new BaseMessage({
        id: "c3-002",
        content: "@Ana @Luis miren el archivo",
        timestamp: ts,
        senderId: "user-21",
      });

      const file: FileMetadata = {
        filename: "datos.csv",
        size: 1024,
        mimeType: "text/csv",
        url: "https://cdn.test.com/datos.csv",
      };

      const mentions: Mention[] = [
        { userId: "ana-01", displayName: "Ana", position: 0 },
        { userId: "luis-01", displayName: "Luis", position: 5 },
      ];

      const decorated = new MentionDecorator(new FileDecorator(base, file), mentions);
      const rendered = decorated.render();

      assert(rendered.includes("**@Ana**"));
      assert(rendered.includes("**@Luis**"));
      assert(rendered.includes("miren el archivo"));
    });
  });

  describe("C4: Negativo - mensaje sin FileDecorator no debe tener campo file", () => {
    it("C4: BaseMessage.getMetadata() no debe incluir la clave 'file'", () => {
      const msg = new BaseMessage({
        id: "c4-001",
        content: "Sin archivo adjunto",
        timestamp: ts,
        senderId: "user-30",
      });

      const metadata = msg.getMetadata();

      assert.equal("file" in metadata, false);
    });

    it("C4: MentionDecorator(BaseMessage).getMetadata() no debe incluir 'file' (solo mentions)", () => {
      const base = new BaseMessage({
        id: "c4-002",
        content: "@Pedro solo texto",
        timestamp: ts,
        senderId: "user-31",
      });

      const mentions: Mention[] = [
        { userId: "pedro-01", displayName: "Pedro", position: 0 },
      ];

      const decorated = new MentionDecorator(base, mentions);
      const metadata = decorated.getMetadata();

      assert.equal("file" in metadata, false);
      assert("mentions" in metadata);
    });
  });

  describe("C5: Cobertura minima - cada clase tiene al menos 2 casos de prueba", () => {
    describe("BaseMessage", () => {
      it("C5: constructor debe asignar id, content, timestamp, senderId correctamente", () => {
        const ts = new Date("2026-05-18T12:00:00Z");
        const msg = new BaseMessage({
          id: "c5-base-01",
          content: "test",
          timestamp: ts,
          senderId: "sender-01",
        });

        assert.equal(msg.id, "c5-base-01");
        assert.equal(msg.content, "test");
        assert.equal(msg.timestamp, ts);
        assert.equal(msg.senderId, "sender-01");
      });

      it("C5: toJSON() debe serializar fielmente todos los campos base", () => {
        const ts = new Date("2026-05-18T12:00:00Z");
        const msg = new BaseMessage({
          id: "c5-base-02",
          content: "serializar",
          timestamp: ts,
          senderId: "sender-02",
        });

        const json = msg.toJSON();

        assert.equal(json.id, "c5-base-02");
        assert.equal(json.content, "serializar");
        assert.equal(json.senderId, "sender-02");
        assert.equal(json.timestamp, "2026-05-18T12:00:00.000Z");
      });
    });

    describe("FileDecorator", () => {
      it("C5: getFile() debe exponer el FileMetadata completo", () => {
        const base = new BaseMessage({
          id: "c5-file-01",
          content: "x",
          timestamp: ts,
          senderId: "u-01",
        });

        const file: FileMetadata = {
          filename: "img.png",
          size: 65536,
          mimeType: "image/png",
          url: "https://cdn.test.com/img.png",
        };

        const decorated = new FileDecorator(base, file);
        const result = decorated.getFile();

        assert.equal(result.filename, "img.png");
        assert.equal(result.size, 65536);
        assert.equal(result.mimeType, "image/png");
        assert.equal(result.url, "https://cdn.test.com/img.png");
      });

      it("C5: debe rechazar size > 100MB (límite superior)", () => {
        const base = new BaseMessage({
          id: "c5-file-02",
          content: "x",
          timestamp: ts,
          senderId: "u-02",
        });

        const oversized: FileMetadata = {
          filename: "huge.bin",
          size: 101 * 1024 * 1024,
          mimeType: "application/octet-stream",
          url: "https://cdn.test.com/huge.bin",
        };

        assert.throws(
          () => new FileDecorator(base, oversized),
          /size debe estar entre 0 y 100MB/,
        );
      });

      it("C5: debe rechazar mimeType vacío", () => {
        const base = new BaseMessage({
          id: "c5-file-03",
          content: "x",
          timestamp: ts,
          senderId: "u-03",
        });

        const noMime: FileMetadata = {
          filename: "f.txt",
          size: 100,
          mimeType: "",
          url: "https://cdn.test.com/f.txt",
        };

        assert.throws(
          () => new FileDecorator(base, noMime),
          /mimeType no puede estar vacío/,
        );
      });
    });

    describe("MentionDecorator", () => {
      it("C5: isMentioned() debe retornar true para usuarios mencionados y false para los que no", () => {
        const base = new BaseMessage({
          id: "c5-mention-01",
          content: "@Alice @Bob",
          timestamp: ts,
          senderId: "u-10",
        });

        const mentions: Mention[] = [
          { userId: "alice-01", displayName: "Alice", position: 0 },
          { userId: "bob-01", displayName: "Bob", position: 7 },
        ];

        const decorated = new MentionDecorator(base, mentions);

        assert.equal(decorated.isMentioned("alice-01"), true);
        assert.equal(decorated.isMentioned("bob-01"), true);
        assert.equal(decorated.isMentioned("unknown"), false);
      });

      it("C5: debe rechazar menciones duplicadas (mismo userId)", () => {
        const base = new BaseMessage({
          id: "c5-mention-02",
          content: "@Carlos @Carlos",
          timestamp: ts,
          senderId: "u-11",
        });

        const dupes: Mention[] = [
          { userId: "carlos-01", displayName: "Carlos", position: 0 },
          { userId: "carlos-01", displayName: "Carlos", position: 8 },
        ];

        assert.throws(
          () => new MentionDecorator(base, dupes),
          /Mención duplicada/,
        );
      });

      it("C5: debe rechazar userId vacío", () => {
        const base = new BaseMessage({
          id: "c5-mention-03",
          content: "@ ",
          timestamp: ts,
          senderId: "u-12",
        });

        const invalid: Mention[] = [
          { userId: "", displayName: "Nobody", position: 0 },
        ];

        assert.throws(
          () => new MentionDecorator(base, invalid),
          /userId no puede estar vacío/,
        );
      });
    });

    describe("ReactionDecorator", () => {
      it("C5: getReactions() y getReaction() deben retornar emojis con contadores correctos", () => {
        const base = new BaseMessage({
          id: "c5-react-01",
          content: "Gran trabajo",
          timestamp: ts,
          senderId: "u-20",
        });

        const reactions: Reaction[] = [
          { emoji: "👍", count: 3, users: ["a", "b", "c"] },
          { emoji: "❤️", count: 1, users: ["d"] },
        ];

        const decorated = new ReactionDecorator(base, reactions);

        const all = decorated.getReactions();
        assert.equal(all.length, 2);

        const thumbsUp = decorated.getReaction("👍");
        assert(thumbsUp);
        assert.equal(thumbsUp.count, 3);
        assert.deepEqual(thumbsUp.users, ["a", "b", "c"]);

        assert.equal(decorated.getReaction("🚀"), undefined);
      });

      it("C5: addReaction() debe incrementar el contador y agregar el userId", () => {
        const base = new BaseMessage({
          id: "c5-react-02",
          content: "Bien",
          timestamp: ts,
          senderId: "u-21",
        });

        const existing: Reaction[] = [
          { emoji: "👍", count: 1, users: ["user-1"] },
        ];

        const decorated = new ReactionDecorator(base, existing);
        const updated = decorated.addReaction("👍", "user-2");

        assert.equal(updated.count, 2);
        assert.deepEqual(updated.users, ["user-1", "user-2"]);
      });

      it("C5: removeReaction() debe decrementar el contador o eliminar el emoji si queda vacío", () => {
        const base = new BaseMessage({
          id: "c5-react-03",
          content: "OK",
          timestamp: ts,
          senderId: "u-22",
        });

        const reactions: Reaction[] = [
          { emoji: "👍", count: 2, users: ["user-1", "user-2"] },
          { emoji: "❤️", count: 1, users: ["user-1"] },
        ];

        const decorated = new ReactionDecorator(base, reactions);

        decorated.removeReaction("👍", "user-1");
        const thumbsUp = decorated.getReaction("👍");
        assert(thumbsUp);
        assert.equal(thumbsUp.count, 1);
        assert.deepEqual(thumbsUp.users, ["user-2"]);

        decorated.removeReaction("❤️", "user-1");
        assert.equal(decorated.getReaction("❤️"), undefined);
      });

      it("C5: debe rechazar count inconsistente con users.length", () => {
        const base = new BaseMessage({
          id: "c5-react-04",
          content: "x",
          timestamp: ts,
          senderId: "u-23",
        });

        const invalid: Reaction[] = [
          { emoji: "👍", count: 10, users: ["user-1"] },
        ];

        assert.throws(
          () => new ReactionDecorator(base, invalid),
          /Inconsistencia en reacción/,
        );
      });
    });
  });
});
