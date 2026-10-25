import { useTranslation } from "react-i18next"
import { ChevronDownIcon, StarIcon } from "lucide-react"
import type { UpgradeStorageModel } from "@workspace/game-catalog"
import type { Rarity } from "@workspace/game-domain"
import { cn } from "@workspace/ui/lib/utils"

import { UpgradeIcon } from "@/shared/ui"

import { battlesByTier, type QuestBattle } from "../model/quest-battles"
import type { QuestScore } from "../model/quest-score"
import { ObjectiveChips } from "./objective-chips"

/**
 * The quest's battles under their tier, Common first, each row with its number, deploy slots, compact
 * objective chips, the drop's icon (odds as accessible text), its points against the maximum and a
 * "perfect" mark. Tier headings show the tier's points. On mobile each tier is a disclosure (the
 * first tier that is not perfect open by default, kept by the caller in `openTiers`).
 */
export function BattleList({
  battles,
  score,
  selected,
  onSelect,
  upgradesById,
  isMobile,
  openTiers,
  onToggleTier,
}: {
  battles: readonly QuestBattle[]
  score: QuestScore | null
  selected: number | null
  onSelect: (battle: number) => void
  upgradesById: ReadonlyMap<string, UpgradeStorageModel> | undefined
  isMobile: boolean
  openTiers: ReadonlySet<Rarity>
  onToggleTier: (tier: Rarity) => void
}) {
  const { t, i18n } = useTranslation(["quest", "progression", "upgrades"])
  const number = new Intl.NumberFormat(i18n.language)
  const scoreOf = (battle: number) =>
    score?.battles.find((entry) => entry.number === battle)
  return (
    <div
      className="flex min-w-0 flex-col gap-3"
      data-testid="quest-battle-list"
    >
      {battlesByTier(battles).map((group) => {
        const tierScore = score?.tiers.find((tier) => tier.tier === group.tier)
        const tierName = t(`progression:rarities.${group.tier}`)
        const open = !isMobile || openTiers.has(group.tier)
        const headingId = `quest-tier-${group.tier}`
        const heading = (
          <span className="flex min-w-0 flex-1 items-baseline justify-between gap-2">
            <span className="font-semibold">{tierName}</span>
            {tierScore ? (
              <span
                className="text-sm text-muted-foreground tabular-nums"
                data-testid="quest-tier-points"
              >
                {t("quest:battles.tierPoints", {
                  points: number.format(tierScore.points),
                  max: number.format(tierScore.max),
                })}
              </span>
            ) : null}
          </span>
        )
        return (
          <section
            aria-labelledby={headingId}
            className="flex min-w-0 flex-col gap-2"
            data-testid="quest-tier"
            data-tier={group.tier}
            key={group.tier}
          >
            <h3 id={headingId}>
              {isMobile ? (
                <button
                  aria-controls={`${headingId}-battles`}
                  aria-expanded={open}
                  className="flex min-h-11 w-full items-center gap-2 rounded-xl border px-3 text-left"
                  data-testid="quest-tier-toggle"
                  onClick={() => onToggleTier(group.tier)}
                  type="button"
                >
                  {heading}
                  <ChevronDownIcon
                    aria-hidden
                    className={cn(
                      "size-4 shrink-0 transition-transform",
                      open && "rotate-180"
                    )}
                  />
                </button>
              ) : (
                <span className="flex">{heading}</span>
              )}
            </h3>
            <ul
              className="flex min-w-0 flex-col gap-2"
              hidden={!open}
              id={`${headingId}-battles`}
            >
              {open
                ? group.battles.map((battle) => {
                    const battleScore = scoreOf(battle.number)
                    const perfect =
                      !!battleScore && battleScore.points === battleScore.max
                    const upgrade = upgradesById?.get(battle.loot.upgradeId)
                    const dropName = t(`upgrades:${battle.loot.upgradeId}`, {
                      defaultValue: upgrade?.label ?? battle.loot.upgradeId,
                    })
                    return (
                      <li key={battle.number}>
                        <button
                          aria-current={
                            selected === battle.number ? "true" : undefined
                          }
                          aria-label={t("quest:battles.show", {
                            number: battle.number,
                          })}
                          className={cn(
                            "flex w-full min-w-0 items-start gap-3 rounded-xl border p-3 text-left transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                            selected === battle.number &&
                              "border-primary bg-muted"
                          )}
                          data-battle={battle.number}
                          data-testid="quest-battle-row"
                          onClick={() => onSelect(battle.number)}
                          type="button"
                        >
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold tabular-nums">
                            {battle.number}
                          </span>
                          <span className="flex min-w-0 flex-1 flex-col gap-1">
                            <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                              <span className="font-medium">
                                {t("quest:battles.battle", {
                                  number: battle.number,
                                })}
                              </span>
                              <span
                                className="text-muted-foreground"
                                data-testid="quest-battle-slots"
                              >
                                {t("quest:battles.slots", {
                                  count: battle.deploySlots,
                                })}
                              </span>
                            </span>
                            <ObjectiveChips
                              compact
                              objectives={battle.objectives}
                            />
                          </span>
                          <span className="flex shrink-0 flex-col items-end gap-1">
                            <span className="flex items-center gap-1.5">
                              <UpgradeIcon
                                className="size-7"
                                id={battle.loot.upgradeId}
                                rarity={upgrade?.rarity}
                              />
                              <span className="sr-only">
                                {t("quest:battles.dropOdds", {
                                  name: dropName,
                                  numerator: battle.loot.chanceNumerator,
                                  denominator: battle.loot.chanceDenominator,
                                })}
                              </span>
                            </span>
                            {battleScore ? (
                              <span
                                className="flex items-center gap-1 text-sm tabular-nums"
                                data-testid="quest-battle-points"
                              >
                                {perfect ? (
                                  <>
                                    <StarIcon
                                      aria-hidden
                                      className="size-3.5 fill-current text-amber-500"
                                    />
                                    <span className="sr-only">
                                      {t("quest:battles.perfect")}
                                    </span>
                                  </>
                                ) : null}
                                {t("quest:battles.points", {
                                  points: number.format(battleScore.points),
                                  max: number.format(battleScore.max),
                                })}
                              </span>
                            ) : null}
                          </span>
                        </button>
                      </li>
                    )
                  })
                : null}
            </ul>
          </section>
        )
      })}
    </div>
  )
}
