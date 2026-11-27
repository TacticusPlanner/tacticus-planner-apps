import { useTranslation } from "react-i18next"
import { progressionRarity } from "@workspace/game-domain"
import type { Rarity } from "@workspace/game-domain"
import { cn } from "@workspace/ui/lib/utils"

import type { TeamRoster } from "@/entities/team"
import { HintTrigger } from "@/shared/ui"
import { useUnitName } from "@/shared/unit-name"

import { capFit, rankCapRarity } from "../../model/cap-fit"
import type { Selection } from "../../model/offense"

const FIT_CLASS = {
  // Amber on its tint passes AA, as on the Teams page's status chips.
  under: "border-warning-foreground/45 bg-warning text-warning-foreground",
  over: "text-muted-foreground",
} as const

/**
 * The selection bar's cap chips: "2 under cap" (amber) for picked units whose rank only fills a
 * lower cap, and "1 over cap" for those that could fight at a higher one (`capFit`). Each chip's
 * hint (a tooltip, a popover on touch) lists the units and their rank (a Machine of War's rarity).
 */
export function CapChips({
  selection,
  roster,
  cap,
}: {
  selection: Selection
  roster: TeamRoster | null
  cap: Rarity | undefined
}) {
  const { t } = useTranslation(["guildWar", "progression"])
  const unitName = useUnitName()
  if (!cap) return null
  const lines = { under: [] as string[], over: [] as string[] }
  for (const [id, kind] of selection) {
    const unit = (kind === "mow" ? roster?.mows : roster?.characters)?.get(id)
    const fit = capFit(kind, unit, cap)
    if (!fit || !unit) continue
    const name = unitName(kind === "mow" ? "Mow" : "Character", id)
    lines[fit.fit].push(
      kind === "character" && unit.rank
        ? t("guildWar:capFit.unitRank", {
            name,
            rank: t(`progression:ranks.${unit.rank}`),
            rarity: t(`progression:rarities.${rankCapRarity(unit.rank)}`),
          })
        : t("guildWar:capFit.unitRarity", {
            name,
            rarity: t(
              `progression:rarities.${progressionRarity(unit.progression)}`
            ),
          })
    )
  }
  const capName = t(`progression:rarities.${cap}`)
  return (["under", "over"] as const).map((fit) => {
    const units = lines[fit]
    if (units.length === 0) return null
    const label = t(`guildWar:capFit.${fit}`, { count: units.length })
    const heading = t(`guildWar:capFit.${fit}Hint`, { rarity: capName })
    return (
      <HintTrigger
        className={cn(
          "rounded-md border px-1.5 py-0.5 text-xs font-medium",
          FIT_CLASS[fit]
        )}
        data-testid={`guild-war-cap-${fit}`}
        hint={
          <span className="flex flex-col gap-1">
            <span className="font-medium">{heading}</span>
            {units.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </span>
        }
        key={fit}
        label={`${label}. ${heading} ${units.join(". ")}`}
      >
        {label}
      </HintTrigger>
    )
  })
}
