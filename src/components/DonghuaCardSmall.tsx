import React from 'react';
import { SafeImage as Image } from './SafeImage';
import { Play } from 'lucide-react';
import { DonghuaCardItem } from '../types';

interface SmallCardProps {
  item: DonghuaCardItem;
  onWatch: (item: DonghuaCardItem) => void;
}

// ponytail: compact card used in the watch modal "populer" rail; reuses SafeImage
// + /api/img proxy so Cloudflare Referer-403 doesn't blank posters.
export const DonghuaCardSmall: React.FC<SmallCardProps> = ({ item, onWatch }) => (
  <div className="relative flex items-center gap-2 rounded-lg sm:rounded-xl bg-elevated hover:bg-line active:bg-line transition-all border border-line hover:border-accent-soft/30 overflow-hidden shrink-0 w-full">
    <div className="relative aspect-[3/4] w-12 h-16 sm:w-14 sm:h-20 rounded-none sm:rounded-l-xl overflow-hidden bg-canvas border-r border-line shrink-0">
      <Image
        src={item.cover}
        alt={item.title}
        fill
        loading="lazy"
        decoding="async"
        sizes="56px"
        className="object-cover"
      />
    </div>
    <span
      title={item.title}
      className="flex-1 min-w-0 text-[10px] sm:text-xs font-semibold text-sub line-clamp-2 cursor-pointer"
      onClick={() => onWatch(item)}
    >
      {item.title}
    </span>
    <button
      onClick={() => onWatch(item)}
      className="m-1.5 sm:m-2 w-7 h-7 rounded-md bg-accent text-white flex items-center justify-center text-xs shrink-0 active:scale-90"
      title="Nonton"
    >
      <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
    </button>
  </div>
);
