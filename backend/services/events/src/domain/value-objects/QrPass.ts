import { createHmac, timingSafeEqual } from "node:crypto";

export class QrPass {
  constructor(
    public readonly registrationId: string,
    public readonly token: string,
    public readonly signature: string,
  ) {}

  get qrContent(): string {
    return `uniconnect://access?rid=${this.token}&sig=${this.signature}`;
  }

  static sign(token: string, secret: string): string {
    return createHmac("sha256", secret).update(token).digest("hex");
  }

  static verify(token: string, signature: string, secret: string): boolean {
    const expected = QrPass.sign(token, secret);
    if (expected.length !== signature.length) return false;
    try {
      return timingSafeEqual(Buffer.from(expected, "utf-8"), Buffer.from(signature, "utf-8"));
    } catch {
      return false;
    }
  }

  static parse(content: string): { token: string; signature: string } | null {
    let url: URL;
    try {
      url = new URL(content);
    } catch {
      return null;
    }
    if (url.protocol !== "uniconnect:") return null;
    if (url.hostname !== "access") return null;
    const token = url.searchParams.get("rid");
    const signature = url.searchParams.get("sig");
    if (!token || !signature) return null;
    return { token, signature };
  }
}
