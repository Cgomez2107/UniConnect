import type { OGResult } from "../../domain/services/IOpenGraphService.js";
import type { IOpenGraphService } from "../../domain/services/IOpenGraphService.js";

interface CacheEntry {
  result: OGResult;
  timestamp: number;
}

export class OpenGraphService implements IOpenGraphService {
  private readonly cache: Map<string, CacheEntry> = new Map();
  private readonly ttlMs: number;
  private hits = 0;
  private misses = 0;

  constructor(ttlMs?: number) {
    this.ttlMs = (ttlMs ?? Number(process.env.OG_CACHE_TTL_MS)) || 3_600_000;
  }

  async scrape(url: string): Promise<OGResult> {
    const cached = this.cache.get(url);
    if (cached && Date.now() - cached.timestamp < this.ttlMs) {
      this.hits++;
      return cached.result;
    }

    this.misses++;
    const result = await this.fetchOG(url);

    this.cache.set(url, { result, timestamp: Date.now() });
    return result;
  }

  private async fetchOG(url: string): Promise<OGResult> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5_000);

    try {
      console.log(`[OpenGraphService] Fetching OG data for URL: ${url}`);
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": "UniConnect/1.0 (OpenGraph Scraper)",
          Accept: "text/html",
        },
      });

      if (!response.ok) {
        console.log(`[OpenGraphService] Response not OK: ${response.status} ${response.statusText}`);
        return { ogTitle: null, ogDescription: null, ogImage: null };
      }

      const html = await response.text();
      console.log(`[OpenGraphService] HTML fetched, length: ${html.length} chars`);

      const ogTitle = this.extract(html, "og:title");
      const ogDescription = this.extract(html, "og:description");
      const ogImage = this.extract(html, "og:image");

      console.log(`[OpenGraphService] Extracted - Title: ${ogTitle}, Description: ${ogDescription ? ogDescription.substring(0, 50) + '...' : null}, Image: ${ogImage}`);

      return {
        ogTitle,
        ogDescription,
        ogImage,
      };
    } catch (error) {
      console.error(`[OpenGraphService] Error fetching OG data for ${url}:`, error);
      return { ogTitle: null, ogDescription: null, ogImage: null };
    } finally {
      clearTimeout(timeout);
    }
  }

  private extract(html: string, property: string): string | null {
    const regex = new RegExp(
      `(?:property=["']${property}["'][^>]*content=["']([^"']+)["']|content=["']([^"']+)["'][^>]*property=["']${property}["'])`,
      "i",
    );
    const match = regex.exec(html);
    return match?.[1] ?? match?.[2] ?? null;
  }

  getCacheStats(): { size: number; hits: number; misses: number } {
    this.evictExpired();
    return { size: this.cache.size, hits: this.hits, misses: this.misses };
  }

  private evictExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache) {
      if (now - entry.timestamp >= this.ttlMs) {
        this.cache.delete(key);
      }
    }
  }
}
