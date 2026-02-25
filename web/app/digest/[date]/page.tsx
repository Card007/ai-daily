import { notFound } from 'next/navigation';
import { getDigestContent, listDigests } from '@/lib/docs';
import { getUiText } from '@/lib/ui-text';
import { ArrowLeft } from 'lucide-react';
import DigestContent from '@/lib/digest-content';

interface PageProps {
  params: Promise<{ date: string }>;
  searchParams: Promise<{ lang?: string }>;
}

export default async function DigestPage({ params, searchParams }: PageProps) {
  const { date } = await params;
  const { lang } = await searchParams;
  const t = getUiText(lang);
  const content = await getDigestContent(date, lang);

  if (!content) {
    notFound();
  }

  const displayDate = date.replace(/_/g, '-');
  const archivesHref = lang === 'en' ? '/archives?lang=en' : '/archives';

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <a
          href={archivesHref}
          className="flex items-center gap-1 text-sm transition-colors"
          style={{ color: 'var(--text-muted)' }}
        >
          <ArrowLeft size={14} />
          {t.archives}
        </a>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>
          {displayDate} {t.digest}
        </h1>
      </div>
      <DigestContent content={content} />
    </div>
  );
}

export async function generateStaticParams() {
  const digests = await listDigests();
  return digests.map((d) => ({ date: d.date }));
}
