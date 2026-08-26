import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Play, Info, ChevronLeft, ChevronRight, Sparkles, Bookmark, Check } from 'lucide-react';
import { DonghuaRecommendation, DonghuaCardItem } from '../types';

interface SpotlightHeroProps {
  recommendations: DonghuaRecommendation[];
  onOpenDetail: (slug: string) => void;
  onWatch: (slug: string, title?: string) => void;
  onToggleBookmark: (item: DonghuaCardItem) => void;
  isBookmarked: (slug: string) => boolean;
}

export const SpotlightHero: React.FC<SpotlightHeroProps> = ({
  recommendations,
  onOpenDetail,
  onWatch,
  onToggleBookmark,
  isBookmarked
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  useEffect(() => {
    if (!recommendations || recommendations.length <= 1 || isPaused) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % recommendations.length);
    }, 7000);
    return () => clearInterval(interval);
  }, [recommendations, isPaused]);

  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  const current = recommendations[currentIndex] || recommendations[0];
  const bookmarked = isBookmarked(current.slug);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + recommendations.length) % recommendations.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % recommendations.length);
  };

  // Mobile touch swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
    setIsPaused(true);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diffX = touchStartX - touchEndX;

    if (Math.abs(diffX) > 45) {
      if (diffX > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
    setTouchStartX(null);
    setIsPaused(false);
  };

  const currentCardItem: DonghuaCardItem = {
    title: current.title,
    slug: current.slug,
    link: current.link,
    cover: current.cover,
    type: '3D Donghua',
    status: 'Ongoing',
    subStatus: 'Sub Indo'
  };

  return (
    <section
      id="spotlight"
      className="w-full pt-18 sm:pt-24 pb-3 sm:pb-6"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        {/* Lightweight Modern Hero Banner Container */}
        <div className="relative flex items-end min-h-[420px] sm:min-h-[480px] rounded-2xl sm:rounded-3xl overflow-hidden bg-elevated border border-line">
          {/* Subtle Ambient Background Lighting */}
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            <Image
              src={current.cover}
              alt=""
              aria-hidden="true"
              fill
              decoding="async"
              sizes="100vw"
              className="w-full h-full object-cover object-center opacity-60 sm:opacity-45 lg:opacity-25 transition-opacity duration-500"
            />
            {/* Smooth dark overlay gradients */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-transparent sm:via-black/85 sm:to-black/60" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/35 to-transparent sm:from-black sm:via-black/90" />
            <div className="absolute top-0 right-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl pointer-events-none" />
          </div>

          {/* Banner Content */}
          <div className="relative z-10 w-full p-4 sm:p-8 md:p-10">
            <div className="flex items-center gap-3 sm:gap-6 lg:gap-8">
              {/* Left Column: Information & Actions */}
              <div className="flex-1 min-w-0 space-y-3 sm:space-y-4">
                {/* Badges */}
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1 rounded-xl text-[11px] sm:text-xs font-semibold bg-accent/20 border border-accent-soft/40 text-accent-soft">
                    <Sparkles className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-accent-soft" />
                    Rekomendasi #{currentIndex + 1}
                  </span>
                  <span className="px-2.5 py-1 rounded-xl text-[11px] sm:text-xs font-medium bg-white/10 text-white border border-white/20">
                    3D Cultivation
                  </span>
                  <span className="px-2.5 py-1 rounded-xl text-[11px] sm:text-xs font-semibold bg-ok/20 text-ok border border-ok/30">
                    Sub Indo HD
                  </span>
                </div>

                {/* Title */}
                <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight line-clamp-2">
                  {current.title}
                </h1>

                {/* Synopsis */}
                <p className="text-sm sm:text-base text-white/80 line-clamp-2 sm:line-clamp-3 max-w-2xl leading-relaxed">
                  {current.synopsis || 'Petualangan kultivasi epik dengan grafis animasi memukau, pertempuran jurus sihir legendaris, dan alur cerita petualangan menegangkan.'}
                </p>

                {/* Action Buttons & Navigation */}
                <div className="flex items-center gap-2 sm:gap-3 pt-1">
                  <button
                    onClick={() => onWatch(current.slug, current.title)}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 sm:px-7 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-accent hover:scale-[1.02] active:scale-95 text-white font-semibold text-xs sm:text-sm shadow-sm transition-all cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-white ml-0.5" />
                    <span>Nonton Sekarang</span>
                  </button>

                  <button
                    onClick={() => onOpenDetail(current.slug)}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-white/10 hover:bg-white/20 active:scale-95 text-white font-semibold text-xs sm:text-sm border border-white/20 transition-all cursor-pointer"
                  >
                    <Info className="w-4 h-4 text-accent-soft" />
                    <span>Detail</span>
                  </button>

                  <button
                    onClick={() => onToggleBookmark(currentCardItem)}
                    className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border transition-all cursor-pointer active:scale-95 shrink-0 ${
                      bookmarked
                        ? 'bg-accent/30 border-accent-soft/40 text-accent-soft'
                        : 'bg-white/10 hover:bg-white/20 border-white/20 text-white'
                    }`}
                    title={bookmarked ? 'Hapus Bookmark' : 'Simpan ke Bookmark'}
                  >
                    {bookmarked ? <Check className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Right Column: Compact Poster Preview (desktop only — mobile uses the full-bleed artwork) */}
              <div className="hidden sm:block shrink-0">
                <div
                  onClick={() => onOpenDetail(current.slug)}
                  className="relative group w-20 sm:w-40 lg:w-52 xl:w-60 aspect-[3/4] rounded-xl sm:rounded-2xl overflow-hidden border border-line hover:border-accent-soft/40 hover:shadow-lg bg-surface cursor-pointer transition-all duration-300"
                >
                  <Image
                    src={current.cover}
                    alt={current.title}
                    fill
                    decoding="async"
                    sizes="240px"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent hidden sm:block" />
                  <div className="absolute bottom-3 left-3 right-3 hidden sm:flex items-center justify-between">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-black/80 text-accent-soft border border-line">
                      Rekomendasi #{currentIndex + 1}
                    </span>
                    <span className="text-[11px] font-medium text-white/70">
                      {currentIndex + 1} / {recommendations.length}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Banner Bottom Controls */}
            <div className="flex items-center justify-between pt-3.5 sm:pt-4 mt-4 sm:mt-5 border-t border-line">
              {/* Slide Indicators */}
              <div className="flex items-center gap-1.5">
                {recommendations.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                      idx === currentIndex
                        ? 'w-6 sm:w-7 bg-accent'
                        : 'w-2 bg-white/25 hover:bg-white/50'
                    }`}
                    title={`Ke rekomendasi ${idx + 1}`}
                  />
                ))}
              </div>

              {/* Prev / Next Arrows */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handlePrev}
                  className="w-7 sm:w-8 h-7 sm:h-8 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white border border-white/20 flex items-center justify-center transition-colors cursor-pointer"
                  title="Sebelumnya"
                >
                  <ChevronLeft className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                </button>
                <button
                  onClick={handleNext}
                  className="w-7 sm:w-8 h-7 sm:h-8 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white border border-white/20 flex items-center justify-center transition-colors cursor-pointer"
                  title="Selanjutnya"
                >
                  <ChevronRight className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

