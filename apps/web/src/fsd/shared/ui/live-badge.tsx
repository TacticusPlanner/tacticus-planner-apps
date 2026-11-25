import type { ComponentProps } from "react"
import { Badge } from "@workspace/ui/components/badge"
import { cn } from "@workspace/ui/lib/utils"

/**
 * The green "live now" dot, in the `success` tokens so it reads as "on now" rather than as an alert.
 * `pulse` animates it (only when motion is safe); keep it for one small marker, not a list of them.
 */
export function LiveDot({
  pulse = false,
  className,
  ...props
}: ComponentProps<"span"> & { pulse?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "size-2 shrink-0 rounded-full bg-success-foreground",
        pulse && "motion-safe:animate-pulse",
        className
      )}
      {...props}
    />
  )
}

/**
 * The one "Live" marker for anything running now (navigation entries, Home's live events): a green
 * badge with the dot and the localized label. The same state looks the same everywhere.
 */
export function LiveBadge({
  label,
  pulse = false,
  dotTestId,
  className,
  ...props
}: Omit<ComponentProps<typeof Badge>, "children"> & {
  label: string
  pulse?: boolean
  dotTestId?: string
}) {
  return (
    <Badge
      className={cn("bg-success text-success-foreground", className)}
      {...props}
    >
      <LiveDot data-testid={dotTestId} pulse={pulse} />
      {label}
    </Badge>
  )
}
