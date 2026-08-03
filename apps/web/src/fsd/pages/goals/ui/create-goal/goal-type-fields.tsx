import { useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Badge } from "@workspace/ui/components/badge"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"

import {
  progressionOrder,
  type Progression,
  type Rank,
  type UpgradeId,
} from "@workspace/game-domain"

import {
  ProgressionBadge,
  RankBadge,
  ReadOnlyField,
  UpgradeIcon,
} from "@/shared/ui"
import { abilityLevelsByRarity } from "../../model/goal-creation-form/goal-validation"
import {
  rowCount,
  type RankAdditionalTarget,
} from "../../model/estimate/rank-additional-target"

export type MissingUpgrade = { id: string; label: string; missing: number }

const RESOURCES_NEEDED_VISIBLE_COUNT = 3

/** "Resources needed" upgrade list, collapsed to the first 3 entries until expanded — shared between
 * Rank's and Ability's own resource-requirement preview. */
function ResourcesNeededList({
  missingUpgrades,
}: {
  missingUpgrades: MissingUpgrade[]
}) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)
  if (missingUpgrades.length === 0) return null

  const visible = expanded
    ? missingUpgrades
    : missingUpgrades.slice(0, RESOURCES_NEEDED_VISIBLE_COUNT)

  return (
    <>
      <ul className="grid gap-0.5 text-muted-foreground">
        {visible.map((entry) => (
          <li className="flex items-center gap-1.5" key={entry.id}>
            <UpgradeIcon className="size-6" id={entry.id as UpgradeId} />
            {entry.label} × {entry.missing}
          </li>
        ))}
      </ul>
      {missingUpgrades.length > RESOURCES_NEEDED_VISIBLE_COUNT ? (
        <button
          className="justify-self-start text-xs font-medium text-primary underline-offset-2 hover:underline"
          data-testid="create-goal-resources-needed-toggle"
          onClick={() => setExpanded((current) => !current)}
          type="button"
        >
          {expanded
            ? t("goals.create.showLess")
            : t("goals.create.showAll", { count: missingUpgrades.length })}
        </button>
      ) : null}
    </>
  )
}

function AdditionalTargetLabel({
  rank,
  value,
}: {
  rank: Rank
  value: RankAdditionalTarget
}) {
  const { t } = useTranslation()
  if (value === "None") {
    return <>{t("goals.create.rank.additionalTarget.none")}</>
  }

  let count = rowCount(value)
  if (value === "TopRow1") count = 1
  if (value === "TopRow2") count = 2
  if (value === "TopRow") count = 3

  return (
    <span className="inline-flex items-center gap-1">
      <RankBadge rank={rank} />
      {count !== null ? (
        <>
          {" "}
          <span>({count}/6)</span>
        </>
      ) : null}
    </span>
  )
}

/** Target-rank field + its "Additional target" (V1's Point Five / Mythic-tier partial-upgrade
 * selection — see rank-additional-target.ts) + the resource-requirement preview (plan §16 phase 2
 * — Rank only). The current rank is read-only — it always reflects the unit's actual current rank,
 * with a small "N/total" badge showing how many of that rank's own upgrade slots are already applied.
 * The day-by-day duration estimate for this range no longer renders here — it's shown per selected
 * project in the drawer's "What will be created" review instead (per-project priority changes the
 * estimate, so one combined isolated number here would be misleading). */
export function RankGoalFields({
  rankStart,
  rankEnd,
  rankEndOptions,
  rankAdditionalTarget,
  additionalTargetChoices,
  onRankEndChange,
  onRankAdditionalTargetChange,
  missingUpgrades,
  rankAppliedUpgrades,
  rankUpgradeSlotsTotal,
}: {
  rankStart: Rank
  rankEnd: Rank
  rankEndOptions: Rank[]
  rankAdditionalTarget: RankAdditionalTarget
  additionalTargetChoices: readonly RankAdditionalTarget[]
  onRankEndChange: (rank: Rank) => void
  onRankAdditionalTargetChange: (value: RankAdditionalTarget) => void
  missingUpgrades: MissingUpgrade[]
  rankAppliedUpgrades: number
  rankUpgradeSlotsTotal: number
}) {
  const { t } = useTranslation()
  const targetTriggerRef = useRef<HTMLButtonElement>(null)
  const [targetContainer, setTargetContainer] = useState<HTMLElement>()
  const additionalTriggerRef = useRef<HTMLButtonElement>(null)
  const [additionalContainer, setAdditionalContainer] = useState<HTMLElement>()

  return (
    <div className="grid gap-3">
      <div className="grid grid-cols-2 gap-3">
        <ReadOnlyField label={t("goals.create.rank.current")}>
          <RankBadge rank={rankStart} />
          {rankUpgradeSlotsTotal > 0 ? (
            <Badge
              className="ml-auto"
              data-testid="create-goal-rank-applied-upgrades"
              variant="secondary"
            >
              {t("goals.create.rank.appliedUpgrades", {
                applied: rankAppliedUpgrades,
                total: rankUpgradeSlotsTotal,
              })}
            </Badge>
          ) : null}
        </ReadOnlyField>
        <div className="grid gap-1.5">
          <label className="text-xs text-muted-foreground">
            {t("goals.create.rank.target")}
          </label>
          <Select
            onOpenChange={(open) => {
              if (open) {
                setTargetContainer(
                  (targetTriggerRef.current?.closest(
                    '[data-slot="sheet-content"]'
                  ) as HTMLElement | null) ?? undefined
                )
              }
            }}
            onValueChange={(value) => onRankEndChange(value as Rank)}
            value={rankEnd}
          >
            <SelectTrigger
              className="w-full"
              data-testid="create-goal-rank-end"
              ref={targetTriggerRef}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent container={targetContainer}>
              {rankEndOptions.map((rank) => (
                <SelectItem key={rank} value={rank}>
                  <RankBadge rank={rank} />
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-1.5">
        <label className="text-xs text-muted-foreground">
          {t("goals.create.rank.additionalTarget.label")}
        </label>
        <Select
          onOpenChange={(open) => {
            if (open) {
              setAdditionalContainer(
                (additionalTriggerRef.current?.closest(
                  '[data-slot="sheet-content"]'
                ) as HTMLElement | null) ?? undefined
              )
            }
          }}
          onValueChange={(value) =>
            onRankAdditionalTargetChange(value as RankAdditionalTarget)
          }
          value={rankAdditionalTarget}
        >
          <SelectTrigger
            className="w-full"
            data-testid="create-goal-rank-additional-target"
            ref={additionalTriggerRef}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent container={additionalContainer}>
            {additionalTargetChoices.map((choice) => (
              <SelectItem key={choice} value={choice}>
                <AdditionalTargetLabel rank={rankEnd} value={choice} />
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {missingUpgrades.length > 0 ? (
        <div
          className="grid gap-1 rounded-2xl border p-3 text-sm"
          data-testid="create-goal-preview"
        >
          <p className="font-medium">{t("goals.create.previewTitle")}</p>
          <ResourcesNeededList missingUpgrades={missingUpgrades} />
          <p className="text-xs text-muted-foreground">
            {t("goals.create.previewDisclaimer")}
          </p>
        </div>
      ) : null}
    </div>
  )
}

export function AscensionGoalFields({
  progressionStart,
  progressionEnd,
  onProgressionEndChange,
}: {
  progressionStart: Progression
  progressionEnd: Progression
  onProgressionEndChange: (value: Progression) => void
}) {
  const { t } = useTranslation()
  const endTriggerRef = useRef<HTMLButtonElement>(null)
  const [endContainer, setEndContainer] = useState<HTMLElement>()

  return (
    <div className="grid grid-cols-2 gap-3">
      <ReadOnlyField label={t("goals.create.ascension.start")}>
        <ProgressionBadge value={progressionStart} />
      </ReadOnlyField>
      <div className="grid gap-1.5">
        <label className="text-xs text-muted-foreground">
          {t("goals.create.ascension.end")}
        </label>
        <Select
          onOpenChange={(open) => {
            if (open) {
              setEndContainer(
                (endTriggerRef.current?.closest(
                  '[data-slot="sheet-content"]'
                ) as HTMLElement | null) ?? undefined
              )
            }
          }}
          onValueChange={(value) =>
            onProgressionEndChange(value as Progression)
          }
          value={progressionEnd}
        >
          <SelectTrigger
            className="w-full"
            data-testid="create-goal-ascension-end"
            ref={endTriggerRef}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent container={endContainer}>
            {progressionOrder.map((option) => (
              <SelectItem key={option} value={option}>
                <ProgressionBadge value={option} />
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

export function AbilityGoalFields({
  activeStart,
  passiveStart,
  targetLevel,
  onTargetLevelChange,
  missingUpgrades,
  costingSupported,
}: {
  activeStart: number
  passiveStart: number
  targetLevel: number
  onTargetLevelChange: (value: number) => void
  missingUpgrades: MissingUpgrade[]
  costingSupported: boolean
}) {
  const { t } = useTranslation("progression")
  const { t: tGoals } = useTranslation()
  const targetTriggerRef = useRef<HTMLButtonElement>(null)
  const [targetContainer, setTargetContainer] = useState<HTMLElement>()
  const minCurrent = Math.min(activeStart, passiveStart)

  return (
    <div className="grid grid-cols-2 gap-3">
      <ReadOnlyField label={tGoals("goals.create.ability.activeStart")}>
        {activeStart}
      </ReadOnlyField>
      <ReadOnlyField label={tGoals("goals.create.ability.passiveStart")}>
        {passiveStart}
      </ReadOnlyField>
      <div className="col-span-2 grid gap-1.5">
        <label className="text-xs text-muted-foreground">
          {tGoals("goals.create.ability.target")}
        </label>
        <Select
          onOpenChange={(open) => {
            if (open) {
              setTargetContainer(
                (targetTriggerRef.current?.closest(
                  '[data-slot="sheet-content"]'
                ) as HTMLElement | null) ?? undefined
              )
            }
          }}
          onValueChange={(value) => onTargetLevelChange(Number(value))}
          value={String(targetLevel)}
        >
          <SelectTrigger
            className="w-full"
            data-testid="create-goal-ability-target"
            ref={targetTriggerRef}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent container={targetContainer}>
            {abilityLevelsByRarity.map(({ rarity, level }) => (
              <SelectGroup key={rarity}>
                <SelectLabel>
                  {t(`rarities.${rarity}`, { defaultValue: rarity })}
                </SelectLabel>
                <SelectItem
                  disabled={level <= minCurrent}
                  value={String(level)}
                >
                  {level}
                </SelectItem>
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
      </div>
      {costingSupported ? (
        <div
          className="col-span-2 grid gap-1 rounded-2xl border p-3 text-sm"
          data-testid="create-goal-ability-preview"
        >
          <p className="font-medium">{tGoals("goals.create.previewTitle")}</p>
          <ResourcesNeededList missingUpgrades={missingUpgrades} />
        </div>
      ) : (
        <p className="col-span-2 text-xs text-muted-foreground">
          {tGoals("goals.create.characterAbilityCostUnsupported")}
        </p>
      )}
    </div>
  )
}
