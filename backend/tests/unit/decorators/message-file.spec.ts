import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { BaseMessage } from "../../../services/messaging/src/domain/decorators/BaseMessage";
import { FileDecorator } from "../../../services/messaging/src/domain/decorators/FileDecorator";
import type { FileMetadata } from "../../../services/messaging/src/domain/decorators/FileDecorator";

describe("US-T01 Tarea 2 - MensajeConArchivo", () => {
  it("render() debe incluir informacion del archivo (url, mimeType, size)", () => {
    const base = new BaseMessage({
      id: "msg-file-001",
      content: "Adjunto archivo",
      timestamp: new Date("2026-04-29T16:00:00Z"),
      senderId: "user-10",
    });

    const file: FileMetadata = {
      filename: "reporte.pdf",
      size: 1024 * 256,
      mimeType: "application/pdf",
      url: "https://cdn.example.com/reporte.pdf",
    };

    const decorated = new FileDecorator(base, file);
    const rendered = decorated.render();

    assert(rendered.includes(file.url));
    assert(rendered.includes(file.mimeType));
    assert(rendered.includes(String(file.size)));
  });

  it("un mensaje base no debe incluir archivo en metadata ni render", () => {
    const base = new BaseMessage({
      id: "msg-file-002",
      content: "Sin archivo",
      timestamp: new Date("2026-04-29T16:05:00Z"),
      senderId: "user-11",
    });

    const metadata = base.getMetadata();
    assert.equal("file" in metadata, false);

    const rendered = base.render();
    assert.equal(rendered.includes("http"), false);
    assert.equal(rendered.includes("application/"), false);
  });

  it("no debe permitir filename vacio", () => {
    const base = new BaseMessage({
      id: "msg-file-003",
      content: "Archivo invalido",
      timestamp: new Date("2026-04-29T16:10:00Z"),
      senderId: "user-12",
    });

    const invalid: FileMetadata = {
      filename: "",
      size: 1024,
      mimeType: "text/plain",
      url: "https://cdn.example.com/file.txt",
    };

    assert.throws(
      () => new FileDecorator(base, invalid),
      /filename no puede estar vacio/,
    );
  });

  it("no debe permitir url vacia", () => {
    const base = new BaseMessage({
      id: "msg-file-004",
      content: "Archivo invalido",
      timestamp: new Date("2026-04-29T16:15:00Z"),
      senderId: "user-13",
    });

    const invalid: FileMetadata = {
      filename: "file.txt",
      size: 1024,
      mimeType: "text/plain",
      url: "",
    };

    assert.throws(
      () => new FileDecorator(base, invalid),
      /url no puede estar vacia/,
    );
  });

  it("no debe permitir mimeType vacio", () => {
    const base = new BaseMessage({
      id: "msg-file-005",
      content: "Archivo invalido",
      timestamp: new Date("2026-04-29T16:20:00Z"),
      senderId: "user-14",
    });

    const invalid: FileMetadata = {
      filename: "file.txt",
      size: 1024,
      mimeType: "",
      url: "https://cdn.example.com/file.txt",
    };

    assert.throws(
      () => new FileDecorator(base, invalid),
      /mimeType no puede estar vacio/,
    );
  });
});
