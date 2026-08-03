import { useState, type ReactNode } from "react"
import { useOutletContext } from "react-router"
import { Swords } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"
import { Separator } from "@workspace/ui/components/separator"

import { useDailyRaids } from "../model/use-daily-raids"
import { energyIconUrl, EntityIcon } from "@/shared/ui"
import type { DailiesOutletContext } from "./dailies-layout"
import { RaidSchedule } from "./raid-schedule"
import { RaidState } from "./raid-state"
import { useTodayTutorial } from "./today.tutorial"

const BONUS_LIMIT = 3

export function TodayPage() {
  const context = useOutletContext<DailiesOutletContext>()
  const { t } = useTranslation("dailies")
  const [showAllBonus, setShowAllBonus] = useState(false)
  const raids = useDailyRaids(context.projectId)
  useTodayTutorial()

  if (context.projectsUnavailable) return <RaidState state="no-project" />
  if (raids.status !== "ready") return <RaidState state={raids.status} />

  const bonusEntries = showAllBonus
    ? raids.bonus.entries
    : raids.bonus.entries.slice(0, BONUS_LIMIT)

  return (
    <div className="space-y-5 md:space-y-7" data-testid="today-page">
      <section className="space-y-3" data-testid="today-schedule">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">{t("today.title")}</h2>
          <p className="sr-only">
            {t("today.summary", {
              energy: raids.today.energyTotal,
              raids: raids.today.raidsTotal,
            })}
          </p>
          <div aria-hidden="true" className="flex flex-wrap gap-2">
            <BadgeStat
              icon={
                <EntityIcon alt="" className="size-4" src={energyIconUrl} />
              }
              value={raids.today.energyTotal}
            />
            <BadgeStat
              icon={<Swords className="size-4 text-muted-foreground" />}
              value={raids.today.raidsTotal}
            />
          </div>
        </div>
        {raids.today.entries.length > 0 ? (
          <RaidSchedule
            entries={raids.today.entries}
            attemptsUsedByBattle={raids.today.attemptsUsedByBattle}
            goalsById={raids.goalsById}
            locationsByBattleId={raids.locationsByBattleId}
            resourceLabels={raids.resourceLabels}
            resourceProgress={raids.resourceProgressByDay.get(1) ?? new Map()}
            resourceVisuals={raids.resourceVisuals}
            testId="today-raid-list"
          />
        ) : (
          <RaidState state="no-farmable" />
        )}
      </section>
      <Separator />
      <section className="space-y-3" data-testid="bonus-raids">
        <h2 className="text-lg font-semibold">{t("bonus.title")}</h2>
        {bonusEntries.length > 0 ? (
          <>
            <RaidSchedule
              entries={bonusEntries}
              attemptsUsedByBattle={raids.bonus.attemptsUsedByBattle}
              goalsById={raids.goalsById}
              locationsByBattleId={raids.locationsByBattleId}
              resourceLabels={raids.resourceLabels}
              resourceProgress={raids.resourceProgressByDay.get(1) ?? new Map()}
              resourceVisuals={raids.resourceVisuals}
              testId="bonus-raid-list"
            />
            {!showAllBonus && raids.bonus.entries.length > BONUS_LIMIT ? (
              <Button variant="outline" onClick={() => setShowAllBonus(true)}>
                {t("bonus.showMore")}
              </Button>
            ) : null}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">{t("bonus.empty")}</p>
        )}
      </section>
    </div>
  )
}

function BadgeStat({ icon, value }: { icon: ReactNode; value: number }) {
  return (
    <span className="flex h-7 items-center gap-1.5 rounded-full bg-muted px-2.5 text-sm font-medium tabular-nums">
      {icon}
      {value}
    </span>
  )
}
