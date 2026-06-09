export interface EventCancelledEvent {
  readonly type: "EVENT_CANCELLED";
  readonly version: "1.0";
  readonly timestamp: Date;
  readonly eventId: string;
  readonly title: string;
  readonly message: string;
  readonly payload: {
    eventId: string;
    title: string;
    description: string;
    location: string;
    category: string;
    startAt: string;
    organizerId: string;
  };
}
