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

export interface GatewayEnv {
  readonly port: number;
  readonly nodeEnv: string;
  readonly studyGroupsBaseUrl: string;
  readonly resourcesBaseUrl: string;
  readonly messagingBaseUrl: string;
  readonly profilesCatalogBaseUrl: string;
  readonly eventsBaseUrl: string;
  readonly authBaseUrl: string;
  readonly jwtAccessSecret: string;
}

/**
 * Loads and validates gateway runtime settings from environment variables.
 * Fail-fast validation avoids booting with broken routing config.
 */
export function loadGatewayEnv(source: NodeJS.ProcessEnv = process.env): GatewayEnv {
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
  const studyGroupsBaseUrl = requireEnv(source, "STUDY_GROUPS_BASE_URL");
  const resourcesBaseUrl = requireEnv(source, "RESOURCES_BASE_URL");
  const messagingBaseUrl = requireEnv(source, "MESSAGING_BASE_URL");

  const port = Number(portRaw);
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error(`Invalid PORT value: ${portRaw}`);
  }

  const profilesCatalogBaseUrl = requireEnv(source, "PROFILES_CATALOG_BASE_URL");
  const eventsBaseUrl = requireEnv(source, "EVENTS_BASE_URL");
  const authBaseUrl = requireEnv(source, "AUTH_BASE_URL");
  const jwtAccessSecret = requireEnv(source, "JWT_ACCESS_SECRET");

  return {
    port,
    nodeEnv: requireEnv(source, "NODE_ENV"),
    studyGroupsBaseUrl,
    resourcesBaseUrl,
    messagingBaseUrl,
    profilesCatalogBaseUrl,
    eventsBaseUrl,
    authBaseUrl,
    jwtAccessSecret,
  };
}
