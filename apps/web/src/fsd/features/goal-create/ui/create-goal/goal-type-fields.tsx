import { useRef, useState, type ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { Badge } from "@workspace/ui/components/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"

import type { Progression, Rank, UpgradeId } from "@workspace/game-domain"

import {
  closestOverlayContent,
  ProgressionBadge,
  RankBadge,
  ReadOnlyField,
  UpgradeIcon,
} from "@/shared/ui"
import {
  rowCount,
  type RankAdditionalTarget,
} from "@/features/goal-farming/@x/goal-create"
import { rankEndKey } from "../../model/goal-creation-form/first-free-target"
import type { GoalFormIssueView } from "../../model/goal-creation-form/use-goal-validation-state"
import { PreviewSection } from "../shared/preview-section"
import { FieldIssues } from "./goal-form-issues"
import { fieldIssueProps } from "./goal-form-issue-ids"

import { PLAIN_VALUE } from "./plain-value"

const NO_ISSUES: readonly GoalFormIssueView[] = []
const NO_TAKEN: ReadonlySet<string> = new Set()

/** A target option an in-flight goal of the unit already holds: shown, marked, and not selectable. */
export function TakenTargetItem({
  value,
  taken,
  children,
}: {
  value: string
  taken: boolean
  children: ReactNode
}) {
  const { t } = useTranslation()
  return (
    <SelectItem disabled={taken} value={value}>
      {children}
      {taken ? (
        <span className="text-xs text-muted-foreground">
          {t("goals.create.takenTarget")}
        </span>
      ) : null}
    </SelectItem>
  )
}

export type MissingUpgrade = { id: string; label: string; missing: number }

const RESOURCES_NEEDED_VISIBLE_COUNT = 3

/** "Resources needed" upgrade list, collapsed to the first 3 entries until expanded — shared between
 * Rank's and Ability's own resource-requirement preview. */
export function ResourcesNeededList({
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

export function AdditionalTargetLabel({
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
 * project in the drawer's "What will be created" review instead (project order changes the
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
  taken = NO_TAKEN,
  issues = NO_ISSUES,
  previewLoading = false,
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
  /** Target keys in-flight Rank goals of this unit hold. */
  taken?: ReadonlySet<string>
  issues?: readonly GoalFormIssueView[]
  previewLoading?: boolean
}) {
  const { t } = useTranslation()
  const targetTriggerRef = useRef<HTMLButtonElement>(null)
  const [targetContainer, setTargetContainer] = useState<HTMLElement>()
  const additionalTriggerRef = useRef<HTMLButtonElement>(null)
  const [additionalContainer, setAdditionalContainer] = useState<HTMLElement>()

  return (
    <div className="grid gap-2">
      <div className="grid grid-cols-2 gap-3">
        <ReadOnlyField
          className={PLAIN_VALUE}
          label={t("goals.create.rank.current")}
        >
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
                  closestOverlayContent(targetTriggerRef.current)
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
              {...fieldIssueProps(issues, "Rank", "target")}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent container={targetContainer}>
              {rankEndOptions.map((rank) => (
                <TakenTargetItem
                  key={rank}
                  taken={rank !== rankEnd && taken.has(rankEndKey(rank))}
                  value={rank}
                >
                  <RankBadge rank={rank} />
                </TakenTargetItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-2">
          <FieldIssues field="target" issues={issues} kind="Rank" />
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
                closestOverlayContent(additionalTriggerRef.current)
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

      <PreviewSection
        emptyText={t("goals.create.rank.noResources")}
        state={
          previewLoading
            ? "loading"
            : missingUpgrades.length > 0
              ? "content"
              : "empty"
        }
        testId="create-goal-preview"
      >
        <ResourcesNeededList missingUpgrades={missingUpgrades} />
        <p className="text-xs text-muted-foreground">
          {t("goals.create.previewDisclaimer")}
        </p>
      </PreviewSection>
    </div>
  )
}

export function AscensionGoalFields({
  progressionStart,
  progressionEnd,
  progressionEndOptions,
  onProgressionEndChange,
  taken = NO_TAKEN,
  issues = NO_ISSUES,
}: {
  progressionStart: Progression
  progressionEnd: Progression
  /** Steps above the start (`progressionEndOptionsFor`). */
  progressionEndOptions: readonly Progression[]
  onProgressionEndChange: (value: Progression) => void
  taken?: ReadonlySet<string>
  issues?: readonly GoalFormIssueView[]
}) {
  const { t } = useTranslation()
  const endTriggerRef = useRef<HTMLButtonElement>(null)
  const [endContainer, setEndContainer] = useState<HTMLElement>()

  return (
    <div className="grid grid-cols-2 gap-3">
      <ReadOnlyField
        className={PLAIN_VALUE}
        label={t("goals.create.ascension.start")}
      >
        <ProgressionBadge value={progressionStart} />
      </ReadOnlyField>
      <div className="grid gap-1.5">
        <label className="text-xs text-muted-foreground">
          {t("goals.create.ascension.end")}
        </label>
        <Select
          onOpenChange={(open) => {
            if (open) {
              setEndContainer(closestOverlayContent(endTriggerRef.current))
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
            {...fieldIssueProps(issues, "Ascension", "target")}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent container={endContainer}>
            {progressionEndOptions.map((option) => (
              <TakenTargetItem
                key={option}
                taken={option !== progressionEnd && taken.has(option)}
                value={option}
              >
                <ProgressionBadge value={option} />
              </TakenTargetItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="col-span-2">
        <FieldIssues field="target" issues={issues} kind="Ascension" />
      </div>
    </div>
  )
}
