export function SkeletonBlock({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} aria-hidden="true" />
}

export function StayCardSkeleton() {
  return (
    <article className="stay-card stay-card--skeleton" aria-hidden="true">
      <SkeletonBlock className="skeleton--media" />
      <div className="stay-card__body">
        <SkeletonBlock className="skeleton--line skeleton--w40" />
        <SkeletonBlock className="skeleton--line skeleton--w80" />
        <SkeletonBlock className="skeleton--line skeleton--w55" />
      </div>
    </article>
  )
}
