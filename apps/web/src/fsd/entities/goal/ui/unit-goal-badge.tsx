import { Target } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"
import { cn } from "@workspace/ui/lib/utils"

/**
 * A small mark beside a unit's name that it has goals, listing each one ("Rank to Gold II") in the
 * tooltip and the accessible name. The caller localizes the lines; renders nothing without goals.
 * Inside another control (a picker tile's button) pass `tooltip={false}`: the badge is then not
 * focusable and its lines are its title.
 */
export function UnitGoalBadge({
  label,
  lines,
  className,
  tooltip = true,
}: {
  /** Accessible prefix, such as "Goals". */
  label: string
  /** One localized line per goal, by kind and target. */
  lines: readonly string[]
  className?: string
  tooltip?: boolean
}) {
  if (lines.length === 0) return null
  const name = `${label}: ${lines.join("; ")}`
  const badge = (
    <span
      aria-label={name}
      className={cn(
        "inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary",
        className
      )}
      data-testid="unit-goal-badge"
      role="img"
      tabIndex={tooltip ? 0 : undefined}
      title={tooltip ? undefined : name}
    >
      <Target aria-hidden className="size-3.5" />
    </span>
  )
  if (!tooltip) return badge
  return (
    <Tooltip>
      <TooltipTrigger asChild>{badge}</TooltipTrigger>
      <TooltipContent>
        <ul className="flex flex-col gap-0.5">
          {lines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </TooltipContent>
    </Tooltip>
  )
}
