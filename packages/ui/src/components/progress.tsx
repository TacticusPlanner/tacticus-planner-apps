import * as React from "react"
import { Progress as ProgressPrimitive } from "radix-ui"

import { cn } from "@workspace/ui/lib/utils"

function Progress({
  className,
  indicatorClassName,
  value,
  max = 100,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root> & {
  indicatorClassName?: string
}) {
  // Radix treats a value outside 0..max (or NaN) as indeterminate and logs an error, so clamp here
  // once instead of in every caller.
  const clamped =
    value == null || Number.isNaN(value)
      ? null
      : Math.min(Math.max(value, 0), max)

  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        "relative flex h-2 w-full items-center overflow-x-hidden rounded-2xl bg-muted",
        className
      )}
      max={max}
      value={clamped}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className={cn(
          "size-full flex-1 bg-primary transition-all",
          indicatorClassName
        )}
        style={{
          transform: `translateX(-${100 - ((clamped ?? 0) / max) * 100}%)`,
        }}
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress }
