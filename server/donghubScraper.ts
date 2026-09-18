import * as cheerio from 'cheerio';

export interface Mirror {
  name: string;
  embedCode: string;
  streamUrl: string | null;
}

export interface DonghuaEpisode {
  title: string;
  series: {
    name: string;
    link: string;
    slug: string;
  };
  prev: string | null;
  next: string | null;
  mirrors: Mirror[];
  relatedEpisodes: Array<{
    title: string;
    link: string;
    slug: string;
    cover: string;
    postedBy: string;
    released: string;
  }>;
  recommended: Array<{
    title: string;
    link: string;
    slug: string;
    cover: string;
    status: string;
    type: string;
    episodeLabel: string;
    subStatus: string;
  }>;
}

export class DonghubScraper {
  baseUrl: string;
  headers: Record<string, string>;

  constructor() {
    this.baseUrl = 'https://donghub.vip';
    this.headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
      'Referer': 'https://donghub.vip/'
    };
  }

  getSlug(urlStr: string): string {
    if (!urlStr) return '';
    try {
      const url = new URL(urlStr, this.baseUrl);
      const pathname = url.pathname.replace(/\/+$/, '').replace(/^\/+/, '');
      const parts = pathname.split('/');
      return parts[parts.length - 1] || '';
    } catch {
      const pathname = urlStr.split('?')[0].replace(/\/+$/, '').replace(/^\/+/, '');
      const parts = pathname.split('/');
      return parts[parts.length - 1] || '';
    }
  }

  async fetchHtml(url: string): Promise<string> {
    const spoofedIp = [
      Math.floor(Math.random() * 255),
      Math.floor(Math.random() * 255),
      Math.floor(Math.random() * 255),
      Math.floor(Math.random() * 255)
    ].join('.');

    const dynamicHeaders = {
      ...this.headers,
      'X-Forwarded-For': spoofedIp,
      'X-Real-IP': spoofedIp,
      'Client-IP': spoofedIp,
      'True-Client-IP': spoofedIp,
      'X-Originating-IP': spoofedIp,
      'Forwarded': `for=${spoofedIp}`
    };

    // Primary fetch attempt
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 9000);
      const res = await fetch(url, {
        headers: dynamicHeaders,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        return await res.text();
      }
    } catch (e) {
      console.warn(`Primary fetch to ${url} failed, trying fallback proxy...`, e);
    }

    // Fallback proxy attempt — caliph is fast (~0.5s). allorigins.win was
    // removed: it times out (>12s, 000) and only added latency + log noise.
    const proxyUrls = [`https://cors.caliph.my.id/${url}`];

    for (const pUrl of proxyUrls) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 9000);
        const res = await fetch(pUrl, {
          headers: dynamicHeaders,
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (res.ok) {
          return await res.text();
        }
      } catch (err) {
        console.warn(`Proxy ${pUrl} failed:`, err);
      }
    }

    throw new Error(`Failed to fetch HTML from ${url}`);
  }

  async getHome() {
    try {
      const html = await this.fetchHtml(`${this.baseUrl}/`);
      const $ = cheerio.load(html);

      const recommendations: any[] = [];
      $('#slidertwo .swiper-slide.item').each((i, el) => {
        const backdropStyle = $(el).find('.backdrop').attr('style') || '';
        const coverMatch = backdropStyle.match(/url\(['"]?([^'"]+)['"]?\)/);
        const cover = coverMatch ? coverMatch[1] : '';
        const titleLink = $(el).find('h2 a');
        const title = titleLink.text().trim();
        const link = titleLink.attr('href') || '';
        const synopsis = $(el).find('.info p').text().trim();

        recommendations.push({
          title,
          link,
          slug: this.getSlug(link),
          cover,
          synopsis
        });
      });

      const popularToday: any[] = [];
      $('.listupd.popularslider article.bs').each((i, el) => {
        const a = $(el).find('.bsx a');
        const link = a.attr('href') || '';
        const titleAttr = a.attr('title') || '';
        const cover = a.find('img').attr('src') || a.find('img').attr('data-src') || '';
        const episode = a.find('.limit .bt .epx').text().trim();
        const subStatus = a.find('.limit .bt .sb').text().trim();
        const type = a.find('.limit .typez').text().trim();
        const status = a.find('.limit .status').text().trim();
        const hot = a.find('.limit .hotbadge').length > 0;

        const tt = a.find('.tt');
        const seriesTitle = tt.clone().children().remove().end().text().trim();
        const episodeTitle = tt.find('h2').text().trim();

        popularToday.push({
          title: episodeTitle || titleAttr,
          seriesTitle: seriesTitle || titleAttr.replace(/\sEpisode\s\d+.*/i, ''),
          link,
          slug: this.getSlug(link),
          cover,
          episode,
          subStatus,
          type,
          status,
          hot
        });
      });

      const latestRelease: any[] = [];
      $('.releases.latesthome').next('.listupd').find('article.bs').each((i, el) => {
        const a = $(el).find('.bsx a');
        const link = a.attr('href') || '';
        const titleAttr = a.attr('title') || '';
        const cover = a.find('img').attr('src') || a.find('img').attr('data-src') || '';
        const episode = a.find('.limit .bt .epx').text().trim();
        const subStatus = a.find('.limit .bt .sb').text().trim();
        const type = a.find('.limit .typez').text().trim();
        const status = a.find('.limit .status').text().trim();
        const hot = a.find('.limit .hotbadge').length > 0;

        const tt = a.find('.tt');
        const seriesTitle = tt.clone().children().remove().end().text().trim();
        const episodeTitle = tt.find('h2').text().trim();

        latestRelease.push({
          title: episodeTitle || titleAttr,
          seriesTitle: seriesTitle || titleAttr.replace(/\sEpisode\s\d+.*/i, ''),
          link,
          slug: this.getSlug(link),
          cover,
          episode,
          subStatus,
          type,
          status,
          hot
        });
      });

      const latestBlog: any[] = [];
      $('.bloglist article').each((i, el) => {
        const titleLink = $(el).find('h2 a');
        const title = titleLink.text().trim();
        const link = titleLink.attr('href') || '';
        const cover = $(el).find('img').attr('src') || '';
        const date = $(el).find('.date').text().trim();
        const snippet = $(el).find('.entry-summary').text().trim();
        latestBlog.push({ title, link, slug: this.getSlug(link), cover, date, snippet });
      });

      const donghuaBaru: any[] = [];
      $('.ongoingseries').find('ul li').each((i, el) => {
        const a = $(el).find('a');
        const link = a.attr('href') || '';
        const title = a.find('.l').text().trim();
        const episode = a.find('.r').text().trim();
        donghuaBaru.push({ title, link, slug: this.getSlug(link), episode });
      });

      const parsePopularList = (selector: string) => {
        const items: any[] = [];
        $(selector).find('ul li').each((i, el) => {
          const rank = $(el).find('.ctr').text().trim();
          const a = $(el).find('.leftseries h4 a');
          const title = a.text().trim();
          const link = a.attr('href') || '';
          const cover = $(el).find('.imgseries img').attr('src') || $(el).find('.imgseries img').attr('data-src') || '';

          const genresList: any[] = [];
          $(el).find('.leftseries span a').each((j, genreEl) => {
            genresList.push({
              name: $(genreEl).text().trim(),
              link: $(genreEl).attr('href') || '',
              slug: this.getSlug($(genreEl).attr('href') || '')
            });
          });

          const rating = $(el).find('.leftseries .rt .numscore').text().trim();

          items.push({
            rank: parseInt(rank) || i + 1,
            title,
            link,
            slug: this.getSlug(link),
            cover,
            genres: genresList,
            rating
          });
        });
        return items;
      };

      const donghuaPopular = {
        weekly: parsePopularList('.wpop-weekly'),
        monthly: parsePopularList('.wpop-monthly'),
        allTime: parsePopularList('.wpop-alltime')
      };

      const genres: any[] = [];
      $('ul.genre li a').each((i, el) => {
        const name = $(el).text().trim();
        const link = $(el).attr('href') || '';
        genres.push({ name, link, slug: this.getSlug(link) });
      });

      return {
        recommendations,
        popularToday,
        latestRelease,
        latestBlog,
        donghuaBaru,
        donghuaPopular,
        genres
      };
    } catch (err: any) {
      throw new Error(`getHome failed: ${err.message}`);
    }
  }

  async getSchedule() {
    try {
      const html = await this.fetchHtml(`${this.baseUrl}/schedule/`);
      const $ = cheerio.load(html);

      const schedule: Record<string, any[]> = {};
      $('.bixbox.schedulepage').each((i, el) => {
        const day = $(el).find('.releases h3 span').text().trim();
        if (!day) return;
        schedule[day] = [];

        $(el).find('.listupd .bs').each((j, bsEl) => {
          const a = $(bsEl).find('.bsx a');
          const link = a.attr('href') || '';
          const title = a.attr('title') || a.find('.tt').text().trim();
          const cover = a.find('img').attr('src') || a.find('img').attr('data-src') || '';
          const releaseTime = a.find('.limit .bt .epx').text().trim();
          const episode = a.find('.limit .bt .sb').text().trim();

          schedule[day].push({
            title,
            link,
            slug: this.getSlug(link),
            cover,
            releaseTime,
            episode
          });
        });
      });

      return schedule;
    } catch (err: any) {
      throw new Error(`getSchedule failed: ${err.message}`);
    }
  }

  async getDetail(slugOrUrl: string) {
    try {
      let url = slugOrUrl;
      if (!url.startsWith('http')) {
        url = `${this.baseUrl}/${slugOrUrl}/`;
      }
      const html = await this.fetchHtml(url);
      const $ = cheerio.load(html);

      const title = $('.entry-title').text().trim();
      const cover = $('.thumb img').attr('src') || $('.thumb img').attr('data-src') || '';
      const synopsis = $('.bixbox.synp .entry-content').text().trim();

      const metadata: Record<string, string> = {};
      $('.info-content .spe span').each((i, el) => {
        const text = $(el).text();
        const parts = text.split(':');
        if (parts.length >= 2) {
          const key = parts[0].trim();
          const val = parts.slice(1).join(':').trim();
          metadata[key] = val;
        }
      });

      const genres: any[] = [];
      $('.genxed a').each((i, el) => {
        genres.push({
          name: $(el).text().trim(),
          link: $(el).attr('href') || '',
          slug: this.getSlug($(el).attr('href') || '')
        });
      });

      const episodes: any[] = [];
      $('.eplister ul li').each((i, el) => {
        const a = $(el).find('a');
        const link = a.attr('href') || '';
        const num = $(el).find('.epl-num').text().trim();
        const epTitle = $(el).find('.epl-title').text().trim();
        const subStatus = $(el).find('.epl-sub .status').text().trim();
        const date = $(el).find('.epl-date').text().trim();

        episodes.push({
          title: epTitle,
          link,
          slug: this.getSlug(link),
          episodeNumber: num,
          date,
          subStatus
        });
      });

      const recommended: any[] = [];
      $('.releases:contains("Recommended Series")').next('.listupd').find('article.bs').each((i, el) => {
        const a = $(el).find('.bsx a');
        const link = a.attr('href') || '';
        const rTitle = a.attr('title') || '';
        const rCover = a.find('img').attr('src') || a.find('img').attr('data-src') || '';
        const status = a.find('.limit .status').text().trim();
        const type = a.find('.limit .typez').text().trim();
        const episodeLabel = a.find('.limit .bt .epx').text().trim();
        const subStatus = a.find('.limit .bt .sb').text().trim();

        recommended.push({
          title: rTitle,
          link,
          slug: this.getSlug(link),
          cover: rCover,
          status,
          type,
          episodeLabel,
          subStatus
        });
      });

      return {
        title,
        cover,
        synopsis,
        metadata,
        genres,
        episodes,
        recommended
      };
    } catch (err: any) {
      throw new Error(`getDetail for "${slugOrUrl}" failed: ${err.message}`);
    }
  }

  async search(query: string, page = 1) {
    try {
      const url = page > 1
        ? `${this.baseUrl}/page/${page}/?s=${encodeURIComponent(query)}`
        : `${this.baseUrl}/?s=${encodeURIComponent(query)}`;
      const html = await this.fetchHtml(url);
      const $ = cheerio.load(html);

      const results: any[] = [];
      $('.listupd article.bs').each((i, el) => {
        const a = $(el).find('.bsx a');
        const link = a.attr('href') || '';
        const title = a.attr('title') || '';
        const cover = a.find('img').attr('src') || a.find('img').attr('data-src') || '';
        const type = a.find('.limit .typez').text().trim();
        const status = a.find('.limit .status').text().trim();
        const episode = a.find('.limit .bt .epx').text().trim();
        const subStatus = a.find('.limit .bt .sb').text().trim();

        results.push({
          title,
          link,
          slug: this.getSlug(link),
          cover,
          type,
          status,
          episode,
          subStatus
        });
      });

      let currentPage = page;
      let totalPages = page;
      const currentText = $('.pagination span.page-numbers.current').text().trim();
      if (currentText) {
        currentPage = parseInt(currentText) || page;
      }
      $('.pagination a.page-numbers').each((i, el) => {
        const num = parseInt($(el).text().trim());
        if (num && num > totalPages) {
          totalPages = num;
        }
      });
      if (currentPage > totalPages) {
        totalPages = currentPage;
      }

      return {
        results,
        pagination: { currentPage, totalPages, hasNextPage: currentPage < totalPages }
      };
    } catch (err: any) {
      throw new Error(`search failed for "${query}": ${err.message}`);
    }
  }

  async getDonghuaByGenre(genreSlug: string, page = 1) {
    try {
      const url = page > 1
        ? `${this.baseUrl}/genres/${genreSlug}/page/${page}/`
        : `${this.baseUrl}/genres/${genreSlug}/`;
      const html = await this.fetchHtml(url);
      const $ = cheerio.load(html);

      const results: any[] = [];
      $('.listupd article.bs').each((i, el) => {
        const a = $(el).find('.bsx a');
        const link = a.attr('href') || '';
        const title = a.attr('title') || '';
        const cover = a.find('img').attr('src') || a.find('img').attr('data-src') || '';
        const type = a.find('.limit .typez').text().trim();
        const status = a.find('.limit .status').text().trim();
        const episode = a.find('.limit .bt .epx').text().trim();
        const subStatus = a.find('.limit .bt .sb').text().trim();

        results.push({
          title,
          link,
          slug: this.getSlug(link),
          cover,
          type,
          status,
          episode,
          subStatus
        });
      });

      let currentPage = page;
      let totalPages = page;
      const currentText = $('.pagination span.page-numbers.current').text().trim();
      if (currentText) {
        currentPage = parseInt(currentText) || page;
      }
      $('.pagination a.page-numbers').each((i, el) => {
        const num = parseInt($(el).text().trim());
        if (num && num > totalPages) {
          totalPages = num;
        }
      });
      if (currentPage > totalPages) {
        totalPages = currentPage;
      }

      return {
        results,
        pagination: { currentPage, totalPages, hasNextPage: currentPage < totalPages }
      };
    } catch (err: any) {
      throw new Error(`getDonghuaByGenre failed for "${genreSlug}": ${err.message}`);
    }
  }

  async getEpisode(slugOrUrl: string): Promise<DonghuaEpisode> {
    try {
      let url = slugOrUrl;
      if (!url.startsWith('http')) {
        url = `${this.baseUrl}/${slugOrUrl}/`;
      }
      const html = await this.fetchHtml(url);
      const $ = cheerio.load(html);

      const title = $('.entry-title').text().trim();
      const seriesLink = $('.naveps.bignav .nvsc a').attr('href') || '';
      const seriesName = $('.year a').text().trim();
      const prevLink = $('.naveps.bignav .nvs a[rel="prev"]').attr('href') || '';
      const nextLink = $('.naveps.bignav .nvs a[rel="next"]').attr('href') || '';

      const mirrors: Mirror[] = [];
      $('select.mirror option').each((i, el) => {
        const name = $(el).text().trim();
        const base64Value = $(el).val() as string;
        if (!base64Value) return;

        let decodedHtml = '';
        try {
          decodedHtml = Buffer.from(base64Value, 'base64').toString('utf8');
        } catch {
          decodedHtml = '';
        }

        let streamUrl = '';
        const iframeMatch = decodedHtml.match(/src=["']([^"']+)["']/i);
        if (iframeMatch) {
          streamUrl = iframeMatch[1];
        }

        mirrors.push({
          name: name || `Server ${i + 1}`,
          embedCode: decodedHtml,
          streamUrl: streamUrl || null
        });
      });

      // Also check standard iframe inside #pembed or .player-embed if mirrors select was empty
      if (mirrors.length === 0) {
        const iframeSrc = $('#pembed iframe, .player-embed iframe, .embed-responsive iframe').attr('src');
        if (iframeSrc) {
          mirrors.push({
            name: 'Default Server',
            embedCode: `<iframe src="${iframeSrc}" allowfullscreen frameborder="0"></iframe>`,
            streamUrl: iframeSrc
          });
        }
      }

      const relatedEpisodes: any[] = [];
      $('.releases:contains("Related Episodes")').next('.listupd').find('.stylefiv').each((i, el) => {
        const a = $(el).find('.bsx .thumb a');
        const rUrl = a.attr('href') || '';
        const rTitle = a.attr('title') || $(el).find('.inf h2 a').text().trim();
        const rCover = a.find('img').attr('src') || a.find('img').attr('data-src') || '';
        const postedBy = $(el).find('.inf span:contains("Posted by")').text().replace(/Posted by:\s*/i, '').trim();
        const released = $(el).find('.inf span:contains("Released on")').text().replace(/Released on:\s*/i, '').trim();

        relatedEpisodes.push({
          title: rTitle,
          link: rUrl,
          slug: this.getSlug(rUrl),
          cover: rCover,
          postedBy: postedBy || 'Admin',
          released: released || ''
        });
      });

      const recommended: any[] = [];
      $('.releases:contains("Recommended Series")').next('.listupd').find('article.bs').each((i, el) => {
        const a = $(el).find('.bsx a');
        const rUrl = a.attr('href') || '';
        const rTitle = a.attr('title') || '';
        const rCover = a.find('img').attr('src') || a.find('img').attr('data-src') || '';
        const status = a.find('.limit .status').text().trim();
        const type = a.find('.limit .typez').text().trim();
        const episodeLabel = a.find('.limit .bt .epx').text().trim();
        const subStatus = a.find('.limit .bt .sb').text().trim();

        recommended.push({
          title: rTitle,
          link: rUrl,
          slug: this.getSlug(rUrl),
          cover: rCover,
          status,
          type,
          episodeLabel,
          subStatus
        });
      });

      return {
        title,
        series: {
          name: seriesName,
          link: seriesLink,
          slug: this.getSlug(seriesLink)
        },
        prev: prevLink ? this.getSlug(prevLink) : null,
        next: nextLink ? this.getSlug(nextLink) : null,
        mirrors,
        relatedEpisodes,
        recommended
      };
    } catch (err: any) {
      throw new Error(`getEpisode for "${slugOrUrl}" failed: ${err.message}`);
    }
  }

  async getGenres() {
    try {
      const homeData = await this.getHome();
      return homeData.genres;
    } catch (err: any) {
      throw new Error(`getGenres failed: ${err.message}`);
    }
  }
}
