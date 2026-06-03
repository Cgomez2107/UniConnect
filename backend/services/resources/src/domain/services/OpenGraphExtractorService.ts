import { extractOgMetadata } from "./ogExtractor.js";
import type { OgMetadata } from "../entities/StudyResource.js";

export class OpenGraphExtractorService {
  async extract(url: string): Promise<OgMetadata | null> {
    if (!url || !url.trim()) return null;

    try {
      const parsedUrl = new URL(url);
      if (!["http:", "https:"].includes(parsedUrl.protocol)) return null;
    } catch {
      return null;
    }

    try {
      const metadata = await extractOgMetadata(url);
      return metadata;
    } catch {
      return null;
    }
  }
}
