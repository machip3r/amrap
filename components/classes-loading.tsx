function Bone({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-[var(--color-border)]/55 ${className ?? ""}`}
    />
  );
}

export function ClassesCatalogSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-3" aria-busy="true" aria-live="polite">
      {Array.from({ length: rows }, (_, i) => (
        <div
          key={i}
          className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-4"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1 space-y-2.5">
              <Bone className="h-5 w-36" />
              <Bone className="h-3.5 w-52 max-w-full" />
              <Bone className="h-3 w-24" />
            </div>
            <Bone className="h-8 w-8 shrink-0 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ClassesCalendarSkeleton({ cols = 3 }: { cols?: number }) {
  return (
    <div className="flex flex-col gap-3" aria-busy="true" aria-live="polite">
      <div className="flex items-center justify-between">
        <Bone className="h-8 w-20 rounded-md" />
        <Bone className="h-4 w-24" />
        <Bone className="h-8 w-20 rounded-md" />
      </div>
      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: cols }, (_, i) => (
          <div
            key={i}
            className="min-h-[8.5rem] rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3"
          >
            <Bone className="mb-3 h-3 w-12" />
            <div className="space-y-2">
              <Bone className="h-10 w-full rounded-md" />
              <Bone className="h-10 w-full rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ClassesLoadingSplash({
  label,
  variant = "catalog",
}: {
  label: string;
  variant?: "catalog" | "calendar";
}) {
  return (
    <div className="flex flex-col gap-3" role="status">
      <p className="sr-only">{label}</p>
      {variant === "calendar" ? (
        <ClassesCalendarSkeleton />
      ) : (
        <ClassesCatalogSkeleton />
      )}
    </div>
  );
}
