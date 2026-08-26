import React from 'react';
import { Sparkles, Heart, Shield, Film, Github } from 'lucide-react';
import { DonghuaGenre } from '../types';
import { ZerDonghuaLogo } from './ZerDonghuaLogo';

interface FooterProps {
  genres: DonghuaGenre[];
  onSelectGenre: (genreSlug: string) => void;
  onOpenSchedule: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  genres,
  onSelectGenre,
  onOpenSchedule
}) => {
  return (
    <footer className="mt-16 border-t border-line bg-canvas text-mute pt-12 pb-24 md:pb-12 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <ZerDonghuaLogo size="lg" />
            <p className="text-xs sm:text-sm text-mute max-w-md leading-relaxed">
              Platform portal streaming donghua (Chinese anime) 3D dan 2D subtitle Indonesia terlengkap. Update tercepat setiap hari dengan kualitas video HD & multi-server player.
            </p>
            <div className="flex items-center gap-2 text-xs text-ok font-semibold">
              <Shield className="w-4 h-4" />
              <span>Fast Mirror Servers • Bebas Iklan Mengganggu</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-ink uppercase tracking-wider">
              Navigasi Cepat
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="hover:text-accent-soft transition-colors cursor-pointer"
                >
                  Spotlight Unggulan
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    const el = document.getElementById('popular');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="hover:text-accent-soft transition-colors cursor-pointer"
                >
                  Populer & Trending
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    const el = document.getElementById('latest');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="hover:text-accent-soft transition-colors cursor-pointer"
                >
                  Update Episode Terbaru
                </button>
              </li>
              <li>
                <button
                  onClick={onOpenSchedule}
                  className="hover:text-accent-soft transition-colors cursor-pointer"
                >
                  Jadwal Rilis Mingguan
                </button>
              </li>
            </ul>
          </div>

          {/* Popular Genres */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-ink uppercase tracking-wider">
              Genre Donghua
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {genres.slice(0, 8).map((g) => (
                <button
                  key={g.slug || g.name}
                  onClick={() => onSelectGenre(g.slug)}
                  className="text-[11px] px-2 py-1 rounded-lg bg-line hover:bg-accent/20 text-sub hover:text-accent-soft border border-line transition-colors cursor-pointer"
                >
                  {g.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Disclaimer & Copyright */}
        <div className="pt-6 border-t border-line flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-faint">
          <p>
            © {new Date().getFullYear()} ZerDonghua Streaming. Platform Donghua Subtitle Indonesia.
          </p>
          <p className="flex items-center gap-1">
            Dibuat dengan <Heart className="w-3 h-3 text-warn fill-warn" /> untuk pecinta Donghua Indonesia
          </p>
        </div>
      </div>
    </footer>
  );
};
