import React from 'react';

/**
 * Lightweight image component that replaces next/image.
 * anichin.cafe images sit behind Cloudflare which 403s requests lacking a
 * same-site Referer, so we proxy them through /api/img (server-side). Keeps
 * real covers instead of placeholders. onError falls back to a dark SVG.
 */
// Dark-themed SVG data URI placeholder — clearly a placeholder, not a random photo.
const PLACEHOLDER =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjU2MCIgdmlld0JveD0iMCAwIDQwMCA1NjAiIHhtbG5zPSJodHRwOi8vd3d3Lncub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMWExYTFhIi8+PHRleHQgeD0iNTAlIiB5PSI1MyUiIGZvbnQtc2l6ZT0iMTIiIGZvbnQtZmFtaWx5PSJNb25vc3BlY3QiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM2MjYyNjkiPk5vIENvdmVyPC90ZXh0Pjwvc3ZnPg==';

const PROXIED_HOSTS = ['donghub.vip', 'img.donghub.vip', 'cdn.donghub.vip', 'anichin.cafe'];

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
