import type { Progression, Rank, UpgradeId } from "@workspace/game-domain"
import { rankIndex } from "@workspace/game-domain"
import type { MowStorageModel } from "@workspace/game-catalog"

import {
  aggregateBaseUpgradeAmounts,
  aggregateBaseUpgrades,
  aggregateOwnedBaseUpgrades,
  appliedUpgradeIds,
  rankUpUpgradeIds,
  type Character,
  type UpgradeWithFarmLocations,
} from "@/features/rank-lookup/@x/goal-create"
import type {
  AcquisitionSource,
  CombinedGoalSpec,
  FarmingStrategy,
  GoalKind,
  UpgradeTarget,
} from "@/entities/goal"
import { mowAbilityUpgradeIds } from "@/features/goal-farming/@x/goal-create"
import { acquisitionSourcesFromPlan } from "./acquisition-plan"
import type { GoalAcquisitionPlan } from "./acquisition-plan"
import {
  abilityProgressionNeed,
  EMPTY_MILESTONES,
  lowestCoveringAscension,
  rankProgressionNeed,
  type AbilityMilestone,
  type GoalMilestones,
} from "./goal-milestones"

// Pure helpers behind the combined-creation composer (plan §6/§7), kept out of
// `use-create-goal-form.ts` because they are pure: all plain
// functions (no hooks), so they're directly unit-testable without rendering anything.

// Deliberately not reusing goal-type-fields.tsx's own `MissingUpgrade` type name (id: string) to
// avoid two same-named-but-different exported types — this one's `id` stays branded `UpgradeId`,
// which is structurally assignable to that string-keyed prop type at the call site.
export type MissingUpgradeEntry = {
  id: UpgradeId
  label: string
  missing: number
  required: number
  inventoryContribution: number
}

/** Resource-requirement preview (Rank goals only, plan §16 phase 2 scope decision — Ascension/
 * Ability/Unlock have no analogous "required vs owned" calc reused anywhere yet): the base
 * upgrades still needed for `rankStart` -> `rankEnd`, net of what's already applied/owned. `[]`
 * when Rank isn't enabled or the range is empty/invalid. */
export function computeMissingUpgrades(params: {
  rankEnabled: boolean
  character: Character | undefined
  rankStart: Rank
  rankEnd: Rank
  rankEndPointFive: boolean
  rankEndAppliedUpgrades?: number
  rankEndTopRowCount?: number
  playerCharacter:
    { rank: Rank; appliedUpgradeSlots: readonly number[] } | undefined
  inventoryUpgrades:
    readonly { upgradeId: UpgradeId; amount: number }[] | undefined
  upgradesById: ReadonlyMap<UpgradeId, UpgradeWithFarmLocations>
  includeCovered?: boolean
}): MissingUpgradeEntry[] {
  const {
    rankEnabled,
    character,
    rankStart,
    rankEnd,
    rankEndPointFive,
    playerCharacter,
    upgradesById,
  } = params
  const sameRankWithoutPartial =
    rankIndex(rankStart) === rankIndex(rankEnd) &&
    !rankEndPointFive &&
    (params.rankEndAppliedUpgrades ?? 0) === 0 &&
    (params.rankEndTopRowCount ?? 0) === 0
  if (
    !rankEnabled ||
    !character ||
    rankIndex(rankStart) > rankIndex(rankEnd) ||
    sameRankWithoutPartial
  ) {
    return []
  }

  const requiredIds = rankUpUpgradeIds(
    character,
    rankStart,
    rankEnd,
    rankEndPointFive,
    params.rankEndAppliedUpgrades,
    params.rankEndTopRowCount
  )
  const required = aggregateBaseUpgrades(requiredIds, upgradesById)

  const appliedIds = playerCharacter
    ? appliedUpgradeIds(
        character,
        playerCharacter.rank,
        playerCharacter.appliedUpgradeSlots
      )
    : []
  const owned = aggregateOwnedBaseUpgrades(
    appliedIds,
    (params.inventoryUpgrades ?? []).map((entry) => ({
      id: entry.upgradeId,
      amount: entry.amount,
    })),
    upgradesById
  )
  const ownedById = new Map(owned.map((entry) => [entry.id, entry.count]))

  return required
    .map((need) => {
      const contribution = Math.min(need.count, ownedById.get(need.id) ?? 0)
      return {
        id: need.id,
        label: upgradesById.get(need.id)?.label ?? need.id,
        missing: need.count - contribution,
        required: need.count,
        inventoryContribution: contribution,
      }
    })
    .filter((entry) => params.includeCovered || entry.missing > 0)
}

/** An Upgrade goal only ever targets base upgrades — a crafted upgrade isn't something you farm
 * directly. So the ids in scope are decomposed through their recipes (recursively, multiplying
 * ingredient counts) down to base materials, deduplicated with their quantities summed: what the
 * picker offers is what the player actually farms. Dropping crafted ids instead would leave the
 * picker empty for most of the ladder — every rank step at Gold2 and above needs only crafted
 * upgrades, so there'd be nothing left to select and the goal could never be submitted. */
function decomposeToBaseQuantities(
  ids: UpgradeId[],
  upgradesById: ReadonlyMap<UpgradeId, UpgradeWithFarmLocations>
): Map<UpgradeId, number> {
  return new Map(
    aggregateBaseUpgrades(ids, upgradesById).map((need) => [
      need.id,
      need.count,
    ])
  )
}

/** An Upgrade goal's selectable upgrades, scoped to `rankStart` -> `rankEnd` (plan: the rank-range
 * picker on the Upgrade card) — each key is a selectable base upgrade id, each value the number
 * actually required across that specific range (what the picker prefills as the target quantity).
 * Empty for an empty/invalid range. */
export function characterRelevantUpgradeQuantities(
  character: Character,
  rankStart: Rank,
  rankEnd: Rank,
  upgradesById: ReadonlyMap<UpgradeId, UpgradeWithFarmLocations>
): Map<UpgradeId, number> {
  return decomposeToBaseQuantities(
    rankUpUpgradeIds(character, rankStart, rankEnd, false),
    upgradesById
  )
}

/** An Upgrade goal's progression range(s): a Character's rank range, or a Mow's per-track ability level
 * ranges (each track optional). */
export type UpgradeRanges = Partial<
  Pick<UpgradeTarget, "rankRange" | "activeRange" | "passiveRange">
>

/** Same shape as `characterRelevantUpgradeQuantities`, but for a Mow: the transitions of each ability
 * track that has a range set, or the whole ladder of both tracks when neither is. */
export function mowRelevantUpgradeQuantities(
  mow: MowStorageModel,
  upgradesById: ReadonlyMap<UpgradeId, UpgradeWithFarmLocations>,
  ranges: Pick<UpgradeRanges, "activeRange" | "passiveRange"> = {}
): Map<UpgradeId, number> {
  const { activeRange, passiveRange } = ranges
  if (!activeRange && !passiveRange) {
    return decomposeToBaseQuantities(
      [
        ...mow.primaryAbility.recipes.flat(),
        ...mow.secondaryAbility.recipes.flat(),
      ],
      upgradesById
    )
  }
  return decomposeToBaseQuantities(
    [
      ...(activeRange
        ? mowAbilityUpgradeIds(
            mow.primaryAbility.recipes,
            activeRange.start,
            activeRange.end
          )
        : []),
      ...(passiveRange
        ? mowAbilityUpgradeIds(
            mow.secondaryAbility.recipes,
            passiveRange.start,
            passiveRange.end
          )
        : []),
    ],
    upgradesById
  )
}

/** Resource-requirement preview for an Upgrade goal (plan: re-introduced V1 upgrade-stockpile
 * goal, phase 9+) — reduces every target to base upgrades via the same `aggregateBaseUpgrades`/
 * `aggregateOwnedBaseUpgrades` primitives Rank goals use (see `computeMissingUpgrades` above),
 * netted against inventory only. Unlike a Rank goal there's no "applied to a rank" contribution to
 * net against — an Upgrade goal isn't attached to any specific rank transition, just a standalone
 * upgrade stockpile target. */
export function computeUpgradeGoalNeed(params: {
  upgradeEnabled: boolean
  targets: { upgradeId: UpgradeId; quantity: number }[]
  inventoryUpgrades:
    readonly { upgradeId: UpgradeId; amount: number }[] | undefined
  upgradesById: ReadonlyMap<UpgradeId, UpgradeWithFarmLocations>
  includeCovered?: boolean
}): MissingUpgradeEntry[] {
  const { upgradeEnabled, targets, upgradesById } = params
  if (!upgradeEnabled || targets.length === 0) return []

  const required = aggregateBaseUpgradeAmounts(
    targets.map((target) => ({
      id: target.upgradeId,
      amount: target.quantity,
    })),
    upgradesById
  )
  const owned = aggregateOwnedBaseUpgrades(
    [],
    (params.inventoryUpgrades ?? []).map((entry) => ({
      id: entry.upgradeId,
      amount: entry.amount,
    })),
    upgradesById
  )
  const ownedById = new Map(owned.map((entry) => [entry.id, entry.count]))

  return required
    .map((need) => {
      const contribution = Math.min(need.count, ownedById.get(need.id) ?? 0)
      return {
        id: need.id,
        label: upgradesById.get(need.id)?.label ?? need.id,
        missing: need.count - contribution,
        required: need.count,
        inventoryContribution: contribution,
      }
    })
    .filter((entry) => params.includeCovered || entry.missing > 0)
}

export type ReviewItem = {
  goalType: GoalKind
  autoSuggested: boolean
  /** How many goals of this type the ladder creates (1 without added milestones). */
  count: number
}

/** "What will be created" review list, flagging entries the user didn't explicitly toggle themselves
 * (auto-included via `useGoalPrerequisites`'s suggestions), with each type's milestone count. */
export function buildReviewItems(
  enabledTypes: ReadonlySet<GoalKind>,
  includesUnlock: boolean,
  includesAscension: boolean,
  counts: Partial<Record<GoalKind, number>> = {}
): ReviewItem[] {
  const items: ReviewItem[] = []
  const countOf = (kind: GoalKind) => counts[kind] ?? 1
  if (includesUnlock) {
    items.push({
      goalType: "Unlock",
      autoSuggested: !enabledTypes.has("Unlock"),
      count: 1,
    })
  }
  if (includesAscension) {
    items.push({
      goalType: "Ascension",
      autoSuggested: !enabledTypes.has("Ascension"),
      count: countOf("Ascension"),
    })
  }
  for (const kind of ["Rank", "Ability", "Upgrade"] as const) {
    if (enabledTypes.has(kind)) {
      items.push({ goalType: kind, autoSuggested: false, count: countOf(kind) })
    }
  }
  return items
}

/**
 * The ordered spec list to submit: Unlock -> Ascension milestones -> Rank milestones -> Ability
 * milestones -> Upgrade. Each milestone of a ladder (goal-target-milestones) depends on the one before
 * it, and every stored start stays at the unit's current state. A Rank/Ability milestone whose target
 * needs a higher progression than `baseProgression` depends on the lowest Ascension that reaches it: an
 * in-flight one from `existingAscensions` (sent as `dependsOnGoalIds`), else one in this request. An
 * explicitly toggled Ascension ladder comes right after Unlock and also gates milestones that need no
 * ascension (by its first step); the auto-suggested one (`ascensionSuggestion`, used only when
 * Ascension itself wasn't toggled) is placed just before the first milestone that needs it, and only
 * milestones that need it depend on it. The character level a target needs is never a spec — the goal
 * itself carries it (integrate-level-progression-into-rank-goals).
 */
export function buildCombinedGoalSpecs(params: {
  enabledTypes: ReadonlySet<GoalKind>
  includesUnlock: boolean
  includesAscension: boolean
  ascensionSuggestion: { start: Progression; end: Progression } | null
  rankStart: Rank
  rankEnd: Rank
  rankEndPointFive: boolean
  rankEndAppliedUpgrades: number
  progressionStart: Progression
  progressionEnd: Progression
  abilityActiveStart: number
  abilityActiveEnd: number
  abilityPassiveStart: number
  abilityPassiveEnd: number
  farmingStrategy: FarmingStrategy
  upgradeTargets: { upgradeId: UpgradeId; quantity: number }[]
  /** The progression range(s) the Upgrade goal is created against; absent groups mean no range. */
  upgradeRanges?: UpgradeRanges
  /** The acquisition-source picker's selection (plan: Campaigns/Onslaught/Shops picker,
   * tacticus-planner-apps#103) — the same plan feeds both Unlock and Ascension specs; each is
   * translated to the wire `acquisitionSources` set independently since they're separate goals. */
  plan: GoalAcquisitionPlan
  /** The Mythic-material shop-offer choice (add-mythic-material-shop-sources), applied to the Rank,
   *  Upgrade, and Machine-of-War Ability specs. `null`/absent keeps the all-available default. */
  mythicMaterialSources?: AcquisitionSource[] | null
  isMow?: boolean
  /** Extra Rank/Ascension/Ability end targets after the cards' own fields ("Add milestone"). */
  milestones?: GoalMilestones
  /** The progression the unit reasons from (current, else where its Unlock lands); defaults to
   *  `progressionStart`. */
  baseProgression?: Progression
  /** The unit's in-flight Ascension goals a milestone can depend on instead of a new one. */
  existingAscensions?: readonly { goalId: string; end: Progression }[]
}): CombinedGoalSpec[] {
  const { enabledTypes, includesUnlock, includesAscension } = params
  const milestones = params.milestones ?? EMPTY_MILESTONES
  const base = params.baseProgression ?? params.progressionStart
  const existingAscensions = params.existingAscensions ?? []
  const specs: CombinedGoalSpec[] = []
  let unlockIndex: number | null = null
  const ascensions: { index: number; end: Progression }[] = []
  const mythicMaterialSources = params.mythicMaterialSources
    ? { acquisitionSources: params.mythicMaterialSources }
    : {}
  const withUnlock = (indexes: (number | null)[]) =>
    [unlockIndex, ...indexes]
      .filter((index): index is number => index !== null)
      .sort((a, b) => a - b)

  if (includesUnlock) {
    specs.push({
      goalType: "Unlock",
      config: {
        acquisitionSources: acquisitionSourcesFromPlan(params.plan, {
          isUnlock: true,
        }),
      },
      dependsOnIndex: [],
    })
    unlockIndex = specs.length - 1
  }

  const pushAscension = (range: { start: Progression; end: Progression }) => {
    const previous = ascensions.at(-1)?.index ?? null
    specs.push({
      goalType: "Ascension",
      config: {
        progression: range,
        acquisitionSources: acquisitionSourcesFromPlan(params.plan),
      },
      dependsOnIndex: withUnlock([previous]),
    })
    ascensions.push({ index: specs.length - 1, end: range.end })
  }

  const explicitAscension = enabledTypes.has("Ascension")
  if (includesAscension && explicitAscension) {
    for (const end of [params.progressionEnd, ...milestones.ascension]) {
      pushAscension({ start: params.progressionStart, end })
    }
  }
  let pendingSuggestion =
    includesAscension && !explicitAscension ? params.ascensionSuggestion : null

  /** The Ascension dependency of a Rank/Ability milestone needing `need` (null: none needed). */
  const ascensionDependency = (
    need: Progression | null
  ): { index: number | null; goalIds: string[] } => {
    if (need === null) {
      return {
        index: explicitAscension ? (ascensions[0]?.index ?? null) : null,
        goalIds: [],
      }
    }
    const existing = lowestCoveringAscension(existingAscensions, need)
    if (existing) return { index: null, goalIds: [existing.goalId] }
    if (pendingSuggestion) {
      pushAscension(pendingSuggestion)
      pendingSuggestion = null
    }
    const covering =
      lowestCoveringAscension(ascensions, need) ?? ascensions.at(-1)
    return { index: covering?.index ?? null, goalIds: [] }
  }
  const dependsOnGoalIds = (goalIds: string[]) =>
    goalIds.length > 0 ? { dependsOnGoalIds: goalIds } : {}

  if (enabledTypes.has("Rank")) {
    let previous: number | null = null
    for (const [position, end] of [
      params.rankEnd,
      ...milestones.rank,
    ].entries()) {
      // Only the card's own target carries an Additional target; added milestones are whole ranks.
      const first = position === 0
      const dependency = ascensionDependency(rankProgressionNeed(end, base))
      specs.push({
        goalType: "Rank",
        config: {
          farmingStrategy: params.farmingStrategy,
          ...mythicMaterialSources,
          rank: {
            start: rankIndex(params.rankStart),
            // The "From" field is always a clean rank boundary (read-only, synced from the unit's
            // actual current rank) — only the target end carries an Additional target.
            startPointFive: false,
            startAppliedUpgrades: 0,
            end: rankIndex(end),
            endPointFive: first ? params.rankEndPointFive : false,
            endAppliedUpgrades: first ? params.rankEndAppliedUpgrades : 0,
          },
        },
        dependsOnIndex: withUnlock([dependency.index, previous]),
        ...dependsOnGoalIds(dependency.goalIds),
      })
      previous = specs.length - 1
    }
  }

  if (enabledTypes.has("Ability")) {
    let previous: number | null = null
    const ladder: AbilityMilestone[] = [
      {
        activeEnd: params.abilityActiveEnd,
        passiveEnd: params.abilityPassiveEnd,
      },
      ...milestones.ability,
    ]
    for (const ability of ladder) {
      // Ascension included here (same as Rank above): an above-cap ability target is one of the two
      // things that triggers the auto-suggested Ascension (use-goal-prerequisites.ts), so the Ability
      // goal must declare that dependency, not merely follow it in submit order — the API only lifts
      // an ability target's cap from an Ascension the goal depends on
      // (fix-goal-ability-cap-effective-progression; rewrite-v1-goal-import).
      const dependency = ascensionDependency(
        abilityProgressionNeed(ability, base)
      )
      specs.push({
        goalType: "Ability",
        config: {
          farmingStrategy: params.farmingStrategy,
          ...(params.isMow ? mythicMaterialSources : {}),
          ability: {
            activeStart: params.abilityActiveStart,
            activeEnd: Math.max(params.abilityActiveStart, ability.activeEnd),
            passiveStart: params.abilityPassiveStart,
            passiveEnd: Math.max(
              params.abilityPassiveStart,
              ability.passiveEnd
            ),
          },
        },
        dependsOnIndex: withUnlock([dependency.index, previous]),
        ...dependsOnGoalIds(dependency.goalIds),
      })
      previous = specs.length - 1
    }
  }

  // A suggestion nothing above ended up needing still goes in, as the user left it included.
  if (pendingSuggestion) pushAscension(pendingSuggestion)

  if (enabledTypes.has("Upgrade") && params.upgradeTargets.length > 0) {
    specs.push({
      goalType: "Upgrade",
      config: {
        ...mythicMaterialSources,
        upgrade: { targets: params.upgradeTargets, ...params.upgradeRanges },
      },
      dependsOnIndex: unlockIndex === null ? [] : [unlockIndex],
    })
  }

  return specs
}
