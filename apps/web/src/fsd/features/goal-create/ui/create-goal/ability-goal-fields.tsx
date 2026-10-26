import { useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"

import type { Rarity } from "@workspace/game-domain"

import { ReadOnlyField, closestOverlayContent } from "@/shared/ui"
import { abilityLevelsByRarity } from "@/features/goal-planning/@x/goal-create"
import { PLAIN_VALUE } from "./plain-value"
import {
  ResourcesNeededList,
  TakenTargetItem,
  type MissingUpgrade,
} from "./goal-type-fields"
import { abilityLevelOptionsFor } from "../../model/target-edit/goal-target-edit"
import { abilityPairKey } from "../../model/goal-creation-form/first-free-target"
import type { GoalFormIssueView } from "../../model/goal-creation-form/use-goal-validation-state"
import { PreviewSection } from "../shared/preview-section"
import { FieldIssues } from "./goal-form-issues"
import { fieldIssueProps } from "./goal-form-issue-ids"

type AbilityEntityType = "Character" | "Mow"

/** i18n keys for each ability track's current/target labels, by entity — Characters have
 * Active/Passive abilities, Machines of War have Primary/Secondary. */
const abilityTrackKeys = {
  Character: {
    activeStart: "goals.create.ability.activeStart",
    activeTarget: "goals.create.ability.activeTarget",
    passiveStart: "goals.create.ability.passiveStart",
    passiveTarget: "goals.create.ability.passiveTarget",
  },
  Mow: {
    activeStart: "goals.create.ability.primaryStart",
    activeTarget: "goals.create.ability.primaryTarget",
    passiveStart: "goals.create.ability.secondaryStart",
    passiveTarget: "goals.create.ability.secondaryTarget",
  },
} as const

/** One track's target levels (`abilityLevelOptionsFor`: the current level, meaning "leave this track
 * where it is", then every level above it) grouped by the rarity tier whose cap first permits each level,
 * so the dropdown keeps a tier heading over each block. Levels above the unit's current rarity cap stay
 * selectable (an above-cap target auto-suggests an Ascension prerequisite — see
 * use-goal-prerequisites.ts). */
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

/** One ability-track target dropdown — its own trigger ref/container so the two tracks' menus
 * portal into the sheet independently. */
export function AbilityTargetSelect({
  label,
  testId,
  currentLevel,
  value,
  onValueChange,
  isTaken,
  triggerProps,
}: {
  label: string
  testId: string
  currentLevel: number
  value: number
  onValueChange: (value: number) => void
  /** Whether choosing `level` would give a target an in-flight Ability goal already holds. */
  isTaken?: (level: number) => boolean
  triggerProps?: ReturnType<typeof fieldIssueProps>
}) {
  const { t } = useTranslation("progression")
  const { t: tGoals } = useTranslation()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [container, setContainer] = useState<HTMLElement>()
  const groups = abilityTargetGroups(currentLevel)

  return (
    <div className="grid gap-1.5">
      <label className="text-xs text-muted-foreground">{label}</label>
      <Select
        onOpenChange={(open) => {
          if (open) {
            setContainer(closestOverlayContent(triggerRef.current))
          }
        }}
        onValueChange={(next) => onValueChange(Number(next))}
        value={String(value)}
      >
        <SelectTrigger
          className="w-full"
          data-testid={testId}
          ref={triggerRef}
          {...triggerProps}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent container={container}>
          {groups.map(({ rarity, levels }) => (
            <SelectGroup key={rarity}>
              <SelectLabel>
                {t(`rarities.${rarity}`, { defaultValue: rarity })}
              </SelectLabel>
              {levels.map((level) => (
                <TakenTargetItem
                  key={level}
                  taken={level !== value && !!isTaken?.(level)}
                  value={String(level)}
                >
                  {level === currentLevel
                    ? tGoals("goals.create.ability.noChange", { level })
                    : level}
                </TakenTargetItem>
              ))}
            </SelectGroup>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

/**
 * The Ability goal card's fields — read-only current levels plus an independent Target selector
 * for each ability track (see `useAbilityFields`). Track labels follow the entity type:
 * Active/Passive for a Character, Primary/Secondary for a Machine of War. MoW ability cost is
 * previewed here; Character ability cost isn't supported yet (`costingSupported`).
 */
export function AbilityGoalFields({
  entityType,
  activeStart,
  passiveStart,
  activeTarget,
  passiveTarget,
  onActiveTargetChange,
  onPassiveTargetChange,
  missingUpgrades,
  costingSupported,
  taken,
  issues = [],
  previewLoading = false,
}: {
  entityType: AbilityEntityType
  activeStart: number
  passiveStart: number
  activeTarget: number
  passiveTarget: number
  onActiveTargetChange: (value: number) => void
  onPassiveTargetChange: (value: number) => void
  missingUpgrades: MissingUpgrade[]
  costingSupported: boolean
  /** Target keys in-flight Ability goals of this unit hold. */
  taken?: ReadonlySet<string>
  issues?: readonly GoalFormIssueView[]
  previewLoading?: boolean
}) {
  const { t: tGoals } = useTranslation()
  const keys = abilityTrackKeys[entityType]
  const start = { active: activeStart, passive: passiveStart }
  const takenPair = (active: number, passive: number) =>
    !!taken?.has(abilityPairKey(start, { active, passive }))

  return (
    <div className="grid grid-cols-2 gap-3">
      <ReadOnlyField className={PLAIN_VALUE} label={tGoals(keys.activeStart)}>
        {activeStart}
      </ReadOnlyField>
      <ReadOnlyField className={PLAIN_VALUE} label={tGoals(keys.passiveStart)}>
        {passiveStart}
      </ReadOnlyField>
      <AbilityTargetSelect
        label={tGoals(keys.activeTarget)}
        testId="create-goal-ability-active-target"
        currentLevel={activeStart}
        value={activeTarget}
        onValueChange={onActiveTargetChange}
        isTaken={(level) =>
          takenPair(level, Math.max(passiveTarget, passiveStart))
        }
        triggerProps={fieldIssueProps(issues, "Ability", "target")}
      />
      <AbilityTargetSelect
        label={tGoals(keys.passiveTarget)}
        testId="create-goal-ability-passive-target"
        currentLevel={passiveStart}
        value={passiveTarget}
        onValueChange={onPassiveTargetChange}
        isTaken={(level) =>
          takenPair(Math.max(activeTarget, activeStart), level)
        }
      />
      <div className="col-span-2">
        <FieldIssues field="target" issues={issues} kind="Ability" />
      </div>
      {costingSupported ? (
        <PreviewSection
          className="col-span-2 grid gap-1 rounded-2xl border p-3 text-sm"
          emptyText={tGoals("goals.create.ability.noResources")}
          state={
            previewLoading
              ? "loading"
              : missingUpgrades.length > 0
                ? "content"
                : "empty"
          }
          testId="create-goal-ability-preview"
        >
          <ResourcesNeededList missingUpgrades={missingUpgrades} />
        </PreviewSection>
      ) : (
        <p className="col-span-2 text-xs text-muted-foreground">
          {tGoals("goals.create.characterAbilityCostUnsupported")}
        </p>
      )}
    </div>
  )
}
