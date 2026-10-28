import type { ReactNode } from "react"
import { Card } from "@workspace/ui/components/card"
import { cn } from "@workspace/ui/lib/utils"

/** One glance tile: a short label above its value. Static text, not a control. */
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
      className={cn("min-h-19 min-w-0 gap-1.5 px-4 py-3", className)}
      data-testid={testId}
      size="sm"
    >
      <dt className={cn("text-xs text-muted-foreground", labelClassName)}>
        {label}
      </dt>
      <dd
        className={cn(
          "min-w-0 text-lg font-semibold tabular-nums",
          valueClassName
        )}
      >
        {children}
      </dd>
    </Card>
  )
}
