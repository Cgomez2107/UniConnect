import { describe, it, expect, jest, beforeEach } from "@jest/globals";

jest.mock("@sendgrid/mail", () => {
  const mockSend = jest.fn<any>();
  const mockSetApiKey = jest.fn<any>();
  return {
    __esModule: true,
    default: { setApiKey: mockSetApiKey, send: mockSend },
  };
}, { virtual: false });

import sgMail from "@sendgrid/mail";
import { SendGridEmailGateway } from "../src/infrastructure/gateways/SendGridEmailGateway.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockSend = sgMail.send as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockSetApiKey = sgMail.setApiKey as any;

interface LoggerSpy {
  error: jest.Mock;
  warn: jest.Mock;
  info: jest.Mock;
}

describe("SendGridEmailGateway", () => {
  let loggerSpy: LoggerSpy;

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
