import { AnichinScraper } from './server/anichinScraper.ts';

const a = new AnichinScraper();

(async () => {
  // Genre page: chat widget must be gone from the HTML the server parses
  const html = await a.fetchAnichinHtml('https://anichin.cafe/genres/isekai/');
  console.log('genre page cbox refs:', (html.match(/cbox/gi) || []).length);
  console.log('genre page "Diskusi" refs:', (html.match(/Diskusi dan lapor/gi) || []).length);

  // Episode page: stream mirrors must not include the widget
  const g = await a.getAnichinGenrePage('isekai', 1);
  const d = await a.getAnichinDetail(g.results[0].url);
  const ep = d.episodes[0];
  console.log('ep:', ep?.url);
  const stream = await a.getAnichinStream(ep.url);
  console.log('mirrors:', (stream.mirrors || []).map((m) => m.name));
  const anyCbox = (stream.mirrors || []).some(
    (m) => /cbox/i.test(String(m.streamUrl)) || /cbox/i.test(String(m.embedCode))
  );
  console.log('any cbox mirror:', anyCbox);

  // normalizeMirrors client filter sanity (mirrors.ts is TS — import via tsx)
  const { normalizeMirrors } = await import('./src/lib/mirrors.ts');
  const out = normalizeMirrors([
    { name: 'Premium 1', streamUrl: 'https://anichin.stream/?id=x' },
    { name: 'Chat', streamUrl: 'https://www5.cbox.ws/box/?boxid=1' },
    { name: 'OK.ru', streamUrl: 'https://ok.ru/videoembed/1' },
    { name: 'FB', streamUrl: 'https://www.facebook.com/plugins/video.php?href=x' },
  ]);
  console.log('normalized names:', out.map((m) => m.name));

  if (anyCbox || (html.match(/cbox/gi) || []).length > 0 || out.some((m) => /cbox|facebook/i.test(m.streamUrl || ''))) {
    console.error('FAIL: widget leaked');
    process.exit(1);
  }
  console.log('PASS');
})();