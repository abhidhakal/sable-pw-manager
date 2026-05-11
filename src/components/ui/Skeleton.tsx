interface SkeletonProps {
  className?: string
  count?: number
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`bg-surface-elevated rounded-md animate-shimmer bg-[length:200%_100%] bg-gradient-to-r from-surface-elevated via-border/30 to-surface-elevated ${className}`}
    />
  )
}

export function VaultCardSkeleton() {
  return (
    <div className="flex items-center gap-4 p-3.5 bg-surface border border-border rounded-lg">
      <Skeleton className="w-10 h-10 rounded-md shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-48" />
      </div>
    </div>
  )
}

export function VaultListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center gap-3">
        <Skeleton className="flex-1 h-10 rounded-md" />
        <Skeleton className="h-10 w-32 rounded-md" />
        <Skeleton className="h-10 w-24 rounded-md" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {Array.from({ length: count }).map((_, i) => (
          <VaultCardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}
