# ZerDonghua 🐉

> Platform streaming Donghua (Chinese Anime 3D & 2D) subtitle Indonesia modern, responsif, dan berkinerja tinggi.

---

## 🌟 Fitur Utama

- **🎬 Multi-Server Video Player**:
  - Pilihan mirror server streaming (Dtube, OKRU, Dailymotion, dll.) dengan urutan prioritas otomatis.
  - Navigasi cepat antar episode (Sebelumnya / Selanjutnya / Daftar Episode Lengkap).
  - Mode teater & pengalaman pemutaran video yang imersif.

- **⚡ Rekomendasi & Sorotan Utama (Spotlight Hero)**:
  - Tampilan hero banner interaktif yang ringan dan cepat.
  - Ringkasan sinopsis, genre kultivasi/aksi, status episode, dan akses langsung sekali klik.

- **🔥 Katalog Terlengkap & Update Harian**:
  - **Sedang Tayang (Ongoing Series)**: Slider horizontal & tampilan grid untuk episode terbaru.
  - **Paling Populer**: Tab filter Hari Ini, Minggu Ini, dan Sepanjang Waktu.
  - **Update Episode Terbaru**: Daftar rilis terkini dengan pencarian & filter instan.

- **📅 Jadwal Rilis Mingguan**:
  - Tab jadwal tayang dari Senin hingga Minggu untuk melacak perilisan episode baru.

- **🔍 Pencarian Cepat & Filter Genre**:
  - Modal pencarian instan dengan paginasi dan saran kata kunci populer (Action, Cultivation, Romance, Fantasy, Martial Arts, Reincarnation).
  - Filter katalog berdasarkan puluhan kategori genre donghua.

- **📌 Watchlist & Riwayat Tontonan**:
  - Penyimpanan bookmark donghua favorit secara lokal (*localStorage*).
  - Riwayat tontonan episode terakhir beserta waktu akses (*Continue Watching*).

- **📱 Mobile Native Experience**:
  - *Floating bottom navigation bar* khusus mobile untuk navigasi cepat (Beranda, Cari, Jadwal, Watchlist).
  - Desain adaptif dari layar smartphone, tablet, hingga ultra-wide desktop.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: [Next.js 15](https://nextjs.org/docs) (App Router, SSR) + [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)

### Backend / Data Layer
- **API**: Next.js Route Handlers (`src/app/api/donghua/route.ts`)
- **Scraping & Parser**: [Cheerio](https://cheerio.js.org/) + Fallback Engine (data statis offline)
- **Deployment**: [Vercel](https://vercel.com/) (auto-deploy setiap push ke `main`)

---

## 🚀 Memulai (Getting Started)

### Prasyarat
- **Node.js** v18.18 atau lebih baru
- **npm**

### Instalasi
```bash
# Clone repository
git clone <repository-url>
cd zerdonghua

# Install dependensi
npm install
```

### Menjalankan Mode Pengembangan (Development)
```bash
npm run dev
```
Aplikasi akan berjalan di `http://localhost:3000`.

### Membangun untuk Produksi (Production Build)
```bash
npm run build
```

### Menjalankan Server Produksi
```bash
npm start
```

### Deploy ke Vercel
Push ke branch `main` akan memicu build & deploy otomatis di Vercel. Pastikan **Framework Preset** proyek diatur ke **Next.js**.

---

## 📡 Dokumentasi API Backend

Endpoint backend internal terpadu berada di `/api/donghua` (Next.js Route Handler). Semua action dikirim via query parameter `action`; respons dibungkus dalam `{ status: boolean, data }`.

| Action | Parameter | Deskripsi |
| :--- | :--- | :--- |
| `home` *(default)* | - | Mengambil data beranda (rekomendasi, rilis terbaru, populer hari ini/minggu/all, donghua ongoing, genre) |
| `schedule` | - | Mengambil jadwal rilis mingguan (Senin - Minggu) |
| `detail` | `slug` (string) | Mengambil detail lengkap series, sinopsis, info rating, produser, dan daftar seluruh episode |
| `episode` | `slug` (string) | Mengambil metadata pemutaran episode, mirror server streaming, iframe embed, dan episode navigasi |
| `search` | `query` (string), `page` (number, opsional) | Mencari judul donghua |
| `genre` | `genre` (string), `page` (number, opsional) | Mengambil daftar donghua berdasarkan genre tertentu |
| `genres` | - | Mengambil daftar semua kategori genre yang tersedia |

Contoh:
```
GET /api/donghua?action=search&query=isekai&page=2
```

---

## 📂 Struktur Proyek

```text
├── metadata.json               # Konfigurasi metadata aplikasi
├── next.config.ts              # Konfigurasi Next.js (SSR + remote images)
├── package.json                # Dependensi & skrip npm
├── server/
│   ├── donghubScraper.ts       # Scraping engine & parser
│   └── donghuaFallback.ts      # Data fallback statis offline/cadangan
├── src/
│   ├── App.tsx                 # Shell aplikasi & state management
│   ├── types.ts                # Definisi TypeScript interfaces
│   ├── app/
│   │   ├── layout.tsx              # Root layout App Router
│   │   ├── page.tsx                # Entry halaman beranda (render shell App)
│   │   ├── globals.css             # Global CSS & Tailwind CSS import
│   │   └── api/
│   │       └── donghua/route.ts    # Route Handler API terpadu
│   ├── lib/
│   │   └── donghuaServer.ts        # Dispatcher action & orkestrasi scraper/fallback
│   ├── services/
│   │   └── donghuaApi.ts           # Klien API frontend
│   └── components/
│       ├── Header.tsx              # Navbar atas & navigasi
│       ├── ZerDonghuaLogo.tsx      # Komponen logo vektor & branding
│       ├── MobileBottomNav.tsx     # Floating bottom navigation bar mobile
│       ├── SpotlightHero.tsx       # Hero banner rekomendasi unggulan
│       ├── DonghuaCard.tsx         # Kartu poster donghua interaktif
│       ├── FeaturedRail.tsx        # Rail konten unggulan horizontal
│       ├── ContinueWatchingSection.tsx # Lanjutkan tontonan dari riwayat
│       ├── OngoingSliderSection.tsx# Bagian donghua sedang tayang
│       ├── PopularSliderSection.tsx# Bagian donghua terpopuler
│       ├── LatestUpdatedSection.tsx# Bagian episode baru rilis
│       ├── HomeGenreShowcase.tsx   # Eksplorasi genre & kategori
│       ├── GenreBar.tsx            # Bar filter genre horizontal
│       ├── HomeScheduleSection.tsx # Preview jadwal tayang di homepage
│       ├── PortalStatsBanner.tsx   # Banner statistik & fitur platform
│       ├── SearchModal.tsx         # Modal pencarian instan
│       ├── WeeklySchedule.tsx      # Modal jadwal mingguan lengkap
│       ├── WatchlistDrawer.tsx     # Drawer bookmark & riwayat nonton
│       ├── DetailsModal.tsx        # Modal rincian donghua & episode picker
│       ├── WatchModal.tsx          # Modal video player multi-server
│       └── Footer.tsx              # Footer aplikasi
```

---

## 📜 Skrip NPM

| Perintah | Fungsi |
| :--- | :--- |
| `npm run dev` | Menjalankan development server Next.js (`next dev`) |
| `npm run build` | Membangun aplikasi untuk produksi (`next build`) |
| `npm start` | Menjalankan server produksi (`next start`) |
| `npm run lint` | Menjalankan ESLint (`next lint`) |
| `npm run clean` | Menghapus folder `.next` (cache build) |

---

## ⚠️ Disclaimer
Aplikasi ini ditujukan untuk tujuan edukasi dan demonstrasi integrasi antarmuka modern. Semua konten video, gambar, dan media dimiliki oleh pemegang hak cipta masing-masing.
