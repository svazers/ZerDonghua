import React, { useState, useEffect } from 'react';
import {
  X,
  Play,
  SkipForward,
  SkipBack,
  Server,
  Layers,
  Sparkles,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Info,
  Flame
} from 'lucide-react';
import { DonghuaStreamData, DonghuaHomeData } from '../types';
import { donghuaApi } from '../services/donghuaApi';
import { SafeImage as Image } from './SafeImage';
import { DonghuaCardSmall } from './DonghuaCardSmall';

type MirrorLike = { streamUrl?: string | null; embedCode?: string };

// A mirror is usable when it has a stream URL (preferred) or usable embed code.
const isMirrorDead = (m?: MirrorLike | null): boolean =>
  !m || (!m.streamUrl && !m.embedCode);

interface WatchModalProps {
  slug: string;
  initialTitle?: string;
  onClose: () => void;
  onOpenDetail: (seriesSlug: string) => void;
  onPlayEpisode: (episodeSlug: string, title?: string) => void;
  onSaveHistory: (data: {
    slug: string;
    seriesSlug?: string;
    title: string;
    seriesTitle: string;
    cover: string;
    episodeNumber: string;
  }) => void;
}

export const WatchModal: React.FC<WatchModalProps> = ({
  slug,
  initialTitle,
  onClose,
  onOpenDetail,
  onPlayEpisode,
  onSaveHistory
}) => {
  const [streamData, setStreamData] = useState<DonghuaStreamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMirrorIndex, setSelectedMirrorIndex] = useState<number>(0);
  const [theaterMode, setTheaterMode] = useState<boolean>(false);
  const [homeData, setHomeData] = useState<DonghuaHomeData | null>(null);
  const [relatedEpisodes, setRelatedEpisodes] = useState<any[]>([]);

  // Lazy-load home data once for the "Latest / Populer / Genre" rails.
  // Memoized client-side so it won't refetch if already cached.
  useEffect(() => {
    if (homeData) return;
    donghuaApi.getHome().then(setHomeData).catch(() => {});
  }, []);

  const selectFirstPlayable = (data: DonghuaStreamData | null) => {
    const mirrors = data?.mirrors ?? [];
    const idx = mirrors.findIndex((m) => !isMirrorDead(m));
    setSelectedMirrorIndex(idx >= 0 ? idx : 0);
  };

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setError(null);

    donghuaApi
      .getEpisode(slug)
      .then((data) => {
        setStreamData(data);
        // API returns relatedEpisodes at root level, not inside streamData
        if (data && (data as any).relatedEpisodes) {
          setRelatedEpisodes((data as any).relatedEpisodes);
        }
        selectFirstPlayable(data);
        if (data) {
          // Extract episode number
          const epMatch = data.title.match(/Episode\s*(\d+)/i) || slug.match(/episode-(\d+)/i);
          const epNum = epMatch ? epMatch[1] : '1';

          onSaveHistory({
            slug: slug,
            seriesSlug: data.series?.slug || slug.replace(/-episode-\d+.*/i, ''),
            title: data.title,
            seriesTitle: data.series?.name || data.title.replace(/Episode \d+.*/i, '').trim(),
            cover: (data as any).relatedEpisodes?.[0]?.cover || data.recommended?.[0]?.cover || '',
            episodeNumber: epNum
          });
        }
      })
      .catch((err) => {
        console.error('Failed to load episode stream:', err);
        setError('Gagal memuat video stream episode ini. Silakan coba server lain atau refresh.');
      })
      .finally(() => setLoading(false));
  }, [slug]);

  if (!slug) return null;

  const allMirrors = streamData?.mirrors ?? [];
  const playableMirrors = allMirrors.filter((m) => !isMirrorDead(m));
  // Always prefer the first playable mirror; fall back to any mirror (even if
  // dead by heuristic) so the iframe still renders and the user can pick.
  const currentMirror = playableMirrors[0] || allMirrors[0];

  const seriesSlug =
    streamData?.series?.slug || slug.replace(/-episode-\d+.*$/i, '');

  return (
    <div
      id="watch-view"
      className="fixed inset-0 z-50 bg-canvas overflow-y-auto flex flex-col text-sub animate-in fade-in duration-200"
    >
      <div
        className={`relative w-full ${theaterMode ? "max-w-7xl" : "max-w-5xl"} mx-auto flex flex-col min-h-full bg-surface sm:border-x sm:border-line shadow-2xl transition-all duration-300`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="p-3 sm:p-4 border-b border-line bg-surface flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-accent/20 border border-accent-soft/40 flex items-center justify-center text-accent-soft shrink-0">
              <Play className="w-4 h-4 fill-accent-soft" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-ink truncate">
                {streamData?.title || initialTitle || slug.replace(/-/g, '')}
              </h2>
              {streamData?.series?.name && (
                <button
                  onClick={() => {
                    if (streamData.series.slug) {
                      onClose();
                      onOpenDetail(streamData.series.slug);
                    }
                  }}
                  className="text-xs text-accent-soft hover:text-ink hover:underline flex items-center gap-1 font-semibold truncate cursor-pointer"
                >
                  <span>Series: {streamData.series.name}</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setTheaterMode(!theaterMode)}
              className="p-2 rounded-xl bg-line hover:bg-line-strong text-mute hover:text-ink border border-line transition-colors hidden sm:flex cursor-pointer"
              title={theaterMode ? 'Mode Standar' : 'Mode Bioskop (Lebar)'}
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-line hover:bg-line-strong text-mute hover:text-ink border border-line transition-colors cursor-pointer"
              title="Tutup Player"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Video Player Container */}
        <div className="relative w-full bg-canvas min-h-[50vh] sm:min-h-[60vh] flex items-center justify-center overflow-hidden">
          {loading ? (
            <div className="text-center space-y-3">
              <div className="w-10 h-10 rounded-full border-3 border-accent-soft border-t-transparent animate-spin mx-auto" />
              <p className="text-xs text-mute font-medium">Menghubungkan ke server stream ZerDonghua...</p>
            </div>
          ) : error ? (
            <div className="p-6 text-center text-sub space-y-3">
              <p className="text-sm text-bad font-semibold">{error}</p>
              <button
                onClick={() => {
                  setLoading(true);
                  setError(null);
                  donghuaApi
                    .getEpisode(slug)
                    .then((data) => {
                      setStreamData(data);
                      selectFirstPlayable(data);
                    })
                    .finally(() => setLoading(false));
                }}
                className="px-4 py-2 rounded-xl bg-accent text-white text-xs font-semibold shadow-sm"
              >
                Coba Lagi
              </button>
            </div>
          ) : currentMirror?.streamUrl ? (
            <iframe
              key={`${currentMirror.streamUrl}-${selectedMirrorIndex}`}
              src={currentMirror.streamUrl}
              className="w-full h-full border-0"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              title={streamData?.title || 'Donghua Stream'}
            />
          ) : currentMirror?.embedCode ? (
            <div
              key={selectedMirrorIndex}
              className="w-full h-full [&>iframe]:w-full [&>iframe]:h-full [&>iframe]:border-0"
              dangerouslySetInnerHTML={{ __html: currentMirror.embedCode }}
            />
          ) : (
            <div className="text-center p-6 text-mute space-y-3">
              <p className="text-sm">Semua server sedang tidak tersedia untuk episode ini.<br />Coba episode lain atau buka di situs sumber.</p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {playableMirrors.length > 1 && (
                  <button
                    onClick={() => {
                      const cur = playableMirrors.indexOf(allMirrors[selectedMirrorIndex]);
                      const next = playableMirrors[(cur + 1) % playableMirrors.length];
                      setSelectedMirrorIndex(allMirrors.indexOf(next));
                    }}
                    className="px-4 py-2 rounded-xl bg-accent text-white text-xs font-semibold"
                  >
                    Ganti ke Server Berikutnya
                  </button>
                )}
                {streamData?.series?.slug && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenDetail(streamData.series.slug);
                    }}
                    className="px-4 py-2 rounded-xl bg-line hover:bg-line-strong text-ink text-xs font-semibold"
                  >
                    Lihat Halaman Series
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Server Mirrors & Navigation Controls */}
        <div className="p-3 sm:p-5 bg-surface border-t border-line space-y-4 sm:space-y-6 pb-12">
          {/* Server Selector */}
          {streamData?.mirrors && streamData.mirrors.length > 0 && (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-mute uppercase tracking-wider">
                  <Server className="w-3.5 h-3.5 text-accent-soft" />
                  <span>Pilih Server ({playableMirrors.length})</span>
                </div>
                {currentMirror?.streamUrl && (
                  <a
                    href={currentMirror.streamUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] sm:text-xs text-accent-soft hover:text-ink flex items-center gap-1 font-semibold hover:underline"
                    title="Buka pemutar video langsung di tab terpisah"
                  >
                    <span>Tab Baru</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {playableMirrors.map((mirror) => {
                  const idx = allMirrors.indexOf(mirror);
                  return (
                    <button
                      key={mirror.name || idx}
                      onClick={() => setSelectedMirrorIndex(idx)}
                      className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 ${
                        selectedMirrorIndex === idx
                          ? 'bg-accent text-white shadow-sm border border-line-strong'
                          : 'bg-line hover:bg-line-strong text-sub hover:text-ink border border-line'
                      }`}
                    >
                      <Play className="w-3 h-3" />
                      <span>{mirror.name || `Server ${idx + 1}`}</span>
                    </button>
                  );
                })}
              </div>
              {playableMirrors.length < allMirrors.length && (
                <p className="text-[10px] sm:text-[11px] text-faint">
                  {allMirrors.length - playableMirrors.length} server sedang tidak tersedia.
                </p>
              )}
              <p className="text-[10px] sm:text-[11px] text-faint flex items-start gap-1.5 leading-relaxed">
                <Info className="w-3 h-3 mt-0.5 shrink-0 text-accent-soft" />
                <span>
                  Jika video tidak bisa diputar atau error, silakan ganti server di atas atau klik
                  {currentMirror?.streamUrl ? (
                    <a
                      href={currentMirror.streamUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent-soft hover:text-ink font-semibold hover:underline"
                    >
                      {''}Tab Baru
                    </a>
                  ) : (
                    ' Tab Baru'
                  )}
                  .
                </span>
              </p>
            </div>
          )}

          {/* Prev / Next Episode Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-line">
            {streamData?.prev ? (
              <button
                onClick={() => onPlayEpisode(streamData.prev!)}
                className="flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-line hover:bg-line-strong active:scale-95 text-sub hover:text-ink text-[11px] sm:text-xs font-semibold border border-line transition-all cursor-pointer"
              >
                <ChevronLeft className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                <span>Prev Ep</span>
              </button>
            ) : (
              <div />
            )}

            {streamData?.series?.slug && (
              <button
                onClick={() => {
                  onClose();
                  onOpenDetail(streamData.series.slug);
                }}
                className="flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-accent/20 hover:bg-accent/30 active:scale-95 text-accent-soft text-[11px] sm:text-xs font-semibold border border-accent-soft/40 transition-all cursor-pointer"
              >
                <Info className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                <span>Semua Episode</span>
              </button>
            )}

            {streamData?.next ? (
              <button
                onClick={() => onPlayEpisode(streamData.next!)}
                className="flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-accent hover:scale-[1.02] active:scale-95 text-white text-[11px] sm:text-xs font-semibold shadow-sm transition-all cursor-pointer"
              >
                <span>Next Ep</span>
                <ChevronRight className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
              </button>
            ) : (
              <div />
            )}
          </div>

          {/* Episode Terkait - dengan poster */}
{relatedEpisodes && relatedEpisodes.length > 0 && (
  <div className="space-y-2 pt-2 border-t border-line">
    <span className="text-[11px] sm:text-xs font-bold text-mute uppercase tracking-wider flex items-center gap-1.5">
      <Layers className="w-3.5 h-3.5 text-accent-soft" />
      <span>Episode Terkait</span>
    </span>
    <div className="flex gap-2 overflow-x-auto pb-1.5 -mx-0.5 sm:-mx-1">
      {relatedEpisodes.map((ep) => (
        <button
          key={ep.slug}
          onClick={() => onPlayEpisode(ep.slug, ep.title)}
          className="relative min-w-[90px] w-[90px] sm:w-[100px] shrink-0 flex flex-col rounded-xl bg-elevated hover:bg-line border border-line hover:border-accent-soft/40 transition-all cursor-pointer active:scale-95 p-2 text-left"
        >
          <div className="relative aspect-[3/4] w-full rounded-lg overflow-hidden bg-canvas mb-1">
            <Image src={ep.cover} alt={ep.title} fill loading="lazy" decoding="async" sizes="100px" className="object-cover" />
          </div>
          <span title={ep.title} className="text-[10px] sm:text-xs font-semibold text-sub line-clamp-2">{ep.title}</span>
        </button>
      ))}
    </div>
  </div>
)}

          {/* Rekomendasi Series - dengan poster */}
{streamData?.recommended && streamData.recommended.length > 0 && (
  <div className="space-y-2 pt-2 border-t border-line">
    <span className="text-[11px] sm:text-xs font-bold text-mute uppercase tracking-wider flex items-center gap-1.5">
      <Flame className="w-3.5 h-3.5 text-accent-soft" />
      <span>Rekomendasi</span>
    </span>
    <div className="flex gap-2 overflow-x-auto pb-1.5 -mx-0.5 sm:-mx-1">
      {streamData.recommended.slice(0, 8).map((r) => (
        <div key={r.slug} className="min-w-[100px] sm:min-w-[110px] w-[100px] sm:w-[110px] shrink-0">
          <button
            onClick={() => onOpenDetail(r.slug)}
            className="w-full text-left rounded-xl overflow-hidden bg-elevated border border-line hover:border-accent-soft/40 transition-all cursor-pointer active:scale-95"
          >
            <div className="relative aspect-[3/4] w-full rounded-lg overflow-hidden bg-canvas">
              <Image src={r.cover} alt={r.title} fill loading="lazy" decoding="async" sizes="110px" className="object-cover" />
            </div>
            <div className="p-1.5">
              <span title={r.title} className="text-[10px] sm:text-xs font-semibold text-sub line-clamp-2">{r.title}</span>
            </div>
          </button>
        </div>
      ))}
    </div>
  </div>
)}

          {/* Episode Terbaru - tanpa poster (list teks saja) */}
{homeData?.latestRelease && homeData.latestRelease.length > 0 && (
  <div className="space-y-2 pt-2 border-t border-line">
    <span className="text-[11px] sm:text-xs font-bold text-mute uppercase tracking-wider flex items-center gap-1.5">
      <Play className="w-3.5 h-3.5 text-accent-soft" />
      <span>Episode Terbaru</span>
    </span>
    <div className="flex flex-col gap-1.5">
      {homeData.latestRelease.slice(0, 6).map((it) => (
        <button
          key={it.slug}
          onClick={() => onPlayEpisode(it.slug, it.title)}
          className="flex items-center gap-2 rounded-lg sm:rounded-xl bg-elevated hover:bg-line border border-line hover:border-accent-soft/30 px-2.5 py-2 text-left transition-all cursor-pointer active:scale-95"
        >
          <span className="text-[10px] sm:text-xs font-semibold text-accent-soft w-10 sm:w-12 shrink-0 text-right">EP</span>
          <span title={it.title} className="text-[11px] sm:text-xs font-semibold text-sub line-clamp-1 flex-1">{it.title}</span>
          {it.episode && (<span className="text-[9px] sm:text-[10px] text-mute bg-line px-1.5 py-0.25 rounded shrink-0">{it.episode}</span>)}
        </button>
      ))}
    </div>
  </div>
)}

          {/* Populer - weekly/monthly/all-time dengan poster kecil */}
{homeData?.donghuaPopular && (
  <div className="space-y-3 pt-2 border-t border-line">
    <span className="text-[11px] sm:text-xs font-bold text-mute uppercase tracking-wider flex items-center gap-1.5">
      <Sparkles className="w-3.5 h-3.5 text-accent-soft" />
      <span>Populer</span>
    </span>
    {(homeData.donghuaPopular.weekly || []).length > 0 && (
      <div>
        <h4 className="text-[10px] sm:text-[11px] text-mute uppercase font-bold mb-1.5 ml-0.5">Mingguan</h4>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-0.5 sm:-mx-1">
          {homeData.donghuaPopular.weekly.slice(0, 8).map((it) => (
            <DonghuaCardSmall key={it.slug} item={it} onWatch={(i) => onOpenDetail(i.slug)} />
          ))}
        </div>
      </div>
    )}
    {(homeData.donghuaPopular.monthly || []).length > 0 && (
      <div>
        <h4 className="text-[10px] sm:text-[11px] text-mute uppercase font-bold mb-1.5 ml-0.5">Bulanan</h4>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-0.5 sm:-mx-1">
          {homeData.donghuaPopular.monthly.slice(0, 8).map((it) => (
            <DonghuaCardSmall key={it.slug} item={it} onWatch={(i) => onOpenDetail(i.slug)} />
          ))}
        </div>
      </div>
    )}
    {(homeData.donghuaPopular.allTime || []).length > 0 && (
      <div>
        <h4 className="text-[10px] sm:text-[11px] text-mute uppercase font-bold mb-1.5 ml-0.5">All-Time</h4>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-0.5 sm:-mx-1">
          {homeData.donghuaPopular.allTime.slice(0, 8).map((it) => (
            <DonghuaCardSmall key={it.slug} item={it} onWatch={(i) => onOpenDetail(i.slug)} />
          ))}
        </div>
      </div>
    )}
  </div>
)}

          {/* Genre tags - static, no click (informational) */}
{homeData?.genres && homeData.genres.length > 0 && (
  <div className="pt-2 border-t border-line">
    <span className="text-[11px] sm:text-xs font-bold text-mute uppercase tracking-wider flex items-center gap-1.5 mb-2">
      <Info className="w-3.5 h-3.5 text-accent-soft" />
      <span>Genre</span>
    </span>
    <div className="flex flex-wrap gap-1.5">
      {homeData.genres.slice(0, 16).map((g) => (
        <span
          key={g.slug}
          className="px-2.5 py-1 rounded-lg bg-line text-[9px] sm:text-[10px] font-semibold text-mute border border-line"
        >
          {g.name}
        </span>
      ))}
    </div>
  </div>
)}

          {/* Footer - same as Home */}
<div className="mt-8 border-t border-line bg-canvas text-mute pt-8 pb-4 px-4 sm:px-6">
  <div className="max-w-5xl mx-auto space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div className="md:col-span-2 space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-accent/20 border border-accent-soft/40 flex items-center justify-center text-accent-soft">
            <Play className="w-4 h-4" />
          </div>
          <span className="text-sm font-bold text-ink">ZerDonghua</span>
        </div>
        <p className="text-xs text-mute max-w-md leading-relaxed">
          Platform portal streaming donghua (Chinese anime) 3D dan 2D subtitle Indonesia terlengkap. Update tercepat setiap hari dengan kualitas video HD & multi-server player.
        </p>
      </div>

      <div className="space-y-2">
        <h4 className="text-xs font-bold text-ink uppercase tracking-wider">Navigasi</h4>
        <ul className="space-y-1.5 text-xs">
          <li><button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:text-accent-soft transition-colors cursor-pointer">Spotlight</button></li>
          <li><button onClick={onClose} className="hover:text-accent-soft transition-colors cursor-pointer">Home</button></li>
        </ul>
      </div>

      <div className="space-y-2">
        <h4 className="text-xs font-bold text-ink uppercase tracking-wider">Info</h4>
        <p className="text-[11px] text-faint">Stream via ZerDonghua · Data dari anichin.cafe / donghub.vip</p>
      </div>
    </div>

    <div className="pt-4 border-t border-line flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-faint">
      <p>© {new Date().getFullYear()} ZerDonghua Streaming.</p>
      <p>Dibuat untuk pecinta Donghua Indonesia</p>
    </div>
  </div>
</div>
        </div>
      </div>
    </div>
  );
};
