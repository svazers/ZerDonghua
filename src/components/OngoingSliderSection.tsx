import React, { useRef, useState } from 'react';
import { Radio, Play, ChevronLeft, ChevronRight, Rows, LayoutGrid, Sparkles, Flame, Eye } from 'lucide-react';
import { DonghuaCardItem, MAX_VISIBLE_CARDS } from '../types';
import { DonghuaCard } from './DonghuaCard';

interface OngoingSliderSectionProps {
  donghuaBaru: Array<DonghuaCardItem & { episode?: string }>;
  onSelect: (item: DonghuaCardItem) => void;
  onWatch: (item: DonghuaCardItem) => void;
  onToggleBookmark: (item: DonghuaCardItem) => void;
  isBookmarked: (slug: string) => boolean;
}

export const OngoingSliderSection: React.FC<OngoingSliderSectionProps> = ({
  donghuaBaru,
  onSelect,
  onWatch,
  onToggleBookmark,
  isBookmarked
}) => {
  const [viewMode, setViewMode] = useState<'slider' | 'grid'>('slider');
  const sliderRef = useRef<HTMLDivElement>(null);

  if (!donghuaBaru || donghuaBaru.length === 0) return null;

  const visible = donghuaBaru.slice(0, MAX_VISIBLE_CARDS);

  const handleScroll = (direction: 'left' | 'right') => {
    if (sliderRef.current) {
      const scrollAmount = direction === 'left' ? -380 : 380;
      sliderRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <section id="ongoing" className="py-6 sm:py-8">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-ok/20 border border-ok/30 flex items-center justify-center text-ok shrink-0">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-ink tracking-tight flex items-center gap-2">
              Sedang Tayang
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-ok/20 text-ok font-semibold border border-ok/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-ok animate-ping" />
                Ongoing Series
              </span>
            </h2>
            <p className="text-xs text-mute">
              Serial donghua yang sedang berlangsung dan paling aktif diperbarui saat ini
            </p>
          </div>
        </div>

        {/* View Mode Switcher & Arrows */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
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

      {/* Content Rendering: Slider or Grid */}
      {viewMode === 'slider' ? (
        <div
          ref={sliderRef}
          className="flex items-stretch gap-2.5 sm:gap-4 overflow-x-auto pb-4 pt-1 scroll-smooth snap-x snap-mandatory no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {visible.map((item, index) => {
            const cardItem: DonghuaCardItem = {
              title: item.title,
              slug: item.slug,
              link: item.link,
              cover: item.cover || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&q=80',
              episode: item.episode,
              type: item.type || '3D Ongoing',
              status: 'Ongoing',
              subStatus: 'Sub Indo',
              hot: true
            };

            return (
              <div
                key={item.slug || `${item.title}-${index}`}
                className="w-[140px] xs:w-[160px] sm:w-[185px] md:w-[200px] shrink-0 snap-start"
              >
                <DonghuaCard
                  item={cardItem}
                  onSelect={onSelect}
                  onWatch={onWatch}
                  onToggleBookmark={onToggleBookmark}
                  isBookmarked={isBookmarked(item.slug)}
                />
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-4">
          {visible.map((item, index) => {
            const cardItem: DonghuaCardItem = {
              title: item.title,
              slug: item.slug,
              link: item.link,
              cover: item.cover || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&q=80',
              episode: item.episode,
              type: item.type || '3D Ongoing',
              status: 'Ongoing',
              subStatus: 'Sub Indo',
              hot: true
            };

            return (
              <DonghuaCard
                key={item.slug || `${item.title}-${index}`}
                item={cardItem}
                onSelect={onSelect}
                onWatch={onWatch}
                onToggleBookmark={onToggleBookmark}
                isBookmarked={isBookmarked(item.slug)}
              />
            );
          })}
        </div>
      )}
    </section>
  );
};
