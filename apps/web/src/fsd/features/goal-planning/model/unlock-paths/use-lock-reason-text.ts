import { useTranslation } from "react-i18next"
import { campaignDescriptor } from "@workspace/game-catalog"
import type { CampaignId } from "@workspace/game-domain"

import { useCampaignDisplay } from "@/shared/lib"

import type { CampaignLockReason } from "./campaign-track-gate"

/** A campaign track's full name ("Fall of Cadia Mirror Elite"), or its group id when the catalog
 *  doesn't describe it. */
export function useCampaignTrackLabel() {
  const { fullLabel } = useCampaignDisplay()
  return (groupId: CampaignId, type: string) => {
    const descriptor = campaignDescriptor(groupId, type)
    return descriptor ? fullLabel(descriptor) : groupId
  }
}

/** One line per thing that stops the player from playing a campaign yet ("Clear Indomitus first (12
 *  battles left)"), as Goals' lock reasons and the material details popover word them. */
export function useLockReasonText(): (reason: CampaignLockReason) => string {
  const { t, i18n } = useTranslation()
  const label = useCampaignTrackLabel()
  const listFormat = new Intl.ListFormat(i18n.resolvedLanguage)
  const unitName = (unitId: string) =>
    t(`characters:${unitId}`, { defaultValue: unitId })

  return (reason) => {
    switch (reason.kind) {
      case "MissingCoreCharacters":
        return t("goals.insights.lockMissingCore", {
          units: listFormat.format(reason.unitIds.map(unitName)),
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
}
