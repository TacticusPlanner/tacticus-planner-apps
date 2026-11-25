import { useTranslation } from "react-i18next"
import { ChevronDown, Gift } from "lucide-react"
import { Badge } from "@workspace/ui/components/badge"

import type { UnclaimedTrackRewards } from "../model/battle-progress"
import { OneTimeRewards } from "./one-time-rewards"

/**
 * A track's one-time medal and milestone rewards still to claim: a primary "N battles to claim"
 * badge that opens the reward list. Nothing renders once everything is claimed, so only the
 * exception draws the eye.
 */
export function UnclaimedRewardsDetails({
  unclaimed,
  "data-testid": testId,
}: {
  unclaimed: UnclaimedTrackRewards
  "data-testid"?: string
}) {
  const { t } = useTranslation("dailies")
  if (unclaimed.battleCount === 0) return null
  return (
    <details className="group min-w-0" data-testid={testId}>
      <summary className="w-fit cursor-pointer list-none rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none [&::-webkit-details-marker]:hidden">
        <Badge className="text-sm">
          <Gift aria-hidden />
          {t("battleProgress.unclaimedEvents.toClaim", {
            count: unclaimed.battleCount,
          })}
          <ChevronDown
            aria-hidden
            className="transition-transform group-open:rotate-180"
          />
        </Badge>
      </summary>
      <OneTimeRewards rewards={unclaimed.rewards} className="mt-2" />
    </details>
  )
}
