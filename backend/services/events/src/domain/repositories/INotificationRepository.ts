export interface INotificationRepository {
  create(input: {
    userId: string;
    type: string;
    title: string;
    body: string;
    payload: Record<string, unknown> | null;
  }): Promise<string>;
}
