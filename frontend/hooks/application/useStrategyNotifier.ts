import { useCallback, useMemo } from "react";
import {
  InAppStrategy,
  PushStrategy,
  EmailStrategy,
  NotificationService,
  DefaultPreferenceService,
} from "@/lib/patterns/strategy";
import type { NotificacionDTO, ResumenNotificacion } from "@/lib/patterns/strategy";
import type { IExpoPushGateway, IUserPushRepository } from "@/lib/patterns/strategy";
import type { IEmailGateway, IUserEmailRepository } from "@/lib/patterns/strategy";

const noopPushGateway: IExpoPushGateway = {
  async enviarPush() {},
};

const noopEmailGateway: IEmailGateway = {
  async enviarCorreo() {},
};

const emptyUserRepo: IUserPushRepository & IUserEmailRepository = {
  async getPushToken() {
    return null;
  },
  async getEmail() {
    return null;
  },
};

let singletonService: NotificationService | null = null;

function getService(): NotificationService {
  if (!singletonService) {
    singletonService = new NotificationService(
      [
        new InAppStrategy(),
        new PushStrategy(noopPushGateway, emptyUserRepo),
        new EmailStrategy(noopEmailGateway, emptyUserRepo),
      ],
      new DefaultPreferenceService(),
    );
  }
  return singletonService;
}

export function useStrategyNotifier() {
  const service = useMemo(() => getService(), []);

  const notificar = useCallback(
    async (dto: NotificacionDTO): Promise<ResumenNotificacion> => {
      return service.notificar(dto);
    },
    [service],
  );

  return { notificar };
}
