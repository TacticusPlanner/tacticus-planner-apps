import { useState } from "react"
import { useTranslation } from "react-i18next"
import { characterIcon } from "@workspace/game-catalog"
import type { UnitId } from "@workspace/game-domain"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Button } from "@workspace/ui/components/button"

import { EntityIcon } from "@/shared/ui"

import type { QuestTeam } from "../model/quest-team"
import type { QuestTeamViewModel } from "../model/use-quest-plan"
import { QuestTeamOptionsDialog } from "./quest-team-options-dialog"

/** Every quest battle needs at least this many units deployed. */
const MIN_TEAM = 3

/**
 * The suggested team for a quest battle (spec: quest-event-teams): the featured hero pinned, then
 * the strongest eligible units, each with its power at the tier's cap and whether it reaches the cap,
 * with notes for a short roster, an unsynced account and unavailable power, and every eligible unit
 * one press away to compare other lineups.
 */
export function QuestTeamSection({
  view,
  nameOf,
  battleNumber = null,
}: {
  view: QuestTeamViewModel
  nameOf: (unitId: string) => string
  battleNumber?: number | null
}) {
  const { t } = useTranslation("quest")
  return (
    <section
      aria-labelledby="quest-team-title"
      className="flex min-w-0 flex-col gap-2 rounded-xl border p-3"
      data-testid="quest-team"
    >
      <h4 className="text-sm font-semibold" id="quest-team-title">
        {t("team.title")}
      </h4>
      {view.status === "loading" ? (
        <Skeleton className="h-16 w-full rounded-lg" />
      ) : view.status === "error" ? (
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm text-destructive">{t("team.error")}</p>
          <Button onClick={view.retry} size="sm" variant="outline">
            {t("status.retry")}
          </Button>
        </div>
      ) : (
        <TeamBody
          battleNumber={battleNumber}
          nameOf={nameOf}
          team={view.team}
          unsynced={view.status === "unsynced"}
        />
      )}
    </section>
  )
}

function TeamBody({
  team,
  unsynced,
  nameOf,
  battleNumber,
}: {
  team: QuestTeam
  unsynced: boolean
  nameOf: (unitId: string) => string
  battleNumber: number | null
}) {
  const { t, i18n } = useTranslation("quest")
  const [optionsOpen, setOptionsOpen] = useState(false)
  const number = new Intl.NumberFormat(i18n.language)
  const members = unsynced
    ? team.members.filter((member) => member.featured)
    : team.members
  return (
    <>
      <ul className="flex flex-col gap-1.5" data-testid="quest-team-members">
        {members.map((member) => (
          <li
            className="flex min-w-0 items-center gap-2 text-sm"
            data-featured={member.featured ? "true" : undefined}
            data-testid="quest-team-member"
            key={member.unitId}
          >
            <EntityIcon
              alt=""
              className="size-8 shrink-0 rounded-full bg-portrait"
              src={characterIcon(member.unitId as UnitId)}
            />
            <span className="min-w-0 flex-1 truncate font-medium">
              {nameOf(member.unitId)}
              {member.featured ? (
                <span className="font-normal text-muted-foreground">
                  {" "}
                  · {t("team.featured")}
                </span>
              ) : null}
            </span>
            {member.power === null ? null : (
              <span className="tabular-nums" data-testid="quest-team-power">
                {number.format(member.power)}
              </span>
            )}
            <span className="text-xs text-muted-foreground">
              {member.atCap ? t("team.atCap") : t("team.belowCap")}
            </span>
          </li>
        ))}
      </ul>
      {!unsynced && (team.totalPower !== null || team.eligibleCount > 0) ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          {team.totalPower === null ? (
            <span />
          ) : (
            <p className="text-sm tabular-nums" data-testid="quest-team-total">
              {t("team.total", { power: number.format(team.totalPower) })}
            </p>
          )}
          {team.eligibleCount > 0 ? (
            <Button
              data-testid="quest-team-all-options"
              onClick={() => setOptionsOpen(true)}
              size="sm"
              variant="outline"
            >
              {t("team.allOptions", { count: team.eligibleCount })}
            </Button>
          ) : null}
        </div>
      ) : null}
      {optionsOpen ? (
        <QuestTeamOptionsDialog
          battleNumber={battleNumber}
          key={battleNumber ?? "none"}
          nameOf={nameOf}
          onOpenChange={setOptionsOpen}
          open
          team={team}
        />
      ) : null}
      {unsynced ? (
        <p
          className="text-sm text-muted-foreground"
          data-testid="quest-team-sync"
        >
          {t("team.sync")}
        </p>
      ) : (
        <>
          {team.eligibleCount < team.openSlots ? (
            <p className="text-sm" data-testid="quest-team-short">
              {t("team.short", {
                count: team.eligibleCount,
                slots: team.openSlots,
              })}
            </p>
          ) : null}
          {members.length < MIN_TEAM ? (
            <p
              className="text-sm text-destructive"
              data-testid="quest-team-min"
            >
              {t("team.minimum", { count: MIN_TEAM })}
            </p>
          ) : null}
          {team.powerUnavailable ? (
            <p
              className="text-sm text-muted-foreground"
              data-testid="quest-team-no-power"
            >
              {t("team.powerUnavailable")}
            </p>
          ) : null}
        </>
      )}
    </>
  )
}
