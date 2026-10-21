import { useTranslation } from "react-i18next"

import type { MissionDeployGroup } from "@/features/daily-raids"
import type { HreTeamPlan } from "@/features/hre-missions"

import { useHreTeamRecommendations } from "../../model/use-hre-team-recommendations"
import type { RunningHse } from "../../model/use-running-hse"
import { HreTeamCard } from "./hre-team-card"

/**
 * The teams for the battles to fight by hand: one per group of listed nodes whose campaigns allow
 * the same factions, built with the mission's campaign rule from only those factions and sized to
 * the group's slots, so every suggested team can deploy on its nodes.
 */
export function HreCampaignTeams({
  groups,
  plan,
  alliance,
  allianceName,
  featuredCharacterId,
  hero,
  hse,
}: {
  groups: readonly MissionDeployGroup[]
  plan: HreTeamPlan
  alliance: string | null
  allianceName: string | null
  featuredCharacterId: string | null
  hero: string
  hse: RunningHse | null
}) {
  const { t } = useTranslation(["hre"])
  const teams = useHreTeamRecommendations({
    plans: groups.map((group) => ({
      ...plan,
      size: Math.min(plan.size, group.slots),
      factions: group.factions,
    })),
    alliance,
    featuredCharacterId,
    hseTrackers: hse?.trackers ?? null,
  })
  return (
    <div className="space-y-3" data-testid="hre-campaign-teams">
      {groups.map((group, index) => {
        const view = teams[index]
        return view ? (
          <HreTeamCard
            alliance={allianceName}
            hero={hero}
            hseEvent={hse?.name ?? null}
            key={group.factions.join("|")}
            plan={plan}
            testId={`hre-campaign-team-${index}`}
            title={t("hre:teams.titleCampaigns", {
              campaigns: group.campaigns.join(", "),
            })}
            tokens={null}
            view={view}
          />
        ) : null
      })}
    </div>
  )
}
