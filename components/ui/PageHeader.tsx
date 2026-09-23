export function PageHeader({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: React.ReactNode }) {
  return (
    <header className="container-page pb-8 pt-12 sm:pt-16">
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h1 className="mt-2 text-4xl font-bold sm:text-5xl">{title}</h1>
      {children && <div className="mt-4 max-w-2xl text-lg leading-relaxed text-paper-200">{children}</div>}
    </header>
  );
}

export function Notice({ tone = 'info', children }: { tone?: 'info' | 'success' | 'warning' | 'error'; children: React.ReactNode }) {
  const styles = {
    info: 'border-ink-600 bg-ink-900 text-paper-200',
    success: 'border-emerald-700/60 bg-emerald-950/40 text-emerald-100',
    warning: 'border-brass-600/60 bg-brass-600/10 text-paper-100',
    error: 'border-stamp-500/60 bg-stamp-600/15 text-paper-50',
  }[tone];
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={`rounded-lg border px-4 py-3 text-sm leading-relaxed ${styles}`}>
      {children}
    </div>
  );
}
