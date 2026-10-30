import { useTranslation } from "react-i18next"
import { chanceIcon } from "@workspace/game-catalog"

import { shopCurrencyIcon } from "@/features/shop-rewards"
import { EntityIcon } from "@/shared/ui"
import type { ShopRecommendationCardView } from "@/features/shop-recommendations"

/** `[currency icon] 1,234` — the amount with its currency icon (V1 shop-card style). */
function CurrencyAmount({
  currencyId,
  amount,
  label,
}: {
  currencyId: string
  amount: number
  label: string
}) {
  return (
    <span className="inline-flex items-center gap-1 align-middle">
      <EntityIcon
        alt={label}
        className="inline size-3.5 shrink-0"
        src={shopCurrencyIcon(currencyId)}
      />
      <span className="tabular-nums">{amount.toLocaleString()}</span>
    </span>
  )
}

function useCard(card: ShopRecommendationCardView) {
  const { t } = useTranslation("shops")
  const currencyLabel = t(`currency.${card.cost.currency}`, {
    defaultValue: card.cost.currency,
  })
  return {
    currencyLabel,
    progress: t("card.progress", {
      acquired: card.acquired,
      required: card.required,
    }),
    availability:
      card.maxPerDay === 1
        ? t("card.availableOne", { qty: card.rewardQty })
        : t("card.availableUpTo", { max: card.maxPerDay, qty: card.rewardQty }),
    freeOffer: card.freeOfferType
      ? t("card.freeOffer", { reward: card.freeOfferType })
      : null,
    eachSuffix: t("card.costEachSuffix"),
    totalLabel: t("card.totalLabel"),
    neededByLabel: t("card.neededByLabel"),
    neededBy: card.neededBy.map((entry) =>
      t("card.neededByEntry", { unit: entry.unitName, count: entry.count })
    ),
    randomHint: t("card.randomHint"),
  }
}

/** One shop offer as a dense row: reward, progress, cost, availability and the goals needing it. */
export function ShopRecommendationCard({
  card,
}: {
  card: ShopRecommendationCardView
}) {
  const text = useCard(card)
  const testId = `shop-card-${card.shopId}-${card.rewardType}`
  const cost = (
    <CurrencyAmount
      currencyId={card.cost.currency}
      amount={card.cost.amount}
      label={text.currencyLabel}
    />
  )
  const total =
    card.remaining > 0 ? (
      <CurrencyAmount
        currencyId={card.cost.currency}
        amount={card.remainingCost}
        label={text.currencyLabel}
      />
    ) : null

  return (
    <div
      className="flex items-center gap-3 rounded-lg border px-3 py-2"
      data-testid={testId}
    >
      <EntityIcon alt="" className="size-9 shrink-0" src={card.rewardIconUrl} />
      <div className="min-w-0 flex-1 leading-tight">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-sm font-medium">
            {card.rewardName}
          </span>
          {!card.isGuaranteed ? (
            <EntityIcon
              src={chanceIcon()}
              alt={text.randomHint}
              className="size-4 shrink-0"
            />
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-x-1.5 text-xs text-muted-foreground">
          <span>{text.progress}</span>
          <span>·</span>
          {cost}
          <span>{text.eachSuffix}</span>
          {total ? (
            <>
              <span>·</span>
              <span>{text.totalLabel}:</span>
              {total}
            </>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-x-1.5 text-xs text-muted-foreground">
          <span>{text.availability}</span>
          {text.freeOffer ? (
            <>
              <span>·</span>
              <span>{text.freeOffer}</span>
            </>
          ) : null}
        </div>
        <div className="truncate text-xs text-muted-foreground">
          {text.neededByLabel}: {text.neededBy.join(", ")}
        </div>
      </div>
    </div>
  )
}
