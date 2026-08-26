import React from 'react';
import { ShieldCheck, Zap, Tv, Calendar, Heart, Award } from 'lucide-react';

interface PortalStatsBannerProps {
  onOpenSchedule: () => void;
  totalGenres: number;
}

export const PortalStatsBanner: React.FC<PortalStatsBannerProps> = ({
  onOpenSchedule,
  totalGenres
}) => {
  return (
    <section className="py-6">
      <div className="rounded-3xl bg-elevated border border-line p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-accent/10 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 relative z-10">
          {/* Stat 1 */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-accent/20 border border-accent-soft/40 flex items-center justify-center text-accent-soft shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <p className="text-base sm:text-lg font-bold text-ink">Update Realtime</p>
              <p className="text-xs text-mute">Rilis setiap hari</p>
            </div>
          </div>

          {/* Stat 2 */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-ok/20 border border-ok/30 flex items-center justify-center text-ok shrink-0">
              <Tv className="w-5 h-5" />
            </div>
            <div>
              <p className="text-base sm:text-lg font-bold text-ink">Multi-Server HD</p>
              <p className="text-xs text-mute">Anti lag & buffering</p>
            </div>
          </div>

          {/* Stat 3 */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-warn/20 border border-warn/30 flex items-center justify-center text-warn shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <p className="text-base sm:text-lg font-bold text-ink">{totalGenres}+ Genre</p>
              <p className="text-xs text-mute">Kultivasi, Aksi & 3D</p>
            </div>
          </div>

          {/* Stat 4 */}
          <div
            onClick={onOpenSchedule}
            className="flex items-center gap-3 cursor-pointer group hover:opacity-90 transition-opacity"
          >
            <div className="w-10 h-10 rounded-2xl bg-accent/20 border border-accent-soft/40 group-hover:bg-accent/30 flex items-center justify-center text-accent-soft shrink-0 transition-colors">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-base sm:text-lg font-bold text-ink group-hover:text-accent-soft transition-colors">
                Jadwal Mingguan
              </p>
              <p className="text-xs text-accent-soft font-semibold flex items-center gap-1">
                Buka Jadwal →
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
