import dotenv from "dotenv";
import sgMail from "@sendgrid/mail";

dotenv.config();

const apiKey = process.env.SENDGRID_API_KEY;
const fromEmail = process.env.EMAIL_FROM;
const fromName = process.env.EMAIL_FROM_NAME ?? "UniConnect";
const toEmail = process.env.TO_EMAIL ?? fromEmail;

if (!apiKey) {
  throw new Error("SENDGRID_API_KEY no está definido en .env");
}

if (!fromEmail) {
  throw new Error("EMAIL_FROM no está definido en .env");
}

if (!toEmail) {
  throw new Error("TO_EMAIL o EMAIL_FROM deben estar definidos en .env");
}

sgMail.setApiKey(apiKey);

async function main(): Promise<void> {
  try {
    const result = await sgMail.send({
      to: toEmail,
      from: { email: fromEmail, name: fromName },
      subject: "[UniConnect] Prueba real de SendGrid",
      text: "Este es un correo de prueba real para validar la integración de SendGrid en UniConnect.",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.5">
          <h2>Prueba real de SendGrid</h2>
          <p>Si recibes este correo, la integración está funcionando correctamente.</p>
          <p><strong>Destino:</strong> ${toEmail}</p>
          <p><strong>Origen:</strong> ${fromEmail}</p>
        </div>
      `,
    });

    console.log(JSON.stringify({ ok: true, statusCode: result[0]?.statusCode ?? 202 }));
  } catch (error) {
    console.error(error.response?.body || error);
    process.exitCode = 1;
  }
}

await main();