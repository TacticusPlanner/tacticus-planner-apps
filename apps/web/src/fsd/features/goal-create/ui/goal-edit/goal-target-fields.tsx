import { useId, useMemo, type ReactNode } from "react"
import { useTranslation } from "react-i18next"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import {
  isProgression,
  lastRank,
  maxAbilityLevel,
  rankAt,
  rankOrder,
  type Progression,
  type Rank,
  type UpgradeId,
} from "@workspace/game-domain"
import type { MowStorageModel } from "@workspace/game-catalog"

import type { GoalDetail } from "@/entities/goal"
import {
  additionalTargetOptions,
  type RankAdditionalTarget,
} from "@/features/goal-farming/@x/goal-create"
import type {
  Character,
  UpgradeWithFarmLocations,
} from "@/features/rank-lookup/@x/goal-create"
import {
  ProgressionBadge,
  RankBadge,
  RarityCombobox,
  UpgradeIcon,
  type RarityComboboxItem,
} from "@/shared/ui"

import {
  abilityLevelOptionsFor,
  isValidUpgradeQuantity,
  progressionEndOptionsFor,
  rankEndOptionsFor,
  type GoalTargetDraft,
} from "../../model/target-edit/goal-target-edit"
import {
  characterRelevantUpgradeQuantities,
  mowRelevantUpgradeQuantities,
} from "../../model/goal-creation-form/goal-spec-builder"
import { OptionalRangeField } from "../shared/optional-range-field"
import { UpgradeQuantityRow } from "../shared/upgrade-quantity-row"
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
        <SelectTrigger className="w-full max-w-xs" data-testid={testId} id={id}>
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
  detail,
  draft,
  onChange,
  portalContainer,
}: FieldsProps<"Ascension">) {
  const { t } = useTranslation()
  const start = detail.config.progression?.start
  const stored = detail.config.progression?.end
  // Only steps above where the goal started, plus a stored target that isn't (so it never opens blank).
  const options = progressionEndOptionsFor(
    start && isProgression(start) ? start : "Common:None",
    stored && isProgression(stored) ? stored : undefined
  )

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
      {options.map((option) => (
        <SelectItem key={option} value={option}>
          <ProgressionBadge value={option} />
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
      stored: ability?.activeEnd,
    },
    {
      key: "passiveEnd" as const,
      label: t(isMow ? "goals.target.secondaryEnd" : "goals.target.passiveEnd"),
      start: ability?.passiveStart ?? 0,
      stored: ability?.passiveEnd,
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3">
      {tracks.map((track) => (
        <TargetSelect
          key={track.key}
          label={track.label}
          onValueChange={(value) =>
            onChange({
              ...draft,
              // An untargeted track may be stored below its start; send it as creation does (end = start).
              activeEnd: Math.max(draft.activeEnd, ability?.activeStart ?? 0),
              passiveEnd: Math.max(
                draft.passiveEnd,
                ability?.passiveStart ?? 0
              ),
              [track.key]: Number(value),
            })
          }
          portalContainer={portalContainer}
          testId={`goal-target-ability-${track.key}`}
          value={String(Math.max(draft[track.key], track.start))}
        >
          {abilityLevelOptionsFor(track.start, track.stored).map((level) => (
            <SelectItem key={level} value={String(level)}>
              {level === track.start
                ? t("goals.create.ability.noChange", { level })
                : level}
            </SelectItem>
          ))}
        </TargetSelect>
      ))}
    </div>
  )
}

const rankOptions = rankOrder.map((rank, index) => ({
  value: index,
  label: <RankBadge rank={rank} />,
}))
const abilityLevelOptions = range(1, maxAbilityLevel).map((level) => ({
  value: level,
  label: level,
}))

/** What the Upgrade picker offers: the materials the unit's range (a Character's rank range, else the
 * whole ladder; a Machine of War's ability ranges) needs, with how many — as in creation. */
function useUpgradeChoices(
  detail: GoalDetail,
  draft: Extract<GoalTargetDraft, { kind: "Upgrade" }>,
  upgradesById: ReadonlyMap<UpgradeId, UpgradeWithFarmLocations>,
  units: UpgradeUnits
): ReadonlyMap<UpgradeId, number> {
  return useMemo(() => {
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
}

type UpgradeUnits = {
  getCharacter: (id: never) => Character | undefined
  mowsById: ReadonlyMap<string, MowStorageModel> | undefined
}

/** The quantities and the optional range(s) are editable, and materials can be added with the creation
 * dialog's picker and removed, as long as one remains. Each quantity error shows on its own row. */
function UpgradeFields({
  detail,
  draft,
  onChange,
  portalContainer,
  upgradesById,
  ownedQuantities,
  units,
}: FieldsProps<"Upgrade"> & {
  upgradesById: ReadonlyMap<UpgradeId, UpgradeWithFarmLocations>
  ownedQuantities?: ReadonlyMap<string, number>
  units: UpgradeUnits
}) {
  const { t } = useTranslation()
  const choices = useUpgradeChoices(detail, draft, upgradesById, units)
  const available = useMemo<RarityComboboxItem<UpgradeId>[]>(() => {
    const selected = new Set(draft.targets.map((target) => target.upgradeId))
    return [...choices.entries()]
      .filter(([id]) => !selected.has(id))
      .map(([id, quantity]) => {
        const upgrade = upgradesById.get(id)
        return {
          id,
          name: upgrade?.label ?? id,
          rarity: upgrade?.rarity ?? "Common",
          meta: (
            <span className="shrink-0 text-xs text-muted-foreground">
              {t("goals.create.upgrade.required", { count: quantity })}
            </span>
          ),
        }
      })
  }, [choices, draft.targets, upgradesById, t])
  const onlyOne = draft.targets.length <= 1

  return (
    <div className="grid gap-2">
      {detail.entityType === "Mow" ? (
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
      )}
      {draft.targets.map((target) => (
        <UpgradeQuantityRow
          error={
            isValidUpgradeQuantity(target.quantity)
              ? null
              : t("goals.create.validation.upgradeQuantity")
          }
          key={target.upgradeId}
          onQuantityChange={(quantity) =>
            onChange({
              ...draft,
              targets: draft.targets.map((entry) =>
                entry.upgradeId === target.upgradeId
                  ? { ...entry, quantity }
                  : entry
              ),
            })
          }
          onRemove={() =>
            onChange({
              ...draft,
              targets: draft.targets.filter(
                (entry) => entry.upgradeId !== target.upgradeId
              ),
            })
          }
          owned={
            ownedQuantities
              ? (ownedQuantities.get(target.upgradeId) ?? 0)
              : undefined
          }
          quantity={target.quantity}
          removeDisabledReason={
            onlyOne ? t("goals.target.removeLast") : undefined
          }
          testId={`goal-target-upgrade-${target.upgradeId}`}
          upgrade={upgradesById.get(target.upgradeId as UpgradeId)}
          upgradeId={target.upgradeId as UpgradeId}
        />
      ))}
      {available.length > 0 ? (
        <RarityCombobox
          emptyText={t("goals.create.upgrade.addEmpty")}
          items={available}
          onChange={(id) =>
            onChange({
              ...draft,
              targets: [
                ...draft.targets,
                { upgradeId: id, quantity: Math.max(1, choices.get(id) ?? 1) },
              ],
            })
          }
          placeholder={t("goals.create.upgrade.add")}
          renderIcon={(id) => {
            const upgrade = upgradesById.get(id)
            return (
              <UpgradeIcon
                className="size-6 shrink-0"
                crafted={upgrade?.crafted}
                id={id}
                rarity={upgrade?.rarity}
              />
            )
          }}
        />
      ) : null}
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
  ownedQuantities,
  units,
}: {
  detail: GoalDetail
  draft: GoalTargetDraft
  onChange: (draft: GoalTargetDraft) => void
  portalContainer: HTMLElement | null
  upgradesById: ReadonlyMap<UpgradeId, UpgradeWithFarmLocations>
  /** How many of each material the account owns, shown on Upgrade rows (undefined until loaded). */
  ownedQuantities?: ReadonlyMap<string, number>
  units: UpgradeUnits
}) {
  const common = { detail, onChange, portalContainer }
  switch (draft.kind) {
    case "Rank":
      return <RankFields {...common} draft={draft} />
    case "Ascension":
      return <AscensionFields {...common} draft={draft} />
    case "Ability":
      return <AbilityFields {...common} draft={draft} />
    case "Upgrade":
      return (
        <UpgradeFields
          {...common}
          draft={draft}
          ownedQuantities={ownedQuantities}
          units={units}
          upgradesById={upgradesById}
        />
      )
  }
}

/** The goal's stored starting point, shown read-only above the editor so the owner can see what the
 * target is measured from. Ability names its tracks: Active/Passive, or Primary/Secondary for a
 * Machine of War. */
export function GoalTargetStart({ detail }: { detail: GoalDetail }) {
  const { t } = useTranslation()
  const { config } = detail
  const isMow = detail.entityType === "Mow"
  switch (detail.goalType) {
    case "Rank":
      return config.rank ? <RankBadge rank={rankAt(config.rank.start)} /> : null
    case "Ascension":
      return config.progression ? (
        <ProgressionBadge value={config.progression.start} />
      ) : null
    case "Ability":
      return config.ability ? (
        <span data-testid="goal-target-start-ability">
          {t("goals.create.ability.trackLevel", {
            track: t(
              isMow
                ? "goals.create.ability.tracks.primary"
                : "goals.create.ability.tracks.active"
            ),
            level: config.ability.activeStart,
          })}
          {" · "}
          {t("goals.create.ability.trackLevel", {
            track: t(
              isMow
                ? "goals.create.ability.tracks.secondary"
                : "goals.create.ability.tracks.passive"
            ),
            level: config.ability.passiveStart,
          })}
        </span>
      ) : null
    default:
      return null
  }
}
