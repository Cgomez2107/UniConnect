import type { ResourcesEnv } from "../../config/env.js";

function extractResourcesStoragePath(fileUrl: string): string | null {
  const marker = "/storage/v1/object/public/resources/";
  const markerIndex = fileUrl.indexOf(marker);
  if (markerIndex < 0) {
    return null;
  }

  const rawPath = fileUrl.slice(markerIndex + marker.length).trim();
  if (!rawPath) {
    return null;
  }

  return rawPath.split("?")[0];
}

export class SupabaseStorageCleaner {
  constructor(private readonly env: ResourcesEnv) {}

  async deletePublicResource(fileUrl: string): Promise<void> {
    if (!this.env.supabaseUrl || !this.env.supabaseServiceRoleKey) {
      return;
    }

    const path = extractResourcesStoragePath(fileUrl);
    if (!path) {
      return;
    }

    const encodedPath = path
      .split("/")
      .map((segment) => encodeURIComponent(segment))
      .join("/");

    const endpoint = `${this.env.supabaseUrl}/storage/v1/object/resources/${encodedPath}`;

    const response = await fetch(endpoint, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${this.env.supabaseServiceRoleKey}`,
        apikey: this.env.supabaseServiceRoleKey,
      },
    });

    if (!response.ok && (response.status === 400 || response.status === 404)) {
      // Some Supabase Storage deployments return 400 for non-existing/invalid paths.
      return;
    }

    if (!response.ok) {
      throw new Error(`Storage cleanup failed with status ${response.status}`);
    }
  }
}
