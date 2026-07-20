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
  energyIconUrl,
  EntityIcon,
  ProgressionBadge,
  RankBadge,
  ReadOnlyField,
  UpgradeIcon,
} from "@/shared/ui"
import { abilityLevelsByRarity } from "../model/goal-validation"
import {
  rowCount,
  rowLevel,
  type RankAdditionalTarget,
} from "../model/rank-additional-target"
import type { EstimateOutcome } from "../model/estimate/estimate.domain"

export type MissingUpgrade = { id: string; label: string; missing: number }
export type EstimatePreview = EstimateOutcome

const STILL_NEEDED_VISIBLE_COUNT = 3

/** "Still needed" upgrade list, collapsed to the first 3 entries until expanded — shared between
 * Rank's and Ability's own resource-requirement preview. */
function StillNeededList({
  missingUpgrades,
}: {
  missingUpgrades: MissingUpgrade[]
}) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)
  if (missingUpgrades.length === 0) return null

  const visible = expanded
    ? missingUpgrades
    : missingUpgrades.slice(0, STILL_NEEDED_VISIBLE_COUNT)

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
      {missingUpgrades.length > STILL_NEEDED_VISIBLE_COUNT ? (
        <button
          className="justify-self-start text-xs font-medium text-primary underline-offset-2 hover:underline"
          data-testid="create-goal-still-needed-toggle"
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

function EstimateSummary({ estimate }: { estimate: EstimatePreview | null }) {
  const { t } = useTranslation()
  if (!estimate) return null

  return estimate.status === "Blocked" ? (
    <p
      className="font-medium text-amber-700"
      data-testid="create-goal-estimate-blocked"
    >
      {t(`goals.estimate.blocked.${estimate.reason}`)}
    </p>
  ) : (
    <div
      className="grid gap-0.5 font-medium"
      data-testid="create-goal-estimate"
    >
      <p>{t("goals.create.previewEstimate", { days: estimate.days })}</p>
      <p className="flex items-center gap-1.5">
        <EntityIcon alt="" className="size-5 shrink-0" src={energyIconUrl} />
        {t("goals.create.previewEnergy", { energy: estimate.energyTotal })}
      </p>
    </div>
  )
}

function additionalTargetLabel(
  t: ReturnType<typeof useTranslation>["t"],
  rank: Rank,
  value: RankAdditionalTarget
): string {
  if (value === "None") return t("goals.create.rank.additionalTarget.none")
  if (value === "TopRow") return t("goals.create.rank.additionalTarget.topRow")
  if (value === "TopRow1" || value === "TopRow2") {
    const count = value === "TopRow1" ? 1 : 2
    return t("goals.create.rank.additionalTarget.row", {
      count,
      total: 3,
      level: rowLevel(rank, count),
    })
  }
  const count = rowCount(value)!
  return t("goals.create.rank.additionalTarget.row", {
    count,
    total: 6,
    level: rowLevel(rank, count),
  })
}

/** Target-rank field + its "Additional target" (V1's Point Five / Mythic-tier partial-upgrade
 * selection — see rank-additional-target.ts) + the resource-requirement preview (plan §16 phase 2
 * — Rank only) + the isolated day-by-day estimate for that same range (plan §16 phase 4). The
 * current rank is read-only — it always reflects the unit's actual current rank, with a small
 * "N/total" badge showing how many of that rank's own upgrade slots are already applied. */
export function RankGoalFields({
  rankStart,
  rankEnd,
  rankEndOptions,
  rankAdditionalTarget,
  additionalTargetChoices,
  onRankEndChange,
  onRankAdditionalTargetChange,
  missingUpgrades,
  estimate,
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
  estimate: EstimatePreview | null
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
                {additionalTargetLabel(t, rankEnd, choice)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {missingUpgrades.length > 0 || estimate ? (
        <div
          className="grid gap-1 rounded-2xl border p-3 text-sm"
          data-testid="create-goal-preview"
        >
          {missingUpgrades.length > 0 ? (
            <>
              <p className="font-medium">{t("goals.create.previewTitle")}</p>
              <StillNeededList missingUpgrades={missingUpgrades} />
            </>
          ) : null}
          <EstimateSummary estimate={estimate} />
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
          <SelectTrigger className="w-full" ref={endTriggerRef}>
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
  estimate,
  costingSupported,
}: {
  activeStart: number
  passiveStart: number
  targetLevel: number
  onTargetLevelChange: (value: number) => void
  missingUpgrades: MissingUpgrade[]
  estimate: EstimatePreview | null
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
          <StillNeededList missingUpgrades={missingUpgrades} />
          <EstimateSummary estimate={estimate} />
        </div>
      ) : (
        <p className="col-span-2 text-xs text-muted-foreground">
          {tGoals("goals.create.characterAbilityCostUnsupported")}
        </p>
      )}
    </div>
  )
}
