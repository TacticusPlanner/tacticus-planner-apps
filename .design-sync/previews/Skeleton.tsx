import { Skeleton } from '@workspace/ui'

// Mirrors apps/web/.../ui-kit/ui/feedback-showcase.tsx: skeletons are sized
// with Tailwind utilities (h-*/w-*), not inline pixel styles, so they read as
// the familiar text/line placeholders and pick up the dark `bg-muted` token.

export function TextLines() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: 280 }}>
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  )
}

export function Card() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 280 }}>
      <Skeleton className="h-32 w-full rounded-xl" />
      <Skeleton className="h-4 w-4/5" />
      <Skeleton className="h-4 w-3/5" />
    </div>
  )
}

export function ListItem() {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center', width: 280 }}>
      <Skeleton className="size-10 rounded-full" />
      <div style={{ display: 'grid', gap: 8, flex: 1 }}>
        <Skeleton className="h-3.5 w-1/2" />
        <Skeleton className="h-3.5 w-3/4" />
      </div>
    </div>
  )
}
