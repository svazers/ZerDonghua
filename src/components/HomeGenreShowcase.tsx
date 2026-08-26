import React, { useState, useEffect, useRef } from 'react';
import { Layers, Sparkles, ChevronLeft, ChevronRight, Rows, LayoutGrid, Play, Info, Bookmark, Check, RefreshCw } from 'lucide-react';
import { donghuaApi } from '../services/donghuaApi';
import { DonghuaCardItem } from '../types';
import { DonghuaCard } from './DonghuaCard';

interface HomeGenreShowcaseProps {
  selectedGenre: string;
  genres: Array<{ name: string; slug: string; count?: string }>;
  onSelectGenre: (slug: string) => void;
  onSelect: (item: DonghuaCardItem) => void;
  onWatch: (item: DonghuaCardItem) => void;
  onToggleBookmark: (item: DonghuaCardItem) => void;
  isBookmarked: (slug: string) => boolean;
}

export const HomeGenreShowcase: React.FC<HomeGenreShowcaseProps> = ({
  selectedGenre,
  genres,
  onSelectGenre,
  onSelect,
  onWatch,
  onToggleBookmark,
  isBookmarked
}) => {
  const [items, setItems] = useState<DonghuaCardItem[]>([]);
  const [page, setPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'slider' | 'grid'>('slider');
  const [hasMore, setHasMore] = useState<boolean>(true);
  const sliderRef = useRef<HTMLDivElement>(null);

  const activeGenreObj = genres.find((g) => g.slug === selectedGenre) || {
    name: selectedGenre || 'Cultivation',
    slug: selectedGenre || 'cultivation'
  };

  useEffect(() => {
    if (!selectedGenre) return;
    setLoading(true);
    donghuaApi
      .getDonghuaByGenre(selectedGenre, page)
      .then((data) => {
        setItems(data.results || []);
        setHasMore(data.pagination?.hasNextPage ?? false);
      })
      .catch((err) => console.error('Failed to load genre donghua:', err))
      .finally(() => setLoading(false));
  }, [selectedGenre, page]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (sliderRef.current) {
      const scrollAmount = direction === 'left' ? -380 : 380;
      sliderRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (!selectedGenre && items.length === 0) return null;

  return (
    <section id="genre-showcase" className="py-6 sm:py-8">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-accent/20 border border-accent-soft/40 flex items-center justify-center text-accent-soft shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-ink tracking-tight flex items-center gap-2">
              Koleksi Genre: {activeGenreObj.name}
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-accent/20 text-accent-soft font-semibold border border-accent-soft/40">
                {items.length} Judul
              </span>
            </h2>
            <p className="text-xs text-mute">
              Jelajahi serial donghua terbaik dalam kategori {activeGenreObj.name}
            </p>
          </div>
        </div>

        {/* Quick Genre Switcher & View Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Pill Switcher for popular genres */}
          <div className="flex items-center gap-1 p-1 bg-surface rounded-2xl border border-line overflow-x-auto no-scrollbar max-w-full">
            {['action', 'cultivation', 'fantasy', 'martial-arts', 'sci-fi', 'romance', '2d'].map((gSlug) => {
              const matched = genres.find((g) => g.slug === gSlug) || { name: gSlug, slug: gSlug };
              const isActive = selectedGenre === gSlug;
              return (
                <button
                  key={gSlug}
                  onClick={() => {
                    setPage(1);
                    onSelectGenre(gSlug);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap capitalize ${
                    isActive
                      ? 'bg-accent text-white shadow-sm border border-line-strong'
                      : 'text-mute hover:text-ink hover:bg-line'
                  }`}
                >
                  {matched.name}
                </button>
              );
            })}
          </div>

          {/* View Mode Toggle & Arrows */}
          <div className="flex items-center gap-1.5">
            <div className="flex items-center p-1 bg-surface rounded-2xl border border-line">
              <button
                onClick={() => setViewMode('slider')}
                className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                  viewMode === 'slider'
                    ? 'bg-accent text-white shadow'
                    : 'text-mute hover:text-ink'
                }`}
                title="Slide ke samping"
              >
                <Rows className="w-3.5 h-3.5 rotate-90" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-accent text-white shadow'
                    : 'text-mute hover:text-ink'
                }`}
                title="Tampilan Grid"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
            </div>

            {viewMode === 'slider' && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleScroll('left')}
                  className="w-8 h-8 rounded-xl bg-line hover:bg-line-strong active:scale-95 border border-line flex items-center justify-center text-sub hover:text-ink transition-all cursor-pointer"
                  title="Geser ke kiri"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleScroll('right')}
                  className="w-8 h-8 rounded-xl bg-line hover:bg-line-strong active:scale-95 border border-line flex items-center justify-center text-sub hover:text-ink transition-all cursor-pointer"
                  title="Geser ke kanan"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content Rendering */}
      {loading ? (
        <div className="py-16 text-center text-mute rounded-3xl bg-white/[0.02] border border-line space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin mx-auto" />
          <p className="text-xs">Memuat koleksi {activeGenreObj.name}...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="py-12 text-center text-mute rounded-3xl bg-white/[0.02] border border-line space-y-2">
          <p className="text-sm font-semibold">Tidak ada donghua ditemukan untuk genre ini.</p>
        </div>
      ) : viewMode === 'slider' ? (
        <div
          ref={sliderRef}
          className="flex items-stretch gap-3 sm:gap-4 overflow-x-auto pb-4 pt-1 scroll-smooth snap-x snap-mandatory no-scrollbar"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {items.map((item, index) => (
            <div
              key={item.slug || `${item.title}-${index}`}
              className="w-[160px] sm:w-[185px] md:w-[200px] shrink-0 snap-start"
            >
              <DonghuaCard
                item={item}
                onSelect={onSelect}
                onWatch={onWatch}
                onToggleBookmark={onToggleBookmark}
                isBookmarked={isBookmarked(item.slug)}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {items.map((item, index) => (
              <DonghuaCard
                key={item.slug || `${item.title}-${index}`}
                item={item}
                onSelect={onSelect}
                onWatch={onWatch}
                onToggleBookmark={onToggleBookmark}
                isBookmarked={isBookmarked(item.slug)}
              />
            ))}
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-4 py-2 rounded-xl bg-ink/5 hover:bg-ink/10 disabled:opacity-30 disabled:pointer-events-none text-ink text-xs font-bold border border-line transition-colors"
            >
              Halaman Sebelumnya
            </button>
            <span className="text-xs text-mute font-semibold px-2">
              Halaman {page}
            </span>
            <button
              disabled={!hasMore}
              onClick={() => setPage((p) => p + 1)}
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-30 disabled:pointer-events-none text-ink text-xs font-bold shadow-lg shadow-cyan-950 transition-all"
            >
              Halaman Selanjutnya
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
