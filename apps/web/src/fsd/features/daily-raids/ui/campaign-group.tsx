import { Children, type ReactNode } from "react"
import type { BattleId } from "@workspace/game-domain"
import { cn } from "@workspace/ui/lib/utils"

import { CampaignLocationName, EntityIcon } from "@/shared/ui"

import {
  groupConsecutiveByCampaign,
  type CampaignGroup as CampaignRowGroup,
} from "../model/campaign-groups"
import { LoneCampaignRowContext } from "./campaign-group-context"
import type { DailyRaidLocationViewModel } from "../model/daily-raids.domain"

/**
 * One campaign's battles in a raid list: a header with the campaign's icon and name with its
 * difficulty ("Indomitus Mirror Elite"), then one row per battle (`children`, each naming just its
 * battle). `location` is any of the group's locations; without one (a battle the catalog cannot
 * place) the header is left out and the row names the battle in full. A group of one row shows no
 * header either: that row names its location in full, with the campaign icon, on one line.
 */
export function CampaignGroup({
  location,
  className,
  testId,
  children,
}: {
  location: DailyRaidLocationViewModel | undefined
  className?: string
  testId?: string
  children: ReactNode
}) {
  const lone = Children.count(children) === 1
  return (
    <div
      className={cn("rounded-lg border px-2 py-1.5", className)}
      data-testid={testId}
    >
      {location && !lone ? (
        <div className="flex items-center gap-2 border-b pb-1.5">
          {location.icon ? (
            <EntityIcon
              alt=""
              className="size-10 shrink-0"
              src={location.icon}
            />
          ) : null}
          <h3 className="min-w-0 text-base/tight font-semibold wrap-break-word">
            <CampaignLocationName
              campaignName={location.campaignName}
              difficultyLabel={location.difficultyLabel}
              nodeLabel={location.difficultyLabel}
            />
          </h3>
        </div>
      ) : null}
      <LoneCampaignRowContext value={lone}>
        <ul className="divide-y">{children}</ul>
      </LoneCampaignRowContext>
    </div>
  )
}

/**
 * A one-row-per-battle list (HSE, HRE, Home) in campaign groups: each run of consecutive rows in
 * one campaign shows under one header, in the list's own order (`groupConsecutiveByCampaign`).
 * `groupRows` replaces that grouping (Home groups its rows the way Today does).
 */
export function CampaignGroupedList<Row>({
  rows,
  battleIdOf,
  locationsByBattleId,
  renderRow,
  groupRows,
  testId,
}: {
  rows: readonly Row[]
  battleIdOf: (row: Row) => BattleId
  locationsByBattleId:
    ReadonlyMap<BattleId, DailyRaidLocationViewModel> | undefined
  renderRow: (row: Row) => ReactNode
  groupRows?: (rows: readonly Row[]) => CampaignRowGroup<Row>[]
  testId: string
}) {
  const locationOf = (row: Row) => locationsByBattleId?.get(battleIdOf(row))
  const groups = groupRows
    ? groupRows(rows)
    : groupConsecutiveByCampaign(
        rows,
        (row) => locationOf(row)?.campaignKey,
        battleIdOf
      )
  return (
    <div className="grid gap-2" data-testid={testId}>
      {groups.map((group) => (
        <CampaignGroup
          key={group.key}
          location={group.items[0] ? locationOf(group.items[0]) : undefined}
          testId={`campaign-group-${group.items[0] ? battleIdOf(group.items[0]) : group.key}`}
        >
          {group.items.map((row) => renderRow(row))}
        </CampaignGroup>
      ))}
    </div>
  )
}
