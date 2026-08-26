import React, { useState } from 'react';
import Image from 'next/image';
import { Bookmark, History, Trash2, Play, X, Clock } from 'lucide-react';
import { BookmarkEntry, WatchHistoryEntry } from '../types';

interface WatchlistDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  bookmarks: BookmarkEntry[];
  history: WatchHistoryEntry[];
  onSelectDetail: (slug: string) => void;
  onWatch: (slug: string, title?: string) => void;
  onRemoveBookmark: (slug: string) => void;
  onRemoveHistory: (slug: string) => void;
  onClearHistory: () => void;
}

export const WatchlistDrawer: React.FC<WatchlistDrawerProps> = ({
  isOpen,
  onClose,
  bookmarks,
  history,
  onSelectDetail,
  onWatch,
  onRemoveBookmark,
  onRemoveHistory,
  onClearHistory
}) => {
  const [activeTab, setActiveTab] = useState<'bookmarks' | 'history'>('bookmarks');

  if (!isOpen) return null;

  return (
    <div
      id="watchlist-drawer-backdrop"
      className="fixed inset-0 z-50 bg-canvas/80 flex justify-end animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md h-full bg-surface/95 border-l border-line shadow-lg flex flex-col animate-in slide-in-from-right duration-250 text-sub"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-line flex items-center justify-between bg-surface">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-accent/20 border border-accent-soft/40 flex items-center justify-center text-accent-soft">
              <Bookmark className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-ink">
                Daftar Simpan & Riwayat
              </h2>
              <p className="text-[11px] text-mute">Kelola bookmark & streaming history</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-line hover:bg-line-strong text-mute hover:text-ink transition-colors cursor-pointer border border-line"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex p-2 bg-canvas border-b border-line gap-2">
          <button
            onClick={() => setActiveTab('bookmarks')}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'bookmarks'
                ? 'bg-accent text-white shadow-sm border border-line-strong'
                : 'text-mute hover:text-ink bg-line border border-line'
            }`}
          >
            Bookmark ({bookmarks.length})
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'bg-accent text-white shadow-sm border border-line-strong'
                : 'text-mute hover:text-ink bg-line border border-line'
            }`}
          >
            Riwayat Nonton ({history.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-24 sm:pb-6">
          {activeTab === 'bookmarks' ? (
            bookmarks.length > 0 ? (
              <div className="space-y-2.5">
                {bookmarks.map((item) => (
                  <div
                    key={item.slug}
                    className="group p-3 rounded-2xl bg-elevated border border-line hover:border-accent-soft/40 flex items-center justify-between gap-3 transition-all"
                  >
                    <div
                      className="flex items-center gap-3 min-w-0 cursor-pointer"
                      onClick={() => {
                        onClose();
                        onSelectDetail(item.slug);
                      }}
                    >
                      {item.cover && (
                        <div className="relative w-12 h-16 rounded-xl overflow-hidden shrink-0 bg-canvas border border-line">
                          <Image
                            src={item.cover}
                            alt={item.title}
                            fill
                            loading="lazy"
                            decoding="async"
                            sizes="48px"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="min-w-0">
                        <h4 className="text-xs font-semibold text-ink group-hover:text-accent-soft truncate">
                          {item.title}
                        </h4>
                        {item.type && (
                          <p className="text-[10px] text-mute mt-0.5">
                            {item.type} • {item.status || 'Ongoing'}
                          </p>
                        )}
                        <span className="text-[10px] font-semibold text-ok">
                          Tersimpan
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => {
                          onClose();
                          onWatch(item.slug, item.title);
                        }}
                        className="p-2 rounded-xl bg-accent text-white shadow-sm transition-colors cursor-pointer"
                        title="Nonton Sekarang"
                      >
                        <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                      </button>
                      <button
                        onClick={() => onRemoveBookmark(item.slug)}
                        className="p-2 rounded-xl bg-line hover:bg-bad/15 text-mute hover:text-bad border border-line transition-colors cursor-pointer"
                        title="Hapus Bookmark"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 space-y-3 text-faint">
                <Bookmark className="w-10 h-10 text-faint stroke-1" />
                <p className="text-sm font-semibold text-mute">Bookmark Anda masih kosong</p>
                <p className="text-xs">Klik tombol bookmark pada poster donghua untuk menyimpannya di sini.</p>
              </div>
            )
          ) : (
            history.length > 0 ? (
              <div className="space-y-3">
                <div className="flex justify-end">
                  <button
                    onClick={onClearHistory}
                    className="text-[11px] text-bad/80 hover:text-bad flex items-center gap-1 font-medium cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" /> Bersihkan Riwayat
                  </button>
                </div>
                <div className="space-y-2.5">
                  {history.map((item) => (
                    <div
                      key={item.slug}
                      className="group p-3 rounded-2xl bg-elevated border border-line hover:border-accent-soft/40 flex items-center justify-between gap-3 transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {item.cover && (
                          <div className="relative w-12 h-16 rounded-xl overflow-hidden shrink-0 bg-canvas border border-line">
                            <Image
                              src={item.cover}
                              alt={item.title}
                              fill
                              loading="lazy"
                              decoding="async"
                              sizes="48px"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="min-w-0 space-y-1">
                          <h4 className="text-xs font-semibold text-ink group-hover:text-accent-soft truncate">
                            {item.seriesTitle || item.title}
                          </h4>
                          <p className="text-[11px] text-accent-soft font-semibold">
                            {item.episodeNumber ? `Ep ${item.episodeNumber}` : item.title}
                          </p>
                          <div className="w-24 h-1 bg-line rounded-full overflow-hidden">
                            <div
                              className="h-full bg-accent rounded-full"
                              style={{ width: `${item.progressPercent || 50}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => {
                            onClose();
                            onWatch(item.slug, item.title);
                          }}
                          className="p-2 rounded-xl bg-accent text-white shadow-sm transition-colors cursor-pointer"
                          title="Lanjutkan Nonton"
                        >
                          <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                        </button>
                        <button
                          onClick={() => onRemoveHistory(item.slug)}
                          className="p-2 rounded-xl bg-line hover:bg-bad/15 text-mute hover:text-bad border border-line transition-colors cursor-pointer"
                          title="Hapus riwayat"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 space-y-3 text-faint">
                <Clock className="w-10 h-10 text-faint stroke-1" />
                <p className="text-sm font-semibold text-mute">Belum ada riwayat streaming</p>
                <p className="text-xs">Mulai tonton episode donghua untuk mencatat progress pemutaran Anda.</p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};
