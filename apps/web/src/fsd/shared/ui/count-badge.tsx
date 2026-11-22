import { Badge } from "@workspace/ui/components/badge"
import { cn } from "@workspace/ui/lib/utils"

/**
 * The one way to show a count on a button, chip or tab (ui-style-guide copy rule 11): a small
 * secondary badge after the label, never "(3)" in the text. A zero count shows nothing unless
 * `showZero` is set.
 */
export function CountBadge({
  count,
  showZero = false,
  className,
  testId,
}: {
  count: number
  showZero?: boolean
  className?: string
  testId?: string
}) {
  if (count === 0 && !showZero) return null
  return (
    <Badge
      className={cn("tabular-nums", className)}
      data-testid={testId}
      variant="secondary"
    >
      {count}
    </Badge>
  )
}
