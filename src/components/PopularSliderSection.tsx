import React, { useRef, useState } from 'react';
import { Flame, Trophy, Star, Crown, TrendingUp, ChevronLeft, ChevronRight, LayoutGrid, Rows } from 'lucide-react';
import { DonghuaCardItem, MAX_VISIBLE_CARDS } from '../types';
import { DonghuaCard } from './DonghuaCard';

interface PopularSliderSectionProps {
  popularToday: DonghuaCardItem[];
  donghuaPopular?: {
    weekly: DonghuaCardItem[];
    monthly: DonghuaCardItem[];
    allTime: DonghuaCardItem[];
  };
  onSelect: (item: DonghuaCardItem) => void;
  onWatch: (item: DonghuaCardItem) => void;
  onToggleBookmark: (item: DonghuaCardItem) => void;
  isBookmarked: (slug: string) => boolean;
}

export const PopularSliderSection: React.FC<PopularSliderSectionProps> = ({
  popularToday,
  donghuaPopular,
  onSelect,
  onWatch,
  onToggleBookmark,
  isBookmarked
}) => {
  const [tab, setTab] = useState<'today' | 'weekly' | 'monthly' | 'allTime'>('today');
  const [viewMode, setViewMode] = useState<'slider' | 'grid'>('slider');
  const sliderRef = useRef<HTMLDivElement>(null);

  let activeList = popularToday;
  let sectionSubtitle = 'Donghua paling banyak ditonton hari ini';

  if (tab === 'weekly' && donghuaPopular?.weekly?.length) {
    activeList = donghuaPopular.weekly;
    sectionSubtitle = 'Top 10 donghua paling populer minggu ini';
  } else if (tab === 'monthly' && donghuaPopular?.monthly?.length) {
    activeList = donghuaPopular.monthly;
    sectionSubtitle = 'Peringkat donghua terfavorit bulan ini';
  } else if (tab === 'allTime' && donghuaPopular?.allTime?.length) {
    activeList = donghuaPopular.allTime;
    sectionSubtitle = 'Donghua legendaris dengan penonton terbanyak sepanjang masa';
  }

  const visibleList = activeList.slice(0, MAX_VISIBLE_CARDS);

  const handleScroll = (direction: 'left' | 'right') => {
    if (sliderRef.current) {
      const scrollAmount = direction === 'left' ? -380 : 380;
      sliderRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <section id="popular" className="py-6 sm:py-8">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-warn/20 border border-warn/30 flex items-center justify-center text-warn shrink-0">
            <Flame className="w-5 h-5 fill-warn" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-ink tracking-tight flex items-center gap-2">
              Peringkat & Populer
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-warn/20 text-warn font-semibold border border-warn/30 flex items-center gap-1">
                <Crown className="w-3 h-3" /> Top Chart
              </span>
            </h2>
            <p className="text-xs text-mute">{sectionSubtitle}</p>
          </div>
        </div>

        {/* Tab Switcher & Display Controls */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* Tabs */}
          <div className="flex items-center gap-1 p-1 bg-surface rounded-2xl border border-line overflow-x-auto no-scrollbar">
            <button
              onClick={() => setTab('today')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                tab === 'today'
                  ? 'bg-accent text-white shadow-sm border border-line-strong'
                  : 'text-mute hover:text-ink hover:bg-line'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Hari Ini ({popularToday?.length || 0})</span>
            </button>

            <button
              onClick={() => setTab('weekly')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                tab === 'weekly'
                  ? 'bg-accent text-white shadow-sm border border-line-strong'
                  : 'text-mute hover:text-ink hover:bg-line'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Mingguan ({donghuaPopular?.weekly?.length || 0})</span>
            </button>

            <button
              onClick={() => setTab('monthly')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                tab === 'monthly'
                  ? 'bg-accent text-white shadow-sm border border-line-strong'
                  : 'text-mute hover:text-ink hover:bg-line'
              }`}
            >
              <Star className="w-3.5 h-3.5" />
              <span>Bulanan ({donghuaPopular?.monthly?.length || 0})</span>
            </button>

            <button
              onClick={() => setTab('allTime')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                tab === 'allTime'
                  ? 'bg-accent text-white shadow-sm border border-line-strong'
                  : 'text-mute hover:text-ink hover:bg-line'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>All-Time ({donghuaPopular?.allTime?.length || 0})</span>
            </button>
          </div>

          {/* Toggle Slider vs Grid & Navigation Arrows */}
          <div className="flex items-center gap-1.5">
            <div className="flex items-center p-1 bg-surface rounded-2xl border border-line">
              <button
                onClick={() => setViewMode('slider')}
                className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                  viewMode === 'slider'
                    ? 'bg-accent text-white shadow'
                    : 'text-mute hover:text-ink'
                }`}
                title="Slide ke samping (Carousel)"
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

      {/* Content Rendering: Slider / Carousel Mode vs Grid Mode */}
      {viewMode === 'slider' ? (
        <div
          ref={sliderRef}
          className="flex items-stretch gap-2.5 sm:gap-4 overflow-x-auto pb-4 pt-1 scroll-smooth snap-x snap-mandatory no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {visibleList.map((item, index) => (
            <div
              key={item.slug || `${item.title}-${index}`}
              className="w-[140px] xs:w-[160px] sm:w-[190px] md:w-[210px] shrink-0 snap-start"
            >
              <DonghuaCard
                item={item}
                rank={tab !== 'today' ? item.rank || index + 1 : undefined}
                onSelect={onSelect}
                onWatch={onWatch}
                onToggleBookmark={onToggleBookmark}
                isBookmarked={isBookmarked(item.slug)}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-4">
          {visibleList.map((item, index) => (
            <DonghuaCard
              key={item.slug || `${item.title}-${index}`}
              item={item}
              rank={tab !== 'today' ? item.rank || index + 1 : undefined}
              onSelect={onSelect}
              onWatch={onWatch}
              onToggleBookmark={onToggleBookmark}
              isBookmarked={isBookmarked(item.slug)}
            />
          ))}
        </div>
      )}
    </section>
  );
};
