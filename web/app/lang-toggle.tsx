'use client';

import { useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Languages } from 'lucide-react';

export default function LangToggle() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const currentLang = searchParams.get('lang') || 'zh';

  const toggle = useCallback(() => {
    const next = currentLang === 'en' ? 'zh' : 'en';
    const params = new URLSearchParams(searchParams.toString());
    if (next === 'zh') {
      params.delete('lang');
    } else {
      params.set('lang', next);
    }
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }, [currentLang, searchParams, pathname, router]);

  return (
    <button
      onClick={toggle}
      aria-label={currentLang === 'zh' ? 'Switch to English' : '切换中文'}
      className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors"
      style={{
        color: 'var(--text-muted)',
        border: '1px solid var(--border)',
        backgroundColor: 'transparent',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = 'var(--text)';
        e.currentTarget.style.backgroundColor = 'var(--surface-card)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = 'var(--text-muted)';
        e.currentTarget.style.backgroundColor = 'transparent';
      }}
    >
      <Languages size={14} />
      {currentLang === 'zh' ? 'EN' : '中文'}
    </button>
  );
}
