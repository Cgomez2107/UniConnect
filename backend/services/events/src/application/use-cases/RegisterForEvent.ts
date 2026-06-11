import type { IEventRepository } from "../../domain/repositories/IEventRepository.js";
import type { INotificationRepository } from "../../domain/repositories/INotificationRepository.js";
import type { IEventSocketGateway } from "../../domain/events/UniversityEventObserver.js";
import type { IEmailGateway } from "../../infrastructure/gateways/SendGridEmailGateway.js";
import { NotFoundError } from "../../../../../shared/libs/errors/NotFoundError.js";

interface RegisterForEventInput {
  eventId: string;
  userId: string;
}

export class RegisterForEvent {
  constructor(
    private readonly repository: IEventRepository,
    private readonly notificationRepository: INotificationRepository | null = null,
    private readonly socketGateway: IEventSocketGateway | null = null,
    private readonly emailGateway: IEmailGateway | null = null,
  ) {}

  async execute(input: RegisterForEventInput): Promise<void> {
    const { eventId, userId } = input;

    // 1. Fetch event details first
    const event = await this.repository.getById(eventId);
    if (!event) {
      throw new NotFoundError("Evento no encontrado.");
    }

    // 2. Perform the database registration and decrement cupos atomically
    await this.repository.registerForEvent(eventId, userId);

    // 3. Persist notification in DB (for in-app UI list)
    const payload = {
      eventId: event.id,
      title: event.title,
      description: event.description,
      category: event.category,
      location: event.location,
      startAt: event.startAt,
      organizerId: event.organizerId,
      organizerName: event.organizerName,
      imageUrl: event.imageUrl,
    };

    if (this.notificationRepository) {
      try {
        await this.notificationRepository.create({
          userId,
          type: "EVENT_REGISTRATION",
          title: `Inscripción exitosa: ${event.title}`,
          body: `Te has inscrito correctamente al evento: ${event.title}. ¡Te esperamos!`,
          payload,
        });
      } catch (err) {
        console.error(`[RegisterForEvent] Failed to persist notification for user ${userId}:`, err);
      }
    }

    // 4. Emit via gateway (realtime WS notification)
    if (this.socketGateway) {
      try {
        await this.socketGateway.emitToUser(userId, "EVENT_REGISTRATION", {
          ...payload,
          message: `Te has inscrito correctamente al evento: ${event.title}. ¡Te esperamos!`,
        });
      } catch (err) {
        console.error(`[RegisterForEvent] Failed to emit realtime update to user ${userId}:`, err);
      }
    }

    // 5. Send confirmation email via SendGrid
    if (this.emailGateway) {
      try {
        const userEmail = await this.repository.getUserEmail(userId);
        if (userEmail) {
          const subject = `✅ Inscripción confirmada: ${event.title}`;
          const eventDate = new Date(event.startAt).toLocaleString("es-CO", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });

          const plainBody =
            `Hola,\n\nTe confirmamos que te has inscrito exitosamente al evento "${event.title}".\n\n` +
            `Detalles del evento:\n` +
            `- Fecha: ${eventDate}\n` +
            `- Ubicación: ${event.location || "Por definir"}\n` +
            (event.organizerName ? `- Organizador: ${event.organizerName}\n` : "") +
            `\n¡Te esperamos!\n\n---\nUniConnect - Conectando tu comunidad universitaria`;

          const htmlBody = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Inscripción confirmada</title>
</head>
<body style="margin:0;padding:0;background:#f4f6fa;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6fa;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%);padding:32px 40px;text-align:center;">
              <p style="margin:0;color:rgba(255,255,255,0.85);font-size:13px;letter-spacing:2px;text-transform:uppercase;">UniConnect</p>
              <h1 style="margin:8px 0 0;color:#ffffff;font-size:26px;font-weight:700;">¡Inscripción confirmada!</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              <p style="margin:0 0 20px;color:#374151;font-size:15px;line-height:1.6;">
                Hola, te confirmamos que tu inscripción al siguiente evento fue registrada exitosamente:
              </p>
              <!-- Event card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;margin-bottom:24px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <h2 style="margin:0 0 16px;color:#111827;font-size:18px;font-weight:600;">${event.title}</h2>
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:4px 0;color:#6b7280;font-size:13px;white-space:nowrap;padding-right:12px;">📅 Fecha</td>
                        <td style="padding:4px 0;color:#374151;font-size:13px;">${eventDate}</td>
                      </tr>
                      <tr>
                        <td style="padding:4px 0;color:#6b7280;font-size:13px;white-space:nowrap;padding-right:12px;">📍 Ubicación</td>
                        <td style="padding:4px 0;color:#374151;font-size:13px;">${event.location || "Por definir"}</td>
                      </tr>
                      ${event.organizerName ? `<tr>
                        <td style="padding:4px 0;color:#6b7280;font-size:13px;white-space:nowrap;padding-right:12px;">👤 Organizador</td>
                        <td style="padding:4px 0;color:#374151;font-size:13px;">${event.organizerName}</td>
                      </tr>` : ""}
                    </table>
                  </td>
                </tr>
              </table>
              <p style="margin:0;color:#374151;font-size:15px;line-height:1.6;">
                ¡Te esperamos en el evento! Recuerda llegar a tiempo. 🎉
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 40px;text-align:center;">
              <p style="margin:0;color:#9ca3af;font-size:12px;">
                UniConnect · Conectando tu comunidad universitaria
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

          await this.emailGateway.enviarEmail(userEmail, subject, plainBody, htmlBody);
        } else {
          console.warn(`[RegisterForEvent] No email found for user ${userId}, skipping email.`);
        }
      } catch (err) {
        console.error(`[RegisterForEvent] Failed to send email to user ${userId}:`, err);
      }
    }
  }
}