import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import {
  campaignDescriptor,
  campaignIcon,
  groupByFaction,
  isAdamantineRank,
  progressionStars,
  rarityRank,
  statAtRank,
} from "@workspace/game-catalog"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"

import {
  aggregateBaseUpgrades,
  campaignDisplayFullLabel,
  campaignDisplayName,
  campaignDisplayShortLabel,
  computeCampaignInsights,
  groupUpgradesByRank,
  rankUpUpgradeIds,
  toBattleLike,
  toCharacterLike,
  toUpgradeWithFarmLocations,
  type CampaignTFunction,
  type RecipeIngredient,
} from "@/features/rank-lookup"
import { useDatasetRecords } from "@/shared/game-catalog"

import { CharacterLookupDesktopPage } from "./desktop/character-lookup-desktop-page"
import { CharacterLookupMobilePage } from "./mobile/character-lookup-mobile-page"
import { useLookupSelection } from "./model/use-lookup-selection"
import type {
  BaseUpgradeView,
  RankGroupView,
  RecipeView,
  UpgradeView,
} from "./character-lookup-results.types"
import type { UnitProfileView } from "./unit-profile.types"

export function CharacterLookupPage() {
  const { t } = useTranslation([
    "common",
    "ranks",
    "characters",
    "factions",
    "upgrades",
    "traits",
    "campaigns",
    "campaignDifficulties",
    "campaignDifficultyCodes",
  ])
  // i18next's `TFunction` is branded by the *first* namespace in the `useTranslation` array (its
  // "default" namespace) — `t` above is perfectly capable of resolving every `campaigns:`/
  // `campaignDifficulties:`/`campaignDifficultyCodes:`-prefixed key used by `campaignDisplay*`
  // below, but isn't nominally assignable to their (differently-branded) parameter type. Every key
  // they build is a runtime template literal anyway (not a static one i18next could validate), so
  // this cast doesn't give anything up.
  const campaignT = t as CampaignTFunction
  const isMobile = useIsMobile()

  const characters = useDatasetRecords("characters")
  const upgrades = useDatasetRecords("upgrades")
  const battles = useDatasetRecords("campaign-battles")
  const campaignDefinitions = useDatasetRecords("campaign-definitions")

  const upgradesById = useMemo(
    () =>
      new Map(upgrades.data.map((u) => [u.id, toUpgradeWithFarmLocations(u)])),
    [upgrades.data]
  )
  const battlesById = useMemo(
    () => new Map(battles.data.map((b) => [b.id, toBattleLike(b)])),
    [battles.data]
  )
  const releaseTypeByGroupId = useMemo(
    () =>
      new Map(campaignDefinitions.data.map((d) => [d.groupId, d.releaseType])),
    [campaignDefinitions.data]
  )

  const characterGroups = useMemo(
    () =>
      groupByFaction(
        characters.data.map((c) => ({
          id: c.id,
          name: t(`characters:${c.id}`, { defaultValue: c.name }),
          faction: c.faction,
        })),
        (factionId) => t(`factions:${factionId}`, { defaultValue: factionId })
      ),
    [characters.data, t]
  )

  const {
    applied,
    draft,
    isDirty,
    setDraftCharacterId,
    setDraftRange,
    setDraftProgressionRange,
    setDraftPointFive,
    handleApply,
  } = useLookupSelection()

  const draftCharacterId =
    draft.characterId ?? characterGroups[0]?.members[0]?.id
  const characterId = applied.characterId ?? characterGroups[0]?.members[0]?.id

  const character = characters.data.find((c) => c.id === characterId)
  const characterForCalc = character ? toCharacterLike(character) : undefined

  const resolveRecipe = useMemo(() => {
    const resolve = (ingredients: RecipeIngredient[]): RecipeView[] =>
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

  const groups = useMemo<RankGroupView[]>(() => {
    if (!characterForCalc) return []
    return groupUpgradesByRank(
      characterForCalc,
      applied.rankStart,
      applied.rankEnd,
      applied.pointFive
    ).map((group) => {
      const byStat: Record<string, UpgradeView[]> = {
        Health: [],
        Damage: [],
        Armour: [],
      }
      for (const id of group.upgradeIds) {
        const up = upgradesById.get(id)
        const view: UpgradeView = {
          id,
          label: t(`upgrades:${id}`, { defaultValue: up?.label ?? id }),
          rarity: up?.rarity ?? "Common",
          crafted: up?.crafted ?? false,
          recipe: resolveRecipe(up?.recipe ?? []),
        }
        ;(byStat[up?.stat ?? "Health"] ??= []).push(view)
      }
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

  const baseUpgrades = useMemo<BaseUpgradeView[]>(() => {
    return needs
      .map((need) => {
        const up = upgradesById.get(need.id)

        // Group by campaign group + difficulty — a material can drop from many battle nodes
        // within the same campaign, so one chip per campaign lists all their node numbers
        // instead of repeating an near-identical chip per node.
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
          const key = `${battle.campaignGroupId}:${battle.difficulty}`
          let entry = locationsByKey.get(key)
          if (!entry) {
            const descriptor = campaignDescriptor(
              battle.campaignGroupId,
              battle.difficulty
            )
            if (!descriptor) continue
            const short = campaignDisplayShortLabel(campaignT, descriptor)
            entry = {
              id: key,
              name: short.name,
              code: short.code,
              challenge: short.challenge,
              icon: campaignIcon(battle.campaignGroupId, battle.difficulty),
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

        return {
          id: need.id,
          count: need.count,
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
          rarityRank(b.rarity) - rarityRank(a.rarity) || b.count - a.count
      )
  }, [needs, upgradesById, battlesById, releaseTypeByGroupId, t, campaignT])

  const { campaignInsights, eventInsights } = useMemo(
    () =>
      computeCampaignInsights(
        needs,
        upgradesById,
        battlesById,
        (groupId) => releaseTypeByGroupId.get(groupId) === "event",
        (descriptor, isEvent) =>
          isEvent
            ? campaignDisplayName(campaignT, descriptor)
            : campaignDisplayFullLabel(campaignT, descriptor)
      ),
    [needs, upgradesById, battlesById, releaseTypeByGroupId, campaignT]
  )

  const profile = useMemo<UnitProfileView | undefined>(() => {
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
      current: statAtRank(
        base,
        applied.rankStart,
        progressionStars(applied.progressionStart)
      ),
      target: statAtRank(
        base,
        applied.rankEnd,
        progressionStars(applied.progressionEnd)
      ),
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

  const loading =
    (characters.loading && characters.data.length === 0) ||
    (upgrades.loading && upgrades.data.length === 0)

  const sharedProps = {
    characterGroups,
    characterId: draftCharacterId,
    rankStart: draft.rankStart,
    rankEnd: draft.rankEnd,
    progressionStart: draft.progressionStart,
    progressionEnd: draft.progressionEnd,
    pointFive: draft.pointFive,
    pointFiveDisabled: isAdamantineRank(draft.rankEnd),
    loading,
    profile,
    baseUpgrades,
    groups,
    campaignInsights,
    eventInsights,
    onCharacterChange: setDraftCharacterId,
    onRangeChange: setDraftRange,
    onProgressionRangeChange: setDraftProgressionRange,
    onPointFiveChange: setDraftPointFive,
    onApply: handleApply,
    applyDisabled: !isDirty,
  }

  return (
    <div className="flex flex-col gap-8" data-testid="character-lookup-page">
      <p className="text-muted-foreground">{t("unitLookup.subtitle")}</p>

      {isMobile ? (
        <CharacterLookupMobilePage {...sharedProps} />
      ) : (
        <CharacterLookupDesktopPage {...sharedProps} />
      )}
    </div>
  )
}
