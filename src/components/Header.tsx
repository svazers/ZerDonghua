import React, { useState, useEffect } from 'react';
import { Search, Bookmark, Calendar, Sparkles, Film, Flame, Menu, X, Sun, Moon } from 'lucide-react';
import { ZerDonghuaLogo } from './ZerDonghuaLogo';

interface HeaderProps {
  onOpenSearch: () => void;
  onOpenWatchlist: () => void;
  onOpenSchedule: () => void;
  onSelectGenre: (genre: string) => void;
  bookmarkCount: number;
  activeSection: string;
  onNavigateSection: (sectionId: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSearch,
  onOpenWatchlist,
  onOpenSchedule,
  onSelectGenre,
  bookmarkCount,
  activeSection,
  onNavigateSection
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    setIsDark(document.documentElement.classList.contains('dark'));
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle('dark', next);
    try { localStorage.setItem('theme', next ? 'dark' : 'light'); } catch {}
  };

  return (
    <header
      id="main-header"
      className={`fixed top-0 left-0 right-0 z-40 bg-canvas/90 border-b border-line transition-all duration-300 ${
        isScrolled ? 'py-3 shadow-sm' : 'py-4 sm:py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4">
        {/* Logo Branding */}
        <div className="flex items-center gap-6 min-w-0">
          <button
            onClick={() => onNavigateSection('spotlight')}
            className="text-left cursor-pointer focus:outline-none focus:ring-1 focus:ring-accent-soft/40 rounded-2xl min-w-0"
            title="ZerDonghua Home"
          >
            <ZerDonghuaLogo size="md" showBadge={false} />
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-surface p-1 rounded-2xl border border-line">
            <button
              onClick={() => onNavigateSection('spotlight')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeSection === 'spotlight'
                  ? 'bg-accent text-white shadow-sm'
                  : 'text-mute hover:text-ink hover:bg-line'
              }`}
            >
              Spotlight
            </button>
            <button
              onClick={() => onNavigateSection('popular')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeSection === 'popular'
                  ? 'bg-accent text-white shadow-sm'
                  : 'text-mute hover:text-ink hover:bg-line'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-warn" />
              Populer
            </button>
            <button
              onClick={() => onNavigateSection('latest')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeSection === 'latest'
                  ? 'bg-accent text-white shadow-sm'
                  : 'text-mute hover:text-ink hover:bg-line'
              }`}
            >
              <Film className="w-3.5 h-3.5 text-accent-soft" />
              Update Terbaru
            </button>
            <button
              onClick={onOpenSchedule}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-mute hover:text-ink hover:bg-line flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5 text-ok" />
              Jadwal Rilis
            </button>
          </nav>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          {/* Theme Toggle (desktop only — mobile toggle lives in the drawer) */}
          <button
            onClick={toggleTheme}
            className="hidden md:block p-2.5 rounded-xl bg-surface hover:bg-elevated border border-line text-sub hover:text-ink transition-colors cursor-pointer"
            title={isDark ? 'Mode Terang' : 'Mode Gelap'}
            aria-label={isDark ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Quick Search Button */}
          <button
            id="header-search-btn"
            onClick={onOpenSearch}
            className="flex items-center gap-3 px-3.5 sm:px-4 py-2 rounded-xl bg-surface hover:bg-elevated border border-line hover:border-accent-soft/40 text-ink text-xs sm:text-sm font-medium transition-all cursor-pointer focus:outline-none focus:ring-1 focus:ring-accent-soft/40"
          >
            <Search className="w-4 h-4 text-accent-soft" />
            <span className="hidden sm:inline text-mute">Cari judul donghua...</span>
            <kbd className="hidden lg:inline-flex px-1.5 py-0.5 text-[10px] font-semibold bg-black/50 text-mute border border-line rounded-md">
              Ctrl+K
            </kbd>
          </button>

          {/* Schedule Button (Mobile/Tablet quick icon) */}
          <button
            onClick={onOpenSchedule}
            className="md:hidden p-2.5 rounded-xl bg-surface hover:bg-elevated border border-line text-ok transition-colors cursor-pointer"
            title="Jadwal Rilis Donghua"
          >
            <Calendar className="w-4 h-4" />
          </button>

          {/* Watchlist / Bookmarks */}
          <button
            id="header-watchlist-btn"
            onClick={onOpenWatchlist}
            className="relative p-2.5 sm:px-3.5 sm:py-2 rounded-xl bg-surface hover:bg-elevated border border-line hover:border-accent-soft/40 text-ink flex items-center gap-2 text-xs font-semibold transition-colors cursor-pointer focus:outline-none focus:ring-1 focus:ring-accent-soft/40"
            title="Daftar Simpan & Riwayat"
          >
            <Bookmark className="w-4 h-4 text-accent-soft" />
            <span className="hidden sm:inline">Bookmark</span>
            {bookmarkCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-accent text-white">
                {bookmarkCount}
              </span>
            )}
          </button>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2.5 rounded-xl bg-surface hover:bg-elevated border border-line text-sub hover:text-ink cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-surface/98 border-b border-line px-4 py-4 space-y-2 animate-in slide-in-from-top duration-200">
          <button
            onClick={() => {
              onNavigateSection('spotlight');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold text-sub hover:text-ink hover:bg-line flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-accent-soft" /> Spotlight Unggulan
          </button>
          <button
            onClick={() => {
              onNavigateSection('popular');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold text-sub hover:text-ink hover:bg-line flex items-center gap-2"
          >
            <Flame className="w-4 h-4 text-warn" /> Populer Hari Ini
          </button>
          <button
            onClick={() => {
              onNavigateSection('latest');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold text-sub hover:text-ink hover:bg-line flex items-center gap-2"
          >
            <Film className="w-4 h-4 text-accent-soft" /> Update Episode Terbaru
          </button>
          <button
            onClick={() => {
              onOpenSchedule();
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold text-sub hover:text-ink hover:bg-line flex items-center gap-2"
          >
            <Calendar className="w-4 h-4 text-ok" /> Jadwal Rilis Mingguan
          </button>
          <button
            onClick={toggleTheme}
            className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold text-sub hover:text-ink hover:bg-line flex items-center gap-2"
          >
            {isDark ? <Sun className="w-4 h-4 text-warn" /> : <Moon className="w-4 h-4 text-accent-soft" />}
            {isDark ? 'Mode Terang' : 'Mode Gelap'}
          </button>
        </div>
      )}
    </header>
  );
};
