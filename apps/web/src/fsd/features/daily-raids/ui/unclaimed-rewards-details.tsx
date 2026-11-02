import { useTranslation } from "react-i18next"

import type { UnclaimedTrackRewards } from "../model/battle-progress"
import { OneTimeRewards } from "./one-time-rewards"

/**
 * A track's one-time medal and milestone rewards still to claim, collapsed under a summary line;
 * "all claimed" once nothing is left.
 */
export function UnclaimedRewardsDetails({
  unclaimed,
  "data-testid": testId,
}: {
  unclaimed: UnclaimedTrackRewards
  "data-testid"?: string
}) {
  const { t } = useTranslation("dailies")
  if (unclaimed.battleCount === 0) {
    return (
      <p className="text-xs text-muted-foreground" data-testid={testId}>
        {t("battleProgress.unclaimedEvents.allClaimed")}
      </p>
    )
  }
  return (
    <details className="min-w-0" data-testid={testId}>
      <summary className="cursor-pointer text-xs text-muted-foreground">
        {t("battleProgress.unclaimedEvents.title")} ·{" "}
        {t("battleProgress.unclaimedEvents.battles", {
          count: unclaimed.battleCount,
        })}
      </summary>
      <OneTimeRewards rewards={unclaimed.rewards} className="mt-2" />
    </details>
  )
}
