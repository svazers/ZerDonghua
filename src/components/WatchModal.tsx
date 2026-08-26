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
  Info
} from 'lucide-react';
import { DonghuaStreamData } from '../types';
import { donghuaApi } from '../services/donghuaApi';

type MirrorLike = { streamUrl?: string | null; embedCode?: string };

// A mirror is unusable when it has no stream URL and its embed code is just a
// "Video Not Available" placeholder returned by dead sources (e.g. OKRU/Dtube).
const isMirrorDead = (m?: MirrorLike | null): boolean =>
  !m || (!m.streamUrl && (!m.embedCode || /video not available/i.test(m.embedCode)));

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
            cover: data.relatedEpisodes?.[0]?.cover || data.recommended?.[0]?.cover || '',
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
  const currentMirror =
    allMirrors[selectedMirrorIndex] && !isMirrorDead(allMirrors[selectedMirrorIndex])
      ? allMirrors[selectedMirrorIndex]
      : playableMirrors[0];

  return (
    <div
      id="watch-modal-backdrop"
      className="fixed inset-0 z-50 bg-canvas/95 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className={`relative w-full ${
          theaterMode ? 'max-w-7xl' : 'max-w-5xl'
        } max-h-[95vh] rounded-3xl bg-surface/95 border border-line shadow-lg overflow-hidden flex flex-col my-auto transition-all duration-300 text-sub`}
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
        <div className="relative w-full bg-canvas aspect-video flex items-center justify-center overflow-hidden">
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
        <div className="p-3 sm:p-5 bg-surface border-t border-line space-y-3 sm:space-y-4 overflow-y-auto max-h-64 pb-6 sm:pb-5">
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

          {/* Related / Other Episodes Quick List */}
          {streamData?.relatedEpisodes && streamData.relatedEpisodes.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-line">
              <span className="text-[11px] sm:text-xs font-bold text-mute uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-accent-soft" />
                Episode Terkait Lainnya
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1.5 sm:gap-2">
                {streamData.relatedEpisodes.map((ep) => (
                  <button
                    key={ep.slug}
                    onClick={() => onPlayEpisode(ep.slug, ep.title)}
                    className="p-2 sm:p-2.5 rounded-xl bg-elevated hover:bg-elevated active:bg-accent/20 border border-line hover:border-accent-soft/40 text-left flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 text-accent-soft shrink-0" />
                    <span className="text-[11px] sm:text-xs font-semibold text-sub truncate">{ep.title}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
