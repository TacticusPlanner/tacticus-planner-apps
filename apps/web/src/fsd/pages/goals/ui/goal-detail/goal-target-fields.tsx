import { useId, type ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { Input } from "@workspace/ui/components/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import {
  maxAbilityLevel,
  progressionOrder,
  rankAt,
  type Progression,
  type Rank,
  type UpgradeId,
} from "@workspace/game-domain"

import type { GoalDetail } from "@/entities/goal"
import {
  additionalTargetOptions,
  type RankAdditionalTarget,
} from "@/features/goal-farming"
import type { UpgradeWithFarmLocations } from "@/features/rank-lookup"
import { ProgressionBadge, RankBadge, UpgradeIcon } from "@/shared/ui"

import { MAX_CHARACTER_LEVEL } from "../../model/goal-creation-form/goal-validation"
import {
  MAX_UPGRADE_QUANTITY,
  rankEndOptionsFor,
  type GoalTargetDraft,
} from "../../model/target-edit/goal-target-edit"
import { AdditionalTargetLabel } from "../create-goal/goal-type-fields"

type FieldsProps<Kind extends GoalTargetDraft["kind"]> = {
  detail: GoalDetail
  draft: Extract<GoalTargetDraft, { kind: Kind }>
  onChange: (draft: GoalTargetDraft) => void
  portalContainer: HTMLElement | null
}

function TargetSelect({
  label,
  testId,
  value,
  onValueChange,
  portalContainer,
  children,
}: {
  label: string
  testId: string
  value: string
  onValueChange: (value: string) => void
  portalContainer: HTMLElement | null
  children: ReactNode
}) {
  const id = useId()

  return (
    <div className="grid gap-1.5">
      <label className="text-xs text-muted-foreground" htmlFor={id}>
        {label}
      </label>
      <Select
        onValueChange={(next) => {
          // Radix can fire onValueChange("") while the option list regenerates; ignore non-options.
          if (next !== "") onValueChange(next)
        }}
        value={value}
      >
        <SelectTrigger className="w-full" data-testid={testId} id={id}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent container={portalContainer ?? undefined}>
          {children}
        </SelectContent>
      </Select>
    </div>
  )
}

function range(from: number, to: number): number[] {
  return Array.from({ length: Math.max(0, to - from + 1) }, (_, i) => from + i)
}

function RankFields({
  detail,
  draft,
  onChange,
  portalContainer,
}: FieldsProps<"Rank">) {
  const { t } = useTranslation()
  // The stored partial-slot target (e.g. 1 or 2 applied slots from an import) may not be one the creation
  // form offers for this rank — keep it selectable so the Select never opens blank.
  const offered = additionalTargetOptions(draft.end)
  const choices = offered.includes(draft.additional)
    ? offered
    : [...offered, draft.additional]

  return (
    <div className="grid gap-3">
      <TargetSelect
        label={t("goals.target.rankEnd")}
        onValueChange={(value) => {
          const end = value as Rank
          // A partial-slot choice only exists for some ranks — fall back to a clean rank boundary.
          const additional = additionalTargetOptions(end).includes(
            draft.additional
          )
            ? draft.additional
            : "None"
          onChange({ kind: "Rank", end, additional })
        }}
        portalContainer={portalContainer}
        testId="goal-target-rank-end"
        value={draft.end}
      >
        {rankEndOptionsFor(detail).map((rank) => (
          <SelectItem key={rank} value={rank}>
            <RankBadge rank={rank} />
          </SelectItem>
        ))}
      </TargetSelect>
      <TargetSelect
        label={t("goals.create.rank.additionalTarget.label")}
        onValueChange={(value) =>
          onChange({ ...draft, additional: value as RankAdditionalTarget })
        }
        portalContainer={portalContainer}
        testId="goal-target-rank-additional"
        value={draft.additional}
      >
        {choices.map((choice) => (
          <SelectItem key={choice} value={choice}>
            <AdditionalTargetLabel rank={draft.end} value={choice} />
          </SelectItem>
        ))}
      </TargetSelect>
    </div>
  )
}

function AscensionFields({
  draft,
  onChange,
  portalContainer,
}: FieldsProps<"Ascension">) {
  const { t } = useTranslation()

  return (
    <TargetSelect
      label={t("goals.target.progressionEnd")}
      onValueChange={(value) =>
        onChange({ kind: "Ascension", end: value as Progression })
      }
      portalContainer={portalContainer}
      testId="goal-target-ascension-end"
      value={draft.end}
    >
      {progressionOrder.map((option) => (
        <SelectItem key={option} value={option}>
          <ProgressionBadge value={option} />
        </SelectItem>
      ))}
    </TargetSelect>
  )
}

function LevelFields({
  detail,
  draft,
  onChange,
  portalContainer,
}: FieldsProps<"Level">) {
  const { t } = useTranslation()
  const start = detail.config.level?.start ?? 0

  return (
    <TargetSelect
      label={t("goals.target.levelEnd")}
      onValueChange={(value) => onChange({ kind: "Level", end: Number(value) })}
      portalContainer={portalContainer}
      testId="goal-target-level-end"
      value={String(draft.end)}
    >
      {range(start + 1, MAX_CHARACTER_LEVEL).map((level) => (
        <SelectItem key={level} value={String(level)}>
          {level}
        </SelectItem>
      ))}
    </TargetSelect>
  )
}

/** Each track is edited on its own — leaving one at its stored value is a valid edit. */
function AbilityFields({
  detail,
  draft,
  onChange,
  portalContainer,
}: FieldsProps<"Ability">) {
  const { t } = useTranslation()
  const ability = detail.config.ability
  const isMow = detail.entityType === "Mow"
  const tracks = [
    {
      key: "activeEnd" as const,
      label: t(isMow ? "goals.target.primaryEnd" : "goals.target.activeEnd"),
      start: ability?.activeStart ?? 0,
    },
    {
      key: "passiveEnd" as const,
      label: t(isMow ? "goals.target.secondaryEnd" : "goals.target.passiveEnd"),
      start: ability?.passiveStart ?? 0,
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3">
      {tracks.map((track) => (
        <TargetSelect
          key={track.key}
          label={track.label}
          onValueChange={(value) =>
            onChange({ ...draft, [track.key]: Number(value) })
          }
          portalContainer={portalContainer}
          testId={`goal-target-ability-${track.key}`}
          value={String(draft[track.key])}
        >
          {range(track.start, maxAbilityLevel).map((level) => (
            <SelectItem key={level} value={String(level)}>
              {level}
            </SelectItem>
          ))}
        </TargetSelect>
      ))}
    </div>
  )
}

/** Only the quantities are editable — each material keeps its identity. */
function UpgradeFields({
  draft,
  onChange,
  upgradesById,
}: Pick<FieldsProps<"Upgrade">, "draft" | "onChange"> & {
  upgradesById: ReadonlyMap<UpgradeId, UpgradeWithFarmLocations>
}) {
  const { t } = useTranslation()

  return (
    <div className="grid gap-2">
      {draft.targets.map((target) => {
        const upgrade = upgradesById.get(target.upgradeId as UpgradeId)
        return (
          <div
            className="flex items-center gap-2"
            data-testid={`goal-target-upgrade-${target.upgradeId}`}
            key={target.upgradeId}
          >
            <UpgradeIcon
              className="size-8 shrink-0"
              crafted={upgrade?.crafted}
              id={target.upgradeId as UpgradeId}
              rarity={upgrade?.rarity}
            />
            <span className="flex-1 truncate text-sm">
              {upgrade?.label ?? target.upgradeId}
            </span>
            <Input
              aria-label={t("goals.target.quantity")}
              className="w-24"
              max={MAX_UPGRADE_QUANTITY}
              min={1}
              onChange={(event) =>
                onChange({
                  ...draft,
                  targets: draft.targets.map((entry) =>
                    entry.upgradeId === target.upgradeId
                      ? { ...entry, quantity: Number(event.target.value) }
                      : entry
                  ),
                })
              }
              type="number"
              // 0 (a cleared field) renders empty so the owner can type a new number; it stays an
              // invalid draft (quantity < 1) until they do.
              value={target.quantity === 0 ? "" : target.quantity}
            />
          </div>
        )
      })}
    </div>
  )
}

/** The end-target controls for the goal's own kind, prefilled from the draft (which starts as the stored
 * target). Reads the stored start only to bound the options — the start itself is never editable. */
export function GoalTargetFields({
  detail,
  draft,
  onChange,
  portalContainer,
  upgradesById,
}: {
  detail: GoalDetail
  draft: GoalTargetDraft
  onChange: (draft: GoalTargetDraft) => void
  portalContainer: HTMLElement | null
  upgradesById: ReadonlyMap<UpgradeId, UpgradeWithFarmLocations>
}) {
  const common = { detail, onChange, portalContainer }
  switch (draft.kind) {
    case "Rank":
      return <RankFields {...common} draft={draft} />
    case "Ascension":
      return <AscensionFields {...common} draft={draft} />
    case "Level":
      return <LevelFields {...common} draft={draft} />
    case "Ability":
      return <AbilityFields {...common} draft={draft} />
    case "Upgrade":
      return (
        <UpgradeFields
          draft={draft}
          onChange={onChange}
          upgradesById={upgradesById}
        />
      )
  }
}

/** The goal's stored starting point, shown read-only above the editor so the owner can see what the
 * target is measured from. */
export function GoalTargetStart({ detail }: { detail: GoalDetail }) {
  const { config } = detail
  switch (detail.goalType) {
    case "Rank":
      return config.rank ? <RankBadge rank={rankAt(config.rank.start)} /> : null
    case "Ascension":
      return config.progression ? (
        <ProgressionBadge value={config.progression.start as Progression} />
      ) : null
    case "Level":
      return config.level ? <span>{config.level.start}</span> : null
    case "Ability":
      return config.ability ? (
        <span>
          {config.ability.activeStart} / {config.ability.passiveStart}
        </span>
      ) : null
    default:
      return null
  }
}
