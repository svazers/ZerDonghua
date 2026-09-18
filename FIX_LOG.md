# FIX_LOG — production homepage hanya placeholder

**Tanggal:** 2026-09-18
**Commit:** `e0d925a` — fix(source): rotate anichin.moe -> anichin.tv when Cloudflare challenges the caller

## Gejala

Production (https://zerdonghua.svazer.eu.cc) render hanya kartu statis `FALLBACK_HOME`:
cover SVG "No Cover", link `donghub.vip` (domain mati, 301 ke donghive.vip), episode
contoh. Local `npm start` di commit yang sama menampilkan data live. User melihat
layar "kosong" / placeholder.

## Root cause

`anichin.moe` dibalik Cloudflare. Setelah sebuah IP cukup banyak melakukan request,
Cloudflare mulai memblokir dengan challenge page 403 (`Just a moment...`).
Vercel memakai shared egress pool — IP tersebut cepat ter-challenge, sehingga
**setiap** scrape melempar exception dan **setiap** action jatuh ke fallback statis.

Bukti: IP container ini (103.177.100.122) menerima 200 dari `anichin.moe/` pada
08:19, lalu 403 challenge pada 08:25 — host, header, dan UA identik. Caliph proxy
juga di-challenge (403). Proxy publik lain (jina/codetabs/allorigins/thingproxy)
semua gagal atau hanya meneruskan halaman challenge.

## Kenapa bukan gejala yang diperbaiki

Bisa saja menambah `anichin.tv` sebagai konstanta baru dan mengganti BASE_URL.
Tapi itu hanya memindahkan masalah: begitu `.tv` juga di-challenge, fallback statis
kembali muncul. Perbaikan harus berada di satu tempat yang dilalui semua pemanggil:
`fetchAnichinHtml` (semua getAnichin* route through-nya).

## Fix

`server/anichinScraper.ts` — rotation di single fetch chokepoint:

- `SOURCES = ['https://anichin.moe', 'https://anichin.tv']` — `.tv` mirror DB &
  theme yang sama (selector identik diverifikasi: `.bsx`, `.eplister`, `.thumb`,
  `select.mirror`, `h1.entry-title`), dan saat ini tidak di-challenge.
- Coba sumber prefer duluan, rotasi kalau gagal. Cost maksimum: satu fetch 9s
  gagal di cold path; sumber yang berhasil tetap jadi preferan.
- **Sniffer** menolak dua mode kegagalan yang sama-sama mengembalikan HTTP 200:
  - challenge page Cloudflare (`Just a moment...`, `cf-challenge`)
  - `.moe` soft-redirect slug tak dikenal ke homepage dengan status 200 — tanpa
    sniffer, homepage ter-parse sebagai halaman detail dan frontend dapat data mati.
  - Cek soft-redirect **hanya** untuk URL `/series/` dan episode, karena halaman
    listing (home/search/schedule/genres) absah tanpa `h1.entry-title`.
- href/src root-relative di-absolutize terhadap sumber yang **benar-benar**
  melayani request (bukan origin yang diminta).
- `anichin.tv` di-allowlist di `/api/img` route dan `SafeImage` proxied hosts.

`src/lib/donghuaServer.ts` tidak diubah — semua aksi sudah melewati chokepoint.

## Bug antara yang ditemukan saat verifikasi

1. Helper awal mengembalikan array saat host cocok, string saat tidak — `for...of`
   atas array mengiterasi **karakter**-nya, jadi setiap kandidat jadi URL 1 huruf
   ("h", "t", ...) yang 404 ke homepage. Diperbaik jadi `candidatesFor(): string[]`
   yang selalu map ke origin+path.
2. Sniffer pertama pakai `<h1 class=entry-title>` untuk semua URL — menolak
   homepage/search/schedule/genre yang absah. Scope dipersempit ke detail/episode.
3. Regex `\/series\/` double-escaped oleh patch tool → invalid char. Diperbaik.

## Verifikasi (local, hasil build terbaru, `next build` clean)

| Aksi | Hasil |
|---|---|
| `action=home` | 20 rekomendasi, 34 popularToday, cover asli `anichin.moe` |
| `action=genres` | 47 genre |
| `action=detail&slug=battle-through-the-heavens-season-5` | cover asli `anichin.tv`, **211 episode** asli |
| `action=episode&slug=against-the-gods-episode-55-subtitle-indonesia` | **11 mirror** (ok.ru, rumble, d.tube, turbovid, …), prev/next resolve, 3 related |
| `action=search` / `genre` / `schedule` | cover asli, bukan SVG |
| SSR HTML `/` | **0** placeholder `data:image/svg`, cover via `/api/img` |

## Catatan operasional

- Build perlu PID headroom: cgroup `pids.max=512`, terpakai ~394 oleh chromium
  MCP/node/wabot. Saat pids penuh, `next build` gagal di "Generating static
  pages" dengan `EAGAIN`/`SIGABRT`. Bunuh orphan chromium (`.chrome-tmp` profile)
  sebelum build.
- `npm start` lokal berjalan (session `proc_fa7741a5e177`) untuk pengujian;
- Setelah push ke `main`, Vercel auto-deploy akan memakai rotation yang sama.
