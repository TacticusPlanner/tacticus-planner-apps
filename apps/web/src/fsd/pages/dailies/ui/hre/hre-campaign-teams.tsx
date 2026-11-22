import { useTranslation } from "react-i18next"

import type { MissionDeployGroup } from "@/features/daily-raids"
import type { HreMission, HreTeamPlan } from "@/entities/hre-mission"

import { useHreTeamRecommendations } from "@/features/team-recommendations"
import { runningHseFor } from "../../model/running-hse"
import type { RunningHse } from "../../model/running-hse"
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
  hses,
  missions,
}: {
  groups: readonly MissionDeployGroup[]
  plan: HreTeamPlan
  alliance: string | null
  allianceName: string | null
  featuredCharacterId: string | null
  hero: string
  /** The running personal HSEs: the one scoring in campaign battles leads the teams. */
  hses: readonly RunningHse[]
  missions: readonly HreMission[]
}) {
  const { t } = useTranslation(["hre"])
  const hse = runningHseFor(hses, "battle")
  const teams = useHreTeamRecommendations({
    plans: groups.map((group) => ({
      ...plan,
      size: Math.min(plan.size, group.slots),
      factions: group.factions,
    })),
    alliance,
    featuredCharacterId,
    hseTrackersFor: () => hse?.trackers ?? null,
  })
  return (
    <div className="space-y-3" data-testid="hre-campaign-teams">
      {groups.map((group, index) => {
        const view = teams[index]
        const fielded =
          view?.status === "ready" && view.team.status === "ready"
            ? view.team.team.members.length
            : 0
        return view ? (
          <HreTeamCard
            alliance={allianceName}
            hero={hero}
            hseEvent={hse?.name ?? null}
            key={group.factions.join("|")}
            missions={missions}
            note={
              group.fewestSlots < fielded
                ? t("hre:teams.fewerSlots", { slots: group.fewestSlots })
                : null
            }
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
