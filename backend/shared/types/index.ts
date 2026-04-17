export interface HealthResponse {
  readonly service: string;
  readonly status: "ok" | "error";
  readonly timestamp: string;
}
