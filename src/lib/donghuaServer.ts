import { AnichinScraper } from '../../server/anichinScraper';
import {
  FALLBACK_HOME,
  FALLBACK_SCHEDULE,
  getFallbackDetail,
  getFallbackEpisode,
} from '../../server/donghuaFallback';
import { normalizeMirrors } from './mirrors';

const anichin = new AnichinScraper();

// Anichin returns url/thumbnail instead of link/cover, and titles are doubled.
// Normalize to the schema the frontend expects: link, cover, slug, seriesTitle.
function normalizeAnichinCard(item: any): any {
  if (!item) return item;
  const link = item.url || item.link || '';
  const cover = item.thumbnail || item.cover || '';
  const rawTitle = (item.title || '').replace(/(.+?)\s*\1/, '$1').trim();
  const slug = (item.slug as string) || link.replace(/^https?:\/\/[^/]+\/(?:seri\/)?/, '').replace(/\/+$/, '');
  const seriesTitle = item.seriesTitle || rawTitle.replace(/\s*Episode\s*\d+.*/i, '').trim();
  const subStatus = item.subStatus || 'Sub Indo';
  const episode = item.episode || '';
  const rankNum = item.rank != null ? Number(item.rank) : undefined;
  return {
    ...item,
    title: rawTitle,
    link,
    cover,
    slug,
    seriesTitle,
    episode,
    subStatus,
    type: item.type || '3D',
    status: item.status || 'Ongoing',
    hot: typeof item.hot === 'boolean' ? item.hot : !!item.rank,
    rating: item.rating || null,
    rank: rankNum,
    genres: Array.isArray(item.genres) && item.genres.length > 0
      ? item.genres.map((g: any) => typeof g === 'string' ? { name: g, link: '', slug: '' } : g)
      : [],
  };
}

function normalizeAnichinHome(anichinData: any): any {
  return {
    recommendations: (anichinData.recommendation || []).map(normalizeAnichinCard),
    popularToday: (anichinData.popularToday || []).map(normalizeAnichinCard),
    latestRelease: (anichinData.latest || []).map(normalizeAnichinCard),
    donghuaBaru: (anichinData.popularToday || []).map(normalizeAnichinCard),
    donghuaPopular: {
      weekly: (anichinData.leaderboard?.weekly || []).map(normalizeAnichinCard),
      monthly: (anichinData.leaderboard?.monthly || []).map(normalizeAnichinCard),
      allTime: (anichinData.leaderboard?.alltime || []).map(normalizeAnichinCard),
    },
    genres: [],
  };
}

function normalizeAnichinSearch(data: any): any {
  return {
    results: (data.results || []).map(normalizeAnichinCard),
    pagination: data.pagination,
  };
}

function normalizeAnichinDetail(data: any): any {
  return {
    title: data.title,
    cover: data.thumbnail || data.cover || '',
    synopsis: data.synopsis || '',
    metadata: data.metadata || {},
    genres: (data.genres || []).map((g: any) => ({
      name: g.name || g.link?.replace(/\/$/, '').split('/').pop() || '',
      link: g.link || '',
      slug: (g.slug as string) || g.link?.replace(/^https?:\/\/[^/]+\/genres\//, '').replace(/\/+$/, '') || '',
    })),
    episodes: (data.episodes || []).map((ep: any) => ({
      title: ep.title,
      link: ep.url || ep.link || '',
      slug: (ep.slug as string) || ep.url?.replace(/^https?:\/\/[^/]+\//, '').replace(/\/+$/, '') || '',
      episodeNumber: ep.number || '',
      date: ep.date || '',
      subStatus: 'Sub Indo',
    })),
    recommended: [],
    url: data.url,
  };
}

function normalizeAnichinSchedule(data: Record<string, any[]>): Record<string, any[]> {
  const out: Record<string, any[]> = {};
  for (const [day, items] of Object.entries(data)) {
    out[day] = (items || []).map((item: any) => {
      const link = item.url || item.link || '';
      const cover = item.thumbnail || item.cover || '';
      const slug = (item.slug as string) || link.replace(/^https?:\/\/[^/]+\/(?:seri\/)?/, '').replace(/\/+$/, '');
      return {
        ...item,
        link,
        cover,
        slug,
      };
    });
  }
  return out;
}

// In-memory cache so we don't hammer anichin on every request.
const cache = new Map<string, { timestamp: number; data: any }>();
const CACHE_TTL_MS = 2 * 60 * 1000;

function getCached(key: string) {
  const item = cache.get(key);
  if (item && Date.now() - item.timestamp < CACHE_TTL_MS) {
    return item.data;
  }
  return null;
}

function setCached(key: string, data: any) {
  cache.set(key, { timestamp: Date.now(), data });
}

// Helper: strip URL to slug and optionally strip episode suffix for series resolution.
function toSlug(slugOrUrl: string): string {
  return slugOrUrl.replace(/^https?:\/\/[^/]+\/(?:seri\/)?/, '').replace(/\/+$/, '');
}

function toSeriesSlug(slug: string): string {
  return slug
    .replace(/-episode-\d+.*$/i, '')
    .replace(/-subtitle-indonesia.*$/i, '')
    .replace(/-sub-indo.*$/i, '');
}

export async function getDonghua(
  action: string,
  query: Record<string, string> = {}
): Promise<any> {
  const cacheKey = `donghua:${action}:${JSON.stringify(query)}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  let result: any = null;

  switch (action) {
    case 'home': {
      try {
        const anichinData = await anichin.getAnichinHome();
        result = normalizeAnichinHome(anichinData);
      } catch (anichinErr) {
        console.warn('anichin getHome failed, using static fallback:', anichinErr);
        result = FALLBACK_HOME;
      }
      break;
    }
    case 'schedule': {
      try {
        const anichinSchedule = await anichin.getAnichinSchedule();
        result = normalizeAnichinSchedule(anichinSchedule);
      } catch (anichinErr) {
        console.warn('anichin schedule failed, using static fallback:', anichinErr);
        result = FALLBACK_SCHEDULE;
      }
      break;
    }
    case 'detail': {
      const slug = query.slug || '';
      if (!slug) throw new Error('Parameter slug diperlukan untuk action detail');
      const cleanSlug = toSlug(slug);

      try {
        const anichinDetail = await anichin.getAnichinDetail(cleanSlug);
        result = normalizeAnichinDetail(anichinDetail);
        if (!result.episodes || result.episodes.length === 0) {
          // Episode slug passed but no episodes — try resolving to series
          const seriesSlug = toSeriesSlug(cleanSlug);
          if (seriesSlug && seriesSlug !== cleanSlug) {
            const seriesDetail = await anichin.getAnichinDetail(seriesSlug);
            result = normalizeAnichinDetail(seriesDetail);
          }
        }
      } catch (anichinErr) {
        console.warn('anichin detail failed, using static fallback:', anichinErr);
        result = getFallbackDetail(cleanSlug);
      }
      break;
    }
    case 'episode': {
      const slug = query.slug || '';
      if (!slug) throw new Error('Parameter slug diperlukan untuk action episode');
      const cleanSlug = toSlug(slug);

      try {
        result = await anichin.getAnichinStream(cleanSlug);
        if (!result.mirrors || result.mirrors.length === 0) throw new Error('anichin stream empty');
      } catch (anichinErr) {
        console.warn('anichin stream failed, trying series detail for episode resolution:', anichinErr);
        try {
          const seriesSlug = toSeriesSlug(cleanSlug);
          if (seriesSlug && seriesSlug !== cleanSlug) {
            result = await anichin.getAnichinStream(`${seriesSlug}-episode-${cleanSlug.match(/episode-(\d+)/i)?.[1] || 1}-subtitle-indonesia`);
            if (!result.mirrors || result.mirrors.length === 0) throw new Error('anichin stream empty');
          } else {
            throw new Error('Cannot resolve series from episode slug');
          }
        } catch (resolveErr) {
          console.warn('Could not resolve episode, using fallback:', resolveErr);
          result = getFallbackEpisode(cleanSlug);
        }
      }

      if (result && result.mirrors && Array.isArray(result.mirrors)) {
        result.mirrors = normalizeMirrors(result.mirrors);
        const SERVER_ORDER = ['dtube', 'okru', 'dailymotion'];
        result.mirrors.sort((a: any, b: any) => {
          const rank = (m: any) => {
            const idx = SERVER_ORDER.findIndex((k) => (m.name || '').toLowerCase().includes(k));
            return idx === -1 ? SERVER_ORDER.length : idx;
          };
          return rank(a) - rank(b);
        });
      }
      break;
    }
    case 'search': {
      const queryStr = query.query || '';
      const page = String(query.page || 1);
      if (!queryStr) throw new Error('Parameter query diperlukan untuk action search');
      try {
        const anichinResult = await anichin.getAnichinSearch(queryStr, Number(page));
        result = normalizeAnichinSearch(anichinResult);
        if (!result.results || result.results.length === 0) {
          throw new Error('anichin search empty');
        }
      } catch (anichinErr) {
        console.warn('anichin search failed, using static fallback:', anichinErr);
        const filtered = FALLBACK_HOME.popularToday.filter(
          (item: any) =>
            item.title.toLowerCase().includes(queryStr.toLowerCase()) ||
            item.seriesTitle?.toLowerCase().includes(queryStr.toLowerCase())
        );
        result = {
          results: filtered,
          pagination: { currentPage: 1, totalPages: 1, hasNextPage: false },
        };
      }
      break;
    }
    case 'genre': {
      const genre = query.genre || '';
      const page = String(query.page || 1);
      if (!genre) throw new Error('Parameter genre diperlukan untuk action genre');
      // Try Anichin's genre page first, then search as fallback within anichin.
      try {
        const anichinResult = await anichin.getAnichinGenrePage(genre, Number(page));
        result = normalizeAnichinSearch(anichinResult);
        if (!result.results || result.results.length === 0) {
          const searchResult = await anichin.getAnichinSearch(genre, Number(page));
          result = normalizeAnichinSearch(searchResult);
          if (!result.results || result.results.length === 0) throw new Error('anichin genre empty');
        }
      } catch (anichinErr) {
        console.warn('anichin genre failed, using static fallback:', anichinErr);
        result = {
          results: FALLBACK_HOME.popularToday,
          pagination: { currentPage: 1, totalPages: 1, hasNextPage: false },
        };
      }
      break;
    }
    case 'genres': {
      try {
        result = await anichin.getAnichinGenres();
        if (!result || result.length === 0) throw new Error('anichin genres empty');
      } catch (anichinErr) {
        console.warn('anichin genres failed, using static fallback:', anichinErr);
        result = FALLBACK_HOME.genres;
      }
      break;
    }
    default:
      throw new Error(`Action ${action} tidak ditemukan`);
  }

  if (result) setCached(cacheKey, result);
  return result;
}
