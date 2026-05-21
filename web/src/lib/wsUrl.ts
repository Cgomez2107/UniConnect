const VITE_WS_URL = import.meta.env.VITE_WS_URL;

const VITE_API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1";

function deriveWsUrlFromApiUrl(apiUrl: string): string {
  const base = apiUrl.replace(/\/api\/v1\/?$/, "");
  return base.replace(/^https:/, "wss:").replace(/^http:/, "ws:");
}

export function getWsUrl(): string {
  return VITE_WS_URL || deriveWsUrlFromApiUrl(VITE_API_URL);
}
