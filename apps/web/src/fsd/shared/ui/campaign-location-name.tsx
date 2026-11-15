/**
 * The app's one way to render a campaign location inline: "Indomitus Mirror *Elite* 36" — campaign
 * name, tier word in italics, node number, all at the parent's size. `nodeLabel` is the tier word +
 * node ("Elite 36"); a campaign event's Standard tier has no word, so it is just the node ("3").
 */
export function CampaignLocationName({
  campaignName,
  difficultyLabel,
  nodeLabel,
}: {
  campaignName: string
  difficultyLabel?: string
  nodeLabel?: string
}) {
  return (
    <>
      <span>{campaignName}</span>
      {nodeLabel ? (
        <>
          {" "}
          {difficultyLabel && nodeLabel.startsWith(difficultyLabel) ? (
            <span>
              <em>{difficultyLabel}</em>
              {nodeLabel.slice(difficultyLabel.length)}
            </span>
          ) : (
            <span>{nodeLabel}</span>
          )}
        </>
      ) : null}
    </>
  )
}
