import type { IObserver } from "./IObserver.js";
import type { ISubject } from "./ISubject.js";
import type { UniversityEvent } from "./UniversityEvents.js";

export class UniversityEventSubject implements ISubject {
  private readonly observers: Set<IObserver> = new Set();
  private readonly name: string;

  constructor(name: string = "UniversityEventSubject") {
    this.name = name;
  }

  subscribe(observer: IObserver): void {
    if (this.observers.has(observer)) {
      console.warn(`[${this.name}] Observer "${observer.name}" already subscribed`);
      return;
    }
    this.observers.add(observer);
  }

  unsubscribe(observer: IObserver): void {
    if (!this.observers.delete(observer)) {
      console.warn(`[${this.name}] Observer "${observer.name}" not found`);
    }
  }

  async emit(event: UniversityEvent): Promise<void> {
    const promises = [...this.observers].map(o =>
      o.handle(event).catch(err => {
        console.error(`[${this.name}] Observer "${o.name}" failed:`, err);
      }),
    );
    await Promise.all(promises);
  }

  getObserverCount(): number {
    return this.observers.size;
  }

  clear(): void {
    this.observers.clear();
  }
}
