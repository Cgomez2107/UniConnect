import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ContentValidator } from "../ContentValidator.js";
import { SizeValidator } from "../SizeValidator.js";
import { MediaValidator } from "../MediaValidator.js";
import { ValidatorFactory } from "../ValidatorFactory.js";
import { ContentError } from "../../../../libs/errors/ContentError.js";
import { SizeError } from "../../../../libs/errors/SizeError.js";
import { MediaError } from "../../../../libs/errors/MediaError.js";

describe("CH01 — ContentValidator", () => {
  it("debe pasar si no hay palabras prohibidas", async () => {
    const v = new ContentValidator(["spam", "ads"]);
    await assert.doesNotReject(v.validate("Hola mundo"));
  });

  it("debe lanzar ContentError si contiene palabra prohibida", async () => {
    const v = new ContentValidator(["spam", "ads"]);
    await assert.rejects(
      () => v.validate("Este mensaje tiene spam"),
      (err) => {
        assert.ok(err instanceof ContentError);
        assert.equal(err.reason, "forbidden_words");
        return true;
      },
    );
  });

  it("debe ser case-insensitive", async () => {
    const v = new ContentValidator(["SpAm"]);
    await assert.rejects(
      () => v.validate("contenido con SPAM"),
      ContentError,
    );
  });

  it("debe pasar contenido vacío sin lanzar error", async () => {
    const v = new ContentValidator(["spam"]);
    await assert.doesNotReject(v.validate(""));
  });

  it("sin forbiddenWords no bloquea nada", async () => {
    const v = new ContentValidator();
    await assert.doesNotReject(v.validate("cualquier cosa"));
  });
});

describe("CH01 — SizeValidator", () => {
  const v = new SizeValidator(10);

  it("debe pasar si el contenido está dentro del límite", async () => {
    await assert.doesNotReject(v.validate("hola"));
  });

  it("debe lanzar SizeError si excede el límite", async () => {
    await assert.rejects(
      () => v.validate("12345678901"),
      (err) => {
        assert.ok(err instanceof SizeError);
        assert.equal(err.reason, "max_length");
        assert.equal(err.maxLength, 10);
        return true;
      },
    );
  });

  it("debe lanzar SizeError con reason empty si no hay texto ni media", async () => {
    await assert.rejects(
      () => v.validate(""),
      (err) => {
        assert.ok(err instanceof SizeError);
        assert.equal(err.reason, "empty");
        return true;
      },
    );
  });

  it("debe pasar si hay mediaUrl aunque el texto esté vacío", async () => {
    await assert.doesNotReject(v.validate("", { mediaUrl: "http://img.jpg" }));
  });
});

describe("CH01 — MediaValidator", () => {
  const v = new MediaValidator();

  it("debe pasar si no hay mediaUrl", async () => {
    await assert.doesNotReject(v.validate("solo texto"));
  });

  it("debe lanzar MediaError si el mime type no está permitido", async () => {
    await assert.rejects(
      () => v.validate("", { mediaUrl: "file.exe", mediaType: "application/x-msdownload" }),
      (err) => {
        assert.ok(err instanceof MediaError);
        assert.equal(err.reason, "unsupported_type");
        return true;
      },
    );
  });

  it("debe pasar si el mime type está permitido", async () => {
    await assert.doesNotReject(v.validate("", { mediaUrl: "img.png", mediaType: "image/png" }));
  });

  it("debe lanzar MediaError si el filename es demasiado largo", async () => {
    const longName = "a".repeat(201) + ".png";
    await assert.rejects(
      () => v.validate("", { mediaUrl: `http://img.com/${longName}`, mediaType: "image/png", mediaFilename: longName }),
      (err) => {
        assert.ok(err instanceof MediaError);
        assert.equal(err.reason, "filename_too_long");
        return true;
      },
    );
  });

  it("debe pasar con filename en el límite", async () => {
    const okName = "a".repeat(200);
    await assert.doesNotReject(v.validate("", { mediaUrl: `http://img.com/${okName}`, mediaType: "image/jpeg", mediaFilename: okName }));
  });

  it("usa application/octet-stream por defecto si no hay mediaType", async () => {
    await assert.rejects(
      () => v.validate("", { mediaUrl: "file.xyz" }),
      MediaError,
    );
  });
});

describe("CH01 — ValidatorFactory", () => {
  it("createChain retorna SizeValidator como cabeza de cadena", () => {
    const head = ValidatorFactory.createChain();
    assert.ok(head instanceof SizeValidator);
  });

  it("la cadena completa debe validar contenido correctamente", async () => {
    const chain = ValidatorFactory.createChain(5000, ["spam", "ads"]);
    await assert.doesNotReject(chain.validate("Hola mundo"));
  });

  it("la cadena rechaza palabras prohibidas", async () => {
    const chain = ValidatorFactory.createChain(5000, ["spam"]);
    await assert.rejects(
      () => chain.validate("mensaje con spam"),
      ContentError,
    );
  });

  it("la cadena rechaza contenido demasiado largo", async () => {
    const chain = ValidatorFactory.createChain(5, []);
    await assert.rejects(
      () => chain.validate("123456"),
      SizeError,
    );
  });

  it("la cadena rechaza media no soportada", async () => {
    const chain = ValidatorFactory.createChain(5000, []);
    await assert.rejects(
      () => chain.validate("", { mediaUrl: "file.exe", mediaType: "application/x-msdownload" }),
      MediaError,
    );
  });

  it("cadena inmutable — valida sin modificar el contenido original", async () => {
    const chain = ValidatorFactory.createChain(10, ["spam"]);
    const content = "  hola  ";
    await chain.validate(content);
    assert.equal(content, "  hola  ");
  });
});

describe("CH01 — manejar() retorna ResultadoValidacion", () => {
  it("retorna valido:true cuando la validacion pasa", async () => {
    const chain = ValidatorFactory.createChain(5000, ["spam"]);
    const res = await chain.manejar("Hola mundo");
    assert.equal(res.valido, true);
    assert.equal(res.codigoError, undefined);
  });

  it("retorna valido:false con codigoError cuando falla por contenido", async () => {
    const chain = ValidatorFactory.createChain(5000, ["spam"]);
    const res = await chain.manejar("mensaje con spam");
    assert.equal(res.valido, false);
    assert.equal(res.codigoError, "ContentError");
  });

  it("retorna valido:false con codigoError cuando falla por tamaño", async () => {
    const chain = ValidatorFactory.createChain(5, []);
    const res = await chain.manejar("123456");
    assert.equal(res.valido, false);
    assert.equal(res.codigoError, "SizeError");
  });

  it("retorna valido:false con codigoError cuando falla por media", async () => {
    const chain = ValidatorFactory.createChain(5000, []);
    const res = await chain.manejar("", { mediaUrl: "file.exe", mediaType: "application/x-msdownload" });
    assert.equal(res.valido, false);
    assert.equal(res.codigoError, "MediaError");
  });

  it("retorna valido:false con mensajeError descriptivo", async () => {
    const chain = ValidatorFactory.createChain(5, []);
    const res = await chain.manejar("123456");
    assert.equal(res.valido, false);
    assert.ok(res.mensajeError!.includes("demasiado largo"));
  });
});
