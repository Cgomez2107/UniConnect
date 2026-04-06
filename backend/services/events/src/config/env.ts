import { requireEnv } from "../../../../shared/libs/config/requiredEnv.js";

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

  const portRaw = requireEnv(source, "PORT");
  const port = Number(portRaw);

  if (!Number.isInteger(port) || port <= 0) {
    throw new Error(`Invalid PORT value: ${portRaw}`);
  }

  const dbHost = requireEnv(source, "DB_HOST");

  const dbPortRaw = requireEnv(source, "DB_PORT");
  const dbPort = Number(dbPortRaw);
  if (!Number.isInteger(dbPort) || dbPort <= 0) {
    throw new Error(`Invalid DB_PORT value: ${dbPortRaw}`);
  }

  const dbName = requireEnv(source, "DB_NAME");
  const dbUser = requireEnv(source, "DB_USER");
  const dbPassword = requireEnv(source, "DB_PASSWORD");

  const dbSsl = source.DB_SSL === "true" || source.DB_SSL === "1";

  return {
    port,
    nodeEnv: requireEnv(source, "NODE_ENV"),
    dbHost,
    dbPort,
    dbName,
    dbUser,
    dbPassword,
    dbSsl,
  };
}
