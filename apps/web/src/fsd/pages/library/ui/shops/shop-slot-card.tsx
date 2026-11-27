import { useTranslation } from "react-i18next"
import { Badge } from "@workspace/ui/components/badge"
import { Pressable } from "@workspace/ui/components/pressable"
import { chanceIcon } from "@workspace/game-catalog"

import { shopCurrencyIcon } from "@/entities/shops/reward"
import { DetailsOverlay, EntityIcon } from "@/shared/ui"
import { useNumberFormat } from "@/shared/lib"
import type {
  LibraryShopRewardView,
  LibraryShopSlotView,
} from "../../model/shops/library-shops.view-model"

const PREVIEW_LIMIT = 3

function useCurrencyLabel() {
  const { t } = useTranslation(["library", "shops"])
  return (currencyId: string) =>
    t(`shops:currency.${currencyId}`, { defaultValue: currencyId })
}

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
  const numbers = useNumberFormat()
  return (
    <span className="inline-flex items-center gap-1 align-middle">
      <EntityIcon
        size="icon"
        alt={label}
        className="inline shrink-0"
        src={shopCurrencyIcon(currencyId)}
      />
      <span className="tabular-nums">{numbers.format(amount)}</span>
    </span>
  )
}

export function ShopSlotCard({
  slot,
  index,
}: {
  slot: LibraryShopSlotView
  index: number
}) {
  const { t } = useTranslation(["library", "shops"])
  const currencyLabel = useCurrencyLabel()
  const [first] = slot.rewards
  if (!first) return null

  if (slot.kind === "single") {
    const reward = first
    return (
      <div
        className="flex flex-col gap-1.5 rounded-lg border bg-card p-3 text-card-foreground shadow-sm"
        data-testid={`shop-slot-${index}`}
      >
        <div className="flex items-start gap-2">
          <EntityIcon
            size="icon-2xl"
            alt=""
            className="shrink-0"
            src={reward.iconUrl}
          />
          <h4 className="min-w-0 flex-1 text-sm font-medium">{reward.label}</h4>
        </div>
        <RewardMeta reward={reward} currencyLabel={currencyLabel} />
      </div>
    )
  }

  const preview = slot.rewards.slice(0, PREVIEW_LIMIT)
  const overflow = slot.rewards.length - preview.length

  const trigger = (
    <Pressable
      className="flex w-full flex-col gap-2 rounded-lg border bg-card p-3 text-left text-card-foreground shadow-sm"
      data-testid={`shop-slot-${index}`}
      data-random="true"
    >
      <div className="flex items-center justify-between gap-1">
        <span className="text-xs font-medium text-muted-foreground">
          {t("shops.randomSlot", { count: slot.rewards.length })}
        </span>
        <Badge className="shrink-0 gap-1" variant="outline">
          <EntityIcon size="icon" src={chanceIcon()} alt="" />
          {t("shops.randomBadge")}
        </Badge>
      </div>

      <ul className="flex flex-col gap-1">
        {preview.map((reward) => (
          <li key={reward.rewardType} className="flex items-center gap-1.5">
            <EntityIcon
              size="icon"
              alt=""
              className="shrink-0"
              src={reward.iconUrl}
            />
            <span className="truncate text-xs">{reward.label}</span>
          </li>
        ))}
        {overflow > 0 ? (
          <li className="text-xs text-muted-foreground">
            {t("shops.andMore", { count: overflow })}
          </li>
        ) : null}
      </ul>

      <span className="text-xs text-muted-foreground">
        {slot.uniformCost && slot.costAmount !== undefined ? (
          <>
            <CurrencyAmount
              currencyId={first.cost.currency}
              amount={slot.costAmount}
              label={currencyLabel(first.cost.currency)}
            />{" "}
            {t("shops.costEachSuffix")}
          </>
        ) : (
          t("shops.costVaries")
        )}
      </span>
    </Pressable>
  )

  return (
    <DetailsOverlay
      description={t("shops.randomSlotHint")}
      testId={`shop-slot-${index}-details`}
      title={t("shops.randomSlot", { count: slot.rewards.length })}
      trigger={trigger}
    >
      <ul className="flex flex-col gap-3">
        {slot.rewards.map((reward) => (
          <li key={reward.rewardType} className="flex items-start gap-2">
            <EntityIcon
              size="icon-lg"
              alt=""
              className="shrink-0"
              src={reward.iconUrl}
            />
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="text-sm font-medium">{reward.label}</span>
              <RewardMeta reward={reward} currencyLabel={currencyLabel} />
            </div>
          </li>
        ))}
      </ul>
    </DetailsOverlay>
  )
}

function RewardMeta({
  reward,
  currencyLabel,
}: {
  reward: LibraryShopRewardView
  currencyLabel: (currencyId: string) => string
}) {
  const { t } = useTranslation(["library", "shops"])
  return (
    <div className="text-xs text-muted-foreground">
      <p>
        {reward.maxPerDay === 1
          ? t("shops.availableOne", { qty: reward.qty })
          : t("shops.availableUpTo", {
              max: reward.maxPerDay,
              qty: reward.qty,
            })}
      </p>
      <p>
        <CurrencyAmount
          currencyId={reward.cost.currency}
          amount={reward.cost.amount}
          label={currencyLabel(reward.cost.currency)}
        />{" "}
        {t("shops.costEachSuffix")}
      </p>
      {reward.freeOfferType ? (
        <p>{t("shops.freeOffer", { reward: reward.freeOfferType })}</p>
      ) : null}
    </div>
  )
}
