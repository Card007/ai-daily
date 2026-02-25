import { listDigests } from '@/lib/docs';
import { getUiText } from '@/lib/ui-text';
import { Inbox, ChevronLeft, ChevronRight } from 'lucide-react';

const PAGE_SIZE = 20;

interface PageProps {
  searchParams: Promise<{ page?: string; lang?: string }>;
}

export default async function ArchivesPage({ searchParams }: PageProps) {
  const { page, lang } = await searchParams;
  const t = getUiText(lang);
  const currentPage = Math.max(1, parseInt(page ?? '1', 10) || 1);
  const digests = await listDigests();
  const totalPages = Math.max(1, Math.ceil(digests.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  const items = digests.slice(start, start + PAGE_SIZE);
  const langParam = lang === 'en' ? '&lang=en' : '';
  const langOnly = lang === 'en' ? '?lang=en' : '';

  if (digests.length === 0) {
    return (
      <div className="py-20 text-center" style={{ color: 'var(--text-muted)' }}>
        <Inbox size={48} className="mx-auto mb-4" style={{ color: 'var(--border)' }} />
        <p className="text-lg">{t.noDigests}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-8 text-2xl font-bold" style={{ color: 'var(--text)' }}>
        {t.archives}
      </h1>

      <ul className="space-y-2">
        {items.map((d, i) => {
          const href = i === 0 && safePage === 1
            ? `/${langOnly}`
            : `/digest/${d.date}${langOnly}`;
          return (
            <li key={d.date}>
              <a
                href={href}
                className="flex items-center justify-between rounded-lg px-4 py-3 transition-colors"
                style={{ border: '1px solid var(--border)' }}
              >
                <span style={{ color: 'var(--text)' }}>{d.displayDate}</span>
                {i === 0 && safePage === 1 && (
                  <span
                    className="rounded px-2 py-0.5 text-xs"
                    style={{ backgroundColor: 'var(--accent-dim)', color: 'var(--accent)' }}
                  >
                    {t.latest}
                  </span>
                )}
              </a>
            </li>
          );
        })}
      </ul>

      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-4">
          {safePage > 1 ? (
            <a
              href={`/archives?page=${safePage - 1}${langParam}`}
              className="flex items-center gap-1 rounded-md px-3 py-1.5 text-sm transition-colors"
              style={{ color: 'var(--text-muted)', border: '1px solid var(--border)' }}
            >
              <ChevronLeft size={14} />
              {t.prev}
            </a>
          ) : (
            <span
              className="flex items-center gap-1 rounded-md px-3 py-1.5 text-sm"
              style={{ color: 'var(--border)' }}
            >
              <ChevronLeft size={14} />
              {t.prev}
            </span>
          )}

          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {safePage} / {totalPages}
          </span>

          {safePage < totalPages ? (
            <a
              href={`/archives?page=${safePage + 1}${langParam}`}
              className="flex items-center gap-1 rounded-md px-3 py-1.5 text-sm transition-colors"
              style={{ color: 'var(--text-muted)', border: '1px solid var(--border)' }}
            >
              {t.next}
              <ChevronRight size={14} />
            </a>
          ) : (
            <span
              className="flex items-center gap-1 rounded-md px-3 py-1.5 text-sm"
              style={{ color: 'var(--border)' }}
            >
              {t.next}
              <ChevronRight size={14} />
            </span>
          )}
        </div>
      )}
    </div>
  );
}
