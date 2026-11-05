import { useTranslation } from "react-i18next"
import { ListChecks } from "lucide-react"
import { characterIcon } from "@workspace/game-catalog"
import type { UnitId } from "@workspace/game-domain"
import { Button } from "@workspace/ui/components/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import { cn } from "@workspace/ui/lib/utils"

import {
  EventUnitChip,
  useMissionLabel,
  type EventUnitChipData,
} from "@/entities/legendary-event"
import { EntityIcon } from "@/shared/ui"

import type { MissionGain } from "../lib/mission-gains"

/**
 * A token's missions behind an icon button with their count: the popover lists each mission it
 * progresses with "+X" (what the play adds, "~" when estimated), and marks the ones it finishes.
 * Nothing when the token progresses none.
 */
export function TokenMissionsPopover({
  gains,
  testId,
}: {
  gains: readonly MissionGain[]
  testId: string
}) {
  const { t, i18n } = useTranslation("legendaryEvents")
  const number = new Intl.NumberFormat(i18n.language)
  const missionLabel = useMissionLabel()
  if (gains.length === 0) return null
  const label = t("tokenPlan.nextToken.missions.button", {
    count: gains.length,
  })
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          aria-label={label}
          className="h-7 gap-1 px-2 tabular-nums"
          data-testid={testId}
          size="sm"
          title={label}
          type="button"
          variant="outline"
        >
          <ListChecks aria-hidden="true" className="size-3.5" />
          {number.format(gains.length)}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-72 gap-2 rounded-xl p-3"
        data-testid={`${testId}-popover`}
      >
        <h4 className="text-sm font-semibold">
          {t("tokenPlan.nextToken.missions.progresses")}
        </h4>
        <ul className="flex flex-col gap-1 text-xs">
          {gains.map((gain) => {
            const mission = missionLabel(gain.ref.mission)
            const name =
              gain.ref.track === "premium"
                ? t("tokenPlan.nextToken.missions.premium", { mission })
                : mission
            return (
              <li
                className="flex items-baseline justify-between gap-3"
                data-completes={gain.completes ? "true" : undefined}
                data-testid={`${testId}-mission`}
                data-track={gain.ref.track}
                key={`${gain.ref.track}${gain.ref.mission.index}`}
              >
                <span className="min-w-0">{name}</span>
                <span
                  className={cn(
                    "shrink-0 font-semibold text-primary tabular-nums",
                    gain.amount === 0 && "text-muted-foreground"
                  )}
                  data-testid={`${testId}-gain`}
                >
                  {gain.amount > 0
                    ? `${gain.estimate ? "~" : ""}+${number.format(gain.amount)}`
                    : t("tokenPlan.nextToken.missions.uncounted")}
                  {gain.completes
                    ? ` · ${t("tokenPlan.nextToken.missions.finishes")}`
                    : ""}
                </span>
              </li>
            )
          })}
        </ul>
      </PopoverContent>
    </Popover>
  )
}

/** A token's team behind an icon button: the popover shows its units as the Teams view's chips
 *  (rank, rarity, ability levels). */
export function TokenTeamPopover({
  teamName,
  members,
  testId,
}: {
  teamName: string
  members: readonly EventUnitChipData[]
  testId: string
}) {
  const { t } = useTranslation("legendaryEvents")
  if (members.length === 0) return null
  const label = t("tokenPlan.nextToken.team", { team: teamName })
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          aria-label={label}
          className="h-8 rounded-full px-1"
          data-testid={testId}
          size="sm"
          title={label}
          type="button"
          variant="ghost"
        >
          <span aria-hidden="true" className="flex -space-x-2">
            {members.map((unit) => (
              <span
                className="size-7 shrink-0 overflow-hidden rounded-full bg-muted ring-2 ring-card"
                data-testid={`${testId}-portrait`}
                data-unit={unit.unitId}
                key={unit.unitId}
              >
                <EntityIcon
                  alt=""
                  className="size-full object-cover"
                  src={characterIcon(unit.unitId as UnitId)}
                />
              </span>
            ))}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-auto max-w-[min(24rem,calc(100vw-2rem))] gap-2 rounded-xl p-3"
        data-testid={`${testId}-popover`}
      >
        <h4 className="text-sm font-semibold">{teamName}</h4>
        <ul
          aria-label={t("tokenPlan.nextToken.members")}
          className="flex flex-wrap gap-1"
        >
          {members.map((unit) => (
            <li
              data-testid="next-token-member"
              data-unit={unit.unitId}
              key={unit.unitId}
            >
              <EventUnitChip showStars unit={unit} />
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  )
}
