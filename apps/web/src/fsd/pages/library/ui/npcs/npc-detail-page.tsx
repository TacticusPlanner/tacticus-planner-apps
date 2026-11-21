import { useTranslation } from "react-i18next"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"

import { UnitNavBar } from "../unit/unit-nav-bar"
import { NpcDetail } from "./npc-detail"
import type { NpcsPageViewProps } from "./npcs-page.view-model"
import { NpcsToolbar } from "./npcs-toolbar"

const NPCS_PATH = "/library/npcs"

/** `/library/npcs/{id}`: the shared unit top bar (back to NPCs, Previous / Next with the position
 *  in the list it was opened from), the Filters button, then the NPC's detail at full width. */
export function NpcDetailPage(props: NpcsPageViewProps) {
  const {
    selectedName,
    neighbours,
    nameOf,
    filters,
    filterOptions,
    activeFilterCount,
    onFiltersChange,
    onClearFilters,
  } = props
  const { t } = useTranslation("library")
  const isMobile = useIsMobile()
  const navTarget = (id: string | undefined) =>
    id ? { to: `${NPCS_PATH}/${id}`, name: nameOf(id), state: null } : undefined

  return (
    <div className="flex flex-col gap-6" data-testid="npc-detail-page">
      <div className="-mx-4 md:-mx-6">
        <UnitNavBar
          back={{ to: NPCS_PATH, label: t("npcs.title") }}
          breadcrumb={[
            t("characterUnit.breadcrumbLibrary"),
            t("npcs.title"),
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
      <NpcsToolbar
        activeCount={activeFilterCount}
        filters={filters}
        onChange={onFiltersChange}
        onClear={onClearFilters}
        options={filterOptions}
        showSearch={false}
      />
      <NpcDetail {...props} compact={isMobile} />
    </div>
  )
}
