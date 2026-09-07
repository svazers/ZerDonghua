import React from 'react';

/**
 * Lightweight image component that replaces next/image.
 * donghub.vip images sit behind Cloudflare which 403s requests lacking a
 * same-site Referer, so we proxy them through /api/img (which injects the
 * Referer server-side). Keeps real covers instead of placeholders.
 * onError still falls back to a placeholder if the proxy fails.
 */
const PLACEHOLDER =
  'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&auto=format&fit=crop&q=80';

const PROXIED_HOSTS = ['donghub.vip', 'img.donghub.vip', 'cdn.donghub.vip'];

function resolveSrc(src: string): string {
  if (!src) return src;
  try {
    const url = new URL(src);
    if (PROXIED_HOSTS.includes(url.hostname)) {
      return `/api/img?u=${encodeURIComponent(src)}`;
    }
  } catch {
    /* relative or malformed — use as-is */
  }
  return src;
}

const SafeImage: React.FC<
  React.ImgHTMLAttributes<HTMLImageElement> & { fill?: boolean }
> = ({ src, alt = '', fill, sizes, className, style, onError, ...rest }) => {
  const resolved = resolveSrc(typeof src === 'string' ? src : '');
  return (
    <img
      src={resolved}
      alt={alt}
      loading="lazy"
      decoding="async"
      data-nimg={fill ? 'fill' : undefined}
      sizes={sizes}
      className={className}
      style={{
        ...(fill
          ? {
              position: 'absolute',
              height: '100%',
              width: '100%',
              left: 0,
              top: '0',
              right: 0,
              bottom: 0,
              color: 'transparent',
            }
          : {}),
        ...style,
      }}
      onError={(e) => {
        const t = e.currentTarget;
        if (t.dataset.fallback !== '1') {
          t.dataset.fallback = '1';
          t.removeAttribute('srcset');
          t.removeAttribute('sizes');
          t.src = PLACEHOLDER;
        }
        onError?.(e);
      }}
      {...rest}
    />
  );
};

export { SafeImage };
export default SafeImage;
