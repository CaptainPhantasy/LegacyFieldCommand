import { cn } from '@/lib/utils'

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-[var(--hover-bg-subtle)]",
        className
      )}
      {...props}
    />
  )
}

// Pre-built skeleton components
export function SkeletonCard() {
  return (
    <div className="glass-basic card-glass p-6 space-y-4">
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
    </div>
  )
}

export function SkeletonInput() {
  return <Skeleton className="h-11 w-full" />
}

export function SkeletonButton() {
  return <Skeleton className="h-11 w-32 rounded-full" />
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}

