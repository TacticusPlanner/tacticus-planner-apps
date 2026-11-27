import { useTranslation } from "react-i18next"
import { Link } from "react-router"

import { EmptyState } from "@/shared/ui"
import {
  RewardText,
  rewardAmount,
  sumRewards,
  useEventRewardFormat,
} from "@/widgets/event-rewards"
import { numberFormat } from "@/shared/lib"

import { useSurvivalContext } from "../model/survival-context"
import type { SurvivalOffer } from "../model/survival-event"
import { survivalTabHref } from "../model/survival-tabs"

/** "$9.99": the US store price. */
function usePrice() {
  const { i18n } = useTranslation()
  const price = numberFormat(i18n.language, {
    style: "currency",
    currency: "USD",
  })
  return (cents: number) => price.format(cents / 100)
}

function OfferCard({ offer }: { offer: SurvivalOffer }) {
  const { t } = useTranslation("survival")
  const { event } = useSurvivalContext()
  const format = useEventRewardFormat()
  const price = usePrice()
  const name = t(`offers.kinds.${offer.kind}` as never, {
    defaultValue: offer.kind,
  })
  // What the premium chains the pass unlocks pay in event currency.
  const currency = sumRewards(
    event.missions.premium.flatMap((chain) => chain.missions)
  ).find((reward) => reward.type === event.currency)
  return (
    <li
      className="flex flex-col gap-3 rounded-lg border bg-card p-4"
      data-testid={`survival-offer-${offer.kind}`}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h3 className="text-lg font-semibold">{name}</h3>
        <span className="text-base font-semibold tabular-nums">
          {price(offer.priceCents)}
        </span>
      </div>
      {offer.maxPurchases === undefined ? null : (
        <p className="text-xs text-muted-foreground">
          {t("offers.purchases", { count: offer.maxPurchases })}
        </p>
      )}
      <ul className="flex flex-col gap-1.5">
        {offer.rewards
          // The pass's premium missions are described below the list.
          .filter((reward) => reward.type !== "seasonalPremium")
          .map((reward) => (
            <li key={reward.type}>
              {reward.type === "seasonalEcBonus" ? (
                <span className="text-xs">
                  {t("offers.currencyBonus", { pct: reward.min })}
                </span>
              ) : (
                <RewardText format={format} rewards={[reward]} />
              )}
            </li>
          ))}
      </ul>
      {offer.kind === "pass" ? (
        <p className="text-sm">
          {t("offers.passUnlocks", {
            points: format.number(event.points.premiumMissions),
            currency: currency ? rewardAmount(currency, format) : "0",
          })}{" "}
          <Link
            className="font-medium text-primary underline-offset-4 hover:underline"
            to={survivalTabHref("missions", event.id)}
          >
            {t("offers.seeMissions")}
          </Link>
        </p>
      ) : null}
    </li>
  )
}

/** Offers: one card per real-money offer, its US price, how often it can be bought and its rewards. */
export function OffersTab() {
  const { t } = useTranslation("survival")
  const { event } = useSurvivalContext()
  if (event.offers.length === 0) {
    return <EmptyState testId="survival-offers" title={t("offers.none")} />
  }
  return (
    <ul className="grid gap-3 md:grid-cols-2" data-testid="survival-offers">
      {event.offers.map((offer) => (
        <OfferCard key={offer.id} offer={offer} />
      ))}
    </ul>
  )
}
