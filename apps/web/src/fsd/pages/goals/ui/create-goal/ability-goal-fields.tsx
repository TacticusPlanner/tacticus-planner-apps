import { useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"

import type { Rarity } from "@workspace/game-domain"

import { ReadOnlyField } from "@/shared/ui"
import { abilityLevelsByRarity } from "../../model/goal-creation-form/goal-validation"
import { ResourcesNeededList, type MissingUpgrade } from ".//goal-type-fields"

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

/** Every selectable target level for one ability track — the full `currentLevel .. max` range,
 * grouped by the rarity tier whose cap first permits each level so the dropdown keeps a tier
 * heading over each block. The current level itself is selectable and means "leave this track
 * where it is"; levels below it are never offered. Levels above the unit's current rarity cap
 * stay selectable (an above-cap target auto-suggests Ascension/Level prerequisites — see
 * use-goal-prerequisites.ts). */
function abilityTargetGroups(
  currentLevel: number
): { rarity: Rarity; levels: number[] }[] {
  const floor = Math.max(currentLevel, 1)
  const groups: { rarity: Rarity; levels: number[] }[] = []
  let tierStart = 1
  for (const { rarity, level: cap } of abilityLevelsByRarity) {
    const levels: number[] = []
    for (let level = Math.max(tierStart, floor); level <= cap; level++) {
      levels.push(level)
    }
    if (levels.length > 0) groups.push({ rarity, levels })
    tierStart = cap + 1
  }
  return groups
}

/** One ability-track target dropdown — its own trigger ref/container so the two tracks' menus
 * portal into the sheet independently. */
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
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [container, setContainer] = useState<HTMLElement>()
  const groups = abilityTargetGroups(currentLevel)

  return (
    <div className="grid gap-1.5">
      <label className="text-xs text-muted-foreground">{label}</label>
      <Select
        onOpenChange={(open) => {
          if (open) {
            setContainer(
              (triggerRef.current?.closest(
                '[data-slot="sheet-content"]'
              ) as HTMLElement | null) ?? undefined
            )
          }
        }}
        onValueChange={(next) => onValueChange(Number(next))}
        value={String(value)}
      >
        <SelectTrigger className="w-full" data-testid={testId} ref={triggerRef}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent container={container}>
          {groups.map(({ rarity, levels }) => (
            <SelectGroup key={rarity}>
              <SelectLabel>
                {t(`rarities.${rarity}`, { defaultValue: rarity })}
              </SelectLabel>
              {levels.map((level) => (
                <SelectItem key={level} value={String(level)}>
                  {level}
                </SelectItem>
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
}) {
  const { t: tGoals } = useTranslation()
  const keys = abilityTrackKeys[entityType]

  return (
    <div className="grid grid-cols-2 gap-3">
      <ReadOnlyField label={tGoals(keys.activeStart)}>
        {activeStart}
      </ReadOnlyField>
      <ReadOnlyField label={tGoals(keys.passiveStart)}>
        {passiveStart}
      </ReadOnlyField>
      <AbilityTargetSelect
        label={tGoals(keys.activeTarget)}
        testId="create-goal-ability-active-target"
        currentLevel={activeStart}
        value={activeTarget}
        onValueChange={onActiveTargetChange}
      />
      <AbilityTargetSelect
        label={tGoals(keys.passiveTarget)}
        testId="create-goal-ability-passive-target"
        currentLevel={passiveStart}
        value={passiveTarget}
        onValueChange={onPassiveTargetChange}
      />
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
