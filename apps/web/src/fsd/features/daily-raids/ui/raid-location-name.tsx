import type { DailyRaidLocationViewModel } from "../model/daily-raids.domain"

/**
 * A location's name as one line: campaign + difficulty + node ("Indomitus Mirror Elite 36"), all at
 * the same size, so it reads the way the game's campaign picker is navigated (campaign + tier, then
 * node). Wraps between words only; a battle the catalog cannot name shows its raw id.
 */
export function RaidLocationName({
  fallbackLabel,
  location,
}: {
  fallbackLabel: string
  location: DailyRaidLocationViewModel | undefined
}) {
  return (
    <div className="text-sm leading-tight font-medium break-words">
      <span>{location?.campaignName ?? fallbackLabel}</span>
      {location?.nodeLabel ? (
        <>
          {" "}
          <span>{location.nodeLabel}</span>
        </>
      ) : null}
    </div>
  )
}
