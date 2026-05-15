import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import type { IEmailGateway } from "../../../shared/patterns/strategy/EmailInstitucionalStrategy.js";

jest.mock("@sendgrid/mail", () => {
  const mockSend = jest.fn<(...args: unknown[]) => Promise<unknown>>();
  const mockSetApiKey = jest.fn<(key: string) => void>();
  return {
    __esModule: true,
    default: { setApiKey: mockSetApiKey, send: mockSend },
    setApiKey: mockSetApiKey,
    send: mockSend,
  };
}, { virtual: false });

import sgMail from "@sendgrid/mail";
import { SendGridEmailGateway } from "../src/infrastructure/gateways/SendGridEmailGateway.js";

interface SendGridResponse { statusCode: number }
type SendFn = (msg: Record<string, unknown>) => Promise<[SendGridResponse]>;
const mockSend = sgMail.send as unknown as jest.Mock<SendFn>;
const mockSetApiKey = sgMail.setApiKey as unknown as jest.Mock<(key: string) => void>;

describe("SendGridEmailGateway", () => {
  let loggerSpy: { error: jest.Mock<(...args: unknown[]) => void>; warn: jest.Mock<(...args: unknown[]) => void>; info: jest.Mock<(...args: unknown[]) => void> };

  beforeEach(() => {
    jest.clearAllMocks();
    loggerSpy = { error: jest.fn(), warn: jest.fn(), info: jest.fn() };
  });

  it("setea la API key en el constructor", () => {
    new SendGridEmailGateway("SG.real_key", "from@test.com", "Test", loggerSpy);
    expect(mockSetApiKey).toHaveBeenCalledWith("SG.real_key");
  });

  it("loggea warning si la API key es placeholder", () => {
    new SendGridEmailGateway("SG.your_sendgrid_api_key_here", "from@test.com", "Test", loggerSpy);
    expect(loggerSpy.error).toHaveBeenCalledWith(
      expect.stringContaining("SendGrid API key is not configured"),
    );
  });

  it("enviarEmail llama a sgMail.send con los parametros correctos", async () => {
    mockSend.mockResolvedValueOnce([{ statusCode: 202 }]);
    const gateway = new SendGridEmailGateway("SG.valid", "from@test.com", "Test", loggerSpy);
    await gateway.enviarEmail("to@test.com", "Asunto Test", "Cuerpo Test");
    expect(mockSend).toHaveBeenCalledWith({
      to: "to@test.com",
      from: { email: "from@test.com", name: "Test" },
      subject: "Asunto Test",
      text: "Cuerpo Test",
    });
    expect(loggerSpy.info).toHaveBeenCalledWith(expect.stringContaining("email_sent"));
  });

  it("enviarEmail propaga errores de sgMail.send", async () => {
    const networkError = new Error("ETIMEDOUT: conexion agotada");
    mockSend.mockRejectedValueOnce(networkError);
    const gateway = new SendGridEmailGateway("SG.valid", "from@test.com", "Test", loggerSpy);
    await expect(gateway.enviarEmail("to@test.com", "Fail", "fail")).rejects.toThrow("ETIMEDOUT");
  });

  it("no loggea warning si la API key es valida", () => {
    new SendGridEmailGateway("SG.valid_key_12345", "from@test.com", "Test", loggerSpy);
    expect(loggerSpy.error).not.toHaveBeenCalled();
  });
});
