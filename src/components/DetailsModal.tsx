import React, { useState, useEffect } from 'react';
import {
  X,
  Play,
  Bookmark,
  Check,
  Film,
  Layers,
  Sparkles,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import Image from 'next/image';
import { DonghuaDetail, DonghuaCardItem } from '../types';
import { donghuaApi } from '../services/donghuaApi';

interface DetailsModalProps {
  slug: string;
  onClose: () => void;
  onWatchEpisode: (episodeSlug: string, title?: string) => void;
  onToggleBookmark: (item: DonghuaCardItem) => void;
  isBookmarked: (slug: string) => boolean;
}

export const DetailsModal: React.FC<DetailsModalProps> = ({
  slug,
  onClose,
  onWatchEpisode,
  onToggleBookmark,
  isBookmarked
}) => {
  const [detail, setDetail] = useState<DonghuaDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setError(null);

    donghuaApi
      .getDetail(slug)
      .then((data) => {
        setDetail(data);
      })
      .catch((err) => {
        console.error('Failed to load donghua detail:', err);
        setError('Gagal memuat detail series donghua ini.');
      })
      .finally(() => setLoading(false));
  }, [slug]);

  if (!slug) return null;

  const cardItem: DonghuaCardItem = {
    title: detail?.title || slug.replace(/-/g, ''),
    slug: slug,
    link: '',
    cover: detail?.cover || '',
    type: detail?.metadata?.['Type'] || '3D Donghua',
    status: detail?.metadata?.['Status'] || 'Ongoing'
  };

  const bookmarked = isBookmarked(slug);

  return (
    <div
      id="details-modal"
      className="fixed inset-0 z-50 bg-canvas/90 flex items-center sm:items-center justify-center p-2 sm:p-6 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[92vh] sm:max-h-[90vh] rounded-3xl bg-surface/95 border border-line shadow-lg overflow-hidden flex flex-col my-auto text-sub"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 z-30 p-2 sm:p-2.5 rounded-full bg-canvas/80 hover:bg-line text-sub hover:text-ink border border-line transition-colors cursor-pointer active:scale-95"
        >
          <X className="w-5 h-5" />
        </button>

        {loading ? (
          <div className="py-32 text-center text-mute space-y-3">
            <div className="w-10 h-10 rounded-full border-3 border-accent-soft border-t-transparent animate-spin mx-auto" />
            <p className="text-xs">Memuat informasi donghua...</p>
          </div>
        ) : error ? (
          <div className="py-24 text-center text-sub p-6 space-y-3">
            <p className="text-sm text-bad">{error}</p>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-accent text-white text-xs font-semibold shadow-sm"
            >
              Tutup
            </button>
          </div>
        ) : detail ? (
          <div className="overflow-y-auto max-h-[92vh] sm:max-h-[90vh] pb-6">
            {/* Top Banner / Backdrop Area */}
            <div className="relative h-36 sm:h-64 w-full overflow-hidden bg-canvas">
              {detail.cover && (
                <Image
                  src={detail.cover}
                  alt={detail.title}
                  fill
                  loading="lazy"
                  decoding="async"
                  sizes="100vw"
                  className="w-full h-full object-cover blur-sm opacity-50 scale-105"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/40" />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(124,58,237,0.3),transparent_70%)]" />

              {/* Badges */}
              <div className="absolute bottom-3 left-4 right-4 sm:bottom-4 sm:left-6 sm:right-6 flex flex-wrap items-center gap-1.5 sm:gap-2">
                {detail.metadata?.['Status'] && (
                  <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg text-[10px] sm:text-xs font-semibold bg-ok/20 text-ok border border-ok/30">
                    {detail.metadata['Status']}
                  </span>
                )}
                {detail.metadata?.['Type'] && (
                  <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg text-[10px] sm:text-xs font-semibold bg-accent text-white shadow-md border border-line-strong">
                    {detail.metadata['Type']}
                  </span>
                )}
                {detail.metadata?.['Released'] && (
                  <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg text-[10px] sm:text-xs font-medium bg-canvas/60 text-sub border border-line">
                    Tahun {detail.metadata['Released']}
                  </span>
                )}
              </div>
            </div>

            {/* Content Container */}
            <div className="p-4 sm:p-8 space-y-5 sm:space-y-6">
              {/* Header Info */}
              <div className="flex flex-row gap-3.5 sm:gap-6 items-start">
                {detail.cover && (
                  <div className="relative w-24 sm:w-40 aspect-[3/4] rounded-2xl overflow-hidden shadow-lg border border-line shrink-0 -mt-12 sm:-mt-16 bg-canvas z-10">
                    <Image
                      src={detail.cover}
                      alt={detail.title}
                      fill
                      loading="lazy"
                      decoding="async"
                      sizes="160px"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="space-y-2 sm:space-y-3 flex-1 min-w-0">
                  <div>
                    <h1 className="text-lg sm:text-3xl font-bold text-ink tracking-tight leading-snug">
                      {detail.title}
                    </h1>
                    {detail.metadata?.['Studio'] && (
                      <p className="text-xs sm:text-sm text-accent-soft font-semibold mt-0.5 sm:mt-1">
                        Studio: {detail.metadata['Studio']}
                      </p>
                    )}
                  </div>

                  {/* Genres Chips */}
                  {detail.genres && detail.genres.length > 0 && (
                    <div className="flex flex-wrap gap-1 sm:gap-1.5">
                      {detail.genres.map((g) => (
                        <span
                          key={g.slug || g.name}
                          className="text-[10px] sm:text-xs font-semibold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-xl bg-line border border-line text-sub"
                        >
                          {g.name}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-1">
                    {detail.episodes && detail.episodes.length > 0 && (
                      <button
                        onClick={() => {
                          const firstEp = detail.episodes[detail.episodes.length - 1] || detail.episodes[0];
                          onClose();
                          onWatchEpisode(firstEp.slug, `${detail.title} - ${firstEp.title}`);
                        }}
                        className="flex items-center gap-1.5 sm:gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-accent hover:scale-[1.02] active:scale-95 text-white font-semibold text-xs sm:text-sm shadow-sm border border-line-strong transition-all cursor-pointer"
                      >
                        <Play className="w-3.5 sm:w-4 h-3.5 sm:h-4 fill-white ml-0.5" />
                        <span>Mulai Nonton Ep 1</span>
                      </button>
                    )}

                    <button
                      onClick={() => onToggleBookmark(cardItem)}
                      className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border text-xs sm:text-sm font-semibold transition-all cursor-pointer active:scale-95 ${
                        bookmarked
                          ? 'bg-accent/30 border-accent-soft/40 text-accent-soft'
                          : 'bg-line border-line hover:bg-line-strong text-sub hover:text-ink'
                      }`}
                    >
                      {bookmarked ? <Check className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-accent-soft" /> : <Bookmark className="w-3.5 sm:w-4 h-3.5 sm:h-4" />}
                      <span>{bookmarked ? 'Tersimpan' : 'Bookmark'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Synopsis */}
              <div className="space-y-1.5 sm:space-y-2">
                <h3 className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-mute">
                  Sinopsis & Alur Cerita
                </h3>
                <p className="text-xs sm:text-sm text-sub leading-relaxed">
                  {detail.synopsis || 'Sinopsis belum tersedia untuk series donghua ini.'}
                </p>
              </div>

              {/* Metadata Grid */}
              {detail.metadata && Object.keys(detail.metadata).length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 p-3 sm:p-4 rounded-2xl bg-elevated border border-line text-[11px] sm:text-xs">
                  {Object.entries(detail.metadata).map(([k, v]) => (
                    <div key={k}>
                      <span className="text-faint block">{k}</span>
                      <span className="font-semibold text-ink line-clamp-1">{v}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Episodes List Grid */}
              <div className="space-y-2.5 sm:space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-mute flex items-center gap-1.5">
                    <Layers className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-accent-soft" />
                    Daftar Episode ({detail.episodes?.length || 0})
                  </h3>
                  <span className="text-[10px] sm:text-[11px] text-ok font-semibold">Sub Indo Lengkap</span>
                </div>

                {detail.episodes && detail.episodes.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-2.5 max-h-80 overflow-y-auto pr-1">
                    {detail.episodes.map((ep) => (
                      <button
                        key={ep.slug}
                        onClick={() => {
                          onClose();
                          onWatchEpisode(ep.slug, `${detail.title} - ${ep.title}`);
                        }}
                        className="group p-2 sm:p-2.5 rounded-xl bg-elevated hover:bg-elevated active:bg-accent/20 border border-line hover:border-accent-soft/40 flex items-center justify-between gap-2 cursor-pointer transition-all text-left"
                      >
                        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-line group-hover:bg-accent text-sub group-hover:text-white flex items-center justify-center font-bold text-[11px] sm:text-xs shrink-0 transition-colors">
                            {ep.episodeNumber || 'EP'}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-ink group-hover:text-accent-soft truncate">
                              {ep.title}
                            </p>
                            {ep.date && (
                              <span className="text-[10px] text-faint">{ep.date}</span>
                            )}
                          </div>
                        </div>

                        <Play className="w-3.5 h-3.5 text-faint group-hover:text-accent-soft shrink-0" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-faint">Belum ada episode yang terdaftar.</p>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
