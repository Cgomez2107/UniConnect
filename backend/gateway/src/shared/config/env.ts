export interface GatewayEnv {
  readonly port: number;
  readonly nodeEnv: string;
  readonly studyGroupsBaseUrl: string;
  readonly resourcesBaseUrl: string;
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

  const portRaw = source.PORT ?? "3000";
  const studyGroupsBaseUrl = source.STUDY_GROUPS_BASE_URL;
  const resourcesBaseUrl = source.RESOURCES_BASE_URL;

  const port = Number(portRaw);
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error(`Invalid PORT value: ${portRaw}`);
  }

  if (!studyGroupsBaseUrl) {
    throw new Error("STUDY_GROUPS_BASE_URL is required");
  }

  if (!resourcesBaseUrl) {
    throw new Error("RESOURCES_BASE_URL is required");
  }

  return {
    port,
    nodeEnv: source.NODE_ENV ?? "development",
    studyGroupsBaseUrl,
    resourcesBaseUrl,
  };
}
