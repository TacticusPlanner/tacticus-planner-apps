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
  maxKnownProgressionIndex,
  resolveFieldNpcName,
  resolveFieldNpcRosterId,
  unitDisplayName,
} from "@/entities/raid-boss"
import { useGuildRaidMetaCatalog } from "@/entities/guild-raid-meta"
import { useTourPageSteps } from "@/shared/tour"

import { useLibraryRouteSelection } from "../../model/use-library-route-selection"
import { RaidBossesDesktopPage } from "./desktop/raid-bosses-desktop-page"
import { RaidBossesMobilePage } from "./mobile/raid-bosses-mobile-page"
import { useRaidBossesCatalog } from "./hooks/use-raid-bosses-catalog"
import { GuildRaidMetaView, GuildRaidSeasonsView } from "./guild-raid-views"
import { useRaidBossesTutorial } from "./raid-bosses.tutorial"
import type { RaidBossesPageViewProps } from "./raid-bosses-page.view-model"

export function RaidBossesPage() {
  const { t } = useTranslation("library")
  const isMobile = useIsMobile()
  const { entityId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()

  const catalog = useRaidBossesCatalog()
  const metaCatalog = useGuildRaidMetaCatalog()
  const npcs = useLiveQuery(() => getNpcs(), [], [])

  const entityIds = useMemo(
    () =>
      catalog.status === "ready"
        ? [...catalog.bosses, ...catalog.primes].map((item) => item.unitSetId)
        : undefined,
    [catalog]
  )

  const selection = useLibraryRouteSelection({
    collectionPath: "/library/raid-bosses",
    entityId,
    entityIds,
    loading: catalog.status === "loading",
  })

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
  const selectedSeasonId = catalog.payload?.seasonConfigRotation.includes(
    requestedSeason ?? ""
  )
    ? requestedSeason!
    : catalog.payload?.seasonConfigRotation[0]
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

  const selectedUnit = selection.selectedId
    ? catalog.byId.get(selection.selectedId)
    : undefined

  const selectedName = selection.selectedId
    ? (catalog.nameById.get(selection.selectedId) ?? "")
    : ""

  // Progression step and per-prime HP-lost points are ephemeral exploration state (not URL-backed) —
  // reset whenever the selected entity changes.
  const [stepIndex, setStepIndex] = useState(0)
  const [hpLostByPrime, setHpLostByPrime] = useState<Record<string, number>>({})
  const stepForUnitRef = useRef<string | undefined>(undefined)

  useEffect(() => {
    if (!selectedUnit || !catalog.payload) return
    if (stepForUnitRef.current === selectedUnit.unitSetId) return

    stepForUnitRef.current = selectedUnit.unitSetId
    setHpLostByPrime({})
    setStepIndex(
      maxKnownProgressionIndex(
        catalog.payload,
        selectedUnit.unitSetId,
        selectedUnit.statProgression.length
      )
    )
  }, [selectedUnit, catalog.payload])

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
            (id) => catalog.nameById.get(id) ?? id
          )
        : ({ kind: "none" } as const),
    [catalog.payload, catalog.nameById, selectedUnit, stepIndex]
  )

  const fieldEnemies = useMemo(
    () =>
      catalog.payload && selectedUnit
        ? fieldNpcIdsForStep(
            catalog.payload,
            selectedUnit.unitSetId,
            stepIndex
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
    [catalog.payload, selectedUnit, stepIndex, npcs]
  )

  const adjusted = useMemo(() => {
    if (!catalog.payload || !selectedUnit) return null
    const view = buildAdjustedView(
      catalog.payload,
      selectedUnit,
      stepIndex,
      hpLostByPrime
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
  ])

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
    selectedId: selection.selectedId,
    selectedUnit,
    selectedName,
    onSelect: selection.select,
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
        isMobile ? (
          <RaidBossesMobilePage {...viewProps} />
        ) : (
          <RaidBossesDesktopPage {...viewProps} />
        )
      ) : null}
      {tab === "seasons" && catalog.payload && selectedSeasonId ? (
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
