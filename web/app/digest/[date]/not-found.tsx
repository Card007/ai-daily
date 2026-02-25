import { FileQuestion } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="py-20 text-center">
      <FileQuestion size={48} className="mx-auto mb-4" style={{ color: 'var(--border)' }} />
      <h2 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>404</h2>
      <p className="mt-2" style={{ color: 'var(--text-muted)' }}>Digest not found</p>
      <a
        href="/"
        className="mt-4 inline-block text-sm transition-colors"
        style={{ color: 'var(--accent)' }}
      >
        Back to Home
      </a>
    </div>
  );
}
