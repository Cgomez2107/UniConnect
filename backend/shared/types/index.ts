export interface HealthResponse {
  readonly status: "ok" | "error";
  readonly version: string;
}
