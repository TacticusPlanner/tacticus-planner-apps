import { useTranslation } from "react-i18next"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"

import { unitNeighbours } from "@/entities/unit"

import { UnitNavBar } from "../unit/unit-nav-bar"
import { RaidBossDetail } from "./raid-boss-detail"
import type { RaidBossesPageViewProps } from "./raid-bosses-page.view-model"

/** A boss or prime's page: the shared unit top bar (back to the season reference, Previous / Next
 *  through the bosses then the primes, with the position), then the detail at full width. */
export function RaidBossDetailPage({
  bosses,
  primes,
  selectedUnit,
  selectedName,
  entityPath,
  seasonReferencePath,
  stepIndex,
  onStepChange,
  modifierContext,
  fieldEnemies,
  adjusted,
}: RaidBossesPageViewProps) {
  const { t } = useTranslation("library")
  const isMobile = useIsMobile()
  const order = [...bosses, ...primes]
  const neighbours = unitNeighbours(
    order.map((item) => item.unitSetId),
    selectedUnit.unitSetId
  )
  const navTarget = (id: string | undefined) =>
    id
      ? {
          to: entityPath(id),
          name: order.find((item) => item.unitSetId === id)?.name ?? id,
          state: null,
        }
      : undefined

  return (
    <div className="flex flex-col gap-6" data-testid="raid-boss-detail-page">
      <div className="-mx-4 md:-mx-6">
        <UnitNavBar
          back={{
            to: seasonReferencePath,
            label: t("raidBosses.seasonReference"),
          }}
          breadcrumb={[
            t("characterUnit.breadcrumbLibrary"),
            t("raidBosses.tabs.details"),
            selectedName,
          ]}
          isMobile={isMobile}
          next={navTarget(neighbours.nextId)}
          position={
            neighbours.index >= 0
              ? t("unit.nav.position", {
                  index: neighbours.index + 1,
                  total: neighbours.total,
                })
              : undefined
          }
          previous={navTarget(neighbours.previousId)}
        />
      </div>
      <RaidBossDetail
        adjusted={adjusted}
        compact={isMobile}
        fieldEnemies={fieldEnemies}
        modifierContext={modifierContext}
        name={selectedName}
        onStepChange={onStepChange}
        stepIndex={stepIndex}
        unit={selectedUnit}
      />
    </div>
  )
}
