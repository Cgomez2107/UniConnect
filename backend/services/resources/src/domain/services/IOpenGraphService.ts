export interface OGResult {
  readonly ogTitle: string | null;
  readonly ogDescription: string | null;
  readonly ogImage: string | null;
}

export interface IOpenGraphService {
  scrape(url: string): Promise<OGResult>;
  getCacheStats(): { size: number; hits: number; misses: number };
}
