export interface IPreferenceService {
  getCanalesActivos(userId: string, eventType: string, priority?: string): Promise<string[]>;
}

export class DefaultPreferenceService implements IPreferenceService {
  async getCanalesActivos(
    _userId: string,
    _eventType: string,
    _priority?: string,
  ): Promise<string[]> {
    return ["in_app", "push_movil"];
  }
}
