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
        "@[42rem]:min-h-19 @[42rem]:flex-col @[42rem]:items-stretch @[42rem]:justify-start @[42rem]:gap-1.5 @[42rem]:rounded-[min(var(--radius-4xl),24px)] @[42rem]:bg-card @[42rem]:px-4 @[42rem]:py-3 @[42rem]:shadow-sm @[42rem]:ring-1",
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
          "min-w-0 flex-1 text-end text-sm font-semibold tabular-nums @[42rem]:flex-none @[42rem]:text-start @[42rem]:text-lg",
          valueClassName
        )}
      >
        {children}
      </dd>
    </Card>
  )
}
