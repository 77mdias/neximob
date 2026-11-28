export default function PainelLoading() {
  return (
    <div className="min-h-screen bg-[var(--nx-bg)]" aria-busy="true" aria-label="Carregando painel">
      <div className="flex h-[56px] items-center border-b border-[var(--nx-border)] bg-[var(--nx-header-bg)] md:h-[64px]">
        <div className="mx-auto flex w-full max-w-[1152px] items-center justify-between px-4 md:px-8 lg:px-12">
          <div className="flex items-center gap-3">
            <div className="h-7 w-28 animate-pulse rounded bg-[var(--nx-surface-muted)]" />
            <div className="h-8 w-36 animate-pulse rounded-[6px] bg-[var(--nx-surface-muted)]" />
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden h-9 w-32 animate-pulse rounded-[6px] bg-[var(--nx-surface-muted)] md:block" />
            <div className="h-9 w-12 animate-pulse rounded-[6px] bg-[var(--nx-surface-muted)]" />
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-[1152px] space-y-6 px-4 pt-[22px] pb-[92px] md:px-8 md:pt-[30px] md:pb-14 lg:px-12">
        <div className="h-8 w-72 animate-pulse rounded bg-[var(--nx-surface-muted)]" />

        <div className="grid grid-cols-2 overflow-hidden rounded-[8px] border border-[var(--nx-border)] bg-[var(--nx-surface)] lg:grid-cols-4">
          <div className="h-[104px] animate-pulse p-4" />
          <div className="h-[104px] animate-pulse border-l border-[var(--nx-border)] p-4" />
          <div className="h-[104px] animate-pulse border-t border-[var(--nx-border)] p-4 lg:border-t-0 lg:border-l" />
          <div className="h-[104px] animate-pulse border-t border-l border-[var(--nx-border)] p-4 lg:border-t-0" />
        </div>

        <div className="h-10 w-80 animate-pulse rounded bg-[var(--nx-surface-muted)]" />

        <div className="space-y-2 rounded-[8px] border border-[var(--nx-border)] p-4">
          <div className="h-10 w-full animate-pulse rounded bg-[var(--nx-surface-subtle)]" />
          <div className="h-12 w-full animate-pulse rounded bg-[var(--nx-surface-subtle)]" />
          <div className="h-12 w-full animate-pulse rounded bg-[var(--nx-surface-subtle)]" />
          <div className="h-12 w-full animate-pulse rounded bg-[var(--nx-surface-subtle)]" />
        </div>
      </main>
    </div>
  );
}
