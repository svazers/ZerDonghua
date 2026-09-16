// verify_anichin_moe.mjs — one runnable check after migrating to anichin.moe
// Fails (exit 1) if any action returns no data, leaks the cbox widget, or
// produces relative/broken slugs. Run: npx tsx verify_anichin_moe.mjs
import { getDonghua } from './src/lib/donghuaServer.ts';
import { normalizeMirrors } from './src/lib/mirrors.ts';

const fail = (msg) => { console.error('FAIL:', msg); process.exit(1); };

const home = await getDonghua('home');
console.log('home:', home.recommendations.length, 'recs |', home.latestRelease.length, 'latest |', home.popularToday.length, 'popular |',
  home.genres.length, 'genres | weekly:', home.donghuaPopular?.weekly?.length);
if (home.latestRelease.length < 10) fail('latestRelease too small');
if (home.genres.length < 40) fail('genres too small: ' + home.genres.length);
if (!home.donghuaPopular?.weekly?.length) fail('no leaderboard weekly');

const sched = await getDonghua('schedule');
const days = Object.keys(sched);
if (days.length < 7) fail('schedule days: ' + days.length);
console.log('schedule:', days.join(','));

const genre = await getDonghua('genre', { genre: 'isekai', page: '1' });
if (!genre.results?.length) fail('genre isekai empty');
console.log('genre isekai:', genre.results.length, 'results | page2 hasNext:', genre.pagination?.hasNextPage);

const search = await getDonghua('search', { query: 'cultivation' });
console.log('search cultivation:', search.results?.length ?? 0);
if (!search.results?.length) fail('search empty');

const seriesUrl = home.latestRelease[0].link;
const detail = await getDonghua('detail', { slug: seriesUrl });
if (!detail.episodes?.length) fail('detail episodes empty for ' + seriesUrl);
console.log('detail:', detail.title, '| eps:', detail.episodes.length, '| cover:', !!detail.cover);

const ep = detail.episodes[0];
const stream = await getDonghua('episode', { slug: ep.link || ep.slug });
const mirrors = normalizeMirrors(stream.mirrors || []);
console.log('episode:', stream.title);
console.log('mirrors:', mirrors.map((m) => m.name).join(', '));
console.log('prev:', stream.prev, '| next:', stream.next);
if (!mirrors.length) fail('no mirrors');
if (mirrors.some((m) => /cbox|disqus|facebook\/plugins/i.test(`${m.streamUrl}${m.embedCode}`))) fail('widget leaked into mirrors');
// prev/next are episode slugs (server action resolves them); spot-check prev plays
for (const [k, v] of [['prev', stream.prev], ['next', stream.next]]) {
  if (v === undefined) fail(`${k} undefined`);
}
if (stream.prev) {
  const prevStream = await getDonghua('episode', { slug: stream.prev });
  console.log('prev resolves:', prevStream.title);
  if (!prevStream.mirrors?.length) fail('prev episode has no mirrors');
} else {
  console.log('note: ep0 (newest) has no prev');
}
console.log('PASS: anichin.moe migration OK');
