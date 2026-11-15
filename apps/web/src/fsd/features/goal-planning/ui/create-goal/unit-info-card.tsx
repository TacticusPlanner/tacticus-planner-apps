import { useId, useState } from "react"
import { useTranslation } from "react-i18next"
import { ChevronDownIcon } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"

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
      className="grid gap-1.5 rounded-2xl border p-3 text-sm"
      data-testid="create-goal-unit-info"
    >
      <p className="font-medium">{t("goals.create.info.title")}</p>
      <div className="grid grid-cols-2 gap-2 @lg:grid-cols-3">
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
            <ReadOnlyField
              label={t(
                entityType === "Mow"
                  ? "goals.create.ability.primaryStart"
                  : "goals.create.ability.activeStart"
              )}
            >
              {abilityActiveLevel}
            </ReadOnlyField>
            <ReadOnlyField
              label={t(
                entityType === "Mow"
                  ? "goals.create.ability.secondaryStart"
                  : "goals.create.ability.passiveStart"
              )}
            >
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

/**
 * Below 768px the current status starts as one line — rank, progression and level — that expands to the
 * full `UnitInfoCard` on activation, so the goal-type selector stays in view (goal-creation).
 */
export function UnitStatusSummary(props: Parameters<typeof UnitInfoCard>[0]) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)
  const bodyId = useId()
  if (props.loading) return null

  return (
    <div className="grid gap-2" data-testid="create-goal-unit-status-summary">
      <button
        aria-controls={bodyId}
        aria-expanded={expanded}
        aria-label={t("goals.create.info.expand")}
        className="flex min-h-11 items-center gap-2 rounded-2xl border px-3 text-left text-sm"
        data-testid="create-goal-unit-status-summary-toggle"
        onClick={() => setExpanded((current) => !current)}
        type="button"
      >
        <span className="font-medium">{t("goals.create.info.title")}</span>
        <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 text-muted-foreground">
          {props.isOwned ? (
            <>
              {props.rank ? <RankBadge rank={props.rank} /> : null}
              <ProgressionBadge value={props.progression} />
              {props.level !== undefined ? (
                <span>
                  {t("goals.create.info.levelShort", { level: props.level })}
                </span>
              ) : null}
            </>
          ) : (
            <span>
              {t("goals.create.info.shards")} {props.shardCount}
            </span>
          )}
        </span>
        <ChevronDownIcon
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform",
            expanded && "rotate-180"
          )}
        />
      </button>
      <div hidden={!expanded} id={bodyId}>
        <UnitInfoCard {...props} />
      </div>
    </div>
  )
}
