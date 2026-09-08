import {
  DonghuaHomeData,
  DonghuaDetail,
  DonghuaStreamData,
  DonghuaGenre,
  DonghuaCardItem
} from '../types';
import { normalizeMirrors } from '../lib/mirrors';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

// In-memory memoization cache & in-flight promise registry
const memoryCache = new Map<string, CacheEntry<any>>();
const inFlightPromises = new Map<string, Promise<any>>();

const DEFAULT_CACHE_TTL = 3 * 60 * 1000; // 3 minutes

function getCachedData<T>(key: string, ttl: number = DEFAULT_CACHE_TTL): T | null {
  const entry = memoryCache.get(key);
  if (entry && Date.now() - entry.timestamp < ttl) {
    return entry.data;
  }
  return null;
}

function setCachedData<T>(key: string, data: T): void {
  memoryCache.set(key, { data, timestamp: Date.now() });
}

async function fetchWithDeduplication<T>(
  cacheKey: string,
  fetcher: () => Promise<T>,
  ttl: number = DEFAULT_CACHE_TTL,
  bypassCache: boolean = false
): Promise<T> {
  if (!bypassCache) {
    const cached = getCachedData<T>(cacheKey, ttl);
    if (cached !== null) {
      return cached;
    }
  }

  // Deduplicate concurrent in-flight requests for the same key
  if (inFlightPromises.has(cacheKey)) {
    return inFlightPromises.get(cacheKey)!;
  }

  const promise = fetcher()
    .then((data) => {
      setCachedData(cacheKey, data);
      inFlightPromises.delete(cacheKey);
      return data;
    })
    .catch((err) => {
      inFlightPromises.delete(cacheKey);
      throw err;
    });

  inFlightPromises.set(cacheKey, promise);
  return promise;
}

// Only talks to the local /api/donghua server route.
// All upstream fetching (anichin.cafe) + static fallback lives server-side in
// donghuaServer.ts — the client never hits remote APIs directly.
async function safeFetchDonghua(params: Record<string, string>): Promise<any> {
  const searchParams = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) {
      searchParams.set(k, v);
    }
  }
  const queryString = searchParams.toString();

  const res = await fetch(`/api/donghua?${queryString}`);
  if (res.ok) {
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const json = await res.json();
      if (json && json.status !== false && json.data) {
        return json.data;
      }
    }
  }

  throw new Error(`Failed to load data for action: ${params.action || 'unknown'}`);
}

export const donghuaApi = {
  /**
   * Clears the in-memory memoization cache
   */
  clearCache(): void {
    memoryCache.clear();
    inFlightPromises.clear();
  },

  /**
   * Fetches home data with in-memory memoization, in-flight deduplication,
   * and complete section data enrichment.
   */
  async getHome(forceRefresh = false): Promise<DonghuaHomeData> {
    return fetchWithDeduplication<DonghuaHomeData>(
      'donghua_home_data',
      async () => {
        const data: DonghuaHomeData = await safeFetchDonghua({ action: 'home' });

        // Build a cover lookup table across sections to ensure every card has a cover image
        const coverLookup = new Map<string, string>();

        (data.latestRelease || []).forEach((item) => {
          if (item.slug && item.cover) coverLookup.set(item.slug, item.cover);
          if (item.title && item.cover) coverLookup.set(item.title.toLowerCase().trim(), item.cover);
        });

        (data.recommendations || []).forEach((item) => {
          if (item.slug && item.cover) coverLookup.set(item.slug, item.cover);
          if (item.title && item.cover) coverLookup.set(item.title.toLowerCase().trim(), item.cover);
        });

        (data.popularToday || []).forEach((item) => {
          if (item.slug && item.cover) coverLookup.set(item.slug, item.cover);
          if (item.title && item.cover) coverLookup.set(item.title.toLowerCase().trim(), item.cover);
        });

        // Ensure ongoing donghua (donghuaBaru) is completely populated
        const enrichedDonghuaBaru = (data.donghuaBaru || []).map((item) => {
          let cover = item.cover || '';
          if (!cover && item.slug && coverLookup.has(item.slug)) {
            cover = coverLookup.get(item.slug)!;
          }
          if (!cover && item.title) {
            const titleLower = item.title.toLowerCase().trim();
            for (const [key, val] of coverLookup.entries()) {
              if (titleLower.includes(key) || key.includes(titleLower)) {
                cover = val;
                break;
              }
            }
          }

          return {
            title: item.title,
            slug: item.slug,
            link: item.link,
            cover: cover || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&q=80',
            episode: item.episode || 'Ongoing',
            type: item.type || '3D Ongoing',
            status: item.status || 'Ongoing',
            subStatus: item.subStatus || 'Sub Indo',
            hot: true
          };
        });

        return {
          recommendations: data.recommendations || [],
          popularToday: data.popularToday || [],
          latestRelease: data.latestRelease || [],
          donghuaBaru: enrichedDonghuaBaru,
          donghuaPopular: data.donghuaPopular || {
            weekly: [],
            monthly: [],
            allTime: []
          },
          genres: data.genres || []
        };
      },
      DEFAULT_CACHE_TTL,
      forceRefresh
    );
  },

  async getSchedule(forceRefresh = false): Promise<Record<string, any[]>> {
    return fetchWithDeduplication(
      'donghua_schedule_data',
      async () => {
        const data = await safeFetchDonghua({ action: 'schedule' });
        return data || {};
      },
      5 * 60 * 1000, // 5 min cache
      forceRefresh
    );
  },

  async getDetail(slug: string): Promise<DonghuaDetail> {
    const cleanSlug = slug.replace(/^https?:\/\/[^\/]+\//, '').replace(/\/+$/, '');
    return fetchWithDeduplication(
      `donghua_detail_${cleanSlug}`,
      async () => {
        return await safeFetchDonghua({ action: 'detail', slug: cleanSlug });
      },
      5 * 60 * 1000
    );
  },

  async getEpisode(slug: string): Promise<DonghuaStreamData> {
    const cleanSlug = slug.replace(/^https?:\/\/[^\/]+\//, '').replace(/\/+$/, '');
    return fetchWithDeduplication(
      `donghua_episode_${cleanSlug}`,
      async () => {
        const data = await safeFetchDonghua({ action: 'episode', slug: cleanSlug });
        if (data && Array.isArray(data.mirrors)) {
          data.mirrors = normalizeMirrors(data.mirrors);
        }
        return data;
      },
      2 * 60 * 1000
    );
  },

  async search(query: string, page = 1): Promise<{ results: DonghuaCardItem[]; pagination: any }> {
    const queryKey = `donghua_search_${query.toLowerCase().trim()}_p${page}`;
    return fetchWithDeduplication(
      queryKey,
      async () => {
        return await safeFetchDonghua({ action: 'search', query, page: String(page) });
      },
      2 * 60 * 1000
    );
  },

  async getDonghuaByGenre(genre: string, page = 1): Promise<{ results: DonghuaCardItem[]; pagination: any }> {
    const genreKey = `donghua_genre_${genre.toLowerCase().trim()}_p${page}`;
    return fetchWithDeduplication(
      genreKey,
      async () => {
        return await safeFetchDonghua({ action: 'genre', genre, page: String(page) });
      },
      5 * 60 * 1000
    );
  },

  async getGenres(): Promise<DonghuaGenre[]> {
    return fetchWithDeduplication(
      'donghua_genres_list',
      async () => {
        const data = await safeFetchDonghua({ action: 'genres' });
        return data || [];
      },
      10 * 60 * 1000 // 10 minutes cache
    );
  }
};

