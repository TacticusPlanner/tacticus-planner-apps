import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useLocation, useNavigate, useParams } from "react-router"
import { useTranslation } from "react-i18next"
import { useLiveQuery } from "dexie-react-hooks"
import { fieldNpcIcon } from "@workspace/game-catalog"
import { getNpcs } from "@workspace/game-catalog/queries"
import { Button } from "@workspace/ui/components/button"
import { Tabs, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"

import {
  buildAdjustedView,
  buildModifierContext,
  fieldNpcIdsForStep,
  buildRaidBossSeasonBoard,
  encounterProgressionStepIndex,
  maxKnownProgressionIndex,
  resolveRaidBossEncounterLocation,
  resolveFieldNpcName,
  resolveFieldNpcRosterId,
  resolveRaidBossSeasonId,
  validRaidBossSeasonIds,
  unitDisplayName,
} from "@/entities/raid-boss"
import { useGuildRaidMetaCatalog } from "@/entities/guild-raid-meta"
import { useTourPageSteps } from "@/shared/tour"

import { RaidBossesDesktopPage } from "./desktop/raid-bosses-desktop-page"
import { RaidBossesMobilePage } from "./mobile/raid-bosses-mobile-page"
import { useRaidBossesCatalog } from "./hooks/use-raid-bosses-catalog"
import { GuildRaidMetaView, GuildRaidSeasonsView } from "./guild-raid-views"
import { useRaidBossesTutorial } from "./raid-bosses.tutorial"
import type { RaidBossesPageViewProps } from "./raid-bosses-page.view-model"
import { RaidBossSeasonReference } from "./raid-boss-season-reference"
import { buildRaidBossSeasonReferenceViewModel } from "./raid-boss-season-reference.view-model"

export function RaidBossesPage() {
  const { t } = useTranslation("library")
  const isMobile = useIsMobile()
  const { entityId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()

  const catalog = useRaidBossesCatalog()
  const metaCatalog = useGuildRaidMetaCatalog()
  const npcs = useLiveQuery(() => getNpcs(), [], [])

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

  useEffect(() => {
    if (catalog.status !== "ready" || !seasonId) return

    const next = new URLSearchParams(location.search)
    let needsNavigation = false
    const requestedSeasonId = search.get("season")

    if (requestedSeasonId && requestedSeasonId !== seasonId) {
      if (seasonId === seasonIds[0]) next.delete("season")
      else next.set("season", seasonId)
      needsNavigation = true
    }

    const hasContextParameter = ["tier", "set", "encounter"].some((key) =>
      search.has(key)
    )
    if (entityId && selectedUnit && hasContextParameter && !exactLocation) {
      next.delete("tier")
      next.delete("set")
      next.delete("encounter")
      needsNavigation = true
    }

    if (entityId && !selectedUnit) {
      next.delete("tier")
      next.delete("set")
      next.delete("encounter")
      void navigate(
        { pathname: "/library/raid-bosses", search: next.toString() },
        { replace: true }
      )
      return
    }

    if (needsNavigation) {
      void navigate(
        { pathname: location.pathname, search: next.toString() },
        { replace: true }
      )
    }
  }, [
    catalog.status,
    entityId,
    location.pathname,
    location.search,
    navigate,
    search,
    seasonId,
    seasonIds,
    selectedUnit,
    exactLocation,
  ])

  const query = useMemo(
    () => new URLSearchParams(location.search),
    [location.search]
  )
  const requestedTab = query.get("tab")
  const tab =
    requestedTab === "seasons" ||
    requestedTab === "meta" ||
    requestedTab === "details"
      ? requestedTab
      : "details"
  const requestedSeason = query.get("season")
  const selectedSeasonId = seasonId
  const requestedComp = query.get("comp")
  const compId =
    metaCatalog.status === "ready" &&
    metaCatalog.meta.comps.some((comp) => comp.id === requestedComp)
      ? requestedComp!
      : undefined

  const updateQuery = useCallback(
    (updates: Record<string, string | undefined>) => {
      const next = new URLSearchParams(location.search)
      for (const [key, value] of Object.entries(updates)) {
        if (value === undefined) next.delete(key)
        else next.set(key, value)
      }
      const search = next.toString()
      void navigate({
        pathname: location.pathname,
        search: search ? `?${search}` : "",
      })
    },
    [location.pathname, location.search, navigate]
  )

  useEffect(() => {
    if (catalog.status !== "ready") return
    const repairs: Record<string, string | undefined> = {}
    if (requestedTab && requestedTab !== tab) repairs.tab = "details"
    if (requestedSeason && requestedSeason !== selectedSeasonId)
      repairs.season = selectedSeasonId
    if (
      metaCatalog.status === "ready" &&
      requestedComp &&
      requestedComp !== compId
    )
      repairs.comp = undefined
    if (Object.keys(repairs).length === 0) return
    const next = new URLSearchParams(location.search)
    for (const [key, value] of Object.entries(repairs)) {
      if (value === undefined) next.delete(key)
      else next.set(key, value)
    }
    const search = next.toString()
    void navigate(
      { pathname: location.pathname, search: search ? `?${search}` : "" },
      { replace: true }
    )
  }, [
    catalog.status,
    compId,
    location.pathname,
    location.search,
    metaCatalog.status,
    navigate,
    requestedComp,
    requestedSeason,
    requestedTab,
    selectedSeasonId,
    tab,
  ])

  useTourPageSteps(useRaidBossesTutorial(tab))

  useTourPageSteps(useRaidBossesTutorial(tab, Boolean(entityId)))

  const selectedName = selectedUnit
    ? (catalog.nameById.get(selectedUnit.unitSetId) ?? "")
    : ""

  // Progression step and per-prime HP-lost points are ephemeral exploration state (not URL-backed) —
  // reset whenever the selected entity changes.
  const [stepIndex, setStepIndex] = useState(0)
  const [hpLostByPrime, setHpLostByPrime] = useState<Record<string, number>>({})
  const stepForUnitRef = useRef<string | undefined>(undefined)

  useEffect(() => {
    if (!selectedUnit || !catalog.payload) return
    const key = exactLocation
      ? `${selectedUnit.unitSetId}:${exactLocation.seasonId}:${exactLocation.tier}:${exactLocation.set}:${exactLocation.encounterIndex}`
      : selectedUnit.unitSetId
    if (stepForUnitRef.current === key) return

    stepForUnitRef.current = key
    setHpLostByPrime({})
    setStepIndex(
      exactLocation
        ? encounterProgressionStepIndex(
            exactLocation.encounter.progressionIndex,
            selectedUnit.statProgression.length
          )
        : maxKnownProgressionIndex(
            catalog.payload,
            selectedUnit.unitSetId,
            selectedUnit.statProgression.length
          )
    )
  }, [selectedUnit, catalog.payload, exactLocation])

  const onHpLostChange = useCallback(
    (primeUnitSetId: string, hpLost: number) =>
      setHpLostByPrime((prev) => ({ ...prev, [primeUnitSetId]: hpLost })),
    []
  )

  const modifierContext = useMemo(
    () =>
      catalog.payload && selectedUnit
        ? buildModifierContext(
            catalog.payload,
            selectedUnit,
            stepIndex,
            (id) => catalog.nameById.get(id) ?? id,
            exactLocation
          )
        : ({ kind: "none" } as const),
    [catalog.payload, catalog.nameById, selectedUnit, stepIndex, exactLocation]
  )

  const fieldEnemies = useMemo(
    () =>
      catalog.payload && selectedUnit
        ? fieldNpcIdsForStep(
            catalog.payload,
            selectedUnit.unitSetId,
            stepIndex,
            exactLocation
          ).map((id) => ({
            name: resolveFieldNpcName(id, selectedUnit.factionId, npcs),
            iconSrc: fieldNpcIcon({
              id,
              questUnitId: resolveFieldNpcRosterId(
                id,
                selectedUnit.factionId,
                npcs
              ),
            }),
          }))
        : [],
    [catalog.payload, selectedUnit, stepIndex, npcs, exactLocation]
  )

  const adjusted = useMemo(() => {
    if (!catalog.payload || !selectedUnit) return null
    const view = buildAdjustedView(
      catalog.payload,
      selectedUnit,
      stepIndex,
      hpLostByPrime,
      exactLocation
    )
    if (!view) return null
    return {
      view,
      hpLostByPrime,
      onHpLostChange,
      primeLabels: Object.fromEntries(
        view.primes.map((panel) => [
          panel.id,
          catalog.nameById.get(panel.unitSetId) ?? panel.unitSetId,
        ])
      ),
      enemyNames: view.enemies.ids.map((id) =>
        resolveFieldNpcName(id, selectedUnit.factionId, npcs)
      ),
      removed: view.enemies.removed.map((entry) => ({
        name: resolveFieldNpcName(
          entry.unitSetId,
          selectedUnit.factionId,
          npcs
        ),
        count: entry.count,
      })),
    }
  }, [
    catalog.payload,
    catalog.nameById,
    selectedUnit,
    stepIndex,
    hpLostByPrime,
    onHpLostChange,
    npcs,
    exactLocation,
  ])

  const onSeasonChange = useCallback(
    (nextSeasonId: string) => {
      const next = new URLSearchParams(location.search)
      if (nextSeasonId === seasonIds[0]) next.delete("season")
      else next.set("season", nextSeasonId)
      next.delete("tier")
      next.delete("set")
      next.delete("encounter")
      void navigate({
        pathname: "/library/raid-bosses",
        search: next.toString(),
      })
    },
    [location.search, navigate, seasonIds]
  )

  const onEncounterSelect = useCallback(
    (
      located: import("@/entities/raid-boss").ResolvedRaidBossEncounterLocation
    ) => {
      const next = new URLSearchParams(location.search)
      next.set("season", located.seasonId)
      next.set("tier", String(located.tier))
      next.set("set", String(located.set))
      next.set("encounter", String(located.encounterIndex))
      void navigate({
        pathname: `/library/raid-bosses/${located.encounter.unitSetId}`,
        search: next.toString(),
      })
    },
    [location.search, navigate]
  )

  const onEntitySelect = useCallback(
    (id: string) => {
      const next = new URLSearchParams(location.search)
      next.delete("tier")
      next.delete("set")
      next.delete("encounter")
      void navigate({
        pathname: `/library/raid-bosses/${id}`,
        search: next.toString(),
      })
    },
    [location.search, navigate]
  )

  const onViewSeasonReference = useCallback(() => {
    const next = new URLSearchParams(location.search)
    if (seasonId === seasonIds[0]) next.delete("season")
    else if (seasonId) next.set("season", seasonId)
    next.delete("tier")
    next.delete("set")
    next.delete("encounter")
    void navigate({
      pathname: "/library/raid-bosses",
      search: next.toString(),
    })
  }, [location.search, navigate, seasonId, seasonIds])

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
