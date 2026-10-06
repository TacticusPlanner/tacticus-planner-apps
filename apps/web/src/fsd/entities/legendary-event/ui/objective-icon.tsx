import { Crosshair, Sword, Target } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"

import type {
  ObjectiveGlyph,
  ObjectiveIcon as Icon,
} from "../lib/objective-label"

const GLYPHS = {
  hits: Target,
  ranged: Crosshair,
  melee: Sword,
} satisfies Record<ObjectiveGlyph, unknown>

/** An objective's icon: the trait / damage-type / faction asset, or an app glyph for hits and
 *  attack type. Decorative: the label beside it carries the meaning. */
export function ObjectiveIcon({
  icon,
  className,
}: {
  icon: Icon | undefined
  className?: string
}) {
  if (!icon) return null
  if (icon.type === "image") {
    return (
      <img
        alt=""
        aria-hidden="true"
        className={cn("size-5 shrink-0 object-contain", className)}
        data-testid="objective-icon"
        src={icon.src}
      />
    )
  }
  const Glyph = GLYPHS[icon.glyph]
  return (
    <Glyph
      aria-hidden="true"
      className={cn("size-5 shrink-0", className)}
      data-testid="objective-icon"
    />
  )
}
