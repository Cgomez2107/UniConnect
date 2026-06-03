import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ContentValidator } from "../ContentValidator.js";
import { SizeValidator } from "../SizeValidator.js";
import { MediaValidator } from "../MediaValidator.js";
import { ValidatorFactory } from "../ValidatorFactory.js";

describe("CH01 — ContentValidator", () => {
  it("debe pasar si no hay palabras prohibidas", async () => {
    const v = new ContentValidator(["spam", "ads"]);
    const result = await v.manejar("Hola mundo");
    assert.equal(result.valido, true);
  });

  it("debe fallar si contiene palabra prohibida", async () => {
    const v = new ContentValidator(["spam", "ads"]);
    const result = await v.manejar("Este mensaje tiene spam");
    assert.equal(result.valido, false);
    assert.equal(result.codigoError, "ContentError");
  });

  it("debe ser case-insensitive", async () => {
    const v = new ContentValidator(["SpAm"]);
    const result = await v.manejar("contenido con SPAM");
    assert.equal(result.valido, false);
    assert.equal(result.codigoError, "ContentError");
  });

  it("debe pasar contenido vacío", async () => {
    const v = new ContentValidator(["spam"]);
    const result = await v.manejar("");
    assert.equal(result.valido, true);
  });

  it("sin forbiddenWords no bloquea nada", async () => {
    const v = new ContentValidator();
    const result = await v.manejar("cualquier cosa");
    assert.equal(result.valido, true);
  });
});

describe("CH01 — SizeValidator", () => {
  it("debe pasar si el contenido está dentro del límite", async () => {
    const v = new SizeValidator(10);
    const result = await v.manejar("hola");
    assert.equal(result.valido, true);
  });

  it("debe fallar si excede el límite", async () => {
    const v = new SizeValidator(10);
    const result = await v.manejar("12345678901");
    assert.equal(result.valido, false);
    assert.equal(result.codigoError, "SizeError");
  });

  it("debe fallar con reason empty si no hay texto ni media", async () => {
    const v = new SizeValidator(10);
    const result = await v.manejar("");
    assert.equal(result.valido, false);
    assert.equal(result.codigoError, "SizeError");
    assert.ok(result.mensajeError!.includes("texto o una imagen"));
  });

  it("debe pasar si hay mediaUrl aunque el texto esté vacío", async () => {
    const v = new SizeValidator(10);
    const result = await v.manejar("", { mediaUrl: "http://img.jpg" });
    assert.equal(result.valido, true);
  });
});

describe("CH01 — MediaValidator", () => {
  it("debe pasar si no hay mediaUrl", async () => {
    const v = new MediaValidator();
    const result = await v.manejar("solo texto");
    assert.equal(result.valido, true);
  });

  it("debe fallar si el mime type no está permitido", async () => {
    const v = new MediaValidator();
    const result = await v.manejar("", { mediaUrl: "file.exe", mediaType: "application/x-msdownload" });
    assert.equal(result.valido, false);
    assert.equal(result.codigoError, "MediaError");
  });

  it("debe pasar si el mime type está permitido", async () => {
    const v = new MediaValidator();
    const result = await v.manejar("", { mediaUrl: "img.png", mediaType: "image/png" });
    assert.equal(result.valido, true);
  });

  it("debe fallar si el filename es demasiado largo", async () => {
    const v = new MediaValidator();
    const longName = "a".repeat(201) + ".png";
    const result = await v.manejar("", { mediaUrl: `http://img.com/${longName}`, mediaType: "image/png", mediaFilename: longName });
    assert.equal(result.valido, false);
    assert.equal(result.codigoError, "MediaError");
  });

  it("debe pasar con filename en el límite", async () => {
    const v = new MediaValidator();
    const okName = "a".repeat(200);
    const result = await v.manejar("", { mediaUrl: `http://img.com/${okName}`, mediaType: "image/jpeg", mediaFilename: okName });
    assert.equal(result.valido, true);
  });

  it("usa application/octet-stream por defecto si no hay mediaType", async () => {
    const v = new MediaValidator();
    const result = await v.manejar("", { mediaUrl: "file.xyz" });
    assert.equal(result.valido, false);
    assert.equal(result.codigoError, "MediaError");
  });
});

describe("CH01 — ValidatorFactory — setSiguiente retorna this", () => {
  it("createChain retorna SizeValidator como cabeza de cadena", () => {
    const head = ValidatorFactory.createChain();
    assert.ok(head instanceof SizeValidator);
  });

  it("la cadena completa debe validar contenido correctamente", async () => {
    const chain = ValidatorFactory.createChain(5000, ["spam", "ads"]);
    const result = await chain.manejar("Hola mundo");
    assert.equal(result.valido, true);
  });

  it("la cadena rechaza palabras prohibidas", async () => {
    const chain = ValidatorFactory.createChain(5000, ["spam"]);
    const result = await chain.manejar("mensaje con spam");
    assert.equal(result.valido, false);
    assert.equal(result.codigoError, "ContentError");
  });

  it("la cadena rechaza contenido demasiado largo", async () => {
    const chain = ValidatorFactory.createChain(5, []);
    const result = await chain.manejar("123456");
    assert.equal(result.valido, false);
    assert.equal(result.codigoError, "SizeError");
  });

  it("la cadena rechaza media no soportada", async () => {
    const chain = ValidatorFactory.createChain(5000, []);
    const result = await chain.manejar("", { mediaUrl: "file.exe", mediaType: "application/x-msdownload" });
    assert.equal(result.valido, false);
    assert.equal(result.codigoError, "MediaError");
  });

  it("cadena inmutable — valida sin modificar el contenido original", async () => {
    const chain = ValidatorFactory.createChain(10, ["spam"]);
    const content = "  hola  ";
    const result = await chain.manejar(content);
    assert.equal(result.valido, true);
    assert.equal(content, "  hola  ");
  });
});

describe("CH01 — manejar() retorna ResultadoValidacion con cortocircuito", () => {
  it("retorna valido:true cuando la validacion pasa", async () => {
    const chain = ValidatorFactory.createChain(5000, ["spam"]);
    const result = await chain.manejar("Hola mundo");
    assert.equal(result.valido, true);
    assert.equal(result.codigoError, undefined);
  });

  it("retorna valido:false con codigoError cuando falla por contenido", async () => {
    const chain = ValidatorFactory.createChain(5000, ["spam"]);
    const result = await chain.manejar("mensaje con spam");
    assert.equal(result.valido, false);
    assert.equal(result.codigoError, "ContentError");
  });

  it("retorna valido:false con codigoError cuando falla por tamaño", async () => {
    const chain = ValidatorFactory.createChain(5, []);
    const result = await chain.manejar("123456");
    assert.equal(result.valido, false);
    assert.equal(result.codigoError, "SizeError");
  });

  it("retorna valido:false con codigoError cuando falla por media", async () => {
    const chain = ValidatorFactory.createChain(5000, []);
    const result = await chain.manejar("", { mediaUrl: "file.exe", mediaType: "application/x-msdownload" });
    assert.equal(result.valido, false);
    assert.equal(result.codigoError, "MediaError");
  });

  it("retorna valido:false con mensajeError descriptivo", async () => {
    const chain = ValidatorFactory.createChain(5, []);
    const result = await chain.manejar("123456");
    assert.equal(result.valido, false);
    assert.ok(result.mensajeError!.includes("demasiado largo"));
  });

  it("cortocircuito: SizeValidator falla y no ejecuta ContentValidator", async () => {
    const chain = ValidatorFactory.createChain(5, ["spam"]);
    const result = await chain.manejar("123456");
    assert.equal(result.valido, false);
    assert.equal(result.codigoError, "SizeError");
  });
});

describe("CH01 — setSiguiente no expone el handler siguiente", () => {
  it("setSiguiente retorna this (el mismo handler), no el siguiente", () => {
    const size = new SizeValidator(10);
    const content = new ContentValidator(["spam"]);
    const result = size.setSiguiente(content);
    assert.ok(result instanceof SizeValidator);
    assert.equal(result, size);
  });
});