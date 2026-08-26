import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Layers, Rows, LayoutGrid } from 'lucide-react';
import { donghuaApi } from '../services/donghuaApi';
import { DonghuaCardItem } from '../types';
import { DonghuaCard } from './DonghuaCard';

interface GenreRailSectionProps {
  genreSlug: string;
  onSelect: (item: DonghuaCardItem) => void;
  onWatch: (item: DonghuaCardItem) => void;
  onToggleBookmark: (item: DonghuaCardItem) => void;
  isBookmarked: (slug: string) => boolean;
}

const genreTitle = (slug: string) =>
  slug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join('');

export const GenreRailSection: React.FC<GenreRailSectionProps> = ({
  genreSlug,
  onSelect,
  onWatch,
  onToggleBookmark,
  isBookmarked
}) => {
  const [items, setItems] = useState<DonghuaCardItem[]>([]);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'slider' | 'grid'>('slider');
  const sliderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setPage(1);
    setItems([]);
    donghuaApi
      .getDonghuaByGenre(genreSlug, 1)
      .then((data) => {
        if (!alive) return;
        setItems(data.results || []);
        setHasMore(data.pagination?.hasNextPage ?? false);
      })
      .catch((err) => console.error(`Failed to load genre ${genreSlug}:`, err))
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [genreSlug]);

  const handleLoadMore = () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    donghuaApi
      .getDonghuaByGenre(genreSlug, page + 1)
      .then((data) => {
        setItems((prev) => [...prev, ...(data.results || [])]);
        setHasMore(data.pagination?.hasNextPage ?? false);
        setPage((p) => p + 1);
      })
      .catch((err) => console.error(`Failed to load more ${genreSlug}:`, err))
      .finally(() => setLoadingMore(false));
  };

  const handleScroll = (direction: 'left' | 'right') => {
    sliderRef.current?.scrollBy({ left: direction === 'left' ? -380 : 380, behavior: 'smooth' });
  };

  if (!loading && items.length === 0) return null;

  return (
    <section id={`genre-${genreSlug}`}>
      {/* Section Header */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-2xl bg-accent/20 border border-accent-soft/40 flex items-center justify-center text-accent-soft shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-ink tracking-tight truncate">
            Genre {genreTitle(genreSlug)}
          </h2>
          {!loading && items.length > 0 && (
            <span className="hidden sm:inline text-xs px-2.5 py-0.5 rounded-full bg-accent/20 text-accent-soft font-semibold border border-accent-soft/40 shrink-0">
              {items.length} Judul
            </span>
          )}
        </div>

        {/* View Mode Toggle & Prev / Next Arrows */}
        <div className="flex items-center gap-1.5 shrink-0">
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
            <>
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
            </>
          )}
        </div>
      </div>

      {/* Cards */}
      {loading ? (
        <div className="flex gap-3 sm:gap-4 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="w-[160px] sm:w-[185px] shrink-0 aspect-[3/4.4] rounded-2xl bg-white/[0.04] border border-line animate-pulse"
            />
          ))}
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
        <div className="space-y-5">
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

          {hasMore && (
            <div className="flex justify-center">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="px-5 py-2 rounded-xl bg-accent/25 hover:bg-accent/40 active:scale-95 disabled:opacity-50 disabled:pointer-events-none border border-accent-soft/40 text-xs font-bold text-accent-soft transition-all cursor-pointer inline-flex items-center gap-2"
              >
                {loadingMore && (
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-accent-soft border-t-transparent animate-spin" />
                )}
                {loadingMore ? 'Memuat...' : 'Tampilkan Lebih Banyak'}
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
