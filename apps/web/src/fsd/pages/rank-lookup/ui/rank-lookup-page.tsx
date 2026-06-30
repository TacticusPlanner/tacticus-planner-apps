import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  campaignIcon,
  firstRank,
  rankAt,
  type RankId,
  useDatasetRecords,
} from "@workspace/game-catalog"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"

import { groupByFaction } from "@/entities/faction"
import { rarityRank } from "@/entities/upgrade"
import {
  aggregateBaseUpgrades,
  groupUpgradesByRank,
  rankUpUpgradeIds,
  type CharacterLike,
  type RecipeIngredient,
  type UpgradeLike,
} from "@/features/rank-lookup"

import { RankLookupDesktopPage } from "./desktop/rank-lookup-desktop-page"
import { RankLookupMobilePage } from "./mobile/rank-lookup-mobile-page"
import type {
  BaseUpgradeView,
  RankGroupView,
  RecipeView,
  UpgradeView,
} from "./rank-lookup-results"

export function RankLookupPage() {
  const { t } = useTranslation([
    "common",
    "ranks",
    "characters",
    "factions",
    "upgrades",
    "campaignLocations",
  ])
  const isMobile = useIsMobile()

  const characters = useDatasetRecords("characters")
  const upgrades = useDatasetRecords("upgrades")
  const battles = useDatasetRecords("campaign-battles")

  const upgradesById = useMemo(
    () =>
      new Map(
        upgrades.data.map((u) => {
          const raw = u as unknown as Record<string, unknown>
          return [
            u.id,
            {
              ...raw,
              composite: raw["craftable"] as boolean,
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
          },
        ])
      ),
    [battles.data]
  )

  const characterGroups = useMemo(
    () =>
      groupByFaction(
        characters.data.map((c) => ({
          id: c.id,
          name: t(`characters:${c.id}`, { defaultValue: c.name }),
          faction: c.faction,
          alliance: c.alliance,
        })),
        (factionId) => t(`factions:${factionId}`, { defaultValue: factionId })
      ),
    [characters.data, t]
  )

  const [selectedCharacterId, setSelectedCharacterId] = useState<string>()
  const [rankStart, setRankStart] = useState<RankId>(firstRank)
  const [rankEnd, setRankEnd] = useState<RankId>(rankAt(1))
  const [pointFive, setPointFive] = useState(false)

  const characterId = selectedCharacterId ?? characterGroups[0]?.members[0]?.id

  const character = characters.data.find((c) => c.id === characterId) as
    | CharacterLike
    | undefined

  const setRange = (start: RankId, end: RankId) => {
    setRankStart(start)
    setRankEnd(end)
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
          children: resolve(up?.recipe ?? []),
        }
      })
    return resolve
  }, [upgradesById, t])

  const groups = useMemo<RankGroupView[]>(() => {
    if (!character) return []
    return groupUpgradesByRank(character, rankStart, rankEnd, pointFive).map(
      (group) => {
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
      }
    )
  }, [character, rankStart, rankEnd, pointFive, upgradesById, t, resolveRecipe])

  const baseUpgrades = useMemo<BaseUpgradeView[]>(() => {
    if (!character) return []
    const upgradeIds = rankUpUpgradeIds(
      character,
      rankStart,
      rankEnd,
      pointFive
    )
    const needs = aggregateBaseUpgrades(upgradeIds, upgradesById)

    return needs
      .map((need) => {
        const up = upgradesById.get(need.id)
        const locations = (up?.farmLocations ?? []).map((location) => {
          const battle = battlesById.get(location.battleId)
          return {
            battleId: location.battleId,
            label: t(`campaignLocations:${location.battleId}`, {
              defaultValue: location.battleId,
            }),
            icon: battle
              ? campaignIcon(battle.campaignGroupId, battle.difficulty)
              : undefined,
          }
        })
        return {
          id: need.id,
          count: need.count,
          label: t(`upgrades:${need.id}`, {
            defaultValue: up?.label ?? need.id,
          }),
          rarity: up?.rarity ?? "Common",
          locations,
        }
      })
      .sort(
        (a, b) =>
          rarityRank(b.rarity) - rarityRank(a.rarity) || b.count - a.count
      )
  }, [character, rankStart, rankEnd, pointFive, upgradesById, battlesById, t])

  const loading =
    (characters.loading && characters.data.length === 0) ||
    (upgrades.loading && upgrades.data.length === 0)

  const sharedProps = {
    characterGroups,
    characterId,
    rankStart,
    rankEnd,
    pointFive,
    loading,
    baseUpgrades,
    groups,
    onCharacterChange: setSelectedCharacterId,
    onRangeChange: setRange,
    onPointFiveChange: setPointFive,
  }

  return (
    <main
      className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-6 sm:px-6 sm:py-10"
      data-testid="rank-lookup-page"
    >
      <p className="text-muted-foreground">{t("rankLookup.subtitle")}</p>

      {isMobile ? (
        <RankLookupMobilePage {...sharedProps} />
      ) : (
        <RankLookupDesktopPage {...sharedProps} />
      )}
    </main>
  )
}
