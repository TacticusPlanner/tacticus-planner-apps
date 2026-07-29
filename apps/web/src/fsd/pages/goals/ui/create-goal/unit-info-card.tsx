import { useTranslation } from "react-i18next"

import { shardIcon } from "@workspace/game-catalog"
import type { Progression, Rank } from "@workspace/game-domain"

import {
  EntityIcon,
  ProgressionBadge,
  RankBadge,
  ReadOnlyField,
} from "@/shared/ui"

/**
 * Read-only "what do I currently have" summary shown below the unit picker, before the user picks
 * any goal type — distinct from the per-goal-type "current" fields already shown inside
 * `RankGoalFields`/`AbilityGoalFields`/etc. once a card is expanded (this renders unconditionally
 * for the selected entity; those only render once their own goal type is toggled on). Reuses the
 * same `ReadOnlyField`/`RankBadge`/`ProgressionBadge` building blocks for visual consistency.
 */
export function UnitInfoCard({
  entityType,
  isOwned,
  loading,
  rank,
  progression,
  abilityActiveLevel,
  abilityPassiveLevel,
  level,
  shardCount,
  shardIsMythic,
}: {
  entityType: "Character" | "Mow"
  isOwned: boolean
  loading: boolean
  rank?: Rank
  progression: Progression
  abilityActiveLevel: number
  abilityPassiveLevel: number
  level?: number
  shardCount: number
  shardIsMythic: boolean
}) {
  const { t } = useTranslation()
  if (loading) return null

  const shardLabel = t(
    shardIsMythic
      ? "goals.create.info.mythicShards"
      : "goals.create.info.shards"
  )

  return (
    <div
      className="grid gap-2 rounded-2xl border p-3 text-sm"
      data-testid="create-goal-unit-info"
    >
      <p className="font-medium">{t("goals.create.info.title")}</p>
      <div className="grid grid-cols-2 gap-3">
        <ReadOnlyField label={shardLabel}>
          <EntityIcon
            alt=""
            className="size-5"
            src={shardIcon(shardIsMythic ? "Mythic" : "Regular")}
          />
          {shardCount}
        </ReadOnlyField>

        {isOwned ? (
          <>
            {entityType === "Character" ? (
              <ReadOnlyField label={t("goals.create.level.current")}>
                {level}
              </ReadOnlyField>
            ) : null}
            <ReadOnlyField label={t("goals.create.ability.activeStart")}>
              {abilityActiveLevel}
            </ReadOnlyField>
            <ReadOnlyField label={t("goals.create.ability.passiveStart")}>
              {abilityPassiveLevel}
            </ReadOnlyField>
            {entityType === "Character" && rank ? (
              <ReadOnlyField label={t("goals.create.rank.current")}>
                <RankBadge rank={rank} />
              </ReadOnlyField>
            ) : null}
            <ReadOnlyField label={t("goals.create.ascension.start")}>
              <ProgressionBadge value={progression} />
            </ReadOnlyField>
          </>
        ) : null}
      </div>
    </div>
  )
}
