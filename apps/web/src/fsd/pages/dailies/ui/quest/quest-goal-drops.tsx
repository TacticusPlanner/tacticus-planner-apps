import { useState } from "react"
import { useTranslation } from "react-i18next"
import { chanceIcon, type UpgradeStorageModel } from "@workspace/game-catalog"
import type { UpgradeId } from "@workspace/game-domain"
import { Button } from "@workspace/ui/components/button"

import { EntityIcon, UpgradeIcon } from "@/shared/ui"

import type { QuestGoalDrops as QuestGoalDropsModel } from "../../model/quest-goal-drops"

/** The drops shown before "Show all"; the rest wait behind the toggle. */
const DROPS_SHOWN = 5

/**
 * The quest's drops your goals still need, one row each: the material and the goals' units, a chip
 * per battle that drops it with its odds (opening that battle on press), and have / need. The first
 * five show; "Show all" opens the rest. On a phone the chips wrap under the material.
 */
export function QuestGoalDrops({
  drops,
  upgradesById,
  onSelect,
}: {
  drops: QuestGoalDropsModel<UpgradeId>
  upgradesById: ReadonlyMap<string, UpgradeStorageModel> | undefined
  onSelect: (battle: number) => void
}) {
  const { t, i18n } = useTranslation(["quest", "upgrades"])
  const number = new Intl.NumberFormat(i18n.language)
  const percent = new Intl.NumberFormat(i18n.language, {
    style: "percent",
    maximumFractionDigits: 0,
  })
  const [expanded, setExpanded] = useState(false)
  if (drops.status === "hidden") return null
  const shown = expanded ? drops.drops : drops.drops.slice(0, DROPS_SHOWN)
  const hiddenCount = drops.drops.length - shown.length

  return (
    <section
      aria-labelledby="quest-goal-drops-title"
      className="flex min-w-0 flex-col gap-3 rounded-xl border p-4"
      data-testid="quest-goal-drops"
    >
      <h3 className="font-semibold" id="quest-goal-drops-title">
        {t("quest:goalDrops.title")}
      </h3>
      {drops.drops.length === 0 ? (
        <p
          className="text-sm text-muted-foreground"
          data-testid="quest-goal-drops-empty"
        >
          {t("quest:goalDrops.empty")}
        </p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {shown.map((drop) => {
            const upgrade = upgradesById?.get(drop.upgradeId)
            const name = t(`upgrades:${drop.upgradeId}`, {
              defaultValue: upgrade?.label ?? drop.upgradeId,
            })
            return (
              <li
                className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1"
                data-testid="quest-goal-drop"
                data-upgrade={drop.upgradeId}
                key={drop.upgradeId}
              >
                <UpgradeIcon
                  className="size-8 shrink-0"
                  id={drop.upgradeId}
                  rarity={upgrade?.rarity}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {name}
                  </span>
                  {drop.units.length > 0 ? (
                    <span className="block truncate text-xs text-muted-foreground">
                      {drop.units.join(", ")}
                    </span>
                  ) : null}
                </span>
                <ul
                  aria-label={t("quest:goalDrops.battles")}
                  className="order-last flex basis-full flex-wrap gap-1 pl-10 sm:order-0 sm:basis-auto sm:pl-0"
                >
                  {drop.battles.map((battle) => (
                    <li key={battle.number}>
                      <button
                        className="inline-flex min-h-8 items-center gap-1 rounded-full border px-2 text-xs transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                        data-testid="quest-goal-drop-battle"
                        onClick={() => onSelect(battle.number)}
                        type="button"
                      >
                        <span className="font-semibold">
                          {t("quest:battles.battle", { number: battle.number })}
                        </span>
                        <span className="inline-flex items-center gap-0.5 text-muted-foreground tabular-nums">
                          <EntityIcon
                            alt=""
                            className="size-3.5"
                            src={chanceIcon()}
                          />
                          {percent.format(
                            battle.numerator / battle.denominator
                          )}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
                <span
                  className="w-14 shrink-0 text-right text-sm font-semibold tabular-nums"
                  data-testid="quest-goal-drop-have"
                >
                  {t("quest:goalDrops.have", {
                    have: number.format(drop.have),
                    need: number.format(drop.need),
                  })}
                </span>
              </li>
            )
          })}
        </ul>
      )}
      {hiddenCount > 0 || expanded ? (
        <Button
          className="self-start"
          data-testid="quest-goal-drops-toggle"
          onClick={() => setExpanded(!expanded)}
          size="sm"
          variant="ghost"
        >
          {expanded
            ? t("quest:goalDrops.showFewer")
            : t("quest:goalDrops.showAll", { count: drops.drops.length })}
        </Button>
      ) : null}
    </section>
  )
}
