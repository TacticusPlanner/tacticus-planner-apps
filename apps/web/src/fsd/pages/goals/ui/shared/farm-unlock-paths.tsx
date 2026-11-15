import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"

import {
  useFarmUnlockPaths,
  type FarmUnlockPathViewModel,
} from "@/features/goal-planning"
import { CampaignLocationName, EntityIcon } from "@/shared/ui"

import { CampaignLockReasons } from "./campaign-lock-reasons"

const UNLOCK_PATH_LIMIT = 2

/** "Unlocks at": the closest locked nodes that drop a blocked resource, how many battles away each
 *  is (counting the campaigns that must be cleared first) and anything else in the way (Power
 *  Level, missing heroes). The rest are behind a "+N more" toggle. Renders nothing when no node
 *  drops it. */
export function FarmUnlockPaths({
  resourceId,
  testId = "farm-unlock-paths",
  showHeading = true,
}: {
  resourceId: string
  testId?: string
  /** Off where the surrounding row already reads as "where it unlocks". */
  showHeading?: boolean
}) {
  const { t } = useTranslation()
  const paths = useFarmUnlockPaths()(resourceId)
  const [expanded, setExpanded] = useState(false)
  if (paths.length === 0) return null

  const shown = expanded ? paths : paths.slice(0, UNLOCK_PATH_LIMIT)
  const hidden = paths.length - UNLOCK_PATH_LIMIT

  return (
    <div className="grid gap-1" data-testid={testId}>
      {showHeading ? (
        <span className="text-muted-foreground">
          {t("goals.estimate.unlockAt")}
        </span>
      ) : null}
      <ul aria-label={t("goals.estimate.unlockAt")} className="grid gap-1.5">
        {shown.map((path) => (
          <li className="grid gap-0.5" key={path.battleId}>
            <span className="flex items-center gap-1.5">
              {path.icon ? (
                <EntityIcon
                  alt=""
                  className="size-4 shrink-0"
                  src={path.icon}
                />
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
            </span>
            {path.kind === "campaign" ? (
              <CampaignLockReasons
                className="pl-5"
                reasons={path.lockReasons}
              />
            ) : null}
          </li>
        ))}
      </ul>
      {hidden > 0 ? (
        <Button
          aria-expanded={expanded}
          className="relative h-auto justify-self-start p-0 text-xs after:absolute after:inset-x-0 after:-inset-y-2 pointer-coarse:after:-inset-y-4"
          onClick={() => setExpanded((value) => !value)}
          type="button"
          variant="link"
        >
          {expanded
            ? t("goals.estimate.unlockFewer")
            : t("goals.estimate.unlockMore", { count: hidden })}
        </Button>
      ) : null}
    </div>
  )
}

function distanceText(
  t: ReturnType<typeof useTranslation>["t"],
  path: FarmUnlockPathViewModel
): string {
  if (path.kind === "event") return t("goals.estimate.unlockDuringEvent")
  const count = path.prerequisiteBattles + path.battlesToGo
  return path.started
    ? t("goals.estimate.battlesToGo", { count })
    : t("goals.estimate.battlesToGoNotStarted", { count })
}
