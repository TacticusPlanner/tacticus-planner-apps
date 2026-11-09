import { useTranslation } from "react-i18next"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { campaignDescriptor, campaignIcon } from "@workspace/game-catalog"
import type { CampaignId } from "@workspace/game-domain"

import type {
  PlanCampaignLockReason,
  PlanCampaignProgression,
} from "@/features/goal-planning"
import { useCampaignDisplay } from "@/shared/lib"
import { energyIconUrl, EntityIcon } from "@/shared/ui"

/** "Campaigns to push" (V1's Campaign Progression): the uncleared campaigns that would unblock the
 *  plan's goals or cut their farming energy, each with the battles left, what it unblocks, the energy
 *  it saves and what stops the player from playing it yet. */
export function InsightsCampaignProgression({
  campaigns,
}: {
  campaigns: PlanCampaignProgression[]
}) {
  const { t, i18n } = useTranslation()
  const { fullLabel } = useCampaignDisplay()
  const listFormat = new Intl.ListFormat(i18n.resolvedLanguage)
  const fmt = (value: number) =>
    new Intl.NumberFormat(i18n.resolvedLanguage).format(value)
  const label = (groupId: CampaignId, type: string) => {
    const descriptor = campaignDescriptor(groupId, type)
    return descriptor ? fullLabel(descriptor) : groupId
  }

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
          className="flex flex-col gap-4 text-sm"
        >
          {campaigns.map((campaign) => {
            const icon = campaignIcon(campaign.campaignGroupId, campaign.type)
            return (
              <li
                className="flex flex-col gap-1"
                data-testid="insights-campaign-progression"
                key={campaign.key}
              >
                <span className="flex justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-1.5 font-medium">
                    {icon ? (
                      <EntityIcon
                        alt=""
                        className="size-5 shrink-0"
                        src={icon}
                      />
                    ) : null}
                    {label(campaign.campaignGroupId, campaign.type)}
                  </span>
                  <span className="shrink-0 text-muted-foreground tabular-nums">
                    {campaign.started
                      ? t("goals.insights.battlesLeft", {
                          count: campaign.battlesLeft,
                        })
                      : t("goals.insights.battlesLeftNotStarted", {
                          count: campaign.battlesLeft,
                        })}
                  </span>
                </span>
                {campaign.unblocks.length > 0 ? (
                  <ul className="flex flex-col gap-0.5 text-xs">
                    {campaign.unblocks.map((unblock) => (
                      <li key={unblock.resourceId}>
                        {t("goals.insights.unblocks", {
                          material: unblock.label,
                          count: unblock.battlesToGo,
                        })}
                      </li>
                    ))}
                  </ul>
                ) : null}
                {campaign.energySaved > 0 ? (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <EntityIcon
                      alt=""
                      className="size-4 shrink-0"
                      src={energyIconUrl}
                    />
                    {t("goals.insights.energySaved", {
                      energy: fmt(campaign.energySaved),
                    })}
                  </span>
                ) : null}
                {campaign.lockReasons.map((reason) => (
                  <span
                    className="text-xs text-amber-800 dark:text-amber-400"
                    key={reason.kind}
                  >
                    {lockReasonText(t, reason, label, listFormat)}
                  </span>
                ))}
              </li>
            )
          })}
        </ol>
      </CardContent>
    </Card>
  )
}

function lockReasonText(
  t: ReturnType<typeof useTranslation>["t"],
  reason: PlanCampaignLockReason,
  label: (groupId: CampaignId, type: string) => string,
  listFormat: Intl.ListFormat
): string {
  switch (reason.kind) {
    case "MissingCoreCharacters":
      return t("goals.insights.lockMissingCore", {
        units: listFormat.format(
          reason.unitIds.map((unitId) =>
            t(`characters:${unitId}`, { defaultValue: unitId })
          )
        ),
      })
    case "RequiredCampaignNotCleared":
      return t("goals.insights.lockRequiredCampaign", {
        campaign: label(reason.campaignGroupId, reason.type),
        count: reason.battlesLeft,
      })
    case "PowerLevelTooLow":
      return t("goals.insights.lockPowerLevel", {
        required: reason.required,
        current: reason.current,
      })
  }
}
