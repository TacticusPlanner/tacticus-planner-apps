import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { useSearchParams } from "react-router"
import {
  campaignIcon,
  campaignShortLabel,
  firstRank,
  firstRarityStars,
  groupByFaction,
  isAdamantineRank,
  isRank,
  isRarityStars,
  rankAt,
  rarityRank,
  statAtRank,
  useDatasetRecords,
  type Rank,
  type RarityStars,
} from "@workspace/game-catalog"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"

import {
  aggregateBaseUpgrades,
  groupUpgradesByRank,
  rankUpUpgradeIds,
  type CharacterLike,
  type RecipeIngredient,
  type UpgradeLike,
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
  progression: RarityStars
  pointFive: boolean
}

function selectionFromParams(params: URLSearchParams): LookupSelection {
  const start = params.get("rankStart")
  const end = params.get("rankEnd")
  const progression = params.get("progression")
  return {
    characterId: params.get("character") ?? undefined,
    rankStart: start && isRank(start) ? start : firstRank,
    rankEnd: end && isRank(end) ? end : rankAt(1),
    progression:
      progression && isRarityStars(progression)
        ? progression
        : firstRarityStars,
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
            } as UpgradeLike & { farmLocations?: { battleId: string }[] },
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
          b as unknown as {
            id: string
            campaignGroupId: string
            difficulty: string
            nodeNumber: number
          },
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

  const setDraftCharacterId = (id: string) =>
    setDraft((prev) => ({ ...prev, characterId: id }))

  const setDraftRange = (start: Rank, end: Rank) =>
    setDraft((prev) => ({
      ...prev,
      rankStart: start,
      rankEnd: end,
      // Adamantine ranks have no point-five step.
      pointFive: isAdamantineRank(end) ? false : prev.pointFive,
    }))

  const setDraftProgression = (value: RarityStars) =>
    setDraft((prev) => ({ ...prev, progression: value }))

  const setDraftPointFive = (value: boolean) =>
    setDraft((prev) => ({ ...prev, pointFive: value }))

  const isDirty =
    draft.characterId !== applied.characterId ||
    draft.rankStart !== applied.rankStart ||
    draft.rankEnd !== applied.rankEnd ||
    draft.progression !== applied.progression ||
    draft.pointFive !== applied.pointFive

  const handleApply = () => {
    setApplied(draft)
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (draft.characterId) next.set("character", draft.characterId)
        else next.delete("character")
        next.set("rankStart", draft.rankStart)
        next.set("rankEnd", draft.rankEnd)
        next.set("progression", draft.progression)
        next.set("pointFive", String(draft.pointFive))
        return next
      },
      { replace: true }
    )
  }

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

  const baseUpgrades = useMemo<BaseUpgradeView[]>(() => {
    if (!characterForCalc) return []
    const upgradeIds = rankUpUpgradeIds(
      characterForCalc,
      applied.rankStart,
      applied.rankEnd,
      applied.pointFive
    )
    const needs = aggregateBaseUpgrades(upgradeIds, upgradesById)

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
  }, [
    characterForCalc,
    applied.rankStart,
    applied.rankEnd,
    applied.pointFive,
    upgradesById,
    battlesById,
    releaseTypeByGroupId,
    t,
  ])

  const profile = useMemo<UnitProfileView | undefined>(() => {
    if (!character) return undefined

    const damageTypes = [
      ...new Set(
        [
          character.meleeDamage,
          character.rangedDamage ?? undefined,
          ...character.activeAbilityDamage,
          ...character.passiveAbilityDamage,
        ].filter((type): type is string => Boolean(type))
      ),
    ]

    const statPair = (base: number) => ({
      current: statAtRank(base, applied.rankStart, applied.progression),
      target: statAtRank(base, applied.rankEnd, applied.progression),
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
  }, [character, applied.rankStart, applied.rankEnd, applied.progression, t])

  const loading =
    (characters.loading && characters.data.length === 0) ||
    (upgrades.loading && upgrades.data.length === 0)

  const sharedProps = {
    characterGroups,
    characterId: draftCharacterId,
    rankStart: draft.rankStart,
    rankEnd: draft.rankEnd,
    progression: draft.progression,
    pointFive: draft.pointFive,
    pointFiveDisabled: isAdamantineRank(draft.rankEnd),
    loading,
    profile,
    baseUpgrades,
    groups,
    onCharacterChange: setDraftCharacterId,
    onRangeChange: setDraftRange,
    onProgressionChange: setDraftProgression,
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
