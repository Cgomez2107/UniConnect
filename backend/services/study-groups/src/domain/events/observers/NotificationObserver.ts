import type { INotificationRepository } from "../../repositories/INotificationRepository.js";
import { NotificationService, type ResumenNotificacion } from "../../../../../../shared/patterns/strategy/NotificationService.js";
import { NotificationMapper } from "../../../application/services/NotificationMapper.js";
import type { StudyGroupEvent } from "../StudyGroupEvents.js";
import type { IObserver } from "./IObserver.js";

export class NotificationObserver implements IObserver {
  readonly name = "NotificationObserver";

  constructor(
    private readonly notificationRepository: INotificationRepository,
    private readonly notificationService: NotificationService,
    private readonly mapper: NotificationMapper,
  ) {}

  async handle(event: StudyGroupEvent): Promise<void> {
    const results = this.mapper.map(event);

    for (const { persistence, dto } of results) {
      await this.notificationRepository.create(persistence);

      const resumen: ResumenNotificacion = await this.notificationService.notificar(dto);

      console.log(
        JSON.stringify({
          observer: this.name,
          event: event.type,
          targetUser: dto.userId,
          dispatchResult: {
            total: resumen.total,
            exitosos: resumen.exitosos,
            fallidos: resumen.fallidos,
          },
        }),
      );
    }
  }
}
