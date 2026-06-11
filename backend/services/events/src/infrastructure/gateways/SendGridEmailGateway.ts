import sgMail from "@sendgrid/mail";

export interface IEmailGateway {
  enviarEmail(to: string, subject: string, body: string, htmlBody?: string): Promise<void>;
}

export class SendGridEmailGateway implements IEmailGateway {
  private readonly fromEmail: string;
  private readonly fromName: string;

  constructor(apiKey: string, fromEmail: string, fromName: string) {
    this.fromEmail = fromEmail;
    this.fromName = fromName;
    sgMail.setApiKey(apiKey);
  }

  async enviarEmail(to: string, subject: string, body: string, htmlBody?: string): Promise<void> {
    const msg: Parameters<typeof sgMail.send>[0] = {
      to,
      from: { email: this.fromEmail, name: this.fromName },
      subject,
      text: body,
    };
    if (htmlBody) {
      (msg as any).html = htmlBody;
    }
    await sgMail.send(msg);
    console.log(`[SendGridEmailGateway] Email sent to ${to}: ${subject}`);
  }
}
