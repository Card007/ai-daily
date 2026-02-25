import { listDigests } from '@/lib/docs';
import { Inbox, ChevronLeft, ChevronRight } from 'lucide-react';

const PAGE_SIZE = 20;

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function ArchivesPage({ searchParams }: PageProps) {
  const { page } = await searchParams;
  const currentPage = Math.max(1, parseInt(page ?? '1', 10) || 1);
  const digests = await listDigests();
  const totalPages = Math.max(1, Math.ceil(digests.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  const items = digests.slice(start, start + PAGE_SIZE);

  if (digests.length === 0) {
    return (
      <div className="py-20 text-center" style={{ color: 'var(--text-muted)' }}>
        <Inbox size={48} className="mx-auto mb-4" style={{ color: 'var(--border)' }} />
        <p className="text-lg">暂无日报</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-8 text-2xl font-bold" style={{ color: 'var(--text)' }}>
        全部日报
      </h1>

      <ul className="space-y-2">
        {items.map((d, i) => (
          <li key={d.date}>
            <a
              href={i === 0 && safePage === 1 ? '/' : `/digest/${d.date}`}
              className="flex items-center justify-between rounded-lg px-4 py-3 transition-colors"
              style={{ border: '1px solid var(--border)' }}
            >
              <span style={{ color: 'var(--text)' }}>{d.displayDate}</span>
              {i === 0 && safePage === 1 && (
                <span
                  className="rounded px-2 py-0.5 text-xs"
                  style={{ backgroundColor: 'var(--accent-dim)', color: 'var(--accent)' }}
                >
                  最新
                </span>
              )}
            </a>
          </li>
        ))}
      </ul>

      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-4">
          {safePage > 1 ? (
            <a
              href={`/archives?page=${safePage - 1}`}
              className="flex items-center gap-1 rounded-md px-3 py-1.5 text-sm transition-colors"
              style={{ color: 'var(--text-muted)', border: '1px solid var(--border)' }}
            >
              <ChevronLeft size={14} />
              上一页
            </a>
          ) : (
            <span
              className="flex items-center gap-1 rounded-md px-3 py-1.5 text-sm"
              style={{ color: 'var(--border)' }}
            >
              <ChevronLeft size={14} />
              上一页
            </span>
          )}

          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {safePage} / {totalPages}
          </span>

          {safePage < totalPages ? (
            <a
              href={`/archives?page=${safePage + 1}`}
              className="flex items-center gap-1 rounded-md px-3 py-1.5 text-sm transition-colors"
              style={{ color: 'var(--text-muted)', border: '1px solid var(--border)' }}
            >
              下一页
              <ChevronRight size={14} />
            </a>
          ) : (
            <span
              className="flex items-center gap-1 rounded-md px-3 py-1.5 text-sm"
              style={{ color: 'var(--border)' }}
            >
              下一页
              <ChevronRight size={14} />
            </span>
          )}
        </div>
      )}
    </div>
  );
}
