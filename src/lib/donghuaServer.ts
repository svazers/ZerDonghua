import { DonghubScraper } from '../../server/donghubScraper';
import { AnichinScraper } from '../../server/anichinScraper';
import {
  FALLBACK_HOME,
  FALLBACK_SCHEDULE,
  getFallbackDetail,
  getFallbackEpisode,
} from '../../server/donghuaFallback';
import { normalizeMirrors } from './mirrors';

const scraper = new DonghubScraper();
const anichin = new AnichinScraper();
const REMOTE_API_BASE = 'https://api.alfisy.my.id/api/anime/donghub';

// Anichin returns url/thumbnail instead of link/cover, and titles are doubled.
// Normalize to the schema the frontend expects: link, cover, slug, seriesTitle.
function normalizeAnichinCard(item: any): any {
  if (!item) return item;
  const link = item.url || item.link || '';
  const cover = item.thumbnail || item.cover || '';
  const title = (item.title || '').replace(/(.+?)\s*\1/, '$1').trim();
  const slug =
    (item.slug as string) ||
    link.replace(/^https?:\/\/[^/]+\/(?:seri\/)?/, '').replace(/\/+$/, '');
  const seriesTitle = item.seriesTitle || title.replace(/\s*Episode\s*\d+.*/i, '').trim();
  return {
    ...item,
    title,
    link,
    cover,
    slug,
    seriesTitle,
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

// In-memory cache so we don't hammer the upstream API on every request.
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

async function fetchFromRemoteApi(params: Record<string, string>): Promise<any> {
  const url = new URL(REMOTE_API_BASE);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, value);
    }
  }

  const response = await fetch(url.toString(), {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
      Accept: 'application/json, text/plain, */*',
    },
  });

  if (!response.ok) {
    throw new Error(`Remote API returned HTTP ${response.status}`);
  }

  const json = await response.json();
  if (!json || json.status === false) {
    throw new Error(json?.message || 'Remote API returned failure status');
  }

  return json.data;
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
        console.warn('anichin getHome failed, trying remote API:', anichinErr);
        try {
          result = await fetchFromRemoteApi({ action: 'home' });
          if (result && result.donghuaBaru && Array.isArray(result.donghuaBaru)) {
            const coverMap = new Map<string, string>();
            if (result.latestRelease && Array.isArray(result.latestRelease)) {
              for (const lr of result.latestRelease) {
                if (lr.slug && lr.cover) coverMap.set(lr.slug, lr.cover);
                if (lr.title && lr.cover) coverMap.set(lr.title.toLowerCase().trim(), lr.cover);
                if (lr.seriesTitle && lr.cover)
                  coverMap.set(lr.seriesTitle.toLowerCase().trim(), lr.cover);
              }
            }
            if (result.recommendations && Array.isArray(result.recommendations)) {
              for (const rec of result.recommendations) {
                if (rec.slug && rec.cover) coverMap.set(rec.slug, rec.cover);
                if (rec.title && rec.cover) coverMap.set(rec.title.toLowerCase().trim(), rec.cover);
              }
            }
            if (result.popularToday && Array.isArray(result.popularToday)) {
              for (const pop of result.popularToday) {
                if (pop.slug && pop.cover) coverMap.set(pop.slug, pop.cover);
                if (pop.title && pop.cover) coverMap.set(pop.title.toLowerCase().trim(), pop.cover);
              }
            }

            result.donghuaBaru = result.donghuaBaru.map((item: any) => {
              let cover = item.cover || '';
              if (!cover && item.slug && coverMap.has(item.slug)) {
                cover = coverMap.get(item.slug)!;
              }
              if (!cover && item.title) {
                const titleLower = item.title.toLowerCase().trim();
                for (const [key, val] of coverMap.entries()) {
                  if (titleLower.includes(key) || key.includes(titleLower)) {
                    cover = val;
                    break;
                  }
                }
              }
              return {
                ...item,
                cover:
                  cover || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&q=80',
                type: '3D Ongoing',
                status: 'Ongoing',
                subStatus: 'Sub Indo',
                hot: true,
              };
            });
          }
        } catch (apiErr) {
          console.warn('Remote API getHome failed, trying donghub scraper:', apiErr);
          try {
            result = await scraper.getHome();
          } catch (scrapeErr) {
            console.warn('donghub scraper getHome failed, using static fallback:', scrapeErr);
            result = FALLBACK_HOME;
          }
        }
      }
      break;
    }
    case 'schedule': {
      try {
        result = await anichin.getAnichinSchedule();
      } catch (anichinErr) {
        console.warn('anichin schedule failed, trying remote API:', anichinErr);
        try {
          result = await fetchFromRemoteApi({ action: 'schedule' });
        } catch (apiErr) {
          try {
            result = await scraper.getSchedule();
          } catch (scrapeErr) {
            result = FALLBACK_SCHEDULE;
          }
        }
      }
      break;
    }
    case 'detail': {
      const slug = query.slug || '';
      if (!slug) throw new Error('Parameter slug diperlukan untuk action detail');
      const cleanSlug = slug.replace(/^https?:\/\/[^\/]+\//, '').replace(/\/+$/, '');

      try {
        result = await fetchFromRemoteApi({ action: 'detail', slug: cleanSlug });
        if (!result || !result.episodes || result.episodes.length === 0) {
          let seriesSlugResolved: string | null = null;
          try {
            const epData = await fetchFromRemoteApi({ action: 'episode', slug: cleanSlug });
            if (epData?.series?.slug) {
              seriesSlugResolved = epData.series.slug;
            } else if (epData?.series?.link) {
              seriesSlugResolved = epData.series.link
                .replace(/^https?:\/\/[^\/]+\//, '')
                .replace(/\/+$/, '');
            }
          } catch {
            /* ignore */
          }

          if (!seriesSlugResolved || seriesSlugResolved === cleanSlug) {
            const stripped = cleanSlug
              .replace(/-episode-\d+.*$/i, '')
              .replace(/-subtitle-indonesia.*$/i, '')
              .replace(/-sub-indo.*$/i, '');
            if (stripped && stripped !== cleanSlug) {
              seriesSlugResolved = stripped;
            }
          }

          if (seriesSlugResolved && seriesSlugResolved !== cleanSlug) {
            try {
              const seriesDetail = await fetchFromRemoteApi({
                action: 'detail',
                slug: seriesSlugResolved,
              });
              if (seriesDetail && seriesDetail.episodes && seriesDetail.episodes.length > 0) {
                result = seriesDetail;
              }
            } catch (seriesErr) {
              console.warn(`Could not fetch detail for resolved series ${seriesSlugResolved}:`, seriesErr);
            }
          }
        }
      } catch (apiErr) {
        try {
          result = await anichin.getAnichinDetail(cleanSlug);
        } catch (anichinErr) {
          try {
            result = await scraper.getDetail(cleanSlug);
          } catch (scrapeErr) {
            result = getFallbackDetail(cleanSlug);
          }
        }
      }
      break;
    }
    case 'episode': {
      const slug = query.slug || '';
      if (!slug) throw new Error('Parameter slug diperlukan untuk action episode');

      try {
        result = await fetchFromRemoteApi({ action: 'episode', slug });
        if (!result || !result.mirrors || result.mirrors.length === 0) {
          try {
            const cleanSeriesSlug = slug.replace(/^https?:\/\/[^\/]+\//, '').replace(/\/+$/, '');
            const detailData = await fetchFromRemoteApi({ action: 'detail', slug: cleanSeriesSlug });
            if (detailData && detailData.episodes && detailData.episodes.length > 0) {
              const targetEp = detailData.episodes[0];
              const epSlug = targetEp.slug || targetEp.link || '';
              if (epSlug) {
                result = await fetchFromRemoteApi({ action: 'episode', slug: epSlug });
              }
            }
          } catch (resolveErr) {
            console.warn('Could not auto-resolve series to episode:', resolveErr);
          }
        }
      } catch (apiErr) {
        try {
          result = await anichin.getAnichinStream(slug);
        } catch (anichinErr) {
          try {
            result = await scraper.getEpisode(slug);
          } catch (scrapeErr) {
            result = getFallbackEpisode(slug);
          }
        }
      }

      if (result && result.mirrors && Array.isArray(result.mirrors)) {
        result.mirrors = normalizeMirrors(result.mirrors);

        // Preferred server order: Dtube (lightest) first, then OKRU, then Dailymotion.
        // Dtube becomes the default selected mirror in the watch modal.
        const SERVER_ORDER = ['dtube', 'okru', 'dailymotion'];
        result.mirrors.sort((a: any, b: any) => {
          const rank = (m: any) => {
            const idx = SERVER_ORDER.findIndex((k) =>
              (m.name || '').toLowerCase().includes(k)
            );
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
      } catch (anichinErr) {
        console.warn('anichin search failed, trying remote API:', anichinErr);
        try {
          result = await fetchFromRemoteApi({ action: 'search', query: queryStr, page });
        } catch (apiErr) {
          try {
            result = await scraper.search(queryStr, Number(page));
          } catch (scrapeErr) {
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
        }
      }
      break;
    }
    case 'genre': {
      const genre = query.genre || '';
      const page = String(query.page || 1);
      if (!genre) throw new Error('Parameter genre diperlukan untuk action genre');
      // Anichin doesn't have per-genre pages; try remote API → donghub scraper → fallback
      try {
        result = await fetchFromRemoteApi({ action: 'genre', genre, page });
      } catch (apiErr) {
        try {
          result = await scraper.getDonghuaByGenre(genre, Number(page));
        } catch (scrapeErr) {
          result = {
            results: FALLBACK_HOME.popularToday,
            pagination: { currentPage: 1, totalPages: 1, hasNextPage: false },
          };
        }
      }
      break;
    }
    case 'genres': {
      try {
        result = await anichin.getAnichinGenres();
        if (!result || result.length === 0) throw new Error('anichin genres empty');
      } catch (anichinErr) {
        console.warn('anichin genres failed, trying remote API:', anichinErr);
        try {
          result = await fetchFromRemoteApi({ action: 'genres' });
        } catch (apiErr) {
          try {
            result = await scraper.getGenres();
          } catch (scrapeErr) {
            result = FALLBACK_HOME.genres;
          }
        }
      }
      break;
    }
    default:
      throw new Error(`Action ${action} tidak ditemukan`);
  }

  if (result) setCached(cacheKey, result);
  return result;
}
