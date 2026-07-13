import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { campaignDescriptor, campaignIcon } from "@workspace/game-catalog"
import type { CharacterStorageModel } from "@workspace/game-catalog"
import {
  rankIndex,
  rarityRank,
  statAtRank,
  type BattleId,
  type CampaignId,
  type Rank,
  type UpgradeId,
} from "@workspace/game-domain"
import type { PlayerDataChunkDto } from "@workspace/player-data"

import {
  aggregateBaseUpgrades,
  aggregateOwnedBaseUpgrades,
  appliedUpgradeIds,
  groupUpgradesByRank,
  rankUpUpgradeIds,
  type Character,
  type RecipeIngredient,
  type UpgradeWithFarmLocations,
} from "@/features/rank-lookup"
import { useCampaignDisplay, type Battle } from "@/shared/lib"

import { computeCampaignInsights } from "../campaign-insights"
import type { LookupSelection } from "./use-lookup-selection"
import type {
  BaseUpgradeViewModel,
  RankGroupViewModel,
  RecipeViewModel,
  UpgradeViewModel,
} from "../character-lookup-results.view-model"
import type { UnitProfileViewModel } from "../unit-profile.view-model"

type PlayerCharacter = PlayerDataChunkDto<"characters">[number]

/**
 * Everything Character Lookup's results derive from the current character + rank/progression
 * selection: the per-rank upgrade groups, the aggregated base-upgrade totals (net of what's already
 * owned, when that toggle is on), the campaign farming insights, and the unit's stat profile. Split
 * out of the page component since it's a large, self-contained slice of business logic — the page
 * itself only owns catalog reads, player-data reads, and the URL-synced selection.
 */
export function useCharacterLookupCalc({
  character,
  characterForCalc,
  applied,
  upgradesById,
  battlesById,
  releaseTypeByGroupId,
  effectiveIncludeOwned,
  playerCharacter,
  inventoryUpgrades,
}: {
  character: CharacterStorageModel | undefined
  characterForCalc: Character | undefined
  applied: LookupSelection
  upgradesById: ReadonlyMap<UpgradeId, UpgradeWithFarmLocations>
  battlesById: ReadonlyMap<BattleId, Battle>
  releaseTypeByGroupId: ReadonlyMap<CampaignId, string>
  effectiveIncludeOwned: boolean
  playerCharacter: PlayerCharacter | undefined
  inventoryUpgrades: PlayerDataChunkDto<"inventory-upgrades"> | undefined
}) {
  const { t } = useTranslation(["characters", "factions", "upgrades"])
  const {
    name: campaignName,
    fullLabel: campaignFullLabel,
    shortLabel: campaignShortLabel,
  } = useCampaignDisplay()

  const resolveRecipe = useMemo(() => {
    const resolve = (ingredients: RecipeIngredient[]): RecipeViewModel[] =>
      ingredients.map((ingredient) => {
        const up = upgradesById.get(ingredient.material)
        return {
          id: ingredient.material,
          label: t(`upgrades:${ingredient.material}`, {
            defaultValue: up?.label ?? ingredient.material,
          }),
          count: ingredient.count,
          rarity: up?.rarity ?? "Common",
          crafted: up?.crafted ?? false,
          children: resolve(up?.recipe ?? []),
        }
      })
    return resolve
  }, [upgradesById, t])

  const groups = useMemo<RankGroupViewModel[]>(() => {
    if (!characterForCalc) return []

    // Only "already applied to this character" is marked here — a hard, positional fact. Inventory
    // stock (not yet applied) isn't allocated across these icons: there's no non-arbitrary way to
    // decide which future slot a stock copy "counts against", so inventory only affects the
    // aggregate views (baseUpgrades/campaign insights below).
    const currentRank = effectiveIncludeOwned
      ? playerCharacter?.rank
      : undefined
    const appliedSlotIndices = playerCharacter?.appliedUpgradeSlots ?? []
    const isSlotOwned = (fromRank: Rank, index: number): boolean => {
      if (!currentRank) return false
      if (rankIndex(fromRank) < rankIndex(currentRank)) return true
      if (fromRank === currentRank) return appliedSlotIndices.includes(index)
      return false
    }

    return groupUpgradesByRank(
      characterForCalc,
      applied.rankStart,
      applied.rankEnd,
      applied.pointFive
    ).map((group) => {
      const byStat: Record<string, UpgradeViewModel[]> = {
        Health: [],
        Damage: [],
        Armour: [],
      }
      group.upgradeIds.forEach((id, index) => {
        const up = upgradesById.get(id)
        const view: UpgradeViewModel = {
          id,
          label: t(`upgrades:${id}`, { defaultValue: up?.label ?? id }),
          rarity: up?.rarity ?? "Common",
          crafted: up?.crafted ?? false,
          recipe: resolveRecipe(up?.recipe ?? []),
          owned: isSlotOwned(group.fromRank, index),
        }
        ;(byStat[up?.stat ?? "Health"] ??= []).push(view)
      })
      return {
        fromRank: group.fromRank,
        toRank: group.toRank,
        pointFive: group.pointFive,
        health: byStat.Health,
        damage: byStat.Damage,
        armour: byStat.Armour,
      }
    })
  }, [
    characterForCalc,
    applied.rankStart,
    applied.rankEnd,
    applied.pointFive,
    upgradesById,
    t,
    resolveRecipe,
    effectiveIncludeOwned,
    playerCharacter,
  ])

  // Shared by baseUpgrades and campaignInsights below so the upgrade-id → count aggregation only
  // runs once per rank/point-five change.
  const needs = useMemo(() => {
    if (!characterForCalc) return []
    const upgradeIds = rankUpUpgradeIds(
      characterForCalc,
      applied.rankStart,
      applied.rankEnd,
      applied.pointFive
    )
    return aggregateBaseUpgrades(upgradeIds, upgradesById)
  }, [
    characterForCalc,
    applied.rankStart,
    applied.rankEnd,
    applied.pointFive,
    upgradesById,
  ])

  // Base-upgrade-id → owned amount (applied to the character + inventory, both base and crafted
  // expanded through their recipe) — empty unless the toggle is on and there's synced player data to
  // draw from, so every downstream read (`owned ?? 0`) is a no-op fallback to today's behavior.
  const ownedBaseUpgrades = useMemo(() => {
    if (!effectiveIncludeOwned || !characterForCalc || !playerCharacter) {
      return new Map<string, number>()
    }
    const applied = appliedUpgradeIds(
      characterForCalc,
      playerCharacter.rank,
      playerCharacter.appliedUpgradeSlots
    )
    const owned = aggregateOwnedBaseUpgrades(
      applied,
      (inventoryUpgrades ?? []).map((entry) => ({
        id: entry.upgradeId,
        amount: entry.amount,
      })),
      upgradesById
    )
    return new Map(owned.map((entry) => [entry.id, entry.count]))
  }, [
    effectiveIncludeOwned,
    characterForCalc,
    playerCharacter,
    inventoryUpgrades,
    upgradesById,
  ])

  // `needs` with owned amounts deducted (floored at 0) — feeds campaign insights so farming
  // recommendations reflect what's actually still needed, not the raw theoretical total. Identical
  // to `needs` whenever ownedBaseUpgrades is empty (toggle off / unauthenticated).
  const effectiveNeeds = useMemo(
    () =>
      needs.map((need) => ({
        id: need.id,
        count: Math.max(0, need.count - (ownedBaseUpgrades.get(need.id) ?? 0)),
      })),
    [needs, ownedBaseUpgrades]
  )

  const baseUpgrades = useMemo<BaseUpgradeViewModel[]>(() => {
    return needs
      .map((need) => {
        const up = upgradesById.get(need.id)

        // Group by campaign group + type — a material can drop from many battle nodes within the
        // same campaign, so one chip per campaign lists all their node numbers instead of
        // repeating an near-identical chip per node.
        const locationsByKey = new Map<
          string,
          {
            id: string
            name: string
            code: string
            challenge: boolean
            icon?: string
            isEvent: boolean
            nodeNumbers: Set<number>
          }
        >()
        for (const location of up?.farmLocations ?? []) {
          const battle = battlesById.get(location.battleId)
          if (!battle) continue
          const key = `${battle.campaignGroupId}:${battle.type}`
          let entry = locationsByKey.get(key)
          if (!entry) {
            const descriptor = campaignDescriptor(
              battle.campaignGroupId,
              battle.type,
              battle.challenge
            )
            if (!descriptor) continue
            const short = campaignShortLabel(descriptor)
            entry = {
              id: key,
              name: short.name,
              code: short.code,
              challenge: short.challenge,
              icon: campaignIcon(
                battle.campaignGroupId,
                battle.type,
                battle.challenge
              ),
              isEvent:
                releaseTypeByGroupId.get(battle.campaignGroupId) === "event",
              nodeNumbers: new Set(),
            }
            locationsByKey.set(key, entry)
          }
          entry.nodeNumbers.add(battle.nodeNumber)
        }
        // "{Campaign name} {short code} {node numbers}", e.g. "Fall of Cadia S 13, 15" or
        // "Adeptus Mechanicus Ext 13B" (event "Challenge" tiers suffix each node with "B").
        const locations = [...locationsByKey.values()].map((entry) => {
          const nodes = [...entry.nodeNumbers]
            .sort((a, b) => a - b)
            .map((n) => (entry.challenge ? `${n}B` : `${n}`))
            .join(", ")
          return {
            id: entry.id,
            label: `${entry.name} ${entry.code} ${nodes}`,
            icon: entry.icon,
            isEvent: entry.isEvent,
          }
        })

        const owned = ownedBaseUpgrades.get(need.id) ?? 0

        return {
          id: need.id,
          count: need.count,
          owned,
          missing: Math.max(0, need.count - owned),
          label: t(`upgrades:${need.id}`, {
            defaultValue: up?.label ?? need.id,
          }),
          rarity: up?.rarity ?? "Common",
          crafted: up?.crafted ?? false,
          campaignLocations: locations
            .filter((l) => !l.isEvent)
            .map(({ id, label, icon }) => ({ id, label, icon })),
          eventLocations: locations
            .filter((l) => l.isEvent)
            .map(({ id, label, icon }) => ({ id, label, icon })),
        }
      })
      .sort(
        (a, b) =>
          rarityRank(b.rarity) - rarityRank(a.rarity) || b.missing - a.missing
      )
  }, [
    needs,
    ownedBaseUpgrades,
    upgradesById,
    battlesById,
    releaseTypeByGroupId,
    t,
    campaignShortLabel,
  ])

  const { campaignInsights, eventInsights } = useMemo(
    () =>
      computeCampaignInsights(
        effectiveNeeds,
        upgradesById,
        battlesById,
        (groupId) => releaseTypeByGroupId.get(groupId) === "event",
        (descriptor, isEvent) =>
          isEvent ? campaignName(descriptor) : campaignFullLabel(descriptor)
      ),
    [
      effectiveNeeds,
      upgradesById,
      battlesById,
      releaseTypeByGroupId,
      campaignName,
      campaignFullLabel,
    ]
  )

  const profile = useMemo<UnitProfileViewModel | undefined>(() => {
    if (!character) return undefined

    const damageTypes = [
      ...new Set(
        [
          character.meleeDamage,
          character.rangedDamage ?? undefined,
          // Zod's `.default([])` only backfills these on freshly-parsed network responses; catalog
          // data cached in IndexedDB before this schema change won't have gone through that parse,
          // so the field can still be `undefined` on an already-synced device.
          ...(character.activeAbilityDamage ?? []),
          ...(character.passiveAbilityDamage ?? []),
        ].filter((type): type is string => Boolean(type))
      ),
    ]

    const statPair = (base: number) => ({
      current: statAtRank(base, applied.rankStart, applied.progressionStart),
      target: statAtRank(base, applied.rankEnd, applied.progressionEnd),
    })

    return {
      id: character.id,
      name: t(`characters:${character.id}`, { defaultValue: character.name }),
      faction: t(`factions:${character.faction}`, {
        defaultValue: character.faction,
      }),
      movement: character.movement,
      meleeHits: character.meleeHits,
      meleeDamageType: character.meleeDamage,
      rangedHits: character.rangedHits ?? undefined,
      rangedDamageType: character.rangedDamage ?? undefined,
      rangeDistance: character.rangeDistance ?? undefined,
      damageTypes,
      equipmentSlots: character.equipmentSlots,
      traits: character.traits,
      health: statPair(character.health),
      damage: statPair(character.damage),
      armour: statPair(character.armour),
    }
  }, [
    character,
    applied.rankStart,
    applied.rankEnd,
    applied.progressionStart,
    applied.progressionEnd,
    t,
  ])

  return { groups, baseUpgrades, campaignInsights, eventInsights, profile }
}
