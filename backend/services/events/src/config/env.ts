export interface EventsEnv {
  readonly port: number;
  readonly nodeEnv: string;
  readonly dbHost: string;
  readonly dbPort: number;
  readonly dbName: string;
  readonly dbUser: string;
  readonly dbPassword: string;
  readonly dbSsl: boolean;
}

export function loadEventsEnv(source: NodeJS.ProcessEnv = process.env): EventsEnv {
  try {
    if (typeof process.loadEnvFile === "function") {
      process.loadEnvFile(".env");
    }
  } catch {
    // Ignore if file doesn't exist
  }

  const portRaw = source.PORT ?? "3106";
  const port = Number(portRaw);

  if (!Number.isInteger(port) || port <= 0) {
    throw new Error(`Invalid PORT value: ${portRaw}`);
  }

  const dbHost = source.DB_HOST;
  if (!dbHost) {
    throw new Error("DB_HOST is required");
  }

  const dbPortRaw = source.DB_PORT ?? "5432";
  const dbPort = Number(dbPortRaw);
  if (!Number.isInteger(dbPort) || dbPort <= 0) {
    throw new Error(`Invalid DB_PORT value: ${dbPortRaw}`);
  }

  const dbName = source.DB_NAME ?? "postgres";
  const dbUser = source.DB_USER;
  if (!dbUser) {
    throw new Error("DB_USER is required");
  }

  const dbPassword = source.DB_PASSWORD;
  if (!dbPassword) {
    throw new Error("DB_PASSWORD is required");
  }

  const dbSsl = source.DB_SSL === "true" || source.DB_SSL === "1";

  return {
    port,
    nodeEnv: source.NODE_ENV ?? "development",
    dbHost,
    dbPort,
    dbName,
    dbUser,
    dbPassword,
    dbSsl,
  };
}
