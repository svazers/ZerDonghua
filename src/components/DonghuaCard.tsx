import React from 'react';
import Image from 'next/image';
import { Play, Flame, Bookmark, Check } from 'lucide-react';
import { DonghuaCardItem } from '../types';

interface DonghuaCardProps {
  item: DonghuaCardItem;
  onSelect: (item: DonghuaCardItem) => void;
  onWatch: (item: DonghuaCardItem) => void;
  onToggleBookmark: (item: DonghuaCardItem) => void;
  isBookmarked: boolean;
  rank?: number;
}

export const DonghuaCard: React.FC<DonghuaCardProps> = ({
  item,
  onSelect,
  onWatch,
  onToggleBookmark,
  isBookmarked,
  rank
}) => {
  return (
    <div
      className="group relative flex flex-col rounded-xl sm:rounded-2xl bg-elevated hover:bg-elevated active:bg-surface border border-line hover:border-accent-soft/40 p-2 sm:p-2.5 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer select-none"
      onClick={() => onSelect(item)}
    >
      {/* Poster Media Box */}
      <div className="relative aspect-[3/4] w-full rounded-lg sm:rounded-xl overflow-hidden bg-canvas border border-line">
        <Image
          src={item.cover}
          alt={item.title}
          fill
          loading="lazy"
          decoding="async"
          sizes="(max-width: 640px) 45vw, 200px"
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />

        {/* Gradient Shadow Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity pointer-events-none" />

        {/* Badges Top Left */}
        <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 flex flex-col gap-1 items-start z-10 pointer-events-none">
          {rank !== undefined && (
            <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-md sm:rounded-lg bg-accent font-black text-white text-[10px] sm:text-xs flex items-center justify-center shadow-md">
              #{rank}
            </span>
          )}
          {item.hot && (
            <span className="px-1.5 py-0.5 rounded-md text-[9px] sm:text-[10px] font-extrabold bg-warn text-white flex items-center gap-0.5">
              <Flame className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-white" /> HOT
            </span>
          )}
          {item.type && (
            <span className="px-1.5 py-0.5 rounded-md text-[9px] sm:text-[10px] font-semibold bg-black/80 text-white border border-white/20 hidden xs:inline-block">
              {item.type}
            </span>
          )}
        </div>

        {/* Top Right: Bookmark Button (Optimized Touch Target) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleBookmark(item);
          }}
          className={`absolute top-1.5 right-1.5 sm:top-2 sm:right-2 p-2 rounded-xl transition-all z-20 cursor-pointer active:scale-90 ${
            isBookmarked
              ? 'bg-accent text-white shadow-md'
              : 'bg-black/75 hover:bg-accent text-white hover:text-white border border-white/20'
          }`}
          title={isBookmarked ? 'Hapus dari bookmark' : 'Simpan ke bookmark'}
        >
          {isBookmarked ? <Check className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
        </button>

        {/* Bottom Badges on Image */}
        <div className="absolute bottom-1.5 left-1.5 right-1.5 sm:bottom-2 sm:left-2 sm:right-2 flex items-center justify-between gap-1 text-[10px] sm:text-[11px] font-bold z-10 pointer-events-none">
          {item.episode ? (
            <span className="px-1.5 sm:px-2 py-0.5 rounded-md bg-accent text-white shadow-sm truncate max-w-[60%]">
              {item.episode}
            </span>
          ) : (
            <span className="px-1.5 sm:px-2 py-0.5 rounded-md bg-black/80 text-white border border-white/20 truncate">
              {item.status || 'Ongoing'}
            </span>
          )}

          {item.subStatus ? (
            <span className="px-1.5 sm:px-2 py-0.5 rounded-md bg-ok/20 text-ok border border-ok/30 shrink-0">
              {item.subStatus}
            </span>
          ) : item.rating ? (
            <span className="px-1.5 sm:px-2 py-0.5 rounded-md bg-warn/20 text-warn border border-warn/30 shrink-0">
              ★ {item.rating}
            </span>
          ) : null}
        </div>

        {/* Center Hover Play Icon */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-15">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onWatch(item);
            }}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-accent hover:scale-105 active:scale-95 text-white flex items-center justify-center shadow-sm transition-transform cursor-pointer border border-line-strong"
            title="Nonton Sekarang"
          >
            <Play className="w-4 h-4 fill-white ml-0.5" />
          </button>
        </div>
      </div>

      {/* Info Section */}
      <div className="mt-1.5 sm:mt-2 space-y-0.5 sm:space-y-1 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-xs sm:text-sm font-semibold text-ink group-hover:text-accent-soft line-clamp-2 transition-colors leading-tight">
            {item.title}
          </h3>
          {item.seriesTitle && item.seriesTitle !== item.title && (
            <p className="text-[10px] sm:text-[11px] text-mute line-clamp-1 mt-0.5">
              {item.seriesTitle}
            </p>
          )}
        </div>

        {/* Genre Tags if any */}
        {item.genres && item.genres.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {item.genres.slice(0, 2).map((g) => (
              <span
                key={g.slug || g.name}
                className="text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded bg-line text-mute border border-line"
              >
                {g.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

