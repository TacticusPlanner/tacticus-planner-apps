import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { useSearchParams } from "react-router"
import {
  campaignIcon,
  campaignShortLabel,
  firstProgression,
  firstRank,
  groupByFaction,
  isAdamantineRank,
  isProgression,
  isRank,
  maxRankForProgression,
  minProgressionForRank,
  progressionStars,
  rankAt,
  rankIndex,
  rarityRank,
  statAtRank,
  useDatasetRecords,
  type Progression,
  type Rank,
} from "@workspace/game-catalog"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"

import {
  aggregateBaseUpgrades,
  computeCampaignInsights,
  groupUpgradesByRank,
  rankUpUpgradeIds,
  type BattleLike,
  type CharacterLike,
  type RecipeIngredient,
  type UpgradeWithFarmLocations,
} from "@/features/rank-lookup"

import { CharacterLookupDesktopPage } from "./desktop/character-lookup-desktop-page"
import { CharacterLookupMobilePage } from "./mobile/character-lookup-mobile-page"
import type {
  BaseUpgradeView,
  RankGroupView,
  RecipeView,
  UpgradeView,
} from "./character-lookup-results"
import type { UnitProfileView } from "./unit-profile"

interface LookupSelection {
  characterId?: string
  rankStart: Rank
  rankEnd: Rank
  progressionStart: Progression
  progressionEnd: Progression
  pointFive: boolean
}

function selectionFromParams(params: URLSearchParams): LookupSelection {
  const start = params.get("rankStart")
  const end = params.get("rankEnd")
  const progressionStart = params.get("progressionStart")
  const progressionEnd = params.get("progressionEnd")
  return {
    characterId: params.get("character") ?? undefined,
    rankStart: start && isRank(start) ? start : firstRank,
    rankEnd: end && isRank(end) ? end : rankAt(1),
    progressionStart:
      progressionStart && isProgression(progressionStart)
        ? progressionStart
        : firstProgression,
    progressionEnd:
      progressionEnd && isProgression(progressionEnd)
        ? progressionEnd
        : firstProgression,
    pointFive: params.get("pointFive") === "true",
  }
}

export function CharacterLookupPage() {
  const { t } = useTranslation([
    "common",
    "ranks",
    "characters",
    "factions",
    "upgrades",
    "traits",
  ])
  const isMobile = useIsMobile()

  const characters = useDatasetRecords("characters")
  const upgrades = useDatasetRecords("upgrades")
  const battles = useDatasetRecords("campaign-battles")
  const campaignDefinitions = useDatasetRecords("campaign-definitions")

  const upgradesById = useMemo(
    () =>
      new Map(
        upgrades.data.map((u) => {
          const raw = u as unknown as Record<string, unknown>
          return [
            u.id,
            {
              ...raw,
              crafted: raw["craftable"] as boolean,
            } as UpgradeWithFarmLocations,
          ]
        })
      ),
    [upgrades.data]
  )
  const battlesById = useMemo(
    () =>
      new Map(
        battles.data.map((b) => [
          b.id,
          b as unknown as BattleLike & { id: string },
        ])
      ),
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

  const [searchParams, setSearchParams] = useSearchParams()
  const [applied, setApplied] = useState<LookupSelection>(() =>
    selectionFromParams(searchParams)
  )
  // Draft mirrors what the controls show; applied drives computation below. They only
  // reconcile on Apply, so dragging the rank slider (or picking a character) doesn't
  // recompute + re-render the whole results tree on every intermediate value.
  const [draft, setDraft] = useState<LookupSelection>(applied)

  const draftCharacterId =
    draft.characterId ?? characterGroups[0]?.members[0]?.id
  const characterId = applied.characterId ?? characterGroups[0]?.members[0]?.id

  const character = characters.data.find((c) => c.id === characterId)
  // rank-lookup-calc only reads id/name/rankUpUpgrades; a full catalog record is structurally
  // compatible (rankUpUpgrades[].rank is a validated Rank string at runtime, just typed loosely
  // by the schema), matching this codebase's existing cast-at-the-boundary pattern.
  const characterForCalc = character as CharacterLike | undefined

  const commitSelection = (selection: LookupSelection) => {
    setApplied(selection)
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (selection.characterId) next.set("character", selection.characterId)
        else next.delete("character")
        next.set("rankStart", selection.rankStart)
        next.set("rankEnd", selection.rankEnd)
        next.set("progressionStart", selection.progressionStart)
        next.set("progressionEnd", selection.progressionEnd)
        next.set("pointFive", String(selection.pointFive))
        return next
      },
      { replace: true }
    )
  }

  // Picking a character is the primary action on this page, so it commits immediately instead of
  // waiting on Apply — Apply stays reserved for the rank range/progression/point-five tweaks.
  const setDraftCharacterId = (id: string) => {
    const next = { ...draft, characterId: id }
    setDraft(next)
    commitSelection(next)
  }

  // A character can only be ranked up as far as its rarity/stars allow (see
  // `maxRankForProgression`), so the rank and progression ranges keep each other in bounds:
  // picking a rank raises progression to the minimum that unlocks it, and lowering progression
  // pulls the rank back down to what it now allows.
  const bumpProgressionForRank = (
    progression: Progression,
    rank: Rank
  ): Progression =>
    rankIndex(maxRankForProgression(progression)) < rankIndex(rank)
      ? minProgressionForRank(rank)
      : progression

  const clampRankForProgression = (
    rank: Rank,
    progression: Progression
  ): Rank => {
    const maxRank = maxRankForProgression(progression)
    return rankIndex(rank) > rankIndex(maxRank) ? maxRank : rank
  }

  const setDraftRange = (start: Rank, end: Rank) =>
    setDraft((prev) => ({
      ...prev,
      rankStart: start,
      rankEnd: end,
      progressionStart: bumpProgressionForRank(prev.progressionStart, start),
      progressionEnd: bumpProgressionForRank(prev.progressionEnd, end),
      // Adamantine ranks have no point-five step.
      pointFive: isAdamantineRank(end) ? false : prev.pointFive,
    }))

  const setDraftProgressionRange = (start: Progression, end: Progression) =>
    setDraft((prev) => {
      const rankEnd = clampRankForProgression(prev.rankEnd, end)
      // Clamping rankEnd down for a lowered "to" progression can leave rankStart above it —
      // pull rankStart down to match so the range selects keep start <= end.
      const rankStart = rankAt(
        Math.min(
          rankIndex(clampRankForProgression(prev.rankStart, start)),
          rankIndex(rankEnd)
        )
      )
      return {
        ...prev,
        progressionStart: start,
        progressionEnd: end,
        rankStart,
        rankEnd,
      }
    })

  const setDraftPointFive = (value: boolean) =>
    setDraft((prev) => ({ ...prev, pointFive: value }))

  const isDirty =
    draft.characterId !== applied.characterId ||
    draft.rankStart !== applied.rankStart ||
    draft.rankEnd !== applied.rankEnd ||
    draft.progressionStart !== applied.progressionStart ||
    draft.progressionEnd !== applied.progressionEnd ||
    draft.pointFive !== applied.pointFive

  const handleApply = () => commitSelection(draft)

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
            const short = campaignShortLabel(
              battle.campaignGroupId,
              battle.difficulty
            )
            if (!short) continue
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
  }, [needs, upgradesById, battlesById, releaseTypeByGroupId, t])

  const { campaignInsights, eventInsights } = useMemo(
    () =>
      computeCampaignInsights(
        needs,
        upgradesById,
        battlesById,
        (groupId) => releaseTypeByGroupId.get(groupId) === "event"
      ),
    [needs, upgradesById, battlesById, releaseTypeByGroupId]
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
