export function CardSkeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="h-48 bg-neutral-200 animate-pulse" />
      <div className="p-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-neutral-200 animate-pulse" />
          <div className="flex-1">
            <div className="h-4 w-3/4 rounded bg-neutral-200 animate-pulse" />
            <div className="mt-2 h-3 w-1/2 rounded bg-neutral-200 animate-pulse" />
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <div className="h-3 w-full rounded bg-neutral-200 animate-pulse" />
          <div className="h-3 w-5/6 rounded bg-neutral-200 animate-pulse" />
          <div className="h-3 w-4/6 rounded bg-neutral-200 animate-pulse" />
        </div>
        <div className="mt-4 flex gap-2">
          <div className="h-8 w-1/3 rounded bg-neutral-200 animate-pulse" />
          <div className="h-8 w-1/3 rounded bg-neutral-200 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export function CategorySkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-4">
      <div className="h-12 w-12 rounded-lg bg-neutral-200 animate-pulse" />
      <div className="flex-1">
        <div className="h-4 w-3/4 rounded bg-neutral-200 animate-pulse" />
        <div className="mt-2 h-3 w-1/2 rounded bg-neutral-200 animate-pulse" />
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="card p-6">
      <div className="flex items-center gap-4">
        <div className="h-20 w-20 rounded-full bg-neutral-200 animate-pulse" />
        <div className="flex-1">
          <div className="h-5 w-1/2 rounded bg-neutral-200 animate-pulse" />
          <div className="mt-2 h-4 w-3/4 rounded bg-neutral-200 animate-pulse" />
          <div className="mt-2 h-4 w-1/3 rounded bg-neutral-200 animate-pulse" />
        </div>
      </div>
      <div className="mt-6 space-y-4">
        <div className="h-4 w-full rounded bg-neutral-200 animate-pulse" />
        <div className="h-4 w-5/6 rounded bg-neutral-200 animate-pulse" />
        <div className="h-4 w-4/6 rounded bg-neutral-200 animate-pulse" />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="card overflow-hidden">
      <div className="border-b border-neutral-200 bg-neutral-50 px-4 py-3">
        <div className="h-4 w-1/4 rounded bg-neutral-200 animate-pulse" />
      </div>
      <div className="divide-y divide-neutral-200">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3">
            <div className="h-10 w-10 rounded-full bg-neutral-200 animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 rounded bg-neutral-200 animate-pulse" />
              <div className="h-3 w-1/2 rounded bg-neutral-200 animate-pulse" />
            </div>
            <div className="h-8 w-20 rounded bg-neutral-200 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function InputSkeleton() {
  return (
    <div>
      <div className="h-4 w-1/4 rounded bg-neutral-200 animate-pulse mb-2" />
      <div className="h-10 w-full rounded-lg bg-neutral-200 animate-pulse" />
    </div>
  );
}
