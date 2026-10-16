import {
  getCampaignBattles,
  getCampaignDefinitions,
} from "@workspace/game-catalog/queries"
import {
  getCampaignEventProgress,
  getLiveProgress,
  getPlayerCharacters,
} from "@workspace/player-data/queries"

/**
 * Reads everything the Campaign Events page needs from the local catalog and player-data stores,
 * settled so a failed read becomes `{ status: "error" }` instead of a rejection: `useLiveQuery`
 * re-throws rejections during render, which would reach the route error boundary rather than the
 * page's own load-error state. A resolved `synced: undefined` is not a failure — it means the
 * profile has never synced.
 */
export async function loadCampaignEventsData() {
  try {
    const [definitions, battles, synced, characters, liveProgress] =
      await Promise.all([
        getCampaignDefinitions(),
        getCampaignBattles(),
        getCampaignEventProgress(),
        getPlayerCharacters(),
        getLiveProgress(),
      ])
    return {
      status: "ready" as const,
      data: { definitions, battles, synced, characters, liveProgress },
    }
  } catch {
    return { status: "error" as const }
  }
}
