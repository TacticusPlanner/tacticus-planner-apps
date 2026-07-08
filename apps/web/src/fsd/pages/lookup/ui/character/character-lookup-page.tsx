import { useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { useIsAuthenticated } from "@azure/msal-react"
import { useLiveQuery } from "dexie-react-hooks"
import {
  campaignDescriptor,
  campaignIcon,
  groupByFaction,
  isAdamantineRank,
  progressionStars,
  rankIndex,
  rarityRank,
  statAtRank,
  type CampaignDefinitionRecord,
  type Rank,
} from "@workspace/game-catalog"
import {
  getCampaignBattles,
  getCampaignDefinitions,
  getCharacters,
  getUpgrades,
} from "@workspace/game-catalog/queries"
import {
  getInventoryUpgrades,
  getPlayerCharacter,
} from "@workspace/player-data/queries"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"

import {
  aggregateBaseUpgrades,
  aggregateOwnedBaseUpgrades,
  appliedUpgradeIds,
  groupUpgradesByRank,
  rankUpUpgradeIds,
  toBattleLike,
  toCharacterLike,
  toUpgradeWithFarmLocations,
  type RecipeIngredient,
} from "@/features/rank-lookup"
import { computeCampaignInsights, useCampaignDisplay } from "@/shared/lib"
import { useTourPageSteps } from "@/shared/tour"

import { useCharacterLookupTutorial } from "./character-lookup.tutorial"
import { CharacterLookupDesktopPage } from "./desktop/character-lookup-desktop-page"
import { CharacterLookupMobilePage } from "./mobile/character-lookup-mobile-page"
import { useLookupSelection } from "./hooks/use-lookup-selection"
import type {
  BaseUpgradeView,
  RankGroupView,
  RecipeView,
  UpgradeView,
} from "./character-lookup-results.types"
import type { UnitProfileView } from "./unit-profile.types"

const toReleaseType = (definition: CampaignDefinitionRecord) =>
  definition.releaseType

// A unique sentinel (not a plain value) so it can be distinguished from a legitimately-resolved
// result via reference equality — the documented Dexie pattern for detecting "still loading" with
// useLiveQuery, since its `defaultResult` argument is only returned before the first resolution.
const PLAYER_CHARACTER_LOADING = Symbol("loading")

export function CharacterLookupPage() {
  const { t } = useTranslation([
    "common",
    "progression",
    "characters",
    "factions",
    "upgrades",
    "traits",
  ])
  const {
    name: campaignName,
    fullLabel: campaignFullLabel,
    shortLabel: campaignShortLabel,
  } = useCampaignDisplay()
  const isMobile = useIsMobile()
  const isAuthenticated = useIsAuthenticated()

  useTourPageSteps(useCharacterLookupTutorial())

  const characters = useLiveQuery(() => getCharacters(), [])
  const charactersById = useMemo(
    () => new Map((characters ?? []).map((c) => [c.id, c])),
    [characters]
  )

  const upgrades = useLiveQuery(() => getUpgrades(), [])
  const upgradesById = useMemo(
    () =>
      new Map(
        (upgrades ?? []).map((u) => [u.id, toUpgradeWithFarmLocations(u)])
      ),
    [upgrades]
  )

  const campaignBattles = useLiveQuery(() => getCampaignBattles(), [])
  const battlesById = useMemo(
    () => new Map((campaignBattles ?? []).map((b) => [b.id, toBattleLike(b)])),
    [campaignBattles]
  )

  // A campaign-definition's `id` is already its `groupId` (see `groupsWithId` in
  // game-catalog-storage.ts), so indexing by `id` here doubles as indexing by `groupId`.
  const campaignDefinitions = useLiveQuery(() => getCampaignDefinitions(), [])
  const releaseTypeByGroupId = useMemo(
    () =>
      new Map((campaignDefinitions ?? []).map((d) => [d.id, toReleaseType(d)])),
    [campaignDefinitions]
  )

  const characterGroups = useMemo(
    () =>
      groupByFaction(
        (characters ?? []).map((c) => ({
          id: c.id,
          name: t(`characters:${c.id}`, { defaultValue: c.name }),
          faction: c.faction,
        })),
        (factionId) => t(`factions:${factionId}`, { defaultValue: factionId })
      ),
    [characters, t]
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

  const handleCharacterChange = (id: string) => {
    setDraftCharacterId(id)
  }

  const draftCharacterId =
    draft.characterId ?? characterGroups[0]?.members[0]?.id

  // Synced player record for the currently selected character only (not the whole roster) — used
  // just to prefill the "from" rank/progression once it loads, see the effect below. MoWs are
  // irrelevant here — Character Lookup only ever looks up characters, which have a rank/equipment
  // MoWs don't.
  const playerCharacterResult = useLiveQuery(
    () =>
      isAuthenticated && draftCharacterId
        ? getPlayerCharacter(draftCharacterId).then((data) => ({
            id: draftCharacterId,
            data,
          }))
        : { id: draftCharacterId, data: undefined },
    [isAuthenticated, draftCharacterId],
    PLAYER_CHARACTER_LOADING
  )
  const playerCharacter =
    playerCharacterResult !== PLAYER_CHARACTER_LOADING &&
    playerCharacterResult.id === draftCharacterId
      ? playerCharacterResult.data
      : undefined
  const playerCharacterLoading =
    isAuthenticated &&
    !!draftCharacterId &&
    (playerCharacterResult === PLAYER_CHARACTER_LOADING ||
      playerCharacterResult.id !== draftCharacterId)

  // Applies the synced rank/progression prefill once per character selection, as soon as it's
  // available — never on a later background refresh of the same character, so it can't clobber
  // rank/progression edits the user has since made via the slider. Falls back to
  // setDraftCharacterId's normal default behavior whenever signed out, the record hasn't finished
  // loading, or the unit isn't in the synced chunk at all.
  const prefilledCharacterIdRef = useRef<string | undefined>(undefined)

  useEffect(() => {
    if (
      !isAuthenticated ||
      !draftCharacterId ||
      playerCharacterLoading ||
      prefilledCharacterIdRef.current === draftCharacterId
    ) {
      return
    }

    prefilledCharacterIdRef.current = draftCharacterId

    if (!playerCharacter) {
      return
    }

    // The synced chunk's rank/progressionIndex are already the catalog's own Rank/Progression
    // string values (see @workspace/player-data's schemas) — no numeric-index conversion needed.
    setDraftCharacterId(draftCharacterId, {
      rankStart: playerCharacter.rank,
      progressionStart: playerCharacter.progressionIndex,
    })
  }, [
    isAuthenticated,
    draftCharacterId,
    playerCharacter,
    playerCharacterLoading,
    setDraftCharacterId,
  ])

  // Whether to net the player's already-applied/owned upgrades out of the required totals below —
  // deliberately local (not part of useLookupSelection's URL-synced state), since "include my
  // personal inventory" isn't something that should travel in a shareable link. Derived (not
  // reset via an effect) so a disabled toggle can never be shown "on": whenever signed out,
  // `effectiveIncludeOwned` reads false regardless of the raw switch state underneath.
  const [includeOwned, setIncludeOwned] = useState(false)
  const effectiveIncludeOwned = includeOwned && isAuthenticated

  // Whole inventory-upgrades chunk (not a single record — we don't know in advance which ids the
  // player owns), used only once includeOwned is on; harmless/unused otherwise.
  const inventoryUpgrades = useLiveQuery(() => getInventoryUpgrades(), [])

  const characterId = applied.characterId ?? characterGroups[0]?.members[0]?.id

  const character = characterId ? charactersById.get(characterId) : undefined
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
      const byStat: Record<string, UpgradeView[]> = {
        Health: [],
        Damage: [],
        Armour: [],
      }
      group.upgradeIds.forEach((id, index) => {
        const up = upgradesById.get(id)
        const view: UpgradeView = {
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

  const baseUpgrades = useMemo<BaseUpgradeView[]>(() => {
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

  const loading = characters === undefined || upgrades === undefined

  const sharedProps = {
    characterGroups,
    characterId: draftCharacterId,
    rankStart: draft.rankStart,
    rankEnd: draft.rankEnd,
    progressionStart: draft.progressionStart,
    progressionEnd: draft.progressionEnd,
    pointFive: draft.pointFive,
    pointFiveDisabled: isAdamantineRank(draft.rankEnd),
    includeOwned: effectiveIncludeOwned,
    includeOwnedDisabled: !isAuthenticated,
    loading,
    profile,
    baseUpgrades,
    groups,
    campaignInsights,
    eventInsights,
    onCharacterChange: handleCharacterChange,
    onRangeChange: setDraftRange,
    onProgressionRangeChange: setDraftProgressionRange,
    onPointFiveChange: setDraftPointFive,
    onIncludeOwnedChange: setIncludeOwned,
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
