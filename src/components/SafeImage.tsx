import React from 'react';

/**
 * Lightweight image component that replaces next/image for remote URLs.
 * donghub.vip posters are behind Cloudflare bot-protection; the next/image
 * server-side optimizer gets 403 and posters fail to load. This renders a
 * plain <img> (browser fetches directly with proper headers) with an
 * onError fallback to a placeholder so card layout is never broken.
 *
 * ponytail: single shared placeholder, add per-section fallbacks if UX needs it.
 */
const PLACEHOLDER = 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&auto=format&fit=crop&q=80';

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  /** next/image-style props we still accept but ignore or adapt */
  fill?: boolean;
  sizes?: string;
  quality?: number;
  priority?: boolean;
  placeholder?: string;
  blurDataURL?: string;
}

export const SafeImage: React.FC<SafeImageProps> = ({
  src,
  alt = '',
  fill,
  sizes,
  className,
  style,
  onError,
  ...rest
}) => {
  const handleError: React.ReactEventHandler<HTMLImageElement> = (e) => {
    const img = e.currentTarget as HTMLImageElement;
    if (img.dataset.fallback === '1') return;
    img.dataset.fallback = '1';
    img.src = PLACEHOLDER;
    onError?.(e);
  };

  // fill = next/image "fill" mode: absolute positioning to cover parent
  const fillStyle: React.CSSProperties = fill
    ? {
        position: 'absolute',
        height: '100%',
        width: '100%',
        left: 0,
        top: '0',
        right: '0',
        bottom: '0',
        color: 'transparent',
      }
    : {};

  return (
    <img
      src={src as string}
      alt={alt}
      loading="lazy"
      decoding="async"
      data-nimg={fill ? 'fill' : undefined}
      sizes={sizes}
      className={className}
      style={{ ...fillStyle, ...style }}
      onError={handleError}
      {...rest}
    />
  );
};
