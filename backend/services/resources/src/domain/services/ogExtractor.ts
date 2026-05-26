import type { OgMetadata } from "../entities/StudyResource.js";

let ogScraper: ((options: { url: string }) => Promise<{ result: { ogTitle?: string; ogImage?: unknown; ogDescription?: string; success: boolean } }>) | null = null;

async function getOgScraper(): Promise<typeof ogScraper> {
  if (ogScraper) return ogScraper;
  try {
    const mod = await import("open-graph-scraper");
    ogScraper = mod.default as unknown as typeof ogScraper;
  } catch {
    ogScraper = null;
  }
  return ogScraper;
}

export async function extractOgMetadata(url: string): Promise<OgMetadata | null> {
  const scraper = await getOgScraper();
  if (!scraper) return null;

  try {
    const { result } = await scraper({ url });

    if (!result.success) return null;

    const ogImage = extractOgImage(result);

    return {
      ogTitle: result.ogTitle ?? undefined,
      ogImage: ogImage ?? undefined,
      ogDescription: result.ogDescription ?? undefined,
    };
  } catch {
    return null;
  }
}

function extractOgImage(result: Record<string, unknown>): string | undefined {
  const ogImage = result.ogImage;
  if (!ogImage) return undefined;

  if (typeof ogImage === "string") return ogImage;

  if (Array.isArray(ogImage)) {
    const first = ogImage[0];
    if (typeof first === "string") return first;
    if (first && typeof first === "object" && "url" in (first as object)) {
      return (first as { url: string }).url;
    }
    return undefined;
  }

  if (typeof ogImage === "object" && ogImage !== null && "url" in ogImage) {
    return (ogImage as { url: string }).url;
  }

  return undefined;
}
