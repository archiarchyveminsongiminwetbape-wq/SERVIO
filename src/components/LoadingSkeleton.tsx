import { Loader2 } from 'lucide-react';

export function CardSkeleton() {
  return (
    <div className="card animate-pulse">
      <div className="h-48 bg-neutral-200" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-neutral-200 rounded w-3/4" />
        <div className="h-3 bg-neutral-200 rounded w-1/2" />
        <div className="flex gap-2 mt-3">
          <div className="h-6 bg-neutral-200 rounded-full w-16" />
          <div className="h-6 bg-neutral-200 rounded-full w-16" />
        </div>
      </div>
    </div>
  );
}

export function ProviderCardSkeleton() {
  return (
    <div className="card animate-pulse">
      <div className="relative h-48 bg-neutral-200">
        <div className="absolute bottom-4 left-4 right-4">
          <div className="h-8 bg-neutral-300 rounded w-3/4 mb-2" />
          <div className="h-4 bg-neutral-300 rounded w-1/2" />
        </div>
      </div>
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 bg-neutral-200 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-neutral-200 rounded w-3/4" />
            <div className="h-3 bg-neutral-200 rounded w-1/2" />
          </div>
        </div>
        <div className="h-3 bg-neutral-200 rounded w-full" />
        <div className="h-3 bg-neutral-200 rounded w-2/3" />
        <div className="flex gap-2 mt-4">
          <div className="h-8 bg-neutral-200 rounded flex-1" />
          <div className="h-8 bg-neutral-200 rounded flex-1" />
        </div>
      </div>
    </div>
  );
}

export function ProfileHeaderSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-48 bg-neutral-200" />
      <div className="mx-auto max-w-7xl px-4 -mt-16">
        <div className="flex gap-4">
          <div className="h-32 w-32 bg-neutral-200 rounded-2xl" />
          <div className="flex-1 space-y-3 pt-8">
            <div className="h-6 bg-neutral-200 rounded w-1/2" />
            <div className="h-4 bg-neutral-200 rounded w-3/4" />
            <div className="h-4 bg-neutral-200 rounded w-1/2" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card animate-pulse p-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-neutral-200 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-neutral-200 rounded w-3/4" />
              <div className="h-3 bg-neutral-200 rounded w-1/2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="card animate-pulse">
      <div className="h-12 bg-neutral-200 border-b" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-16 border-b last:border-0" />
      ))}
    </div>
  );
}

export function FullPageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 size={32} className="animate-spin text-primary-500" />
    </div>
  );
}

export function InlineLoader({ size = 24 }: { size?: number }) {
  return (
    <div className="flex items-center justify-center p-4">
      <Loader2 size={size} className="animate-spin text-primary-500" />
    </div>
  );
}
