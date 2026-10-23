import { CircleMinus, CircleQuestionMark } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"

import type { LegendaryEventAnnotationStatus } from "@/entities/legendary-event"

/** V1's icon and colour for a mark: a question mark in the warning colour for Maybe clear, a minus
 *  in the danger colour for Stop here. Decorative: callers carry the accessible text. */
export function AnnotationMarkIcon({
  status,
  className,
}: {
  status: LegendaryEventAnnotationStatus
  className?: string
}) {
  const Icon = status === "maybeClear" ? CircleQuestionMark : CircleMinus
  return (
    <Icon
      aria-hidden="true"
      className={cn(
        "size-4",
        status === "maybeClear"
          ? "text-amber-600 dark:text-amber-400"
          : "text-destructive",
        className
      )}
      data-mark={status}
      data-testid="annotation-mark-icon"
    />
  )
}
