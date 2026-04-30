/**
 * ISubject.ts
 *
 * Contrato para subjects del dominio de messaging.
 */

import type { ChatChannel, ChatEvent } from "./ChatEvents.js";
import type { IChatObserver } from "./ChatSubject.js";

export interface ISubject {
  subscribe(channel: ChatChannel, observer: IChatObserver): void;
  unsubscribe(channel: ChatChannel, observer: IChatObserver): void;
  emit(channel: ChatChannel, event: ChatEvent): Promise<void>;
}
