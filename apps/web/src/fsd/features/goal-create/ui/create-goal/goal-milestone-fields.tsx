import { useRef, useState, type ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { Plus, X } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
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
  progressionIndex,
  progressionOrder,
  rankIndex,
  rankOrder,
  type Progression,
  type Rank,
  type Rarity,
} from "@workspace/game-domain"

import { closestOverlayContent, ProgressionBadge, RankBadge } from "@/shared/ui"
import type { AbilityMilestone } from "../../model/goal-creation-form/goal-milestones"
import { abilityLevelsByRarity } from "@/features/goal-planning/@x/goal-create"
import { abilityLevelOptionsFor } from "../../model/target-edit/goal-target-edit"

type MilestoneListProps<T> = {
  kind: "rank" | "ascension" | "ability"
  milestones: readonly T[]
  /** The index of the milestone that isn't above the one before it, if any. */
  invalidIndex: number | null
  canAdd: boolean
  onAdd: () => void
  onRemove: (index: number) => void
  renderTarget: (milestone: T, index: number) => ReactNode
}

/**
 * The added milestones of one ladder (goal-target-milestones), stacked under the card's own target —
 * each its own goal after the one before it — plus "Add milestone". The same list renders in the
 * desktop dialog and the mobile sheet.
 */
function MilestoneList<T>({
  kind,
  milestones,
  invalidIndex,
  canAdd,
  onAdd,
  onRemove,
  renderTarget,
}: MilestoneListProps<T>) {
  const { t } = useTranslation()

  return (
    <div
      className="col-span-full grid gap-2"
      data-testid={`create-goal-${kind}-milestones`}
    >
      {milestones.map((milestone, index) => {
        // The card's own target is milestone 1.
        const number = index + 2
        return (
          <div
            className="grid gap-1.5 rounded-xl border p-2"
            data-testid={`create-goal-${kind}-milestone-${index}`}
            key={index}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                {t("goals.create.milestones.label", { number })}
              </span>
              <Button
                aria-label={t("goals.create.milestones.remove", { number })}
                onClick={() => onRemove(index)}
                size="icon"
                type="button"
                variant="ghost"
              >
                <X />
              </Button>
            </div>
            {renderTarget(milestone, index)}
            {invalidIndex === index ? (
              <p className="text-xs text-destructive" role="alert">
                {t("goals.create.milestones.notAbove")}
              </p>
            ) : null}
          </div>
        )
      })}
      {canAdd ? (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            data-testid={`create-goal-${kind}-add-milestone`}
            onClick={onAdd}
            size="sm"
            type="button"
            variant="outline"
          >
            <Plus />
            {t("goals.create.milestones.add")}
          </Button>
          {milestones.length > 0 ? (
            <span className="text-xs text-muted-foreground">
              {t("goals.create.milestones.hint")}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

/** One milestone's end-target dropdown over `options`, portaled into the sheet like the card's own. */
function MilestoneSelect<T extends string>({
  testId,
  label,
  value,
  options,
  onChange,
  renderOption,
}: {
  testId: string
  label: string
  value: T
  options: readonly T[]
  onChange: (value: T) => void
  renderOption: (value: T) => ReactNode
}) {
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [container, setContainer] = useState<HTMLElement>()

  return (
    <Select
      onOpenChange={(open) => {
        if (open) setContainer(closestOverlayContent(triggerRef.current))
      }}
      onValueChange={(next) => onChange(next as T)}
      value={value}
    >
      <SelectTrigger
        aria-label={label}
        className="w-full"
        data-testid={testId}
        ref={triggerRef}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent container={container}>
        {options.map((option) => (
          <SelectItem key={option} value={option}>
            {renderOption(option)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

type Ladder<T> = {
  milestones: readonly T[]
  invalidIndex: number | null
  canAdd: boolean
  onAdd: () => void
  onRemove: (index: number) => void
  onChange: (index: number, value: T) => void
}

/** Added Rank milestones: whole ranks above the unit's current rank. */
export function RankMilestoneFields({
  rankStart,
  ...ladder
}: Ladder<Rank> & { rankStart: Rank }) {
  const { t } = useTranslation()
  const options = rankOrder.filter(
    (rank) => rankIndex(rank) > rankIndex(rankStart)
  )
  return (
    <MilestoneList
      {...ladder}
      kind="rank"
      renderTarget={(rank, index) => (
        <MilestoneSelect
          label={t("goals.create.rank.target")}
          onChange={(value) => ladder.onChange(index, value)}
          options={options}
          renderOption={(option) => <RankBadge rank={option} />}
          testId={`create-goal-rank-milestone-${index}-end`}
          value={rank}
        />
      )}
    />
  )
}

/** Added Ascension milestones: progression steps above the unit's current one. */
export function AscensionMilestoneFields({
  progressionStart,
  ...ladder
}: Ladder<Progression> & { progressionStart: Progression }) {
  const { t } = useTranslation()
  const options = progressionOrder.filter(
    (step) => progressionIndex(step) > progressionIndex(progressionStart)
  )
  return (
    <MilestoneList
      {...ladder}
      kind="ascension"
      renderTarget={(progression, index) => (
        <MilestoneSelect
          label={t("goals.create.ascension.end")}
          onChange={(value) => ladder.onChange(index, value)}
          options={options}
          renderOption={(option) => <ProgressionBadge value={option} />}
          testId={`create-goal-ascension-milestone-${index}-end`}
          value={progression}
        />
      )}
    />
  )
}

/** Added Ability milestones: a target level for each track, from the unit's current levels. */
export function AbilityMilestoneFields({
  entityType,
  activeStart,
  passiveStart,
  ...ladder
}: Ladder<AbilityMilestone> & {
  entityType: "Character" | "Mow"
  activeStart: number
  passiveStart: number
}) {
  const { t } = useTranslation()
  const isMow = entityType === "Mow"
  return (
    <MilestoneList
      {...ladder}
      kind="ability"
      renderTarget={(ability, index) => (
        <div className="grid grid-cols-2 gap-3">
          <AbilityTargetSelect
            currentLevel={activeStart}
            label={t(
              isMow
                ? "goals.create.ability.primaryTarget"
                : "goals.create.ability.activeTarget"
            )}
            onValueChange={(activeEnd) =>
              ladder.onChange(index, { ...ability, activeEnd })
            }
            testId={`create-goal-ability-milestone-${index}-active`}
            value={ability.activeEnd}
          />
          <AbilityTargetSelect
            currentLevel={passiveStart}
            label={t(
              isMow
                ? "goals.create.ability.secondaryTarget"
                : "goals.create.ability.passiveTarget"
            )}
            onValueChange={(passiveEnd) =>
              ladder.onChange(index, { ...ability, passiveEnd })
            }
            testId={`create-goal-ability-milestone-${index}-passive`}
            value={ability.passiveEnd}
          />
        </div>
      )}
    />
  )
}

/** One track's milestone levels (`abilityLevelOptionsFor`) grouped by the rarity tier whose cap first
 * permits each level, under a tier heading per block. */
function abilityTargetGroups(
  currentLevel: number
): { rarity: Rarity; levels: number[] }[] {
  const levels = abilityLevelOptionsFor(currentLevel)
  const groups: { rarity: Rarity; levels: number[] }[] = []
  let tierStart = 1
  for (const { rarity, level: cap } of abilityLevelsByRarity) {
    const inTier = levels.filter((level) => level >= tierStart && level <= cap)
    if (inTier.length > 0) groups.push({ rarity, levels: inTier })
    tierStart = cap + 1
  }
  return groups
}

/** One ability milestone track's level dropdown, portalled into the sheet. */
function AbilityTargetSelect({
  label,
  testId,
  currentLevel,
  value,
  onValueChange,
}: {
  label: string
  testId: string
  currentLevel: number
  value: number
  onValueChange: (value: number) => void
}) {
  const { t } = useTranslation("progression")
  const { t: tGoals } = useTranslation()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [container, setContainer] = useState<HTMLElement>()

  return (
    <div className="grid gap-1.5">
      <label className="text-xs text-muted-foreground">{label}</label>
      <Select
        onOpenChange={(open) => {
          if (open) setContainer(closestOverlayContent(triggerRef.current))
        }}
        onValueChange={(next) => onValueChange(Number(next))}
        value={String(value)}
      >
        <SelectTrigger className="w-full" data-testid={testId} ref={triggerRef}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent container={container}>
          {abilityTargetGroups(currentLevel).map(({ rarity, levels }) => (
            <SelectGroup key={rarity}>
              <SelectLabel>
                {t(`rarities.${rarity}`, { defaultValue: rarity })}
              </SelectLabel>
              {levels.map((level) => (
                <SelectItem key={level} value={String(level)}>
                  {level === currentLevel
                    ? tGoals("goals.create.ability.noChange", { level })
                    : level}
                </SelectItem>
              ))}
            </SelectGroup>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
