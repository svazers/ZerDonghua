import React from 'react';
import Image from 'next/image';

interface ZerDonghuaLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  showBadge?: boolean;
  className?: string;
}

export const ZerDonghuaLogo: React.FC<ZerDonghuaLogoProps> = ({
  size = 'md',
  showSubtitle = true,
  showBadge = true,
  className = ''
}) => {
  const iconSizeMap = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const titleSizeMap = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl'
  };

  const badgeSizeMap = {
    sm: 'text-[9px] px-1 py-0.2',
    md: 'text-[10px] px-1.5 py-0.5',
    lg: 'text-xs px-2 py-0.5',
    xl: 'text-xs px-2.5 py-1'
  };

  return (
    <div className={`flex items-center gap-2.5 sm:gap-3 group select-none ${className}`}>
      {/* Logo mark */}
      <div
        className={`relative ${iconSizeMap[size]} rounded-2xl bg-accent p-[1.5px] shadow-sm group-hover:shadow-md transition-all duration-300 group-hover:scale-105 shrink-0`}
      >
        {/* Background dark shield with subtle radial gradient */}
        <div className="w-full h-full bg-surface rounded-[14px] flex items-center justify-center overflow-hidden relative">
          <Image
            src="/icon.png"
            alt="ZerDonghua"
            fill
            decoding="async"
            sizes="64px"
            className="w-full h-full object-contain p-1.5 relative z-10"
          />
        </div>
      </div>

      {/* Brand Typography */}
      <div>
        <div className="flex items-center gap-1.5">
          <span
            className={`${titleSizeMap[size]} font-black tracking-tight text-ink group-hover:text-accent-soft transition-colors leading-none`}
          >
            ZER
            <span className="text-accent-soft">
              DONGHUA
            </span>
          </span>
          {showBadge && (
            <span
              className={`${badgeSizeMap[size]} font-black uppercase rounded-md bg-accent text-white tracking-widest shadow-sm border border-line-strong leading-tight`}
            >
              HD
            </span>
          )}
        </div>
        {showSubtitle && (
          <p className="text-[10px] sm:text-[11px] text-mute font-medium tracking-wide mt-0.5">
            Streaming Donghua Sub Indo
          </p>
        )}
      </div>
    </div>
  );
};
