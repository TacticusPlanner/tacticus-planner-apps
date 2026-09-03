import { useTranslation } from "react-i18next"
import { Dices } from "lucide-react"
import { Badge } from "@workspace/ui/components/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog"

import { shopCurrencyIcon } from "@/features/shop-rewards"
import { EntityIcon } from "@/shared/ui"
import type {
  LibraryShopRewardView,
  LibraryShopSlotView,
} from "./library-shops.view-model"

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

export function ShopSlotCard({
  slot,
  index,
}: {
  slot: LibraryShopSlotView
  index: number
}) {
  const { t } = useTranslation(["library", "shops"])
  const currencyLabel = useCurrencyLabel()

  if (slot.kind === "single") {
    const reward = slot.rewards[0]!
    return (
      <div
        className="flex flex-col gap-1.5 rounded-lg border bg-card p-3 text-card-foreground shadow-sm"
        data-testid={`shop-slot-${index}`}
      >
        <div className="flex items-start gap-2">
          <EntityIcon
            alt=""
            className="size-10 shrink-0"
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
  const first = slot.rewards[0]!

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="flex w-full flex-col gap-2 rounded-lg border bg-card p-3 text-left text-card-foreground shadow-sm transition-colors hover:border-primary"
          data-testid={`shop-slot-${index}`}
          data-random="true"
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              {t("shops.randomSlot", { count: slot.rewards.length })}
            </span>
            <Badge className="shrink-0 gap-1" variant="outline">
              <Dices className="size-3" />
              {t("shops.randomBadge")}
            </Badge>
          </div>

          <ul className="flex flex-col gap-1">
            {preview.map((reward) => (
              <li key={reward.rewardType} className="flex items-center gap-1.5">
                <EntityIcon
                  alt=""
                  className="size-5 shrink-0"
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
        </button>
      </DialogTrigger>

      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {t("shops.randomSlot", { count: slot.rewards.length })}
          </DialogTitle>
          <DialogDescription>{t("shops.randomSlotHint")}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          {slot.rewards.map((reward) => (
            <div
              key={reward.rewardType}
              className="flex flex-col gap-1.5 rounded-lg border bg-card p-3"
            >
              <div className="flex items-start gap-2">
                <EntityIcon
                  alt=""
                  className="size-9 shrink-0"
                  src={reward.iconUrl}
                />
                <h4 className="min-w-0 flex-1 text-sm font-medium">
                  {reward.label}
                </h4>
              </div>
              <RewardMeta reward={reward} currencyLabel={currencyLabel} />
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
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
