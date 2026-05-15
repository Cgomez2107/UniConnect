export interface IPreferenceService {
  getCanalesActivos(userId: string, eventType: string, priority?: string): Promise<string[]>;
  setCanalActivo(userId: string, eventType: string, canal: string, activo: boolean): Promise<void>;
}
