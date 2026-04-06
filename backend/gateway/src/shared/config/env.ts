import { requireEnv } from "../../../../shared/libs/config/requiredEnv.js";

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
    }
  } catch (error) {
    // Ignore if file doesn't exist
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
