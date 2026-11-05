import type { DailyRaidLocationViewModel } from "../model/daily-raids.domain"

/**
 * A location's name as one line: campaign + difficulty + node ("Indomitus Mirror Elite 36"), all at
 * the same size (tier word in italics), so it reads the way the game's campaign picker is navigated (campaign + tier, then
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
          <NodeLabel
            difficultyLabel={location.difficultyLabel}
            nodeLabel={location.nodeLabel}
          />
        </>
      ) : null}
    </div>
  )
}

/** "Elite 36" with the difficulty word in italics, so the tier stands apart from the campaign name. */
function NodeLabel({
  difficultyLabel,
  nodeLabel,
}: {
  difficultyLabel: string | undefined
  nodeLabel: string
}) {
  if (!difficultyLabel || !nodeLabel.startsWith(difficultyLabel)) {
    return <span>{nodeLabel}</span>
  }
  return (
    <span>
      <em>{difficultyLabel}</em>
      {nodeLabel.slice(difficultyLabel.length)}
    </span>
  )
}
