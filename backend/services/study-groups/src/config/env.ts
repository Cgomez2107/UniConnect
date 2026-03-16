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
  const portRaw = source.PORT ?? "3101";
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
    nodeEnv: source.NODE_ENV ?? "development",
    dbHost: source.DB_HOST,
    dbPort: parsedDbPort,
    dbName: source.DB_NAME,
    dbUser: source.DB_USER,
    dbPassword: source.DB_PASSWORD,
    dbSsl: source.DB_SSL === "true",
  };
}
