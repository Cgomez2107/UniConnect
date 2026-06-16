import { describe, it, expect } from "vitest";
import { QrPass } from "../../src/domain/value-objects/QrPass.js";

const SECRET = "test-hmac-secret-for-unit-tests";
const TOKEN = "550e8400-e29b-41d4-a716-446655440000";

describe("QrPass — sign", () => {
  it("produce una firma HMAC-SHA256 de 64 caracteres hexadecimales", () => {
    const sig = QrPass.sign(TOKEN, SECRET);
    expect(sig).toMatch(/^[a-f0-9]{64}$/);
  });

  it("produce firmas distintas para distintos tokens", () => {
    const sig1 = QrPass.sign(TOKEN, SECRET);
    const sig2 = QrPass.sign("other-token", SECRET);
    expect(sig1).not.toBe(sig2);
  });

  it("produce firmas distintas para distintos secretos", () => {
    const sig1 = QrPass.sign(TOKEN, SECRET);
    const sig2 = QrPass.sign(TOKEN, "different-secret");
    expect(sig1).not.toBe(sig2);
  });
});

describe("QrPass — verify", () => {
  it("retorna true para una firma válida", () => {
    const sig = QrPass.sign(TOKEN, SECRET);
    expect(QrPass.verify(TOKEN, sig, SECRET)).toBe(true);
  });

  it("retorna false para una firma alterada (tamper)", () => {
    const sig = QrPass.sign(TOKEN, SECRET);
    const tampered = (parseInt(sig[0], 16) ^ 1).toString(16) + sig.slice(1);
    expect(QrPass.verify(TOKEN, tampered, SECRET)).toBe(false);
  });

  it("retorna false para un secreto incorrecto", () => {
    const sig = QrPass.sign(TOKEN, SECRET);
    expect(QrPass.verify(TOKEN, sig, "wrong-secret")).toBe(false);
  });

  it("retorna false cuando las longitudes difieren", () => {
    expect(QrPass.verify(TOKEN, "too-short", SECRET)).toBe(false);
  });

  it("retorna false para firma vacía", () => {
    expect(QrPass.verify(TOKEN, "", SECRET)).toBe(false);
  });

  it("retorna false para token vacío", () => {
    const sig = QrPass.sign(TOKEN, SECRET);
    expect(QrPass.verify("", sig, SECRET)).toBe(false);
  });

  it("retorna false si la firma no es un hex string válido (longitud incorrecta)", () => {
    expect(QrPass.verify(TOKEN, "xyz-not-hex!!", SECRET)).toBe(false);
  });
});

describe("QrPass — parse", () => {
  it("extrae token y signature de un contenido QR válido", () => {
    const sig = QrPass.sign(TOKEN, SECRET);
    const content = `uniconnect://access?rid=${TOKEN}&sig=${sig}`;
    const result = QrPass.parse(content);
    expect(result).toEqual({ token: TOKEN, signature: sig });
  });

  it("retorna null para protocolo que no es uniconnect", () => {
    expect(QrPass.parse("https://example.com/qr")).toBeNull();
  });

  it("retorna null para hostname incorrecto", () => {
    expect(QrPass.parse("uniconnect://fake?rid=x&sig=y")).toBeNull();
  });

  it("retorna null cuando falta rid", () => {
    const sig = QrPass.sign(TOKEN, SECRET);
    expect(QrPass.parse(`uniconnect://access?sig=${sig}`)).toBeNull();
  });

  it("retorna null cuando falta sig", () => {
    expect(QrPass.parse(`uniconnect://access?rid=${TOKEN}`)).toBeNull();
  });

  it("retorna null para string vacío", () => {
    expect(QrPass.parse("")).toBeNull();
  });

  it("retorna null para null/undefined", () => {
    expect(QrPass.parse(null as unknown as string)).toBeNull();
    expect(QrPass.parse(undefined as unknown as string)).toBeNull();
  });
});

describe("QrPass — qrContent", () => {
  it("genera la URL en el formato correcto", () => {
    const pass = new QrPass("reg-1", TOKEN, "abc123sig");
    expect(pass.qrContent).toBe(`uniconnect://access?rid=${TOKEN}&sig=abc123sig`);
  });

  it("el contenido generado es parseable de vuelta", () => {
    const sig = QrPass.sign(TOKEN, SECRET);
    const pass = new QrPass("reg-1", TOKEN, sig);
    const parsed = QrPass.parse(pass.qrContent);
    expect(parsed).toEqual({ token: TOKEN, signature: sig });
  });
});
