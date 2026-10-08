import { X } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"

import type { ObjectiveIcon as Icon } from "../lib/objective-label"

const BADGES = {
  not: { className: "bg-red-600 text-white", glyph: <X className="size-2" /> },
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
 * An objective's icon (design D6): the game asset with a red-X badge for a negated filter or a
 * "≥" / "≤" badge for a hits bound. `muted` fades it for a not-satisfied state. Decorative: the
 * label or accessible text beside it carries the meaning.
 */
export function ObjectiveIcon({
  icon,
  className,
  muted = false,
}: {
  icon: Icon | undefined
  className?: string
  muted?: boolean
}) {
  if (!icon) return null
  const badge = icon.badge ? BADGES[icon.badge] : undefined
  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative inline-flex size-5 shrink-0",
        muted && "opacity-35 grayscale",
        className
      )}
      data-muted={muted ? "true" : undefined}
      data-testid="objective-icon"
    >
      <img alt="" className="size-full object-contain" src={icon.src} />
      {badge ? (
        <span
          className={cn(
            "absolute -right-1 -bottom-1 flex size-3 items-center justify-center rounded-full text-[8px] leading-none font-bold",
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
