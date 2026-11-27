import { useTranslation } from "react-i18next"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"
import { cn } from "@workspace/ui/lib/utils"

import {
  DailyMissions,
  MissionChainCard,
  useEventRewardFormat,
} from "@/widgets/event-rewards"

import { useSurvivalContext } from "../model/survival-context"

/**
 * Missions: the daily missions and the free and premium chains, rendered as the event shop renders
 * them. A free chain pays Stat Boosts, a premium one needs the Season Pass; each says so.
 */
export function MissionsTab() {
  const { t, i18n } = useTranslation("survival")
  const { event } = useSurvivalContext()
  const isMobile = useIsMobile()
  const format = useEventRewardFormat()
  const { missions, rules } = event
  const stats = new Intl.ListFormat(i18n.language, {
    type: "conjunction",
  }).format(
    rules.statBoostStats.map((stat) =>
      t(`stats.${stat}` as never, { defaultValue: stat })
    )
  )
  const chains = [
    ...missions.free.map((chain) => ({ chain, kind: "free" as const })),
    ...missions.premium.map((chain) => ({ chain, kind: "premium" as const })),
  ]
  return (
    <div className="flex flex-col gap-4" data-testid="survival-missions">
      <DailyMissions
        empty={t("missions.none")}
        format={format}
        missions={missions.daily}
        phone={isMobile}
        testIdPrefix="survival"
      />
      {chains.length === 0 ? null : (
        <div
          className={cn(
            "grid gap-3",
            isMobile ? "grid-cols-1" : "md:grid-cols-2"
          )}
        >
          {chains.map(({ chain, kind }) => {
            const boosts = chain.missions.some((mission) =>
              mission.rewards.some(
                (reward) => reward.type === "survivalBoost_stats"
              )
            )
            return (
              <MissionChainCard
                chain={chain}
                format={format}
                key={chain.id}
                kind={kind}
                testIdPrefix="survival"
              >
                {kind === "premium" ? (
                  <p className="text-xs text-muted-foreground">
                    {t("missions.premiumNote")}
                  </p>
                ) : null}
                {boosts && rules.statBoostPct > 0 ? (
                  <p className="text-xs text-muted-foreground">
                    {t("missions.statBoostNote", {
                      pct: rules.statBoostPct,
                      stats,
                    })}
                  </p>
                ) : null}
              </MissionChainCard>
            )
          })}
        </div>
      )}
    </div>
  )
}
