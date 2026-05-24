export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="h-8 w-32 animate-pulse rounded bg-[var(--surface-2)]" />
      <div className="mt-6 animate-pulse">
        <div className="h-3 w-48 rounded bg-[var(--surface-2)]" />
        <div className="mt-2 h-8 w-72 rounded bg-[var(--surface-2)]" />
        <div className="mt-2 h-4 w-40 rounded bg-[var(--surface-2)]" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,320px)_1fr]">
        <aside className="flex flex-col gap-4">
          <div className="h-[280px] animate-pulse rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-2)]" />
          <div className="h-[120px] animate-pulse rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-2)]" />
          <div className="h-[200px] animate-pulse rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-2)]" />
        </aside>
        <div className="flex flex-col gap-6">
          <div className="h-[180px] animate-pulse rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-2)]" />
          <div className="h-[320px] animate-pulse rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-2)]" />
          <div className="h-[140px] animate-pulse rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-2)]" />
          <div className="h-[100px] animate-pulse rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-2)]" />
        </div>
      </div>
    </main>
  );
}
