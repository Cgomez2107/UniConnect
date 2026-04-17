import { requireEnv } from "../../../../shared/libs/config/requiredEnv.js";

export interface StudyGroupsEnv {
  readonly port: number;
  readonly nodeEnv: string;
  readonly dbHost?: string;
  readonly dbPort?: number;
  readonly dbName?: string;
  readonly dbUser?: string;
  readonly dbPassword?: string;
  readonly dbSsl: boolean;
}

export function loadStudyGroupsEnv(source: NodeJS.ProcessEnv = process.env): StudyGroupsEnv {
  // Use native Node.js env loading as fallback/primary for reliability with tsx watch
  try {
    if (typeof process.loadEnvFile === 'function') {
      process.loadEnvFile('.env');
    }
  } catch (error) {
    // Ignore if file doesn't exist
  }

  const portRaw = requireEnv(source, "PORT");
  const port = Number(portRaw);

  if (!Number.isInteger(port) || port <= 0) {
    throw new Error(`Invalid PORT value: ${portRaw}`);
  }

  const dbPortRaw = source.DB_PORT;
  const parsedDbPort = dbPortRaw ? Number(dbPortRaw) : undefined;

  if (dbPortRaw && (typeof parsedDbPort !== "number" || !Number.isInteger(parsedDbPort) || parsedDbPort <= 0)) {
    throw new Error(`Invalid DB_PORT value: ${dbPortRaw}`);
  }

  return {
    port,
    nodeEnv: requireEnv(source, "NODE_ENV"),
    dbHost: requireEnv(source, "DB_HOST"),
    dbPort: parsedDbPort,
    dbName: requireEnv(source, "DB_NAME"),
    dbUser: requireEnv(source, "DB_USER"),
    dbPassword: requireEnv(source, "DB_PASSWORD"),
    dbSsl: source.DB_SSL === "true",
  };
}
