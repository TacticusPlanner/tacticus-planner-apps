import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Users } from "lucide-react"
import { characterIcon } from "@workspace/game-catalog"
import type { UnitId } from "@workspace/game-domain"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"

import { EntityIcon } from "@/shared/ui"

import type { IncursionPlans } from "../../model/use-incursion-plans"
import type { Incursion } from "../../model/incursions.model"
import { IncursionEligibleDialog } from "./incursion-eligible-dialog"

/**
 * The suggested team for one MoW (strongest allowed heroes, a Healer preferred) and its power, or
 * why there is no suggestion, with every eligible hero one click away.
 */
export function IncursionTeam({
  incursion,
  plans,
}: {
  incursion: Incursion
  plans: IncursionPlans
}) {
  const { t, i18n } = useTranslation(["incursions", "characters"])
  const [open, setOpen] = useState(false)
  const testId = `incursion-${incursion.mowId}-team`
  if (plans.status === "loading" && !plans.unsynced) return null

  if (plans.status === "unavailable") {
    return (
      <p className="text-sm text-muted-foreground" data-testid={testId}>
        {t("team.noPower")}
      </p>
    )
  }
  const plan =
    plans.status === "ready"
      ? plans.plans.get(incursion.mowId)?.team
      : undefined
  if (!plan || plan.status === "unsynced") {
    return (
      <p className="text-sm text-muted-foreground" data-testid={testId}>
        {t("team.unsynced")}
      </p>
    )
  }

  const browse =
    plan.eligible.length > 0 ? (
      <>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setOpen(true)}
          data-testid={`${testId}-eligible`}
        >
          <Users aria-hidden="true" />
          {t("team.eligible", { count: plan.eligible.length })}
        </Button>
        <IncursionEligibleDialog
          open={open}
          onOpenChange={setOpen}
          incursion={incursion}
          eligible={plan.eligible}
          suggested={plan.status === "ready" ? plan.team : []}
        />
      </>
    ) : null

  if (plan.status === "tooFew") {
    return (
      <div className="space-y-2" data-testid={testId}>
        <p className="text-sm text-muted-foreground">
          {t("team.tooFew", { count: incursion.minUnitsOfGrandAllianceNeeded })}
        </p>
        {browse}
      </div>
    )
  }

  const number = new Intl.NumberFormat(i18n.language)
  return (
    <section className="space-y-2" data-testid={testId}>
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-medium">{t("team.title")}</h3>
        <span
          className="text-xs text-muted-foreground tabular-nums"
          data-testid={`${testId}-power`}
        >
          {t("team.power", {
            power: number.format(Math.round(plan.teamPower)),
          })}
        </span>
        {plan.sustained ? (
          <Badge variant="secondary" title={t("team.sustainHint")}>
            {t("team.sustain")}
          </Badge>
        ) : null}
        <span className="ml-auto">{browse}</span>
      </div>
      <ul className="flex flex-wrap gap-2" data-testid={`${testId}-members`}>
        {plan.team.map((member) => {
          const name = t(`characters:${member.id}`, { defaultValue: member.id })
          return (
            <li
              key={member.id}
              className="flex items-center gap-1.5 rounded-md border px-1.5 py-1 text-xs"
              title={name}
              data-unit-id={member.id}
            >
              <EntityIcon
                src={characterIcon(member.id as UnitId)}
                alt=""
                className="size-7 rounded-sm"
              />
              <span className="max-w-28 truncate">{name}</span>
            </li>
          )
        })}
      </ul>
      <p className="text-xs text-muted-foreground">{t("team.hint")}</p>
    </section>
  )
}
