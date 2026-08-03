import { cn } from "@workspace/ui/lib/utils"

/** A project's color indicator (plan §6) — the single visual shared by every place a project shows
 * up: goal row/card badges, the project filter, project management, and the goal-membership
 * checkbox list. Falls back to a neutral outline dot when the project has no custom color. */
export function ProjectColorDot({
  color,
  className,
}: {
  color: string | null
  className?: string
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-block size-2.5 shrink-0 rounded-full",
        color ? "" : "border border-muted-foreground",
        className
      )}
      style={color ? { backgroundColor: color } : undefined}
    />
  )
}
