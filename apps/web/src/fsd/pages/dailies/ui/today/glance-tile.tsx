import type { ReactNode } from "react"
import { Card } from "@workspace/ui/components/card"
import { cn } from "@workspace/ui/lib/utils"

/**
 * One glance tile: a short label above its value. Static text, not a control. Below 42rem of page
 * content it drops its card chrome and becomes a label / value row of the single glance card.
 */
export function GlanceTile({
  children,
  className,
  label,
  labelClassName,
  testId,
  valueClassName,
}: {
  children: ReactNode
  className?: string
  label: ReactNode
  labelClassName?: string
  testId?: string
  valueClassName?: string
}) {
  return (
    <Card
      className={cn(
        "min-w-0 flex-row items-center justify-between gap-3 rounded-none bg-transparent px-0 py-2 shadow-none ring-0",
        "@2xl:min-h-19 @2xl:flex-col @2xl:items-stretch @2xl:justify-start @2xl:gap-1.5 @2xl:rounded-[min(var(--radius-4xl),24px)] @2xl:bg-card @2xl:px-4 @2xl:py-3 @2xl:shadow-sm @2xl:ring-1",
        className
      )}
      data-testid={testId}
      size="sm"
    >
      <dt
        className={cn("shrink-0 text-xs text-muted-foreground", labelClassName)}
      >
        {label}
      </dt>
      <dd
        className={cn(
          "min-w-0 flex-1 text-end text-sm font-semibold tabular-nums @2xl:flex-none @2xl:text-start @2xl:text-lg",
          valueClassName
        )}
      >
        {children}
      </dd>
    </Card>
  )
}
