import { useEffect, useMemo, useRef, useState } from "react"
import { useParams } from "react-router"
import { useTranslation } from "react-i18next"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"

import {
  findEncountersForUnit,
  maxKnownProgressionIndex,
} from "@/entities/raid-boss"
import { useTourPageSteps } from "@/shared/tour"

import { useLibraryRouteSelection } from "../../model/use-library-route-selection"
import { RaidBossesDesktopPage } from "./desktop/raid-bosses-desktop-page"
import { RaidBossesMobilePage } from "./mobile/raid-bosses-mobile-page"
import { useRaidBossesCatalog } from "./hooks/use-raid-bosses-catalog"
import { useRaidBossesTutorial } from "./raid-bosses.tutorial"
import type { RaidBossesPageViewProps } from "./raid-bosses-page.view-model"

export function RaidBossesPage() {
  const { t } = useTranslation("library")
  const isMobile = useIsMobile()
  const { entityId } = useParams()

  useTourPageSteps(useRaidBossesTutorial())

  const catalog = useRaidBossesCatalog()

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

  const selectedUnit = selection.selectedId
    ? catalog.byId.get(selection.selectedId)
    : undefined

  const selectedName = useMemo(
    () =>
      [...catalog.bosses, ...catalog.primes].find(
        (item) => item.unitSetId === selection.selectedId
      )?.name ?? "",
    [catalog.bosses, catalog.primes, selection.selectedId]
  )

  // Progression step is ephemeral exploration state (not URL-backed) — reset to the max known step
  // whenever the selected entity changes.
  const [stepIndex, setStepIndex] = useState(0)
  const stepForUnitRef = useRef<string | undefined>(undefined)

  useEffect(() => {
    if (!selectedUnit || !catalog.payload) return
    if (stepForUnitRef.current === selectedUnit.unitSetId) return

    stepForUnitRef.current = selectedUnit.unitSetId
    setStepIndex(
      maxKnownProgressionIndex(
        catalog.payload,
        selectedUnit.unitSetId,
        selectedUnit.statProgression.length
      )
    )
  }, [selectedUnit, catalog.payload])

  const encounters = useMemo(
    () =>
      catalog.payload && selectedUnit
        ? findEncountersForUnit(catalog.payload, selectedUnit.unitSetId)
        : [],
    [catalog.payload, selectedUnit]
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

  const viewProps: RaidBossesPageViewProps = {
    bosses: catalog.bosses,
    primes: catalog.primes,
    selectedId: selection.selectedId,
    selectedUnit,
    selectedName,
    onSelect: selection.select,
    stepIndex,
    onStepChange: setStepIndex,
    encounters,
  }

  return (
    <div className="flex flex-col gap-6" data-testid="raid-bosses-library-page">
      <p className="text-muted-foreground">
        {t("collections.raidBosses.description")}
      </p>
      {isMobile ? (
        <RaidBossesMobilePage {...viewProps} />
      ) : (
        <RaidBossesDesktopPage {...viewProps} />
      )}
    </div>
  )
}
