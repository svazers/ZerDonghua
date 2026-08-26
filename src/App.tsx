'use client';

import React, { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import { Header } from './components/Header';
import { SpotlightHero } from './components/SpotlightHero';
import { GenreBar } from './components/GenreBar';
import { FeaturedRail } from './components/FeaturedRail';
import { ContinueWatchingSection } from './components/ContinueWatchingSection';
import { MobileBottomNav } from './components/MobileBottomNav';
const WeeklySchedule = lazy(() => import('./components/WeeklySchedule').then(m => ({ default: m.WeeklySchedule })));
const SearchModal = lazy(() => import('./components/SearchModal').then(m => ({ default: m.SearchModal })));
const DetailsModal = lazy(() => import('./components/DetailsModal').then(m => ({ default: m.DetailsModal })));
const WatchModal = lazy(() => import('./components/WatchModal').then(m => ({ default: m.WatchModal })));
const WatchlistDrawer = lazy(() => import('./components/WatchlistDrawer').then(m => ({ default: m.WatchlistDrawer })));
// Below-the-fold sections are code-split so the initial bundle stays light.
const HomeScheduleSection = lazy(() => import('./components/HomeScheduleSection').then(m => ({ default: m.HomeScheduleSection })));
const HomeGenreShowcase = lazy(() => import('./components/HomeGenreShowcase').then(m => ({ default: m.HomeGenreShowcase })));
const GenreRailSection = lazy(() => import('./components/GenreRailSection').then(m => ({ default: m.GenreRailSection })));
const PopularSliderSection = lazy(() => import('./components/PopularSliderSection').then(m => ({ default: m.PopularSliderSection })));
const OngoingSliderSection = lazy(() => import('./components/OngoingSliderSection').then(m => ({ default: m.OngoingSliderSection })));
const LatestUpdatedSection = lazy(() => import('./components/LatestUpdatedSection').then(m => ({ default: m.LatestUpdatedSection })));
const PortalStatsBanner = lazy(() => import('./components/PortalStatsBanner').then(m => ({ default: m.PortalStatsBanner })));
const Footer = lazy(() => import('./components/Footer').then(m => ({ default: m.Footer })));
import { donghuaApi } from './services/donghuaApi';
import {
  DonghuaHomeData,
  DonghuaCardItem,
  BookmarkEntry,
  WatchHistoryEntry
} from './types';
import { Sparkles, Film, Flame, AlertCircle, RefreshCw } from 'lucide-react';

export function App({ initialHomeData }: { initialHomeData?: DonghuaHomeData | null }) {
  // Home Data State
  const [homeData, setHomeData] = useState<DonghuaHomeData | null>(initialHomeData ?? null);
  const [loading, setLoading] = useState<boolean>(!initialHomeData);
  const [error, setError] = useState<string | null>(null);
  const isFetchingRef = useRef<boolean>(false);

  // Genre filtering state
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [genreResults, setGenreResults] = useState<DonghuaCardItem[] | null>(null);
  const [genreLoading, setGenreLoading] = useState<boolean>(false);

  // Modals & Navigation State
  const [searchOpen, setSearchOpen] = useState<boolean>(false);
  const [watchlistOpen, setWatchlistOpen] = useState<boolean>(false);
  const [scheduleOpen, setScheduleOpen] = useState<boolean>(false);

  const [detailSlug, setDetailSlug] = useState<string | null>(null);
  const [watchSlug, setWatchSlug] = useState<string | null>(null);
  const [watchTitle, setWatchTitle] = useState<string | undefined>(undefined);

  const [activeSection, setActiveSection] = useState<string>('spotlight');

  // Local Storage: Bookmarks
  const [bookmarks, setBookmarks] = useState<BookmarkEntry[]>(() => {
    try {
      const saved = localStorage.getItem('donghub_bookmarks');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Local Storage: Watch History
  const [watchHistory, setWatchHistory] = useState<WatchHistoryEntry[]>(() => {
    try {
      const saved = localStorage.getItem('donghub_watch_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Sync Bookmarks to Local Storage
  useEffect(() => {
    try {
      localStorage.setItem('donghub_bookmarks', JSON.stringify(bookmarks));
    } catch (e) {
      console.warn('Failed to save bookmarks:', e);
    }
  }, [bookmarks]);

  // Sync Watch History to Local Storage
  useEffect(() => {
    try {
      localStorage.setItem('donghub_watch_history', JSON.stringify(watchHistory));
    } catch (e) {
      console.warn('Failed to save history:', e);
    }
  }, [watchHistory]);

  // Unified Memoized Home Data Fetcher
  const fetchHomeData = useCallback(async (forceRefresh = false) => {
    if (isFetchingRef.current && !forceRefresh) return;
    isFetchingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const data = await donghuaApi.getHome(forceRefresh);
      setHomeData(data);
      setError(null);
    } catch (err: any) {
      console.error('Failed to load donghua home data:', err);
      setError('Gagal memuat data dari server ZerDonghua. Silakan periksa koneksi atau coba lagi.');
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, []);

  // Single mount effect ensuring no redundant calls
  useEffect(() => {
    if (initialHomeData) return; // SSR already provided the data
    let isMounted = true;
    fetchHomeData().catch(() => {
      if (isMounted) {
        console.warn('Initial home fetch finished with issues');
      }
    });
    return () => {
      isMounted = false;
    };
  }, [fetchHomeData, initialHomeData]);

  // Handle Genre selection & scraping
  const handleSelectGenre = (genreSlug: string | null) => {
    setSelectedGenre(genreSlug);
    if (!genreSlug) {
      setGenreResults(null);
      return;
    }

    setGenreLoading(true);
    donghuaApi
      .getDonghuaByGenre(genreSlug)
      .then((res) => {
        setGenreResults(res.results || []);
      })
      .catch((err) => {
        console.error('Failed to fetch genre results:', err);
      })
      .finally(() => setGenreLoading(false));
  };

  // Bookmark Toggle
  const handleToggleBookmark = (item: DonghuaCardItem) => {
    setBookmarks((prev) => {
      const exists = prev.some((b) => b.slug === item.slug);
      if (exists) {
        return prev.filter((b) => b.slug !== item.slug);
      } else {
        return [
          {
            slug: item.slug,
            title: item.title,
            cover: item.cover,
            type: item.type,
            status: item.status,
            latestEpisode: item.episode,
            addedAt: Date.now()
          },
          ...prev
        ];
      }
    });
  };

  const isBookmarked = (slug: string) => {
    return bookmarks.some((b) => b.slug === slug);
  };

  // Watch History Record
  const handleSaveHistory = (entry: {
    slug: string;
    seriesSlug?: string;
    title: string;
    seriesTitle: string;
    cover: string;
    episodeNumber: string;
  }) => {
    setWatchHistory((prev) => {
      const filtered = prev.filter((h) => h.slug !== entry.slug);
      return [
        {
          ...entry,
          watchedAt: Date.now(),
          progressPercent: 40
        },
        ...filtered
      ].slice(0, 20); // Keep max 20 history items
    });
  };

  const handleRemoveBookmark = (slug: string) => {
    setBookmarks((prev) => prev.filter((b) => b.slug !== slug));
  };

  const handleRemoveHistory = (slug: string) => {
    setWatchHistory((prev) => prev.filter((h) => h.slug !== slug));
  };

  const handleClearHistory = () => {
    setWatchHistory([]);
  };

  // Navigation & Watch triggers
  const handleOpenDetail = (slug: string) => {
    setDetailSlug(slug);
  };

  const handleWatch = (itemOrSlug: DonghuaCardItem | string, title?: string) => {
    if (typeof itemOrSlug === 'string') {
      setWatchSlug(itemOrSlug);
      setWatchTitle(title);
    } else {
      setWatchSlug(itemOrSlug.slug);
      setWatchTitle(itemOrSlug.title);
    }
  };

  const handleNavigateSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleNavigateHome = () => {
    setSelectedGenre(null);
    setGenreResults(null);
    setActiveSection('spotlight');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col selection:bg-accent selection:text-white relative">
      {/* Main Header */}
      <Header
        onOpenSearch={() => setSearchOpen(true)}
        onOpenWatchlist={() => setWatchlistOpen(true)}
        onOpenSchedule={() => setScheduleOpen(true)}
        onSelectGenre={handleSelectGenre}
        bookmarkCount={bookmarks.length}
        activeSection={activeSection}
        onNavigateSection={handleNavigateSection}
      />

      {/* Main App Content Body */}
      <main className="flex-1 z-10 pb-24 md:pb-0">
        {loading && !homeData ? (
          <div className="py-48 flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 rounded-full border-4 border-accent border-t-transparent animate-spin" />
            <p className="text-sm font-semibold text-mute">
              Memuat katalog ZerDonghua...
            </p>
          </div>
        ) : error && !homeData ? (
          <div className="py-32 max-w-lg mx-auto px-4 text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-bad/10 border border-bad/20 text-bad flex items-center justify-center mx-auto shadow-md">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-ink">Gagal Memuat Data</h3>
            <p className="text-sm text-mute">{error}</p>
            <button
              onClick={() => fetchHomeData(true)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-accent hover:bg-accent active:scale-95 text-white font-bold text-sm shadow-md transition-all cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              Coba Muat Ulang
            </button>
          </div>
        ) : (
          <>
            {/* Spotlight Hero Carousel */}
            {homeData?.recommendations && homeData.recommendations.length > 0 && !selectedGenre && (
              <SpotlightHero
                recommendations={homeData.recommendations}
                onOpenDetail={handleOpenDetail}
                onWatch={handleWatch}
                onToggleBookmark={handleToggleBookmark}
                isBookmarked={isBookmarked}
              />
            )}

            <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-4 sm:space-y-6">
              {/* Genre Bar Filter */}
              {homeData?.genres && homeData.genres.length > 0 && (
                <GenreBar
                  genres={homeData.genres}
                  selectedGenre={selectedGenre}
                  onSelectGenre={handleSelectGenre}
                />
              )}

              {/* Genre Filter Results View if Selected: Rich Dynamic In-Home Genre Showcase */}
              {selectedGenre && (
                <Suspense fallback={null}>
                  <HomeGenreShowcase
                    selectedGenre={selectedGenre}
                    genres={homeData?.genres || []}
                    onSelectGenre={handleSelectGenre}
                    onSelect={(item) => handleOpenDetail(item.slug)}
                    onWatch={(item) => handleWatch(item.slug, item.title)}
                    onToggleBookmark={handleToggleBookmark}
                    isBookmarked={isBookmarked}
                  />
                </Suspense>
              )}

              {!selectedGenre && (
                <Suspense fallback={<div className="h-48" />}>
                <>
                  {/* Continue Watching Section */}
                  <ContinueWatchingSection
                    history={watchHistory}
                    onResume={(item) => handleWatch(item.slug, item.title)}
                    onRemove={handleRemoveHistory}
                    onClear={handleClearHistory}
                  />

                  {/* Curated Recommendations Masterpiece Rail (Slide ke samping) */}
                  {homeData?.recommendations && homeData.recommendations.length > 0 && (
                    <FeaturedRail
                      recommendations={homeData.recommendations}
                      onSelect={handleOpenDetail}
                      onWatch={handleWatch}
                      onToggleBookmark={handleToggleBookmark}
                      isBookmarked={isBookmarked}
                    />
                  )}

                  {/* In-Page Interactive Daily Release Schedule (Live Schedule) */}
                  <HomeScheduleSection
                    onSelect={handleOpenDetail}
                    onWatch={handleWatch}
                    onToggleBookmark={handleToggleBookmark}
                    isBookmarked={isBookmarked}
                  />

                  {/* Popular & Trending Rankings (Multi-Timeframe Top 10) */}
                  {homeData?.popularToday && homeData.popularToday.length > 0 && (
                    <PopularSliderSection
                      popularToday={homeData.popularToday}
                      donghuaPopular={homeData.donghuaPopular}
                      onSelect={(item) => handleOpenDetail(item.slug)}
                      onWatch={handleWatch}
                      onToggleBookmark={handleToggleBookmark}
                      isBookmarked={isBookmarked}
                    />
                  )}

                  {/* Sedang Tayang (Ongoing Series Showcase) */}
                  {homeData?.donghuaBaru && homeData.donghuaBaru.length > 0 && (
                    <OngoingSliderSection
                      donghuaBaru={homeData.donghuaBaru}
                      onSelect={(item) => handleOpenDetail(item.slug)}
                      onWatch={handleWatch}
                      onToggleBookmark={handleToggleBookmark}
                      isBookmarked={isBookmarked}
                    />
                  )}

                  {/* Latest Released Episodes Feed */}
                  {homeData?.latestRelease && homeData.latestRelease.length > 0 && (
                    <LatestUpdatedSection
                      latestRelease={homeData.latestRelease}
                      onSelect={(item) => handleOpenDetail(item.slug)}
                      onWatch={handleWatch}
                      onToggleBookmark={handleToggleBookmark}
                      isBookmarked={isBookmarked}
                    />
                  )}

                  {/* Rail terpisah per genre — slider kartu + panah prev/next */}
                  {['action', 'cultivation', 'fantasy', 'martial-arts'].map((slug) => (
                    <Suspense key={slug} fallback={<div className="h-48" />}>
                      <GenreRailSection
                        genreSlug={slug}
                        onSelect={(item) => handleOpenDetail(item.slug)}
                        onWatch={(item) => handleWatch(item.slug, item.title)}
                        onToggleBookmark={handleToggleBookmark}
                        isBookmarked={isBookmarked}
                      />
                    </Suspense>
                  ))}

                  {/* Portal Status & Quality Features Banner */}
                  <PortalStatsBanner
                    onOpenSchedule={() => setScheduleOpen(true)}
                    totalGenres={homeData?.genres?.length || 26}
                  />
                </>
                </Suspense>
              )}
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <Suspense fallback={null}>
        <Footer
          genres={homeData?.genres || []}
          onSelectGenre={handleSelectGenre}
          onOpenSchedule={() => setScheduleOpen(true)}
        />
      </Suspense>

      {/* Interactive Modals */}
      <Suspense fallback={null}>
        <SearchModal
          isOpen={searchOpen}
          onClose={() => setSearchOpen(false)}
          onSelectDetail={handleOpenDetail}
          onWatch={handleWatch}
        />

        <WeeklySchedule
          isOpen={scheduleOpen}
          onClose={() => setScheduleOpen(false)}
          onSelect={handleOpenDetail}
          onWatch={handleWatch}
        />

        <WatchlistDrawer
          isOpen={watchlistOpen}
          onClose={() => setWatchlistOpen(false)}
          bookmarks={bookmarks}
          history={watchHistory}
          onSelectDetail={handleOpenDetail}
          onWatch={handleWatch}
          onRemoveBookmark={handleRemoveBookmark}
          onRemoveHistory={handleRemoveHistory}
          onClearHistory={handleClearHistory}
        />

        {detailSlug && (
          <DetailsModal
            slug={detailSlug}
            onClose={() => setDetailSlug(null)}
            onWatchEpisode={(epSlug, title) => handleWatch(epSlug, title)}
            onToggleBookmark={handleToggleBookmark}
            isBookmarked={isBookmarked}
          />
        )}

        {watchSlug && (
          <WatchModal
            slug={watchSlug}
            initialTitle={watchTitle}
            onClose={() => setWatchSlug(null)}
            onOpenDetail={handleOpenDetail}
            onPlayEpisode={(epSlug, title) => handleWatch(epSlug, title)}
            onSaveHistory={handleSaveHistory}
          />
        )}
      </Suspense>

      {/* Floating Mobile Bottom Navigation Bar */}
      <MobileBottomNav
        activeTab={
          searchOpen
            ? 'search'
            : scheduleOpen
            ? 'schedule'
            : watchlistOpen
            ? 'watchlist'
            : 'home'
        }
        bookmarkCount={bookmarks.length}
        onNavigateHome={handleNavigateHome}
        onOpenSearch={() => {
          setScheduleOpen(false);
          setWatchlistOpen(false);
          setSearchOpen(true);
        }}
        onOpenSchedule={() => {
          setSearchOpen(false);
          setWatchlistOpen(false);
          setScheduleOpen(true);
        }}
        onOpenWatchlist={() => {
          setSearchOpen(false);
          setScheduleOpen(false);
          setWatchlistOpen(true);
        }}
      />
    </div>
  );
}

export default App;
