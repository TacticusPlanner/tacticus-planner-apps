import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useLocation, useNavigate, useParams } from "react-router"
import { useTranslation } from "react-i18next"
import { useLiveQuery } from "dexie-react-hooks"
import { fieldNpcIcon } from "@workspace/game-catalog"
import { getNpcs } from "@workspace/game-catalog/queries"
import { Button } from "@workspace/ui/components/button"
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
} from "@/entities/raid-boss"
import { useTourPageSteps } from "@/shared/tour"

import { RaidBossesDesktopPage } from "./desktop/raid-bosses-desktop-page"
import { RaidBossesMobilePage } from "./mobile/raid-bosses-mobile-page"
import { useRaidBossesCatalog } from "./hooks/use-raid-bosses-catalog"
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

  useTourPageSteps(useRaidBossesTutorial(Boolean(entityId)))

  const catalog = useRaidBossesCatalog()
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

  if (catalog.status === "loading") {
    return (
      <p
        className="py-10 text-center text-muted-foreground"
        data-testid="raid-bosses-library-page"
      >
        {t("loading")}
      </p>
    )
  }

  if (catalog.status === "absent") {
    return (
      <p
        className="py-10 text-center text-muted-foreground"
        data-testid="raid-bosses-library-page"
      >
        {t("collections.raidBossesNoRecords")}
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
      {!entityId && seasonReference ? (
        <RaidBossSeasonReference
          viewModel={seasonReference}
          seasonIds={seasonIds}
          onSeasonChange={onSeasonChange}
          onEncounterSelect={onEncounterSelect}
        />
      ) : entityId && selectedUnit ? (
        isMobile ? (
          <RaidBossesMobilePage {...viewProps} />
        ) : (
          <RaidBossesDesktopPage {...viewProps} />
        )
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
      )}
    </div>
  )
}
