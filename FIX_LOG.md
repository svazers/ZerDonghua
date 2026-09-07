# FIX_LOG — Poster / Cover Tidak Muncul di ZerDonghua

**Tanggal:** 2026-09-07
**Komponen:** `src/components/SafeImage.tsx`, `src/app/api/img/route.ts`, 10 komponen card/section
**Severity:** High (seluruh poster donghua tampil placeholder, bukan cover asli)

---

## Symptom
Poster donghua di halaman utama & semua section muncul sebagai placeholder
(unsplash), bukan cover asli dari `donghub.vip`. Terjadi baik di dev maupun
production (`zerdonghuaa.vercel.app`).

## Root Cause
`donghub.vip` memserving gambar di balik Cloudflare bot-protection yang
**403** pada request yang tidak membawa header `Referer` same-site.

Bukti:
```
curl -A "Mozilla/5.0" https://donghub.vip/.../poster.jpg        → 403
curl -A "Mozilla/5.0" -H "Referer: https://donghub.vip/" ...   → 200
```

Dua lapisan kegagalan sebelumnya:
1. `next/image` (default) → optimizer server-side fetch dari `donghub.vip`
   tanpa Referer → 403 → gambar optimizer gagal.
2. Setelah diganti `<img>` polos, browser fetch langsung dengan
   `Referer: https://zerdonghuaa.vercel.app/` → tetap 403 → `onError`
   fallback ke placeholder.

Penyebab inti = **Cloudflare memblokir request tanpa Referer same-site**,
bukan masalah optimizer semata.

## Fix
Tambah route proxy `/api/img?u=<encoded-url>` yang fetch gambar server-side
sambil menyuntikkan header `Referer: https://<host>/`. `SafeImage` mengarahkan
URL `donghub.vip` melalui proxy ini; placeholder unsplash hanya sisa fallback
terakhir di `onError`.

**File baru:** `src/app/api/img/route.ts`
- Validasi host (allowlist `donghub.vip`, `img/cdn.donghub.vip`, `i0.wp.com`,
  `images.weserv.nl`) agar tidak jadi open proxy.
- `Cache-Control: public, max-age=86400, immutable` → Vercel/Edge cache 1 hari.
- Return `content-type` asli + `Access-Control-Allow-Origin: *`.

**File diubah:** `src/components/SafeImage.tsx`
- `resolveSrc()` membungkus host ter-proxy jadi `/api/img?u=...`.
- `onError` tetap fallback ke unsplash bila proxy gagal.

**10 komponen** (tetap `import { SafeImage as Image }`):
`DonghuaCard, SpotlightHero, FeaturedRail, ContinueWatchingSection,
WeeklySchedule, SearchModal, WatchlistDrawer, HomeScheduleSection,
DetailsModal, ZerDonghuaLogo`.

## Verification
- `npx tsc --noEmit` → clean
- `npx next build` → route `/api/img` muncul, build sukses
- Proxy lokal: `GET /api/img?u=...donghub.vip...` → **200, image/jpeg, 180KB**
  (direct fetch → 403)
- SSR HTML: 37 cover via `/api/img?u=...`, **0** URL `donghub.vip` langsung
- Deploy: `git push origin main` → Vercel auto-build

## Skipped (YAGNI)
- Puppeteer / Playwright / cookie / headless browser untuk bypass Cloudflare
  → overkill; proxy + header Referer sudah cukup. Tambah hanya bila Cloudflare
  naik ke JS-challenge (5xx + captcha), bukan sekadar Referer-check.
- `next/image` optimizer → tidak dipakai karena tidak bisa inject Referer per-request.

## Known Ceiling
`ponytail:` proxy global tanpa rate-limit per-host. Bila traffic tinggi &
Cloudflare throttle, tambah in-memory LRU cache di `route.ts` atau naikkan
`max-age`.

---

# FIX_LOG — Watch Modal streaming section expansion

**Tanggal:** 2026-09-07
**Komponen:** `src/components/WatchModal.tsx`, `src/components/DonghuaCardSmall.tsx`

## Root Cause
Watch modal hanya dapat server-selector + prev/next. Tidak ada rekomendasi, related,
latest, popular, genre, atau footer — terlalu polos; tidak ada info poster-related.

## Fix
- `WatchModal`: lazy-fetch `donghuaApi.getHome()` (memoized) untuk latestRelease,
  donghuaPopular (weekly/monthly/allTime), genres.
- 5 section baru di bottom rail:
  1. **Rekomendasi** (`streamData.recommended`, dari episode API) — poster, horizontal scroll
  2. **Episode Terkait** (`streamData.relatedEpisodes`) — poster kecil, scrollable
  3. **Episode Terbaru** (`homeData.latestRelease`) — list teks tanpa poster (per request)
  4. **Populer** (`donghuaPopular.weekly/monthly/allTime`) — `DonghuaCardSmall` poster kecil
  5. **Genre tags** (`homeData.genres`) — static, informational
- **Footer**: credit + data source.
- `DonghuaCardSmall`: komponen baru, poster 100x140px, pakai `SafeImage`→`/api/img` proxy.

## Verified
- `tsc --noEmit` clean
- API episode (?action=episode) return: recommended 5, relatedEpisodes 1, streams 3 (Dailymotion/Dtube/Okru)
- API home: latestRelease 20, donghuaPopular 10/10/10, genres 26
- Dev server HTTP 200, home page SSR render OK
