import { useCallback, useEffect, useMemo } from "react"
import { useLocation, useNavigate, useParams } from "react-router"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"
import { Tabs, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"

import {
  buildRaidBossSeasonBoard,
  resolveRaidBossEncounterLocation,
  resolveRaidBossSeasonId,
  validRaidBossSeasonIds,
  unitDisplayName,
  type ResolvedRaidBossEncounterLocation,
} from "@/entities/raid-boss"
import { useGuildRaidMetaCatalog } from "@/entities/guild-raid-meta"
import { useTourPageSteps } from "@/shared/tour"

import { RaidBossesDesktopPage } from "./desktop/raid-bosses-desktop-page"
import { RaidBossesMobilePage } from "./mobile/raid-bosses-mobile-page"
import { useRaidBossDetail } from "./hooks/use-raid-boss-detail"
import { useRaidBossesCatalog } from "./hooks/use-raid-bosses-catalog"
import { GuildRaidMetaView, GuildRaidSeasonsView } from "./guild-raid-views"
import { useRaidBossesTutorial } from "./raid-bosses.tutorial"
import type { RaidBossesPageViewProps } from "./raid-bosses-page.view-model"
import { RaidBossSeasonReference } from "./raid-boss-season-reference"
import { buildRaidBossSeasonReferenceViewModel } from "./raid-boss-season-reference.view-model"
import {
  encounterSearch,
  entitySearch,
  parseRaidBossesTab,
  repairRaidBossesSearch,
  seasonReferenceSearch,
  updateSearch,
} from "./raid-bosses-search"

export function RaidBossesPage() {
  const { t } = useTranslation("library")
  const isMobile = useIsMobile()
  const { entityId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()

  const catalog = useRaidBossesCatalog()
  const metaCatalog = useGuildRaidMetaCatalog()

  const search = useMemo(
    () => new URLSearchParams(location.search),
    [location.search]
  )
  const seasonIds = useMemo(
    () => (catalog.payload ? validRaidBossSeasonIds(catalog.payload) : []),
    [catalog.payload]
  )
  const seasonId = useMemo(
    () =>
      catalog.payload
        ? resolveRaidBossSeasonId(catalog.payload, search.get("season"))
        : undefined,
    [catalog.payload, search]
  )
  const board = useMemo(
    () =>
      catalog.payload && seasonId
        ? buildRaidBossSeasonBoard(catalog.payload, seasonId)
        : undefined,
    [catalog.payload, seasonId]
  )
  const selectedUnit = entityId ? catalog.byId.get(entityId) : undefined
  const itemsById = useMemo(
    () =>
      new Map(
        [...catalog.bosses, ...catalog.primes].map((item) => [
          item.unitSetId,
          item,
        ])
      ),
    [catalog.bosses, catalog.primes]
  )
  const seasonReference = useMemo(
    () =>
      board
        ? buildRaidBossSeasonReferenceViewModel(board, itemsById)
        : undefined,
    [board, itemsById]
  )
  const exactLocation = useMemo(() => {
    if (!catalog.payload || !selectedUnit) return undefined
    const tier = Number(search.get("tier"))
    const set = Number(search.get("set"))
    const encounterIndex = Number(search.get("encounter"))
    return resolveRaidBossEncounterLocation(
      catalog.payload,
      selectedUnit.unitSetId,
      {
        seasonId: search.get("season") ?? "",
        tier,
        set,
        encounterIndex,
      }
    )
  }, [catalog.payload, search, selectedUnit])

  const requestedTab = search.get("tab")
  const tab = parseRaidBossesTab(requestedTab)
  const selectedSeasonId = seasonId
  const requestedComp = search.get("comp")
  const compId =
    metaCatalog.status === "ready" &&
    metaCatalog.meta.comps.some((comp) => comp.id === requestedComp)
      ? requestedComp!
      : undefined
  const firstEntityId =
    catalog.bosses[0]?.unitSetId ?? catalog.primes[0]?.unitSetId

  useEffect(() => {
    const repair = repairRaidBossesSearch(search, {
      catalogReady: catalog.status === "ready",
      metaReady: metaCatalog.status === "ready",
      entityId,
      entityKnown: Boolean(selectedUnit),
      firstEntityId,
      hasExactLocation: Boolean(exactLocation),
      seasonIds,
      selectedSeasonId,
      compId,
    })
    if (!repair) return
    void navigate(
      {
        pathname: repair.pathname ?? location.pathname,
        search: repair.search.toString(),
      },
      { replace: true }
    )
  }, [
    catalog.status,
    compId,
    entityId,
    exactLocation,
    firstEntityId,
    location.pathname,
    metaCatalog.status,
    navigate,
    search,
    seasonIds,
    selectedSeasonId,
    selectedUnit,
  ])

  const updateQuery = useCallback(
    (updates: Record<string, string | undefined>) => {
      void navigate({
        pathname:
          !entityId && updates.tab && updates.tab !== "details" && firstEntityId
            ? `/library/raid-bosses/${firstEntityId}`
            : location.pathname,
        search: updateSearch(search, updates).toString(),
      })
    },
    [entityId, firstEntityId, location.pathname, navigate, search]
  )

  useTourPageSteps(useRaidBossesTutorial(tab, Boolean(entityId)))

  const selectedName = selectedUnit
    ? (catalog.nameById.get(selectedUnit.unitSetId) ?? "")
    : ""

  const { stepIndex, setStepIndex, modifierContext, fieldEnemies, adjusted } =
    useRaidBossDetail(catalog, selectedUnit, exactLocation)

  const onSeasonChange = useCallback(
    (nextSeasonId: string) =>
      void navigate({
        pathname: "/library/raid-bosses",
        search: seasonReferenceSearch(
          search,
          nextSeasonId,
          seasonIds
        ).toString(),
      }),
    [navigate, search, seasonIds]
  )

  const onEncounterSelect = useCallback(
    (located: ResolvedRaidBossEncounterLocation) =>
      void navigate({
        pathname: `/library/raid-bosses/${located.encounter.unitSetId}`,
        search: encounterSearch(search, located).toString(),
      }),
    [navigate, search]
  )

  const onEntitySelect = useCallback(
    (id: string) =>
      void navigate({
        pathname: `/library/raid-bosses/${id}`,
        search: entitySearch(search).toString(),
      }),
    [navigate, search]
  )

  const onViewSeasonReference = useCallback(
    () =>
      void navigate({
        pathname: "/library/raid-bosses",
        search: seasonReferenceSearch(search, seasonId, seasonIds).toString(),
      }),
    [navigate, search, seasonId, seasonIds]
  )

  if (catalog.status === "loading") {
    return (
      <p
        className="py-10 text-center text-muted-foreground"
        data-testid="raid-bosses-library-page"
      >
        {t("raidBosses.loading")}
      </p>
    )
  }

  if (catalog.status === "absent") {
    return (
      <p
        className="py-10 text-center text-muted-foreground"
        data-testid="raid-bosses-library-page"
      >
        {t("raidBosses.unavailable")}
      </p>
    )
  }

  if (catalog.status === "failed") {
    return (
      <div
        className="flex flex-col items-center gap-4 py-10 text-center text-muted-foreground"
        data-testid="raid-bosses-library-page"
      >
        <p data-testid="raid-bosses-sync-failed">
          {t("raidBosses.syncFailed")}
        </p>
        <Button variant="outline" onClick={catalog.retry}>
          {t("raidBosses.retry")}
        </Button>
      </div>
    )
  }

  const viewProps: RaidBossesPageViewProps = {
    bosses: catalog.bosses,
    primes: catalog.primes,
    rosterGroups: catalog.rosterGroups,
    selectedId: selectedUnit?.unitSetId,
    selectedUnit,
    selectedName,
    onSelect: onEntitySelect,
    stepIndex,
    onStepChange: setStepIndex,
    modifierContext,
    fieldEnemies,
    adjusted,
  }

  return (
    <div className="flex flex-col gap-6" data-testid="raid-bosses-library-page">
      <p className="text-muted-foreground">
        {t("collections.raidBosses.description")}
      </p>
      <Tabs value={tab} onValueChange={(value) => updateQuery({ tab: value })}>
        <TabsList
          className="max-w-full overflow-x-auto"
          data-testid="raid-boss-tabs"
        >
          <TabsTrigger value="seasons">
            {t("raidBosses.tabs.seasons")}
          </TabsTrigger>
          <TabsTrigger value="meta">{t("raidBosses.tabs.meta")}</TabsTrigger>
          <TabsTrigger value="details">
            {t("raidBosses.tabs.details")}
          </TabsTrigger>
        </TabsList>
      </Tabs>
      {tab === "details" ? (
        entityId && selectedUnit ? (
          <>
            <Button
              className="w-fit"
              data-testid="raid-boss-view-season-reference"
              onClick={onViewSeasonReference}
              variant="outline"
            >
              {t("raidBosses.viewSeasonReference")}
            </Button>
            {isMobile ? (
              <RaidBossesMobilePage {...viewProps} />
            ) : (
              <RaidBossesDesktopPage {...viewProps} />
            )}
          </>
        ) : seasonReference ? (
          <RaidBossSeasonReference
            viewModel={seasonReference}
            seasonIds={seasonIds}
            onSeasonChange={onSeasonChange}
            onEncounterSelect={onEncounterSelect}
          />
        ) : (
          <p className="text-muted-foreground">
            {t("raidBosses.noSeasonReference")}
          </p>
        )
      ) : null}
      {tab === "seasons" && !entityId && seasonReference ? (
        <RaidBossSeasonReference
          viewModel={seasonReference}
          seasonIds={seasonIds}
          onSeasonChange={onSeasonChange}
          onEncounterSelect={onEncounterSelect}
        />
      ) : null}
      {tab === "seasons" && entityId && catalog.payload && selectedSeasonId ? (
        <GuildRaidSeasonsView
          payload={catalog.payload}
          selectedSeasonId={selectedSeasonId}
          onSelectSeason={(season) => updateQuery({ season })}
          encounterName={(unitSetId) =>
            catalog.nameById.get(unitSetId) ?? unitDisplayName(unitSetId)
          }
          encounterPortrait={(unitSetId) => catalog.portraitById.get(unitSetId)}
          mobile={isMobile}
        />
      ) : null}
      {tab === "meta" ? (
        <GuildRaidMetaView
          catalog={metaCatalog}
          compId={compId}
          onCompChange={(comp) => updateQuery({ comp })}
          mobile={isMobile}
        />
      ) : null}
    </div>
  )
}
