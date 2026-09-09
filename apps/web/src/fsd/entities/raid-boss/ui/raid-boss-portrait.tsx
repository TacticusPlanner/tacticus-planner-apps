import { cn } from "@workspace/ui/lib/utils"

import { EntityIcon } from "@/shared/ui/entity-icon"

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
 * A raid boss / prime portrait. `src` is the round-portrait URL resolved from the unit-set id (see the
 * game-catalog `raidBossPortrait` helper); when it is absent — an id with no bundled asset, as some
 * Necron minions / Tyranid Warrior variants have none even in V1 — this renders a readable initials
 * badge instead. `EntityIcon` also falls back to the badge on a load error.
 */
export function RaidBossPortrait({
  name,
  src,
  className,
  rounded = "full",
}: {
  name: string
  src?: string
  className?: string
  rounded?: "full" | "lg"
}) {
  const shape = rounded === "full" ? "rounded-full" : "rounded-lg"

  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden bg-muted text-muted-foreground",
        shape,
        className
      )}
      aria-hidden={src ? undefined : true}
    >
      {src ? (
        <EntityIcon src={src} alt={name} className="size-full" />
      ) : (
        <span className="text-xs font-semibold">{initials(name)}</span>
      )}
    </span>
  )
}
