import { useState } from "react"
import { npcPortrait } from "@workspace/game-catalog"
import { cn } from "@workspace/ui/lib/utils"

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
 * An NPC variation's portrait, resolved from its id through the ported override map. When no asset is
 * mapped, or the mapped file fails to load, a readable initials badge is rendered instead so list rows
 * and the detail header keep a consistent, fixed-size slot.
 */
export function NpcPortrait({
  variationId,
  name,
  className,
  rounded = "full",
}: {
  variationId: string
  name: string
  className?: string
  rounded?: "full" | "lg"
}) {
  const src = npcPortrait(variationId)
  // Track which src failed so a new variation id is retried for free.
  const [erroredSrc, setErroredSrc] = useState<string | null>(null)
  const showImage = src !== undefined && erroredSrc !== src
  const shape = rounded === "full" ? "rounded-full" : "rounded-lg"

  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden bg-muted text-muted-foreground",
        shape,
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
