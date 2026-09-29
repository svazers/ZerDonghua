import { notFound } from 'next/navigation';
import { getDonghua } from '@/lib/donghuaServer';
import App from '@/App';
import type { DonghuaHomeData } from '@/types';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ slug: string[] }> };

export default async function OverlayPage({ params }: Props) {
  const { slug } = await params;
  const [type, ...parts] = slug;
  if (!['detail', 'watch'].includes(type) || !parts.length) notFound();
  const route = { type: type as 'detail' | 'watch', slug: parts.join('/') };
  let initialHomeData: DonghuaHomeData | null = null;
  try {
    initialHomeData = await getDonghua('home', {});
  } catch (err) {
    console.error('Failed to load initial home data for SSR:', err);
  }
  return <App initialHomeData={initialHomeData} initialRoute={route} />;
}
