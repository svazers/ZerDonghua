import React from 'react';
import { Home, Search, Calendar, Bookmark } from 'lucide-react';

interface MobileBottomNavProps {
  activeTab: 'home' | 'search' | 'schedule' | 'watchlist';
  bookmarkCount: number;
  onNavigateHome: () => void;
  onOpenSearch: () => void;
  onOpenSchedule: () => void;
  onOpenWatchlist: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  bookmarkCount,
  onNavigateHome,
  onOpenSearch,
  onOpenSchedule,
  onOpenWatchlist,
}) => {
  return (
    <nav
      id="mobile-bottom-nav"
      aria-label="Mobile Bottom Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 pointer-events-none"
    >
      {/* Floating Bottom Nav Container */}
      <div className="max-w-md mx-auto pointer-events-auto rounded-3xl bg-surface/95 border border-line shadow-lg px-2 py-1.5 flex items-center justify-around">
        {/* Home Item */}
        <button
          onClick={onNavigateHome}
          className={`flex-1 flex flex-col items-center justify-center py-1.5 px-2 rounded-2xl transition-all cursor-pointer select-none active:scale-95 relative ${
            activeTab === 'home'
              ? 'text-accent-soft font-bold'
              : 'text-mute hover:text-ink'
          }`}
          title="Beranda"
        >
          {activeTab === 'home' && (
            <span className="absolute -top-1 w-6 h-1 rounded-full bg-accent" />
          )}
          <div
            className={`p-1 rounded-xl transition-all ${
              activeTab === 'home' ? 'bg-accent/20 text-accent-soft' : ''
            }`}
          >
            <Home className="w-5 h-5" />
          </div>
          <span className="text-[10px] tracking-tight leading-none mt-1">
            Beranda
          </span>
        </button>

        {/* Search Item */}
        <button
          onClick={onOpenSearch}
          className="flex-1 flex flex-col items-center justify-center py-1.5 px-2 rounded-2xl text-mute hover:text-ink transition-all cursor-pointer select-none active:scale-95 group"
          title="Cari Donghua"
        >
          <div className="p-1 rounded-xl group-hover:text-accent-soft group-hover:bg-line transition-all">
            <Search className="w-5 h-5" />
          </div>
          <span className="text-[10px] tracking-tight leading-none mt-1 group-hover:text-ink">
            Cari
          </span>
        </button>

        {/* Schedule Item */}
        <button
          onClick={onOpenSchedule}
          className="flex-1 flex flex-col items-center justify-center py-1.5 px-2 rounded-2xl text-mute hover:text-ink transition-all cursor-pointer select-none active:scale-95 group"
          title="Jadwal Rilis"
        >
          <div className="p-1 rounded-xl group-hover:text-accent-soft group-hover:bg-line transition-all">
            <Calendar className="w-5 h-5" />
          </div>
          <span className="text-[10px] tracking-tight leading-none mt-1 group-hover:text-ink">
            Jadwal
          </span>
        </button>

        {/* Watchlist / Bookmark Item */}
        <button
          onClick={onOpenWatchlist}
          className="flex-1 flex flex-col items-center justify-center py-1.5 px-2 rounded-2xl text-mute hover:text-ink transition-all cursor-pointer select-none active:scale-95 group relative"
          title="Watchlist & Riwayat"
        >
          <div className="p-1 rounded-xl group-hover:text-accent-soft group-hover:bg-line transition-all relative">
            <Bookmark className="w-5 h-5" />
            {bookmarkCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-accent border border-line-strong text-white text-[9px] font-black flex items-center justify-center shadow-md">
                {bookmarkCount > 99 ? '99+' : bookmarkCount}
              </span>
            )}
          </div>
          <span className="text-[10px] tracking-tight leading-none mt-1 group-hover:text-ink">
            Watchlist
          </span>
        </button>
      </div>
    </nav>
  );
};
