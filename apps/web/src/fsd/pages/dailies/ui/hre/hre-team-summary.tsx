import { useTranslation } from "react-i18next"
import { Badge } from "@workspace/ui/components/badge"
import { characterIcon, gameModeTokenIcon } from "@workspace/game-catalog"

import type { HreTeamPlan } from "@/entities/hre-mission"
import type { HreTeamViewModel } from "@/features/team-recommendations"
import { EntityIcon } from "@/shared/ui"

/** Portraits a folded row shows before "+N": fewer on a phone, so the row stays on one line. */
const SHOWN = 5
const SHOWN_PHONE = 2

/**
 * A token-mode team's folded row: the mode's token icon and name, "N battles" (or "Up to N battles"
 * on spare tokens) and the team's portraits in one row. Nothing in it is interactive: the whole row
 * opens the fold.
 */
export function HreTeamSummary({
  plan,
  view,
  battles,
  testId,
}: {
  plan: HreTeamPlan & { mode: Exclude<HreTeamPlan["mode"], "battle"> }
  view: HreTeamViewModel | undefined
  /** The token objective's battles to go, or the spare battles to play. */
  battles: number
  testId: string
}) {
  const { t } = useTranslation("hre")
  const members =
    view?.status === "ready" && view.team.status === "ready"
      ? view.team.team.members
      : []
  return (
    <span
      className="flex min-w-0 flex-1 items-center gap-2"
      data-testid={testId}
    >
      <span className="flex min-w-0 items-center gap-1.5">
        <EntityIcon alt="" size="inline" src={gameModeTokenIcon(plan.mode)} />
        <span className="truncate">{t(`tokens.modes.${plan.mode}`)}</span>
      </span>
      <Badge className="shrink-0 tabular-nums" variant="secondary">
        {plan.spare
          ? t("teams.upTo", { count: battles })
          : t("raids.battleCount", { count: battles })}
      </Badge>
      {members.length > 0 ? (
        <span
          className="flex shrink-0 items-center gap-0.5"
          data-testid={`${testId}-portraits`}
        >
          {members.slice(0, SHOWN).map((member, index) => (
            <span
              className={index < SHOWN_PHONE ? "contents" : "max-sm:hidden"}
              key={member.unitId}
            >
              <EntityIcon
                alt=""
                size="inline"
                src={characterIcon(member.unitId)}
              />
            </span>
          ))}
          {members.length > SHOWN_PHONE ? (
            <span className="text-xs text-muted-foreground tabular-nums sm:hidden">
              +{members.length - SHOWN_PHONE}
            </span>
          ) : null}
          {members.length > SHOWN ? (
            <span className="text-xs text-muted-foreground tabular-nums max-sm:hidden">
              +{members.length - SHOWN}
            </span>
          ) : null}
        </span>
      ) : null}
    </span>
  )
}
