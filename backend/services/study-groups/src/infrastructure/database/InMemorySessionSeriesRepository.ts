import type { SessionSeries } from "../../domain/entities/SessionSeries.js";
import type { ISessionSeriesRepository, CreateSessionSeriesInput } from "../../domain/repositories/ISessionSeriesRepository.js";

export class InMemorySessionSeriesRepository implements ISessionSeriesRepository {
  private series: Map<string, SessionSeries> = new Map();

  async create(input: CreateSessionSeriesInput): Promise<SessionSeries> {
    const now = new Date().toISOString();
    const entity: SessionSeries = {
      id: crypto.randomUUID(),
      requestId: input.requestId,
      frequency: input.frequency,
      interval: input.interval,
      daysOfWeek: input.daysOfWeek,
      startDate: input.startDate,
      endDate: input.endDate,
      startTime: input.startTime,
      durationMinutes: input.durationMinutes,
      location: input.location,
      createdBy: input.createdBy,
      createdAt: now,
    };
    this.series.set(entity.id, entity);
    return entity;
  }

  async getById(id: string): Promise<SessionSeries | null> {
    return this.series.get(id) ?? null;
  }

  async listByRequestId(requestId: string): Promise<SessionSeries[]> {
    return Array.from(this.series.values()).filter(s => s.requestId === requestId);
  }
}
