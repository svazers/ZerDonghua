import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_HOSTS = new Set([
  'donghub.vip',
  'img.donghub.vip',
  'cdn.donghub.vip',
  'i0.wp.com',
  'images.weserv.nl',
]);

export async function GET(req: NextRequest) {
  const u = req.nextUrl.searchParams.get('u');
  if (!u) {
    return new NextResponse('Missing u param', { status: 400 });
  }

  let url: URL;
  try {
    url = new URL(u);
  } catch {
    return new NextResponse('Invalid url', { status: 400 });
  }

  if (url.protocol !== 'https:' || !ALLOWED_HOSTS.has(url.hostname)) {
    return new NextResponse('Host not allowed', { status: 403 });
  }

  // donghub.vip serves images through Cloudflare which 403s requests
  // without a same-site Referer. Add it server-side to bypass the check.
  const upstream = await fetch(url.toString(), {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      Referer: `https://${url.hostname}/`,
      Accept: 'image/avif,image/webp,image/png,image/jpeg,image/*,*/*;q=0.8',
    },
    // ponytail: global fetch, no per-image lock needed at this scale
  });

  if (!upstream.ok) {
    return new NextResponse(`Upstream ${upstream.status}`, { status: 502 });
  }

  const buf = await upstream.arrayBuffer();
  return new NextResponse(buf, {
    status: 200,
    headers: {
      'Content-Type': upstream.headers.get('content-type') || 'image/jpeg',
      'Cache-Control': 'public, max-age=86400, immutable',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
