import { useId, useState } from "react"
import { Link, useLocation, useParams } from "react-router"
import { useTranslation } from "react-i18next"
import { useIsAuthenticated } from "@azure/msal-react"
import { useLiveQuery } from "dexie-react-hooks"
import { abilityIcon, mowIcon } from "@workspace/game-catalog"
import { getMowUpgradeCosts } from "@workspace/game-catalog/queries"
import {
  progressionOrder,
  progressionRarity,
  type Progression,
  type UnitId,
} from "@workspace/game-domain"
import { Button } from "@workspace/ui/components/button"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"

import { useAbilityText } from "@/shared/ability-text"
import { useTourPageSteps } from "@/shared/tour"
import { ProgressionSelect } from "@/shared/ui"

import { MOWS_PATH } from "../mows/mows-list-page"
import { useMowListItems, useMowsCatalog } from "../mows/use-mows-catalog"
import { AbilityPanel } from "../unit/ability-panel"
import { UnitHeader, type ValuesMode } from "../unit/unit-header"
import { UnitNavBar } from "../unit/unit-nav-bar"
import {
  readUnitOrigin,
  unitNeighbours,
  unitOriginState,
} from "../unit/unit-origin"
import { UnitTabs } from "../unit/unit-tabs"
import { useUnitTab } from "../unit/use-unit-tab"
import { MowMythicPanel } from "./mow-mythic-panel"
import { MowUnitDetails } from "./mow-unit-details"
import { useMowUnitTutorial } from "./mow-unit.tutorial"
import {
  MOW_STARTING_PROGRESSION,
  MOW_STARTING_RARITY,
  costsByLevel,
  mowAbilityLevels,
  mowMaxAbilityLevel,
  mythicLevel,
} from "./mow-unit.view-model"
import {
  calculateMowUpgrades,
  ownedMowStock,
  type MowAbility,
  type MowCostRung,
} from "./mow-upgrades.model"
import { MowUpgradesTab } from "./mow-upgrades-tab"
import { useMowPlayerData } from "./use-mow-player-data"
import { useMowUpgradeRanges } from "./use-mow-upgrade-ranges"

const TABS = ["details", "upgrades"] as const

/** `/library/machines-of-war/:entityId`: one Machine of War's unit page. */
export function MowUnitPage() {
  const { entityId } = useParams()
  const catalog = useMowsCatalog()
  const costs = useLiveQuery(() => getMowUpgradeCosts(), [])
  const { t } = useTranslation("library")

  if (catalog.status === "loading" || (catalog.status === "ready" && !costs)) {
    return (
      <p className="text-muted-foreground" data-testid="mow-unit-loading">
        {t("loading")}
      </p>
    )
  }
  if (catalog.status === "failed") {
    return (
      <div className="flex flex-col items-start gap-3">
        <p data-testid="mow-unit-load-failed">{t("unit.loadFailed")}</p>
        <Button variant="outline" onClick={catalog.retry}>
          {t("unit.retry")}
        </Button>
      </div>
    )
  }
  const mow = entityId ? catalog.byId.get(entityId) : undefined
  if (!mow) {
    return (
      <div
        className="flex flex-col items-start gap-3"
        data-testid="mow-unit-not-found"
      >
        <p>{t("unit.notFound")}</p>
        <Button asChild variant="outline">
          <Link to={MOWS_PATH}>{t("mowsList.title")}</Link>
        </Button>
      </div>
    )
  }
  // Keyed by unit, so page state (custom values, ability levels, ranges) starts afresh.
  return (
    <MowUnit
      key={mow.id}
      catalog={catalog}
      unitId={mow.id}
      costs={costs as MowCostRung[]}
    />
  )
}

function MowUnit({
  catalog,
  unitId,
  costs,
}: {
  catalog: ReturnType<typeof useMowsCatalog>
  unitId: UnitId
  costs: readonly MowCostRung[]
}) {
  const { t } = useTranslation(["library", "mows", "abilities", "progression"])
  const isMobile = useIsMobile()
  const isAuthenticated = useIsAuthenticated()
  const location = useLocation()
  const panelId = useId()
  const mow = catalog.byId.get(unitId)!
  const name = t(`mows:${unitId}`, { defaultValue: mow.name })
  const abilityText = useAbilityText()
  const [tab, setTab] = useUnitTab(TABS)

  // --- Player data -----------------------------------------------------------------------------
  const {
    player,
    ownership,
    shardRecord,
    unlockCosts,
    inventory,
    inventoryUpgrades,
    upgradesById,
  } = useMowPlayerData(unitId, isAuthenticated)
  const baseProgression = player?.progressionIndex ?? MOW_STARTING_PROGRESSION
  const [mode, setMode] = useState<ValuesMode>("base")
  const [custom, setCustom] = useState<Progression | undefined>()
  const shown =
    mode === "custom" ? (custom ?? baseProgression) : baseProgression
  const rarity = progressionRarity(shown)
  const describe = (progression: Progression) => ({
    rarity: t(`progression:rarities.${progressionRarity(progression)}`, {
      defaultValue: progressionRarity(progression),
    }),
  })

  // --- Abilities ---------------------------------------------------------------------------------
  const playerLevels = mowAbilityLevels(player)
  const maxLevel = mowMaxAbilityLevel(costs)
  const abilityKeys: Record<MowAbility, string> = {
    primary: mow.primaryAbility.name,
    secondary: mow.secondaryAbility.name,
  }
  const abilityNames: Record<MowAbility, string> = {
    primary: t(`abilities:${abilityKeys.primary}`, {
      defaultValue: abilityKeys.primary,
    }),
    secondary: t(`abilities:${abilityKeys.secondary}`, {
      defaultValue: abilityKeys.secondary,
    }),
  }
  // Player data can arrive after the first render, so a level follows the player's until changed.
  const [levelOverrides, setLevelOverrides] = useState<
    Partial<Record<MowAbility, number>>
  >({})
  const levels: Record<MowAbility, number> = {
    primary: levelOverrides.primary ?? playerLevels.primary,
    secondary: levelOverrides.secondary ?? playerLevels.secondary,
  }

  // The mythic ability (not in the catalog yet, #204) follows the blue stars of the values shown.
  const mythicKey = mow.mythicAbility?.name
  const mythicName = mythicKey
    ? t(`abilities:${mythicKey}`, { defaultValue: mythicKey })
    : t("mowUnit.mythic.unnamed")
  const mythic = mythicLevel(shown)

  // --- Ability upgrades --------------------------------------------------------------------------
  const { ranges, setFrom, setTo } = useMowUpgradeRanges(playerLevels, maxLevel)
  const [includeOwned, setIncludeOwned] = useState(true)
  const inventoryReady =
    isAuthenticated &&
    inventory !== undefined &&
    inventoryUpgrades !== undefined
  // At most 118 steps, so it is recalculated on every change, as the tab specifies.
  const result = calculateMowUpgrades({
    recipes: {
      primary: mow.primaryAbility.recipes,
      secondary: mow.secondaryAbility.recipes,
    },
    costsByLevel: costsByLevel(costs),
    upgradesById,
    ranges,
    owned:
      inventoryReady && includeOwned
        ? ownedMowStock(inventory, inventoryUpgrades, mow.alliance)
        : undefined,
  })

  // --- Navigation -------------------------------------------------------------------------------
  const listItems = useMowListItems(catalog.records)
  const origin = readUnitOrigin(location.state) ?? {
    kind: "list" as const,
    ids: listItems.map((item) => item.id),
  }
  const neighbours = unitNeighbours(origin.ids, unitId)
  const nameOf = (id: string) =>
    listItems.find((item) => item.id === id)?.name ?? id
  const navTarget = (id: string | undefined) =>
    id
      ? {
          to: { pathname: `${MOWS_PATH}/${id}`, search: location.search },
          name: nameOf(id),
          state: unitOriginState(origin),
        }
      : undefined

  const allianceName = t(`npcs.alliances.${mow.alliance}`, {
    defaultValue: mow.alliance,
  })
  const yourUnitLine = player
    ? [
        t(
          `progression:rarities.${progressionRarity(player.progressionIndex)}`,
          { defaultValue: progressionRarity(player.progressionIndex) }
        ),
        t(`progression:stars.${player.progressionIndex.split(":")[1]}`, {
          defaultValue: player.progressionIndex,
        }),
        t("mowUnit.header.levels", playerLevels),
      ].join(" · ")
    : undefined

  useTourPageSteps(useMowUnitTutorial({ upgradesOpen: tab === "upgrades" }))

  const panel = (ability: MowAbility) => (
    <AbilityPanel
      kind={t(`mowUnit.abilities.${ability}`)}
      name={abilityNames[ability]}
      iconSrc={abilityIcon(abilityKeys[ability])}
      text={abilityText(abilityKeys[ability])}
      rarity={rarity}
      unitName={name}
      factionId={mow.faction}
      level={levels[ability]}
      onLevelChange={(level) =>
        setLevelOverrides((current) => ({ ...current, [ability]: level }))
      }
      maxLevel={maxLevel}
      playerLevel={player ? playerLevels[ability] : undefined}
      data-testid={`unit-ability-${ability}`}
    />
  )

  const mythicPanel = (
    <MowMythicPanel
      name={mythicName}
      abilityKey={mythicKey}
      text={mythicKey ? abilityText(mythicKey) : undefined}
      level={mythic}
      rarity={rarity}
      unitName={name}
      factionId={mow.faction}
    />
  )

  return (
    <div className="-mx-4 flex flex-col md:-mx-6" data-testid="mow-unit-page">
      <UnitNavBar
        back={{ to: MOWS_PATH, label: t("mowsList.title") }}
        breadcrumb={[
          t("characterUnit.breadcrumbLibrary"),
          t("mowsList.title"),
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
        <UnitHeader
          portraitSrc={mowIcon(unitId) ?? ""}
          portraitRarity={
            ownership === "notOwned" ? MOW_STARTING_RARITY : rarity
          }
          name={name}
          factionId={mow.faction}
          kindLine={t("mowUnit.header.kind", { alliance: allianceName })}
          ownership={ownership}
          signedIn={isAuthenticated}
          yourUnit={
            yourUnitLine
              ? { label: t("mowUnit.header.yourUnit"), line: yourUnitLine }
              : undefined
          }
          notUnlockedText={t(
            "mowUnit.header.notUnlocked",
            describe(MOW_STARTING_PROGRESSION)
          )}
          showingText={t(
            "mowUnit.header.showing",
            describe(MOW_STARTING_PROGRESSION)
          )}
          shards={
            ownership === "notOwned"
              ? {
                  owned: shardRecord?.amount ?? 0,
                  needed: unlockCosts?.get(MOW_STARTING_RARITY)?.shards ?? 0,
                }
              : undefined
          }
          mode={mode}
          onModeChange={(next) => {
            setMode(next)
            if (next === "custom" && !custom) setCustom(baseProgression)
          }}
          customControls={
            <div className="w-56">
              <ProgressionSelect
                label={t("unit.values.stars")}
                value={shown}
                options={progressionOrder}
                onChange={setCustom}
              />
            </div>
          }
          isMobile={isMobile}
        />
      </div>
      {/* Tabs and panel share a parent so the mobile tab bar stays stuck while the panel scrolls. */}
      <div className="mt-5">
        <UnitTabs
          tabs={[
            { id: "details", label: t("unit.tabs.details") },
            { id: "upgrades", label: t("mowUnit.tabs.upgrades") },
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
            <MowUnitDetails
              panels={{
                primary: panel("primary"),
                secondary: panel("secondary"),
                mythic: mythicPanel,
              }}
              metas={{
                primary: t("unit.ability.levelShort", {
                  level: levels.primary,
                }),
                secondary: t("unit.ability.levelShort", {
                  level: levels.secondary,
                }),
                mythic:
                  mythic === undefined
                    ? t("mowUnit.mythic.unlocks")
                    : t("unit.ability.levelShort", { level: mythic }),
              }}
              names={{ ...abilityNames, mythic: mythicName }}
              isMobile={isMobile}
            />
          ) : (
            <MowUpgradesTab
              alliance={mow.alliance}
              abilityNames={abilityNames}
              ranges={ranges}
              maxLevel={maxLevel}
              onFromChange={setFrom}
              onToChange={setTo}
              result={result}
              includeOwned={inventoryReady ? includeOwned : undefined}
              onIncludeOwnedChange={setIncludeOwned}
              upgradesById={upgradesById}
              isMobile={isMobile}
            />
          )}
        </div>
      </div>
    </div>
  )
}
