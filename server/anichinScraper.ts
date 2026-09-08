import * as cheerio from 'cheerio';
import { DonghubScraper, Mirror, DonghuaEpisode } from './donghubScraper';
import { DonghuaStreamData } from '../src/types';

export interface AnichinHome {
  popularToday: any[];
  latest: any[];
  recommendation: any[];
  leaderboard: { weekly: any[]; monthly: any[]; alltime: any[] };
}

const BASE_URL = 'https://anichin.cafe';
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

function decodeBase64(str: string): string {
  try {
    return Buffer.from(str, 'base64').toString('utf-8');
  } catch {
    return str;
  }
}

// Reuses the same header/proxy fallback strategy as DonghubScraper by
// extending it — anichin needs identical spoofing logic.
export class AnichinScraper extends DonghubScraper {
  constructor() {
    super();
    // Override baseUrl and headers to target anichin.
    // Must reset headers with anichin Referer, not inherit donghub's.
    this.baseUrl = BASE_URL;
    this.headers = {
      'User-Agent': USER_AGENT,
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
      Referer: 'https://anichin.cafe/',
    };
  }

  private async fetchAnichinHtml(url: string): Promise<string> {
    // Reuse DonghubScraper's spoofing + proxy-fallback via fetchHtml,
    // but with Anichin-specific headers already set above.
    return await this.fetchHtml(url);
  }

  private parseCard($: any, el: any) {
    const a = $(el).find('a');
    const link = a.attr('href') || '';
    const rawTitle =
      $(el).find('.tt h2, .tt').first().text().trim() ||
      $(el).find('.title').text().trim();
    const title = rawTitle.split('\n')[0].replace(/\t+/g, ' ').trim();
    const episode = $(el).find('.bt .epx').text().trim();
    const type = $(el).find('.typez').text().trim();
    const thumbnail =
      $(el).find('img').attr('src') ||
      $(el).find('img').attr('data-src') ||
      null;
    if (!link || !title) return null;
    return { title, episode, type, thumbnail, url: link };
  }

  async getAnichinHome(): Promise<AnichinHome> {
    const html = await this.fetchAnichinHtml(`${BASE_URL}/`);
    const $ = cheerio.load(html);

    const parseCard = (el: any) => this.parseCard($, el);

    const popularToday: any[] = [];
    $('.releases.hothome').parent().find('.bsx').each((_, el) => {
      const c = parseCard(el);
      if (c) popularToday.push(c);
    });

    const latest: any[] = [];
    $('.releases:contains("Latest Release")')
      .closest('.bixbox')
      .find('.bsx')
      .each((_, el) => {
        const c = parseCard(el);
        if (c) latest.push(c);
      });

    const recommendation: any[] = [];
    $('.releases:contains("Recommendation")')
      .closest('.bixbox')
      .find('.bsx')
      .each((_, el) => {
        const a = $(el).find('a');
        const link = a.attr('href') || '';
        const rawTitle =
          $(el).find('.tt h2, .tt').first().text().trim() ||
          $(el).find('.title').text().trim();
        const title = rawTitle.split('\n')[0].replace(/\t+/g, ' ').trim();
        const status = $(el).find('.bt .epx').text().trim();
        const type = $(el).find('.typez').text().trim();
        const thumbnail =
          $(el).find('img').attr('src') ||
          $(el).find('img').attr('data-src') ||
          null;
        if (link && title) {
          recommendation.push({ title, status, type, thumbnail, url: link });
        }
      });

    const parsePopularTab = (tabClass: string) => {
      const items: any[] = [];
      $(tabClass)
        .find('li')
        .each((_, el) => {
          const rank = $(el).find('.ctr').text().trim();
          const title = $(el)
            .find('.leftseries h4 a, .leftseries h4')
            .first()
            .text()
            .trim();
          const link =
            $(el).find('.leftseries h4 a').attr('href') ||
            $(el).find('a').attr('href') ||
            '';
          const thumbnail =
            $(el).find('img').attr('src') ||
            $(el).find('img').attr('data-src') ||
            null;
          const rating = $(el).find('.numscore').text().trim() || null;
          const genres: string[] = [];
          $(el).find('.leftseries span a').each((_, g) => {
            genres.push($(g).text().trim());
          });
          if (title && link) {
            items.push({ rank, title, rating, genres, thumbnail, url: link });
          }
        });
      return items;
    };

    const leaderboard = {
      weekly: parsePopularTab('.wpop-weekly'),
      monthly: parsePopularTab('.wpop-monthly'),
      alltime: parsePopularTab('.wpop-alltime'),
    };

    return { popularToday, latest, recommendation, leaderboard };
  }

  async getAnichinSchedule(): Promise<Record<string, any[]>> {
    const html = await this.fetchAnichinHtml(`${BASE_URL}/schedule/`);
    const $ = cheerio.load(html);
    const schedule: Record<string, any[]> = {};

    $('.schedulepage').each((_, el) => {
      const day = $(el).find('.releases h3, h3').first().text().trim();
      if (!day) return;
      const items: any[] = [];
      $(el)
        .find('.bsx')
        .each((_, itemEl) => {
          const a = $(itemEl).find('a');
          const link = a.attr('href') || '';
          const rawTitle =
            $(itemEl).find('.tt h2, .tt').first().text().trim() ||
            $(itemEl).find('.title').text().trim();
          const title = rawTitle.split('\n')[0].replace(/\t+/g, ' ').trim();
          const time = $(itemEl).find('.bt .epx').text().trim();
          const thumbnail =
            $(itemEl).find('img').attr('src') ||
            $(itemEl).find('img').attr('data-src') ||
            null;
          if (link && title) {
            items.push({ title, time, thumbnail, url: link });
          }
        });
      schedule[day.toLowerCase()] = items;
    });

    return schedule;
  }

  async getAnichinDetail(urlOrSlug: string): Promise<any> {
    if (!urlOrSlug) {
      throw new Error('URL atau slug diperlukan');
    }
    const cleanUrl = urlOrSlug.startsWith('http')
      ? urlOrSlug.trim()
      : `${BASE_URL}/seri/${urlOrSlug.replace(/^\/+|\/+$/g, '')}/`;

    const html = await this.fetchAnichinHtml(cleanUrl);
    const $ = cheerio.load(html);

    const title = $('h1.entry-title').text().trim();
    if (!title) {
      throw new Error('Data nicht gefunden');
    }

    const thumbnail =
      $('.thumb img').attr('src') ||
      $('.thumb img').attr('data-src') ||
      $('meta[property="og:image"]').attr('content') ||
      null;
    const synopsis = $('.entry-content p, .synp .entry-content').text().trim();
    const rating = $('.rating strong, .num').first().text().trim() || null;

    const genres: any[] = [];
    $('.genxed a').each((_, el) => {
      genres.push({ name: $(el).text().trim(), link: $(el).attr('href') || '' });
    });

    const metadata: Record<string, string> = {};
    $('.info-content .spe span').each((_, el) => {
      const text = $(el).text().trim();
      const parts = text.split(':');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const val = parts.slice(1).join(':').trim();
        metadata[key] = val;
      }
    });

    const episodes: any[] = [];
    $('.eplister li').each((_, el) => {
      const a = $(el).find('a');
      const epLink = a.attr('href') || '';
      const epNum = $(el).find('.epl-num').text().trim();
      const epTitle = $(el).find('.epl-title').text().trim();
      const epDate = $(el).find('.epl-date').text().trim();
      if (epLink) {
        episodes.push({ number: epNum, title: epTitle, date: epDate, url: epLink });
      }
    });

    return { title, thumbnail, synopsis, rating, genres, metadata, episodes, url: cleanUrl };
  }

  async getAnichinStream(episodeUrl: string): Promise<Partial<DonghuaStreamData>> {
    if (!episodeUrl) {
      throw new Error('URL episode diperlukan');
    }
    const cleanUrl = episodeUrl.startsWith('http')
      ? episodeUrl.trim()
      : `${BASE_URL}/${episodeUrl.replace(/^\/+|\/+$/g, '')}/`;

    const html = await this.fetchAnichinHtml(cleanUrl);
    const $ = cheerio.load(html);

    const title = $('h1.entry-title').text().trim();
    if (!title) {
      throw new Error('Episode tidak ditemukan');
    }

    const defaultIframe =
      $('.player-embed iframe, .video-content iframe, iframe').first().attr('src') || null;

    const mirrors: Mirror[] = [];
    $('select.mirror option, .mirror option').each((_, el) => {
      const name = $(el).text().trim();
      const rawVal = $(el).attr('value');
      if (!rawVal || !name || name.toLowerCase().includes('select')) return;
      const decoded = decodeBase64(rawVal);
      const matchSrc = decoded.match(/src=["']([^"']+)["']/i);
      const iframeSrc = matchSrc ? matchSrc[1] : decoded.startsWith('http') ? decoded : null;
      if (iframeSrc) {
        mirrors.push({ name, embedCode: decoded, streamUrl: iframeSrc });
      }
    });

    if (mirrors.length === 0 && defaultIframe) {
      mirrors.push({
        name: 'Default Server',
        embedCode: `<iframe src="${defaultIframe}" allowfullscreen frameborder="0"></iframe>`,
        streamUrl: defaultIframe,
      });
    }

    // Derive series slug from episode slug:
    // "tales-of-herding-gods-episode-1-subtitle-indonesia" -> "tales-of-herding-gods"
    const seriesSlug = episodeUrl
      .replace(/^https?:\/\/[^/]+\//, '')
      .replace(/\/+$/, '')
      .replace(/-episode-\d+.*$/i, '')
      .replace(/-subtitle-indonesia.*$/i, '')
      .replace(/-sub-indo.*$/i, '');

    let series: any = null;
    let prev: string | null = null;
    let next: string | null = null;
    let relatedEpisodes: any[] = [];
    let recommended: any[] = [];

    if (seriesSlug && seriesSlug !== episodeUrl) {
      try {
        const detail = await this.getAnichinDetail(seriesSlug);
        const epList = (detail.episodes || []).map((ep: any) => ({
          slug: ep.slug || ep.url?.replace(/^https?:\/\/[^/]+\//, '').replace(/\/+$/, ''),
          title: ep.title,
          episodeNumber: ep.number,
          date: ep.date,
        }));

        if (epList.length > 0) {
          // Find current episode index for prev/next
          const currentSlugNorm = episodeUrl.replace(/^https?:\/\/[^/]+\//, '').replace(/\/+$/, '');
          const idx = epList.findIndex(
            (ep: any) => ep.slug === currentSlugNorm || ep.slug === episodeUrl
          );
          if (idx >= 0) {
            if (idx > 0) prev = epList[idx - 1].slug;
            if (idx < epList.length - 1) next = epList[idx + 1].slug;
          }
          // Related episodes (siblings in the list, excluding current)
          relatedEpisodes = epList
            .filter((_: any, i: number) => i !== idx)
            .slice(Math.max(0, (idx || 0) - 2), (idx || 0) + 3)
            .map((ep: any) => ({
              ...ep,
              title: ep.title || '',
              cover: detail.thumbnail || '',
              postedBy: '',
              released: ep.date || '',
            }));
        }

        series = {
          name: detail.title,
          link: detail.url || `${BASE_URL}/seri/${seriesSlug}/`,
          slug: seriesSlug,
        };
        recommended = []; // anichin detail has no recommendations section
      } catch (detailErr) {
        // non-fatal: stream still usable without series context
      }
    }

    return { title, mirrors, series, prev, next, relatedEpisodes, recommended };
  }

  async getAnichinSearch(query: string, page = 1): Promise<{ results: any[]; pagination: any }> {
    if (!query) throw new Error('Query diperlukan');
    const url =
      page > 1
        ? `${BASE_URL}/page/${page}/?s=${encodeURIComponent(query)}`
        : `${BASE_URL}/?s=${encodeURIComponent(query)}`;
    const html = await this.fetchAnichinHtml(url);
    const $ = cheerio.load(html);
    const results: any[] = [];

    $('.listupd .bsx, .animpost').each((_, el) => {
      const a = $(el).find('a').first();
      const link = a.attr('href') || '';
      const rawTitle =
        $(el).find('.tt h2, .tt, .title, h4').first().text().trim();
      const title = rawTitle.split('\n')[0].replace(/\t+/g, ' ').trim();
      const status = $(el).find('.bt .epx, .status').text().trim();
      const type = $(el).find('.typez').text().trim();
      const thumbnail =
        $(el).find('img').attr('src') ||
        $(el).find('img').attr('data-src') ||
        null;
      if (link && title) {
        results.push({ title, status, type, thumbnail, url: link });
      }
    });

    const hasNextPage = $('.pagination .next, .hpage .r').length > 0;
    const totalPages = $('.pagination a')
      .map((_, el) => $(el).text().trim())
      .get()
      .filter((t) => /^\d+$/.test(t))
      .reduce((max, t) => Math.max(max, Number(t)), Number(page));
    return {
      results,
      pagination: { currentPage: Number(page), totalPages, hasNextPage: totalPages > Number(page) },
    };
  }

  async getAnichinGenres(): Promise<any[]> {
    const html = await this.fetchAnichinHtml(`${BASE_URL}/`);
    const $ = cheerio.load(html);
    const genres: any[] = [];
    $('ul.genre li a').each((_, el) => {
      const name = $(el).text().trim();
      const link = $(el).attr('href') || '';
      genres.push({ name, link, slug: this.getSlug(link) });
    });
    return genres;
  }

  async getAnichinGenrePage(genreSlug: string, page = 1): Promise<{ results: any[]; pagination: any }> {
    const url = page > 1
      ? `${BASE_URL}/genres/${genreSlug}/page/${page}`
      : `${BASE_URL}/genres/${genreSlug}/`;
    const html = await this.fetchAnichinHtml(url);
    const $ = cheerio.load(html);
    const results: any[] = [];
    $('.listupd .bsx, .animpost').each((_, el) => {
      const c = this.parseCard($, el);
      if (c) results.push(c);
    });
    const totalPages = $('.pagination a')
      .map((_, el) => $(el).text().trim())
      .get()
      .filter((t) => /^\d+$/.test(t))
      .reduce((max, t) => Math.max(max, Number(t)), Number(page));
    return { results, pagination: { currentPage: Number(page), totalPages, hasNextPage: totalPages > Number(page) } };
  }
}
