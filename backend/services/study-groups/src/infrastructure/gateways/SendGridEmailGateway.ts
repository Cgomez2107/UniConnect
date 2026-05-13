import sgMail from "@sendgrid/mail";
import type { IEmailGateway } from "../../../../../shared/patterns/strategy/EmailInstitucionalStrategy.js";

interface Logger {
  error(...args: unknown[]): void;
  warn(...args: unknown[]): void;
  info(...args: unknown[]): void;
}

export class SendGridEmailGateway implements IEmailGateway {
  private readonly fromEmail: string;
  private readonly fromName: string;
  private readonly logger: Logger;

  constructor(
    apiKey: string,
    fromEmail: string,
    fromName: string,
    logger?: Logger,
  ) {
    this.fromEmail = fromEmail;
    this.fromName = fromName;
    this.logger = logger ?? console;

    if (!apiKey || apiKey === "SG.your_sendgrid_api_key_here") {
      this.logger.error(
        "[SendGridEmailGateway] SendGrid API key is not configured or is a placeholder. Email channel will fail at runtime.",
      );
    }

    sgMail.setApiKey(apiKey);
  }

  async enviarEmail(to: string, subject: string, body: string): Promise<void> {
    await sgMail.send({
      to,
      from: { email: this.fromEmail, name: this.fromName },
      subject,
      text: body,
    });

    this.logger.info(
      JSON.stringify({
        gateway: "SendGridEmailGateway",
        event: "email_sent",
        to,
        subject,
      }),
    );
  }
}
