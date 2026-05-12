import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { requireEnv } from "../../../../shared/libs/config/requiredEnv.js";

function loadEnvFileFallback(): void {
  const envPath = resolve(process.cwd(), ".env");
  if (!existsSync(envPath)) return;
  const content = readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

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
    } else {
      loadEnvFileFallback();
    }
  } catch (error) {
    loadEnvFileFallback();
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
