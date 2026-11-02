import { useState } from "react"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"

import {
  unitLibraryPath,
  UnitRosterRow,
  type UnitFaction,
  type UnitKind,
  type UnitTileUnit,
} from "@/entities/unit"

import type {
  CollectionFactionGroup,
  CollectionListedUnit,
} from "../../model/collection-view"
import { FactionHeader } from "./faction-header"

// Faction sections flow in equal columns at least 420px wide (the full width when narrower), with
// the same gaps as the Cards grid.
const sectionGrid =
  "grid items-start gap-2.5 sm:gap-3 [grid-template-columns:repeat(auto-fill,minmax(min(26.25rem,100%),1fr))]"

/**
 * The Roster view: the same faction groups as the Cards view, each unit a dense row. On desktop a
 * row is a link to the unit's Library page; on mobile it expands in place, one row at a time, and
 * the expanded row holds the link.
 */
export function CollectionRoster({
  groups,
  showOwned,
  origins,
}: {
  groups: readonly CollectionFactionGroup[]
  showOwned: boolean
  origins: Record<UnitKind, unknown>
}) {
  const row = useRosterRow(origins)

  return (
    <div className={sectionGrid}>
      {groups.map((group) => (
        <section
          key={group.factionId}
          aria-label={group.factionName}
          className="flex flex-col overflow-hidden rounded-[10px] border bg-card"
          data-testid="collection-roster-section"
          data-faction={group.factionId}
        >
          <FactionHeader group={group} showOwned={showOwned} />
          <ul className="flex flex-col px-1 py-1">
            {group.units.map((unit) => row(unit))}
          </ul>
        </section>
      ))}
    </div>
  )
}

/**
 * The Roster view without faction groups: one card of rows flowing in equal columns, left to right
 * then down, so reading, DOM and keyboard order agree. Each row shows its faction.
 */
export function CollectionRosterList({
  units,
  origins,
}: {
  units: readonly CollectionListedUnit[]
  origins: Record<UnitKind, unknown>
}) {
  const row = useRosterRow(origins)

  return (
    <ul className={ungroupedRows} data-testid="collection-ungrouped">
      {units.map(({ unit, factionId, factionName }) =>
        row(unit, { id: factionId, name: factionName })
      )}
    </ul>
  )
}

const ungroupedRows =
  "grid gap-x-3 rounded-[10px] border bg-card px-1 py-1 [grid-template-columns:repeat(auto-fill,minmax(min(26.25rem,100%),1fr))]"

/**
 * Renders one roster row as a list item: a link on desktop, an expandable row on mobile where the
 * list keeps a single expanded row (a row that left the list simply stops matching).
 */
function useRosterRow(origins: Record<UnitKind, unknown>) {
  const isMobile = useIsMobile()
  const [expandedId, setExpandedId] = useState<string | null>(null)

  return (unit: UnitTileUnit, faction?: UnitFaction) => {
    const key = `${unit.kind}:${unit.unitId}`
    return (
      <li key={key} className="min-w-0 border-b last:border-b-0">
        <UnitRosterRow
          unit={unit}
          faction={faction}
          link={{
            to: unitLibraryPath(unit.kind, unit.unitId),
            state: origins[unit.kind],
          }}
          form={isMobile ? "expandable" : "link"}
          expanded={expandedId === key}
          onToggle={() => setExpandedId((open) => (open === key ? null : key))}
          testId={
            unit.data.state === "owned"
              ? "collection-owned-row"
              : "collection-unowned-row"
          }
        />
      </li>
    )
  }
}
