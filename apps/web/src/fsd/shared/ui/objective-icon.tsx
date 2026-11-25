import { X } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"

/** An objective's icon: a game asset plus an optional badge (red X for a negated filter, "≥" / "≤"
 *  for a bound). */
export interface ObjectiveIconSpec {
  src: string
  badge?: "not" | "min" | "max"
}

const BADGES = {
  not: {
    className: "bg-destructive text-white",
    glyph: <X className="size-2" />,
  },
  min: {
    className: "bg-background text-foreground ring-1 ring-border",
    glyph: "≥",
  },
  max: {
    className: "bg-background text-foreground ring-1 ring-border",
    glyph: "≤",
  },
} as const

/**
 * An objective's icon (Legendary Events, quests): the game asset with a red-X badge for a negated filter or a
 * "≥" / "≤" badge for a hits bound. `muted` fades it for a not-satisfied state. Decorative: the
 * label or accessible text beside it carries the meaning. Inline size unless `className` says otherwise.
 */
export function ObjectiveIcon({
  icon,
  className,
  muted = false,
}: {
  icon: ObjectiveIconSpec | undefined
  className?: string
  muted?: boolean
}) {
  if (!icon) return null
  const badge = icon.badge ? BADGES[icon.badge] : undefined
  return (
    <span
      aria-hidden="true"
      className={cn(
        // Inline by default (ui-style-guide game icon sizes): the 20px icon baseline.
        "relative inline-flex size-icon shrink-0",
        muted && "opacity-25 grayscale",
        className
      )}
      data-muted={muted ? "true" : undefined}
      data-testid="objective-icon"
    >
      <img alt="" className="size-full object-contain" src={icon.src} />
      {badge ? (
        <span
          className={cn(
            "absolute -right-1 -bottom-1 flex size-3 items-center justify-center rounded-full text-2xs leading-none font-bold",
            badge.className
          )}
          data-testid={`objective-icon-badge-${icon.badge}`}
        >
          {badge.glyph}
        </span>
      ) : null}
    </span>
  )
}
