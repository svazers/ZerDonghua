import type { Metadata, Viewport } from 'next';
import { Inter, Outfit } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '900'],
  variable: '--font-inter',
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  variable: '--font-outfit',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ZerDonghua - Streaming Donghua Subtitle Indonesia Terlengkap',
  description:
    'Nonton streaming Donghua (Chinese Anime) 3D dan 2D subtitle Indonesia kualitas HD gratis dengan multi-server player, update tercepat, dan jadwal rilis mingguan.',
  applicationName: 'ZerDonghua',
  icons: { icon: '/icon.png', apple: '/icon.png' },
  openGraph: {
    title: 'ZerDonghua - Streaming Donghua Subtitle Indonesia',
    description:
      'Nonton streaming Donghua (Chinese Anime) 3D dan 2D subtitle Indonesia kualitas HD gratis dengan multi-server player, update tercepat, dan jadwal rilis mingguan.',
    type: 'website',
    images: ['/icon.png'],
  },
  twitter: { card: 'summary_large_image', images: ['/icon.png'] },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fafafa' },
    { media: '(prefers-color-scheme: dark)', color: '#06060b' }
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

const themeInit = `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark')}catch(e){}})()`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${inter.variable} ${outfit.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body className="bg-canvas text-ink antialiased selection:bg-accent selection:text-white">
        {children}
      </body>
    </html>
  );
}
