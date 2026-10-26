import { useMemo, type ReactNode } from "react"
import { useTranslation } from "react-i18next"
import {
  isProgression,
  lastRank,
  maxAbilityLevel,
  rankAt,
  rankOrder,
  type UpgradeId,
} from "@workspace/game-domain"
import type { MowStorageModel } from "@workspace/game-catalog"

import type { FarmingStrategy, GoalDetail } from "@/entities/goal"
import { additionalTargetOptions } from "@/features/goal-farming/@x/goal-create"
import type {
  Character,
  UpgradeWithFarmLocations,
} from "@/features/rank-lookup/@x/goal-create"
import { RankBadge } from "@/shared/ui"

import {
  characterRelevantUpgradeQuantities,
  mowRelevantUpgradeQuantities,
} from "../../model/goal-creation-form/goal-spec-builder"
import type { useProgressionPreview } from "../../model/goal-creation-form/use-progression-preview"
import type { GoalFormIssueView } from "../../model/goal-creation-form/use-goal-validation-state"
import {
  isGoalTargetDraftChanged,
  type GoalTargetDraft,
} from "../../model/target-edit/goal-target-edit"
import { AbilityGoalCard } from "../goal-card/ability-goal-card"
import { AscensionGoalCard } from "../goal-card/ascension-goal-card"
import type { ResourcePreview } from "../goal-card/card-parts"
import { RankGoalCard } from "../goal-card/rank-goal-card"
import { UnlockGoalCard } from "../goal-card/unlock-goal-card"
import { UpgradeGoalCard } from "../goal-card/upgrade-goal-card"
import { OptionalRangeField } from "../shared/optional-range-field"

type UpgradeUnits = {
  getCharacter: (id: never) => Character | undefined
  mowsById: ReadonlyMap<string, MowStorageModel> | undefined
}

const LOADING: ResourcePreview = { state: "loading", missingUpgrades: [] }

const rankOptions = rankOrder.map((rank, index) => ({
  value: index,
  label: <RankBadge rank={rank} />,
}))
const abilityLevelOptions = Array.from(
  { length: maxAbilityLevel },
  (_, index) => ({ value: index + 1, label: index + 1 })
)

/**
 * The goal's card in edit mode: the draft adapted to the same per-kind card creation renders, with the
 * unit and goal type fixed and no milestones. Edit-only parts (the goal's own sources or farming
 * locations, its notes) are passed in by the form.
 */
export function GoalEditCard({
  detail,
  draft,
  onChange,
  issues,
  takenKeys,
  rarityCap,
  previews,
  farmingStrategy,
  onFarmingStrategyChange,
  upgradesById,
  ownedQuantities,
  units,
  portalContainer,
  sources,
  mythic,
  note,
}: {
  detail: GoalDetail
  draft: GoalTargetDraft | null
  onChange: (draft: GoalTargetDraft) => void
  issues: readonly GoalFormIssueView[]
  /** Target keys other in-flight goals of this unit and kind hold. */
  takenKeys: ReadonlySet<string>
  rarityCap: number
  previews: {
    progressionPreview: ReturnType<typeof useProgressionPreview>
    resourcePreview: ResourcePreview | undefined
  }
  farmingStrategy: FarmingStrategy
  onFarmingStrategyChange: (value: FarmingStrategy) => void
  upgradesById: ReadonlyMap<UpgradeId, UpgradeWithFarmLocations>
  ownedQuantities?: ReadonlyMap<string, number>
  units: UpgradeUnits
  portalContainer: HTMLElement | null
  sources?: ReactNode
  mythic?: ReactNode
  note?: ReactNode
}) {
  const resourcePreview = previews.resourcePreview ?? LOADING

  if (!draft) {
    return (
      <UnlockGoalCard
        entityType={detail.entityType === "Mow" ? "Mow" : "Character"}
        note={note}
        sources={sources}
      />
    )
  }
  switch (draft.kind) {
    case "Rank": {
      const start = rankAt(detail.config.rank?.start ?? 0)
      // A stored partial-slot target the creation form doesn't offer for this rank stays selectable.
      const offered = additionalTargetOptions(draft.end)
      return (
        <RankGoalCard
          additionalTargetChoices={
            offered.includes(draft.additional)
              ? offered
              : [...offered, draft.additional]
          }
          farmingStrategy={farmingStrategy}
          issues={issues}
          mode="edit"
          mythic={mythic}
          note={note}
          onChange={(value) => {
            const endChanged = value.end !== draft.end
            onChange({
              kind: "Rank",
              end: value.end,
              // A partial-slot choice only exists for some ranks: fall back to a clean boundary.
              additional:
                !endChanged ||
                additionalTargetOptions(value.end).includes(value.additional)
                  ? value.additional
                  : "None",
            })
          }}
          onFarmingStrategyChange={onFarmingStrategyChange}
          preview={resourcePreview}
          start={start}
          takenKeys={takenKeys}
          value={{ end: draft.end, additional: draft.additional }}
        />
      )
    }
    case "Ascension": {
      const start = detail.config.progression?.start
      return (
        <AscensionGoalCard
          issues={issues}
          mode="edit"
          note={note}
          onChange={(end) => onChange({ kind: "Ascension", end })}
          preview={previews.progressionPreview}
          sources={sources}
          start={start && isProgression(start) ? start : "Common:None"}
          takenKeys={takenKeys}
          value={draft.end}
        />
      )
    }
    case "Ability": {
      const ability = detail.config.ability
      const start = {
        active: ability?.activeStart ?? 0,
        passive: ability?.passiveStart ?? 0,
      }
      // An untouched track may be stored below its start; it reads, and is sent, as "no change".
      const changed = isGoalTargetDraftChanged(detail, draft)
      const value = {
        active: changed
          ? draft.activeEnd
          : Math.max(draft.activeEnd, start.active),
        passive: changed
          ? draft.passiveEnd
          : Math.max(draft.passiveEnd, start.passive),
      }
      return (
        <AbilityGoalCard
          entityType={detail.entityType === "Mow" ? "Mow" : "Character"}
          issues={issues}
          mode="edit"
          mythic={mythic}
          note={note}
          onChange={(next) =>
            onChange({
              kind: "Ability",
              activeEnd: next.active,
              passiveEnd: next.passive,
            })
          }
          preview={previews.resourcePreview}
          rarityCap={rarityCap}
          sources={sources}
          start={start}
          value={value}
        />
      )
    }
    case "Upgrade":
      return (
        <EditUpgradeCard
          detail={detail}
          draft={draft}
          issues={issues}
          mythic={mythic}
          note={note}
          onChange={onChange}
          ownedQuantities={ownedQuantities}
          portalContainer={portalContainer}
          preview={resourcePreview}
          sources={sources}
          units={units}
          upgradesById={upgradesById}
        />
      )
  }
}

/** The Upgrade goal's card: the range(s) it was created against, its materials and "Add material". */
function EditUpgradeCard({
  detail,
  draft,
  onChange,
  issues,
  preview,
  upgradesById,
  ownedQuantities,
  units,
  portalContainer,
  sources,
  mythic,
  note,
}: {
  detail: GoalDetail
  draft: Extract<GoalTargetDraft, { kind: "Upgrade" }>
  onChange: (draft: GoalTargetDraft) => void
  issues: readonly GoalFormIssueView[]
  preview: ResourcePreview
  upgradesById: ReadonlyMap<UpgradeId, UpgradeWithFarmLocations>
  ownedQuantities?: ReadonlyMap<string, number>
  units: UpgradeUnits
  portalContainer: HTMLElement | null
  sources?: ReactNode
  mythic?: ReactNode
  note?: ReactNode
}) {
  const { t } = useTranslation()
  // What the picker offers: the materials the range needs, with how many — as in creation.
  const choices = useMemo<ReadonlyMap<UpgradeId, number>>(() => {
    if (detail.entityType === "Character") {
      const character = units.getCharacter(detail.entityId as never)
      if (!character) return new Map()
      return characterRelevantUpgradeQuantities(
        character,
        rankAt(draft.rankRange?.start ?? 0),
        draft.rankRange ? rankAt(draft.rankRange.end) : lastRank,
        upgradesById
      )
    }
    const mow = units.mowsById?.get(detail.entityId)
    return mow
      ? mowRelevantUpgradeQuantities(mow, upgradesById, {
          activeRange: draft.activeRange,
          passiveRange: draft.passiveRange,
        })
      : new Map()
  }, [detail, draft, upgradesById, units])

  return (
    <UpgradeGoalCard
      choices={choices}
      issues={issues}
      mode="edit"
      mythic={mythic}
      note={note}
      onAdd={(id, quantity) =>
        onChange({
          ...draft,
          targets: [...draft.targets, { upgradeId: id, quantity }],
        })
      }
      onQuantityChange={(id, quantity) =>
        onChange({
          ...draft,
          targets: draft.targets.map((entry) =>
            entry.upgradeId === id ? { ...entry, quantity } : entry
          ),
        })
      }
      onRemove={(id) =>
        onChange({
          ...draft,
          targets: draft.targets.filter((entry) => entry.upgradeId !== id),
        })
      }
      ownedQuantities={ownedQuantities}
      preview={preview}
      ranges={
        detail.entityType === "Mow" ? (
          <>
            <OptionalRangeField
              label={t("goals.create.upgrade.range.primary")}
              onChange={(activeRange) => onChange({ ...draft, activeRange })}
              options={abilityLevelOptions}
              portalContainer={portalContainer}
              testId="goal-target-upgrade-range-primary"
              value={draft.activeRange}
            />
            <OptionalRangeField
              label={t("goals.create.upgrade.range.secondary")}
              onChange={(passiveRange) => onChange({ ...draft, passiveRange })}
              options={abilityLevelOptions}
              portalContainer={portalContainer}
              testId="goal-target-upgrade-range-secondary"
              value={draft.passiveRange}
            />
          </>
        ) : (
          <OptionalRangeField
            label={t("goals.create.upgrade.range.rank")}
            onChange={(rankRange) => onChange({ ...draft, rankRange })}
            options={rankOptions}
            portalContainer={portalContainer}
            testId="goal-target-upgrade-range-rank"
            value={draft.rankRange}
          />
        )
      }
      sources={sources}
      targets={draft.targets}
      upgradesById={upgradesById}
    />
  )
}
