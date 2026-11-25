import { useState } from "react"
import { cn } from "@workspace/ui/lib/utils"

import { entityIconClassName } from "@/shared/ui"
import type { EntityIconSize } from "@/shared/ui"

import { npcPortraitSrc } from "../lib/portrait-variation"

/** Initials for the text-badge fallback (up to two words). */
function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("")
}

/**
 * An NPC variation's portrait, resolved from its id through the ported override map, else the portrait
 * of the playable character it is a version of (`characterId`). When neither exists, or the file fails
 * to load, a readable initials badge is rendered instead so list rows
 * and the detail header keep a consistent, fixed-size slot. `size` is a step on the style guide's
 * scale (`portrait-sm` … for a portrait, `icon` next to text).
 */
export function NpcPortrait({
  variationId,
  characterId,
  name,
  size,
  className,
  rounded = "full",
}: {
  variationId: string
  characterId?: string | null
  name: string
  size: EntityIconSize
  className?: string
  rounded?: "full" | "lg"
}) {
  const src = npcPortraitSrc(variationId, characterId)
  // Track which src failed so a new variation id is retried for free.
  const [erroredSrc, setErroredSrc] = useState<string | null>(null)
  const showImage = src !== undefined && erroredSrc !== src
  const shape = rounded === "full" ? "rounded-full" : "rounded-lg"

  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden bg-muted text-muted-foreground",
        shape,
        entityIconClassName(size),
        className
      )}
      aria-hidden={showImage ? undefined : true}
      data-testid="npc-portrait"
      data-fallback={showImage ? undefined : "initials"}
    >
      {showImage ? (
        <img
          src={src}
          alt={name}
          loading="lazy"
          className="size-full object-cover"
          onError={() => setErroredSrc(src)}
        />
      ) : (
        <span className="text-xs font-semibold">{initials(name)}</span>
      )}
    </span>
  )
}
