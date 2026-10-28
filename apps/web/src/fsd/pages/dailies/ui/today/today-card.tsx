import { useId, type ReactNode } from "react"
import { Card } from "@workspace/ui/components/card"
import { cn } from "@workspace/ui/lib/utils"

/**
 * The shell every Today dashboard card shares: a named region with its own h2, an optional meta
 * line next to the title and an optional action at the end of the header row.
 */
export function TodayCard({
  action,
  children,
  className,
  meta,
  testId,
  title,
  titleClassName,
  ...props
}: {
  action?: ReactNode
  children: ReactNode
  className?: string
  meta?: ReactNode
  testId: string
  title: ReactNode
  titleClassName?: string
} & Record<`data-${string}`, string | undefined>) {
  const headingId = useId()

  return (
    <Card
      aria-labelledby={headingId}
      className={cn("min-w-0 gap-3 px-4", className)}
      data-testid={testId}
      role="region"
      size="sm"
      {...props}
    >
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2
          className={cn("text-base font-semibold", titleClassName)}
          id={headingId}
        >
          {title}
        </h2>
        {meta ? (
          <span className="text-xs text-muted-foreground">{meta}</span>
        ) : null}
        {action ? <span className="ms-auto">{action}</span> : null}
      </div>
      {children}
    </Card>
  )
}
