import { campaignDescriptor } from "@workspace/game-catalog"
import type { CampaignId } from "@workspace/game-domain"

import { useCampaignDisplay } from "@/shared/lib"

/** A campaign track's full name ("Fall of Cadia Mirror Elite"), or its group id when the catalog
 *  doesn't describe it. */
export function useCampaignTrackLabel() {
  const { fullLabel } = useCampaignDisplay()
  return (groupId: CampaignId, type: string) => {
    const descriptor = campaignDescriptor(groupId, type)
    return descriptor ? fullLabel(descriptor) : groupId
  }
}
