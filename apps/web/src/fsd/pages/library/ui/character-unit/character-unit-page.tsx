import { useId, useMemo, useState } from "react"
import { Link, useLocation, useParams } from "react-router"
import { useTranslation } from "react-i18next"
import { useIsAuthenticated } from "@azure/msal-react"
import { useLiveQuery } from "dexie-react-hooks"
import { abilityIcon } from "@workspace/game-catalog"
import {
  getEquipment,
  getUnlockShardCostsMap,
} from "@workspace/game-catalog/queries"
import {
  maxAbilityLevel,
  maxRankForProgression,
  progressionRarity,
  type UnitId,
} from "@workspace/game-domain"
import {
  getInventoryShard,
  getPlayerCharacter,
  getPlayerCharacters,
} from "@workspace/player-data/queries"
import { Button } from "@workspace/ui/components/button"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"

import { useAbilityText } from "@/shared/ability-text"
import { useTourPageSteps } from "@/shared/tour"

import { buildRadarPopulation, buildStatRadar } from "../../model/stat-radar"
import { CharacterRankUpTab } from "../character/character-rank-up-tab"
import { useCharacterListItems } from "../characters/use-character-list-items"
import { useCharactersCatalog } from "../characters/use-characters-catalog"
import { AbilityPanel } from "../unit/ability-panel"
import { UnitNavBar } from "../unit/unit-nav-bar"
import { UnitPowerValue } from "../unit/unit-power-value"
import {
  readUnitOrigin,
  unitNeighbours,
  unitOriginState,
} from "../unit/unit-origin"
import { UnitTabs } from "../unit/unit-tabs"
import { useUnitTab } from "../unit/use-unit-tab"
import { useCharacterUnitTutorial } from "./character-unit.tutorial"
import { CharacterUnitDetails } from "./character-unit-details"
import { CharacterUnitHeader, type ValuesMode } from "./character-unit-header"
import { MythicQuestsList } from "./mythic-quests-card"
import { RelicPanel } from "./relic-panel"
import { useCharacterPowerView } from "./use-character-power-view"
import { useMythicQuests } from "./use-mythic-quests"
import {
  playerAbilityLevels,
  playerValues,
  equippableItems,
  relicFor,
  startingValues,
  unitOwnership,
  type ShownValues,
} from "./character-unit.view-model"

const COLLECTION_PATH = "/library/characters"
const TABS = ["details", "rankup"] as const

// Distinguishes "still reading" from a resolved `undefined` (no record), as Dexie's useLiveQuery
// returns its default until the first resolution.
const LOADING = Symbol("loading")

/** `/library/characters/:entityId`: one character's unit page. */
export function CharacterUnitPage() {
  const { entityId } = useParams()
  const catalog = useCharactersCatalog()
  const { t } = useTranslation("library")

  if (catalog.status === "loading") {
    return (
      <p className="text-muted-foreground" data-testid="character-unit-loading">
        {t("loading")}
      </p>
    )
  }
  if (catalog.status === "failed") {
    return (
      <div className="flex flex-col items-start gap-3">
        <p data-testid="character-unit-load-failed">{t("unit.loadFailed")}</p>
        <Button variant="outline" onClick={catalog.retry}>
          {t("unit.retry")}
        </Button>
      </div>
    )
  }
  const character = entityId ? catalog.byId.get(entityId) : undefined
  if (!character) {
    return (
      <div
        className="flex flex-col items-start gap-3"
        data-testid="character-unit-not-found"
      >
        <p>{t("unit.notFound")}</p>
        <Button asChild variant="outline">
          <Link to={COLLECTION_PATH}>{t("charactersList.title")}</Link>
        </Button>
      </div>
    )
  }
  // Keyed by unit, so page state (custom values, ability levels, the calculator) starts afresh.
  return (
    <CharacterUnit key={character.id} catalog={catalog} unitId={character.id} />
  )
}

function CharacterUnit({
  catalog,
  unitId,
}: {
  catalog: ReturnType<typeof useCharactersCatalog>
  unitId: UnitId
}) {
  const { t } = useTranslation([
    "library",
    "characters",
    "abilities",
    "equipmentItems",
    "progression",
  ])
  const isMobile = useIsMobile()
  const isAuthenticated = useIsAuthenticated()
  const location = useLocation()
  const panelId = useId()
  const character = catalog.byId.get(unitId)!
  const name = t(`characters:${unitId}`, { defaultValue: character.name })
  const abilityText = useAbilityText()
  const [tab, setTab] = useUnitTab(TABS)

  // --- Player data -----------------------------------------------------------------------------
  const roster = useLiveQuery(
    () => (isAuthenticated ? getPlayerCharacters() : undefined),
    [isAuthenticated],
    LOADING
  )
  const playerCharacter = useLiveQuery(
    () => (isAuthenticated ? getPlayerCharacter(unitId) : undefined),
    [isAuthenticated, unitId],
    LOADING
  )
  const shardRecord = useLiveQuery(
    () => (isAuthenticated ? getInventoryShard(unitId) : undefined),
    [isAuthenticated, unitId]
  )
  const unlockCosts = useLiveQuery(() => getUnlockShardCostsMap(), [])
  const equipment = useLiveQuery(() => getEquipment(), [])

  const player =
    playerCharacter === LOADING ? undefined : (playerCharacter ?? undefined)
  const ownership = unitOwnership(
    roster !== LOADING && roster !== undefined,
    player,
    isAuthenticated && (roster === LOADING || playerCharacter === LOADING)
  )
  const baseValues = player ? playerValues(player) : startingValues(character)
  const [mode, setMode] = useState<ValuesMode>("base")
  const [custom, setCustom] = useState<ShownValues | undefined>()
  const shown = mode === "custom" ? (custom ?? baseValues) : baseValues

  // --- Abilities and relic ---------------------------------------------------------------------
  const levels = playerAbilityLevels(player)
  const activeId = character.activeAbilityNames[0]
  const passiveId = character.passiveAbilityNames[0]
  const [abilityLevels, setAbilityLevels] = useState<Record<string, number>>({})
  const levelOf = (id: string) => abilityLevels[id] ?? levels.get(id) ?? 1
  const setLevel = (id: string) => (level: number) =>
    setAbilityLevels((current) => ({ ...current, [id]: level }))
  const relic = relicFor(character, equipment ?? [], player)
  const slotItems = equippableItems(character, equipment ?? [])
  const mythic = useMythicQuests(unitId)
  const [relicLevel, setRelicLevel] = useState<number | undefined>()

  // --- Comparison and stats ----------------------------------------------------------------------
  const population = useMemo(
    () => buildRadarPopulation(catalog.characters),
    [catalog.characters]
  )
  const radar = buildStatRadar(character, population)
  const shownRelicLevel = relicLevel ?? relic?.equippedLevel ?? 1
  const powerView = useCharacterPowerView({
    characterId: unitId,
    shown,
    player,
    activeLevel: levelOf(activeId ?? ""),
    passiveLevel: levelOf(passiveId ?? ""),
    equippedRelic:
      relic?.equippedLevel === undefined
        ? undefined
        : { id: relic.relic.id, level: shownRelicLevel },
  })

  // --- Navigation -------------------------------------------------------------------------------
  const listItems = useCharacterListItems(catalog.characters)
  const origin = readUnitOrigin(location.state) ?? {
    kind: "list" as const,
    ids: listItems.map((item) => item.id),
  }
  const neighbours = unitNeighbours(origin.ids, unitId)
  const nameOf = (id: string) =>
    listItems.find((item) => item.id === id)?.name ?? id
  // Only the tab carries over: the calculator's range belongs to the unit it was set for.
  const tabParam = new URLSearchParams(location.search).get("tab")
  const navTarget = (id: string | undefined) =>
    id
      ? {
          to: {
            pathname: `${COLLECTION_PATH}/${id}`,
            search: tabParam
              ? `?${new URLSearchParams({ tab: tabParam })}`
              : "",
          },
          name: nameOf(id),
          state: unitOriginState(origin),
        }
      : undefined

  const yourUnitLine = player
    ? [
        t(
          `progression:rarities.${progressionRarity(player.progressionIndex)}`,
          {
            defaultValue: progressionRarity(player.progressionIndex),
          }
        ),
        t(`progression:stars.${player.progressionIndex.split(":")[1]}`, {
          defaultValue: player.progressionIndex,
        }),
        t(`progression:ranks.${player.rank}`, { defaultValue: player.rank }),
        t("characterUnit.header.abilities", {
          active: (activeId && levels.get(activeId)) ?? 1,
          passive: (passiveId && levels.get(passiveId)) ?? 1,
        }),
        ...(relic?.equippedLevel !== undefined
          ? [t("characterUnit.header.relic", { level: relic.equippedLevel })]
          : []),
      ].join(" · ")
    : undefined

  useTourPageSteps(
    useCharacterUnitTutorial({
      hasAbilityText:
        activeId !== undefined && abilityText(activeId) !== undefined,
    })
  )

  const abilityPanel = (id: string | undefined, kind: "active" | "passive") =>
    id ? (
      <AbilityPanel
        kind={t(`characterUnit.abilities.${kind}`)}
        name={t(`abilities:${id}`, { defaultValue: id })}
        iconSrc={abilityIcon(id)}
        text={abilityText(id)}
        rarity={progressionRarity(shown.progression)}
        unitName={name}
        factionId={character.faction}
        level={levelOf(id)}
        onLevelChange={setLevel(id)}
        maxLevel={maxAbilityLevel}
        playerLevel={levels.get(id)}
        data-testid={`unit-ability-${kind}`}
      />
    ) : null

  const relicPanel = (
    <RelicPanel
      relic={relic?.relic}
      characterId={character.id}
      unitName={name}
      factionId={character.faction}
      text={relic ? abilityText(relic.relic.abilityId) : undefined}
      level={shownRelicLevel}
      playerLevel={relic?.equippedLevel}
      onLevelChange={setRelicLevel}
      nameOf={nameOf}
    />
  )

  return (
    <div
      className="-mx-4 flex flex-col md:-mx-6"
      data-testid="character-unit-page"
    >
      <UnitNavBar
        back={{ to: COLLECTION_PATH, label: t("charactersList.title") }}
        breadcrumb={[
          t("characterUnit.breadcrumbLibrary"),
          t("collections.characters.label"),
          name,
        ]}
        previous={navTarget(neighbours.previousId)}
        next={navTarget(neighbours.nextId)}
        position={
          neighbours.index >= 0
            ? t("unit.nav.position", {
                index: neighbours.index + 1,
                total: neighbours.total,
              })
            : undefined
        }
        isMobile={isMobile}
      />
      <div className="px-4 pt-6 md:px-6">
        <CharacterUnitHeader
          unitId={unitId}
          name={name}
          factionId={character.faction}
          alliance={t(`npcs.alliances.${character.alliance}`, {
            defaultValue: character.alliance,
          })}
          ownership={ownership}
          signedIn={isAuthenticated}
          baseValues={baseValues}
          shown={shown}
          mode={mode}
          onModeChange={(next) => {
            setMode(next)
            if (next === "custom" && !custom) setCustom(baseValues)
          }}
          onCustomChange={setCustom}
          yourUnitLine={yourUnitLine}
          power={
            <UnitPowerValue
              label={t("characterUnit.power.label")}
              figure={powerView.power}
              note={
                powerView.includesItems
                  ? t("characterUnit.power.withItems")
                  : t("characterUnit.power.withoutItems")
              }
              unavailableText={t("characterUnit.power.unavailable")}
              isMobile={isMobile}
            />
          }
          shards={
            ownership === "notOwned"
              ? {
                  owned: shardRecord?.amount ?? 0,
                  needed:
                    unlockCosts?.get(character.initialRarity)?.shards ?? 0,
                }
              : undefined
          }
          isMobile={isMobile}
        />
      </div>
      {/* Tabs and panel share a parent so the mobile tab bar stays stuck while the panel scrolls. */}
      <div className="mt-5">
        <UnitTabs
          tabs={[
            { id: "details", label: t("unit.tabs.details") },
            { id: "rankup", label: t("unit.tabs.rankup") },
          ]}
          active={tab}
          onSelect={setTab}
          label={t("unit.tabs.label")}
          isMobile={isMobile}
          panelId={panelId}
          className="md:mx-6"
        />
        <div
          id={panelId}
          role="tabpanel"
          aria-labelledby={`${panelId}-tab-${tab}`}
          className="px-4 pt-5 pb-10 md:px-6"
        >
          {tab === "details" ? (
            <CharacterUnitDetails
              character={character}
              name={name}
              stats={powerView.stats}
              radar={radar}
              shownRank={shown.rank}
              rankCap={maxRankForProgression(shown.progression)}
              owned={ownership === "owned" && mode === "base"}
              activePanel={abilityPanel(activeId, "active")}
              passivePanel={abilityPanel(passiveId, "passive")}
              activeLevel={levelOf(activeId ?? "")}
              passiveLevel={levelOf(passiveId ?? "")}
              relicPanel={relicPanel}
              slotItems={slotItems}
              relicSlot={
                relic
                  ? {
                      slot: relic.relic.type,
                      name: t(`equipmentItems:${relic.relic.id}`, {
                        defaultValue: relic.relic.name,
                      }),
                    }
                  : undefined
              }
              mythicQuests={
                mythic.quests ? (
                  <MythicQuestsList
                    quests={mythic.quests}
                    template={mythic.template}
                    unitName={name}
                    nameOf={(id) =>
                      t(`characters:${id}`, {
                        defaultValue: catalog.byId.get(id)?.name ?? id,
                      })
                    }
                    equipment={equipment ?? []}
                  />
                ) : null
              }
              mythicQuestCount={mythic.quests?.length ?? 0}
              relicLevel={relic ? shownRelicLevel : undefined}
              isMobile={isMobile}
            />
          ) : (
            <CharacterRankUpTab characterId={unitId} />
          )}
        </div>
      </div>
    </div>
  )
}
