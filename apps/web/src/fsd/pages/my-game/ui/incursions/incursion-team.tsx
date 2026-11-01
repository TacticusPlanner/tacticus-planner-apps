import { useTranslation } from "react-i18next"
import { characterIcon } from "@workspace/game-catalog"
import type { UnitId } from "@workspace/game-domain"
import { Badge } from "@workspace/ui/components/badge"

import { EntityIcon } from "@/shared/ui"

import type { IncursionPlans } from "../../model/use-incursion-plans"
import type { Incursion } from "../../model/incursions.model"
import { useTierName } from "./use-tier-name"

/**
 * The suggested team for one MoW (strongest allowed heroes, a Healer preferred) and the tiers it is
 * estimated to clear, or why there is no suggestion.
 */
export function IncursionTeam({
  incursion,
  plans,
}: {
  incursion: Incursion
  plans: IncursionPlans
}) {
  const { t, i18n } = useTranslation(["incursions", "characters"])
  const tierName = useTierName(incursion)
  if (plans.status === "loading") return null
  const testId = `incursion-${incursion.mowId}-team`

  if (plans.status === "unavailable") {
    return (
      <p className="text-sm text-muted-foreground" data-testid={testId}>
        {plans.reason === "unsynced" ? t("team.unsynced") : t("team.noPower")}
      </p>
    )
  }
  const plan = plans.plans.get(incursion.mowId)
  if (!plan) {
    return (
      <p className="text-sm text-muted-foreground" data-testid={testId}>
        {t("team.tooFew", { count: incursion.minUnitsOfGrandAllianceNeeded })}
      </p>
    )
  }

  const number = new Intl.NumberFormat(i18n.language)
  const clearable = incursion.tiers.filter(
    (tier) => plan.tiers.get(tier.index)?.cleared
  )
  const highest = clearable.at(-1)

  return (
    <section className="space-y-2" data-testid={testId}>
      <div className="flex flex-wrap items-center gap-2">
        <h4 className="text-sm font-medium">{t("team.title")}</h4>
        <span className="text-xs text-muted-foreground tabular-nums">
          {t("team.power", {
            power: number.format(Math.round(plan.teamPower)),
          })}
        </span>
        {plan.sustained ? (
          <Badge variant="secondary" title={t("team.sustainHint")}>
            {t("team.sustain")}
          </Badge>
        ) : null}
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
                className="size-7 rounded"
              />
              <span className="max-w-28 truncate">{name}</span>
            </li>
          )
        })}
      </ul>
      <p className="text-sm" data-testid={`${testId}-clearable`}>
        {highest
          ? t("team.clearable", {
              count: clearable.length,
              total: incursion.tiers.length,
              tier: tierName(highest.index),
            })
          : t("team.clearableNone")}
      </p>
      <p className="text-xs text-muted-foreground">{t("team.hint")}</p>
    </section>
  )
}
