import { listDigests, getDigestContent } from '@/lib/docs';
import { getUiText } from '@/lib/ui-text';
import { Inbox, Archive } from 'lucide-react';
import DigestContent from '@/lib/digest-content';

interface PageProps {
  searchParams: Promise<{ lang?: string }>;
}

export default async function HomePage({ searchParams }: PageProps) {
  const { lang } = await searchParams;
  const t = getUiText(lang);
  const digests = await listDigests();

  if (digests.length === 0) {
    return (
      <div className="py-20 text-center" style={{ color: 'var(--text-muted)' }}>
        <Inbox size={48} className="mx-auto mb-4" style={{ color: 'var(--border)' }} />
        <p className="text-lg">{t.noDigests}</p>
        <p className="mt-2 text-sm">{t.noDigestsHint}</p>
      </div>
    );
  }

  const latest = digests[0];
  const content = await getDigestContent(latest.date, lang);

  if (!content) {
    return (
      <div className="py-20 text-center" style={{ color: 'var(--text-muted)' }}>
        <Inbox size={48} className="mx-auto mb-4" style={{ color: 'var(--border)' }} />
        <p className="text-lg">{t.loadFailed}</p>
      </div>
    );
  }

  return (
    <div>
      <DigestContent content={content} />
      <div className="mt-8 text-center">
        <a
          href={lang === 'en' ? '/archives?lang=en' : '/archives'}
          className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm transition-colors"
          style={{ color: 'var(--accent)', border: '1px solid var(--border)' }}
        >
          <Archive size={16} />
          {t.viewAll}
        </a>
      </div>
    </div>
  );
}
