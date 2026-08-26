import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Search, X, Flame, Play, Info } from 'lucide-react';
import { DonghuaCardItem } from '../types';
import { donghuaApi } from '../services/donghuaApi';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDetail: (slug: string) => void;
  onWatch: (slug: string, title?: string) => void;
}

const TRENDING_SEARCHES = [
  'Battle Through the Heavens',
  'Perfect World',
  'Renegade Immortal',
  'Soul Land',
  'Throne of Seal',
  'Swallowed Star',
  'Shrouding the Heavens',
  'The Great Ruler'
];

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onSelectDetail,
  onWatch
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<DonghuaCardItem[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        // Toggle search
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(() => {
      donghuaApi
        .search(query.trim())
        .then((res) => {
          setResults(res.results || []);
        })
        .catch((err) => {
          console.error('Search error:', err);
          setResults([]);
        })
        .finally(() => setLoading(false));
    }, 400);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div
      id="search-modal"
      className="fixed inset-0 z-50 bg-canvas/90 flex items-start justify-center pt-16 sm:pt-24 px-4 pb-6 overflow-y-auto animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-3xl bg-surface/95 border border-line shadow-lg overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="p-4 sm:p-5 border-b border-line bg-surface flex items-center gap-3">
          <Search className="w-5 h-5 text-accent-soft shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari judul donghua (contoh: Perfect World, BTTH, Xian Ni)..."
            className="flex-1 bg-transparent text-ink placeholder-faint text-sm sm:text-base focus:outline-none font-medium"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-md text-faint hover:text-ink"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="px-2.5 py-1 rounded-lg bg-line text-mute hover:text-ink text-xs font-semibold"
          >
            ESC
          </button>
        </div>

        {/* Trending Searches Suggestions */}
        {!query && (
          <div className="p-4 border-b border-line bg-elevated space-y-2">
            <span className="text-xs font-bold text-mute uppercase tracking-wider flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-warn" />
              Pencarian Populer
            </span>
            <div className="flex flex-wrap gap-2">
              {TRENDING_SEARCHES.map((k) => (
                <button
                  key={k}
                  onClick={() => setQuery(k)}
                  className="px-3 py-1.5 rounded-xl bg-line hover:bg-accent/20 text-sub hover:text-accent-soft border border-line hover:border-accent-soft/40 text-xs transition-colors cursor-pointer"
                >
                  {k}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-3 sm:p-4 divide-y divide-line space-y-1">
          {loading ? (
            <div className="py-12 text-center text-mute space-y-2">
              <div className="w-6 h-6 rounded-full border-2 border-accent-soft border-t-transparent animate-spin mx-auto" />
              <p className="text-xs">Mencari judul donghua...</p>
            </div>
          ) : results.length > 0 ? (
            results.map((item) => (
              <div
                key={item.slug}
                onClick={() => {
                  onClose();
                  onSelectDetail(item.slug);
                }}
                className="group p-2.5 rounded-2xl hover:bg-elevated flex items-center justify-between gap-3 cursor-pointer transition-all border border-transparent hover:border-accent-soft/40"
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

                  <div className="min-w-0 space-y-0.5">
                    <h4 className="text-xs sm:text-sm font-semibold text-ink group-hover:text-accent-soft transition-colors truncate">
                      {item.title}
                    </h4>
                    <div className="flex items-center gap-2 text-[10px] text-mute">
                      {item.type && (
                        <span className="px-1.5 py-0.2 rounded bg-accent/20 text-accent-soft border border-accent-soft/40">
                          {item.type}
                        </span>
                      )}
                      {item.episode && (
                        <span className="text-ok font-semibold">{item.episode}</span>
                      )}
                      {item.subStatus && (
                        <span className="text-mute">{item.subStatus}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onClose();
                      onWatch(item.slug, item.title);
                    }}
                    className="p-2 rounded-xl bg-accent text-white transition-colors shadow-sm"
                    title="Nonton Sekarang"
                  >
                    <Play className="w-4 h-4 fill-white text-white ml-0.5" />
                  </button>
                </div>
              </div>
            ))
          ) : query ? (
            <div className="p-8 text-center text-mute text-sm space-y-2">
              <p>Tidak ada donghua ditemukan untuk "{query}"</p>
              <p className="text-xs text-faint">Coba kata kunci lain atau pilih dari pencarian populer di atas.</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
