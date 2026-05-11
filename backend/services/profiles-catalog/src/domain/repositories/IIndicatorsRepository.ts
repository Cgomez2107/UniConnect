import type { Indicators } from "../decorators/StatisticsDecorator.js";
import type { Badge } from "../decorators/BadgesDecorator.js";

export interface IIndicatorsRepository {
  getIndicators(userId: string): Promise<Indicators>;
  getBadges(userId: string): Promise<Badge[]>;
}
