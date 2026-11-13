import { useTranslation } from "react-i18next"
import { Badge } from "@workspace/ui/components/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { campaignIcon } from "@workspace/game-catalog"

import type { PlanCampaignProgression } from "@/features/goal-planning"
import { energyIconUrl, EntityIcon } from "@/shared/ui"

import { CampaignLockReasons } from "../shared/campaign-lock-reasons"
import { useCampaignTrackLabel } from "../shared/campaign-track-label"
import { GoalResourceIcon } from "../shared/goal-resource-icon"

/** "Campaigns to push" (V1's Campaign Progression): the uncleared campaigns that would unblock the
 *  plan's goals or cut their farming energy, each with the battles left, what it unblocks (by
 *  material icon), the energy it saves and what stops the player from playing it yet, with an
 *  Unlock goal shortcut for a missing core hero. */
export function InsightsCampaignProgression({
  campaigns,
}: {
  campaigns: PlanCampaignProgression[]
}) {
  const { t, i18n } = useTranslation()
  const label = useCampaignTrackLabel()
  const fmt = (value: number) =>
    new Intl.NumberFormat(i18n.resolvedLanguage).format(value)

  if (campaigns.length === 0) return null

  return (
    <Card id="campaigns-to-push">
      <CardHeader>
        <CardTitle>{t("goals.insights.progressionTitle")}</CardTitle>
        <CardDescription>
          {t("goals.insights.progressionDescription")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ol
          aria-label={t("goals.insights.progressionTitle")}
          className="flex flex-col gap-3 text-sm"
        >
          {campaigns.map((campaign) => {
            const icon = campaignIcon(campaign.campaignGroupId, campaign.type)
            return (
              <li
                className="flex flex-col gap-2.5 rounded-xl border p-3"
                data-testid="insights-campaign-progression"
                key={campaign.key}
              >
                <span className="flex items-center gap-2.5">
                  {icon ? (
                    <EntityIcon alt="" className="size-9 shrink-0" src={icon} />
                  ) : null}
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate font-medium">
                      {label(campaign.campaignGroupId, campaign.type)}
                    </span>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {campaign.started
                        ? t("goals.insights.battlesLeft", {
                            count: campaign.battlesLeft,
                          })
                        : t("goals.insights.battlesLeftNotStarted", {
                            count: campaign.battlesLeft,
                          })}
                    </span>
                  </span>
                  {campaign.energySaved > 0 ? (
                    <Badge
                      className="shrink-0 gap-1 tabular-nums"
                      variant="secondary"
                    >
                      <EntityIcon
                        alt=""
                        className="size-3.5 shrink-0"
                        src={energyIconUrl}
                      />
                      {t("goals.insights.energySaved", {
                        energy: fmt(campaign.energySaved),
                      })}
                    </Badge>
                  ) : null}
                </span>
                {campaign.unblocks.length > 0 ? (
                  <ul className="flex flex-col gap-1.5 text-xs">
                    {campaign.unblocks.map((unblock) => (
                      <li
                        className="flex items-center gap-2"
                        key={unblock.resourceId}
                      >
                        <GoalResourceIcon
                          className="size-6"
                          resourceId={unblock.resourceId}
                        />
                        {t("goals.insights.unblocks", {
                          material: unblock.label,
                          count: unblock.battlesToGo,
                        })}
                      </li>
                    ))}
                  </ul>
                ) : null}
                <CampaignLockReasons reasons={campaign.lockReasons} />
              </li>
            )
          })}
        </ol>
      </CardContent>
    </Card>
  )
}
