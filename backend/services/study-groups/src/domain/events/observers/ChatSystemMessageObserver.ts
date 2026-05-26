import type { Pool } from "pg";
import type { StudyGroupEvent } from "../StudyGroupEvents.js";
import type { IObserver } from "./IObserver.js";

export class ChatSystemMessageObserver implements IObserver {
  readonly name = "ChatSystemMessageObserver";

  constructor(private readonly pool: Pool) {}

  async handle(event: StudyGroupEvent): Promise<void> {
    switch (event.type) {
      case "ADMIN_TRANSFER_REQUESTED":
        await this.insertSystemMessage(
          event.groupId,
          `El administrador ha iniciado una transferencia de administración del grupo "${event.groupName}".`,
        );
        break;

      case "ADMIN_TRANSFER_ACCEPTED":
        await this.insertSystemMessage(
          event.groupId,
          "La transferencia de administración ha sido aceptada. Procesando cambio de roles...",
        );
        break;

      case "ADMIN_TRANSFER_REJECTED":
        await this.insertSystemMessage(
          event.groupId,
          "La transferencia de administración ha sido rechazada. El grupo continúa en estado activo.",
        );
        break;

      case "ADMIN_TRANSFER_COMPLETED":
        await this.insertSystemMessage(
          event.groupId,
          `La transferencia de administración se ha completado. El grupo "${event.groupName}" tiene un nuevo administrador.`,
        );
        break;

      default:
        break;
    }
  }

  private async insertSystemMessage(requestId: string, content: string): Promise<void> {
    try {
      await this.pool.query(
        "SELECT insert_study_group_system_message_backend($1, $2)",
        [requestId, content],
      );
    } catch (error) {
      console.error(
        `[ChatSystemMessageObserver] Error al insertar mensaje de sistema:`,
        error instanceof Error ? error.message : String(error),
      );
    }
  }
}
