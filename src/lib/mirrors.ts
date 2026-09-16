// Normalization shared by the server route and the client API layer, because
// episode data can arrive through either path.
//
// The embed snippet carries the authoritative, complete URL. The API's
// streamUrl is sometimes truncated (e.g. Dailymotion video id cut off)
// and HTML-entity encoded (&amp;), which breaks when set as iframe.src.
//
// Dailymotion URLs are additionally canonicalized to /embed/video/<id>: the
// source's geo.dailymotion.com/player.html form carries partner params we do
// not need, and the canonical form redirects to the same player.

export interface MirrorLike {
  name?: string;
  streamUrl?: string | null;
  embedCode?: string;
}

export function normalizeMirrors<T extends MirrorLike>(mirrors: T[]): T[] {
  const normalized = (mirrors || [])
    // Keep only actual video embeds — drop chat widgets, trackers, ads.
    .filter((m: any) => {
      const src = String(m.streamUrl || '') + String(m.embedCode || '');
      return !/cbox\.ws|disqus|facebook\.com\/plugins|addthis/i.test(src);
    })
    .map((m: any) => {
    let streamUrl = m.streamUrl || '';
    if (m.embedCode) {
      const srcMatch = m.embedCode.match(/src=["']([^"']+)["']/i);
      if (srcMatch) streamUrl = srcMatch[1];
    }
    streamUrl = String(streamUrl).replace(/&amp;/g, '&');

    const dmId =
      streamUrl.match(/dailymotion\.com\/(?:embed\/)?video\/([A-Za-z0-9]+)/i)?.[1] ||
      streamUrl.match(/[?&]video=([A-Za-z0-9]+)/i)?.[1] ||
      streamUrl.match(/dai\.ly\/([A-Za-z0-9]+)/i)?.[1];
    if (dmId && /dailymotion|dai\.ly/i.test(streamUrl)) {
      streamUrl = `https://www.dailymotion.com/embed/video/${dmId}`;
    }

    return { ...m, streamUrl };
  });

  // Sort: clean non-Dailymotion servers first, Dailymotion-branded next
  // (anichin rehosts to DM -> visible DM watermark), '[Ads]' servers last.
  const tier = (m: any): number => {
    const hay = `${m.name || ''} ${m.streamUrl || ''}`;
    if (/\[ads?\]/i.test(String(m.name || ''))) return 2;
    if (/dailymotion|dai\.ly|anichin-player/i.test(hay)) return 1;
    return 0;
  };
  normalized.sort((a, b) => tier(a) - tier(b));

  return normalized;
}
