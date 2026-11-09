import { useTranslation } from "react-i18next"

import {
  useFarmUnlockPaths,
  type FarmUnlockPathViewModel,
} from "@/features/goal-planning"
import { CampaignLocationName, EntityIcon } from "@/shared/ui"

const UNLOCK_PATH_LIMIT = 2

/** "Unlocks at": the closest locked nodes that drop a blocked resource and how many battles away
 *  each is, so a `NoFarmLocation` blocker says how to get past it. Renders nothing when no node
 *  drops it. */
export function FarmUnlockPaths({
  resourceId,
  testId = "farm-unlock-paths",
}: {
  resourceId: string
  testId?: string
}) {
  const { t } = useTranslation()
  const paths = useFarmUnlockPaths()(resourceId)
  if (paths.length === 0) return null

  return (
    <div className="grid gap-0.5" data-testid={testId}>
      <span className="text-muted-foreground">
        {t("goals.estimate.unlockAt")}
      </span>
      <ul aria-label={t("goals.estimate.unlockAt")} className="grid gap-0.5">
        {paths.slice(0, UNLOCK_PATH_LIMIT).map((path) => (
          <li className="flex items-center gap-1" key={path.battleId}>
            {path.icon ? (
              <EntityIcon alt="" className="size-4 shrink-0" src={path.icon} />
            ) : null}
            <span>
              <CampaignLocationName
                campaignName={path.campaignName}
                difficultyLabel={path.difficultyLabel}
                nodeLabel={path.nodeLabel}
              />
              <span className="text-muted-foreground">
                {" · "}
                {distanceText(t, path)}
              </span>
            </span>
          </li>
        ))}
      </ul>
      {paths.length > UNLOCK_PATH_LIMIT ? (
        <span className="text-muted-foreground">
          {t("goals.estimate.unlockMore", {
            count: paths.length - UNLOCK_PATH_LIMIT,
          })}
        </span>
      ) : null}
    </div>
  )
}

function distanceText(
  t: ReturnType<typeof useTranslation>["t"],
  path: FarmUnlockPathViewModel
): string {
  if (path.kind === "event") return t("goals.estimate.unlockDuringEvent")
  return path.started
    ? t("goals.estimate.battlesToGo", { count: path.battlesToGo })
    : t("goals.estimate.battlesToGoNotStarted", { count: path.battlesToGo })
}
