export interface UpdateAvailabilityDto {
  readonly status: "confirmed" | "declined";
  readonly userName?: string;
}
