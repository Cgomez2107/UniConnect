import type { Indicadores } from "../decorators/EstadisticasDecorator.js";
import type { Insignia } from "../decorators/InsigniasDecorator.js";

export interface IIndicadoresRepository {
  getIndicadores(userId: string): Promise<Indicadores>;
  getInsignias(userId: string): Promise<Insignia[]>;
}
