export interface IPreferenceRepository {
  getCanalesActivos(userId: string, eventType: string): Promise<string[] | null>;
  setCanalActivo(userId: string, eventType: string, canal: string, activo: boolean): Promise<void>;
}
