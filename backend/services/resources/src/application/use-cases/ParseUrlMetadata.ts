export interface ParseUrlCommand {
  readonly url: string;
}

export interface ParsedMetadata {
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
}

export class ParseUrlMetadata {
  async execute(command: ParseUrlCommand): Promise<ParsedMetadata> {
    if (!command.url.trim()) {
      throw new Error("URL es obligatoria.");
    }

    const url = command.url.trim();

    try {
      new URL(url);
    } catch {
      throw new Error("La URL proporcionada no es válida.");
    }

    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; UniConnectBot/1.0; +https://uniconnect.app)",
          Accept: "text/html,application/xhtml+xml",
        },
        signal: AbortSignal.timeout(8000),
      });

      if (!response.ok) {
        return { ogTitle: null, ogDescription: null, ogImage: null };
      }

      const html = await response.text();

      return this.parseOpenGraph(html);
    } catch {
      return { ogTitle: null, ogDescription: null, ogImage: null };
    }
  }

  private parseOpenGraph(html: string): ParsedMetadata {
    const ogTitle = this.extractMetaContent(html, "og:title") ?? this.extractTitle(html);
    const ogDescription =
      this.extractMetaContent(html, "og:description") ??
      this.extractMetaContent(html, "description");
    const ogImage = this.extractMetaContent(html, "og:image");

    return {
      ogTitle: ogTitle ?? null,
      ogDescription: ogDescription ?? null,
      ogImage: ogImage ?? null,
    };
  }

  private extractMetaContent(html: string, property: string): string | undefined {
    const patterns = [
      new RegExp(`<meta\\s+property=["']${escapeRegex(property)}["']\\s+content=["']([^"']*)["']\\s*/?>`, "i"),
      new RegExp(`<meta\\s+content=["']([^"']*)["']\\s+property=["']${escapeRegex(property)}["']\\s*/?>`, "i"),
      new RegExp(`<meta\\s+name=["']${escapeRegex(property)}["']\\s+content=["']([^"']*)["']\\s*/?>`, "i"),
      new RegExp(`<meta\\s+content=["']([^"']*)["']\\s+name=["']${escapeRegex(property)}["']\\s*/?>`, "i"),
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match?.[1]) return decodeHtmlEntities(match[1]);
    }

    return undefined;
  }

  private extractTitle(html: string): string | undefined {
    const match = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    return match?.[1]?.trim() ? decodeHtmlEntities(match[1].trim()) : undefined;
  }
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#039;/g, "'")
    .replace(/&#(\d+);/g, (_match, dec) => String.fromCodePoint(Number(dec)));
}
