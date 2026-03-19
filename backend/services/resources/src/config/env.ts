export interface ResourcesEnv {
  readonly port: number;
  readonly nodeEnv: string;
  readonly dbHost?: string;
  readonly dbPort?: number;
  readonly dbName?: string;
  readonly dbUser?: string;
  readonly dbPassword?: string;
  readonly dbSsl: boolean;
  readonly supabaseUrl?: string;
  readonly supabaseServiceRoleKey?: string;
}

export function loadResourcesEnv(source: NodeJS.ProcessEnv = process.env): ResourcesEnv {
  try {
    if (typeof process.loadEnvFile === "function") {
      process.loadEnvFile(".env");
    }
  } catch {
    // Ignore missing .env file
  }

  const portRaw = source.PORT ?? "3103";
  const port = Number(portRaw);

  if (!Number.isInteger(port) || port <= 0) {
    throw new Error(`Invalid PORT value: ${portRaw}`);
  }

  const dbPortRaw = source.DB_PORT;
  const parsedDbPort = dbPortRaw ? Number(dbPortRaw) : undefined;

  if (
    dbPortRaw &&
    (typeof parsedDbPort !== "number" || !Number.isInteger(parsedDbPort) || parsedDbPort <= 0)
  ) {
    throw new Error(`Invalid DB_PORT value: ${dbPortRaw}`);
  }

  return {
    port,
    nodeEnv: source.NODE_ENV ?? "development",
    dbHost: source.DB_HOST,
    dbPort: parsedDbPort,
    dbName: source.DB_NAME,
    dbUser: source.DB_USER,
    dbPassword: source.DB_PASSWORD,
    dbSsl: source.DB_SSL === "true",
    supabaseUrl: source.SUPABASE_URL,
    supabaseServiceRoleKey: source.SUPABASE_SERVICE_ROLE_KEY,
  };
}
