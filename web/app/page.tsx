import { listDigests, getDigestContent } from '@/lib/docs';
import { Inbox, Archive } from 'lucide-react';
import DigestContent from '@/lib/digest-content';

export default async function HomePage() {
  const digests = await listDigests();

  if (digests.length === 0) {
    return (
      <div className="py-20 text-center" style={{ color: 'var(--text-muted)' }}>
        <Inbox size={48} className="mx-auto mb-4" style={{ color: 'var(--border)' }} />
        <p className="text-lg">暂无日报</p>
        <p className="mt-2 text-sm">等待 GitHub Actions 生成第一份日报...</p>
      </div>
    );
  }

  const latest = digests[0];
  const content = await getDigestContent(latest.date);

  if (!content) {
    return (
      <div className="py-20 text-center" style={{ color: 'var(--text-muted)' }}>
        <Inbox size={48} className="mx-auto mb-4" style={{ color: 'var(--border)' }} />
        <p className="text-lg">日报内容加载失败</p>
      </div>
    );
  }

  return (
    <div>
      <DigestContent content={content} />
      <div className="mt-8 text-center">
        <a
          href="/archives"
          className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm transition-colors"
          style={{ color: 'var(--accent)', border: '1px solid var(--border)' }}
        >
          <Archive size={16} />
          查看全部日报
        </a>
      </div>
    </div>
  );
}
