import type {
  GameCatalogShopVariant,
  ResolvedEventSlot,
  ResolvedShopOffer,
  ShopLockContext,
} from "@workspace/game-catalog"
import { useTranslation } from "react-i18next"

import type { EventShopCartEntry } from "@/entities/event-shop"
import {
  dailyFreebie,
  entryKey,
  slotLabel,
  type ClassifiedEntry,
  type DailyFreebie,
  type SlotLabel,
} from "@/features/shops/event-planner"

import type { EventShopController } from "./use-event-shop-controller"

type EntryRef = Pick<EventShopCartEntry, "week" | "day" | "slotIndex">

/** One slot of the selected day as a card, tile or sheet shows it. */
export interface SlotView {
  ref: EntryRef
  slot: ResolvedEventSlot
  /** The offer shown first: the one in the cart, else the slot's (only) offer. */
  offer: ResolvedShopOffer
  /** Every option (more than one only without synced player data). */
  options: ResolvedShopOffer[]
  label: SlotLabel | null
  entry: ClassifiedEntry | null
  /** The free bundled offer's quantity per purchase. */
  freeQty: number
  /** Set when the shown offer is the daily freebie: claimed in game, never planned. */
  freebie: DailyFreebie | null
  /** The freebie terms of any option of the slot (several only without synced data). */
  freebieOf: (rewardType: string) => DailyFreebie | null
  /** What the card shows as the reward: the offer, or for the daily freebie the event currency it
   *  gives (×5), as the game shows it. */
  shown: { rewardType: string; unitId?: string; qty: number }
}

export function slotViews(controller: EventShopController): SlotView[] {
  const { selectedDay, slots, entryByKey, roster } = controller
  const lockContext: ShopLockContext | undefined =
    roster.lockContext ?? undefined
  return slots.flatMap((slot) => {
    const options = slot.offers
    if (options.length === 0) return []
    const ref: EntryRef = {
      week: selectedDay.week,
      day: selectedDay.dow,
      slotIndex: slot.slotIndex,
    }
    const entry = entryByKey.get(entryKey(ref)) ?? null
    // A planned reward the roster no longer resolves to (e.g. shards after the unit hit max legendary)
    // stays on the card, so the card shows what its controls act on.
    const plannedVariants =
      entry &&
      !options.some((option) => option.rewardType === entry.entry.rewardType)
        ? plannedRewardVariants(controller, ref, entry.entry.rewardType)
        : []
    const offer =
      options.find((option) => option.rewardType === entry?.entry.rewardType) ??
      offerOf(plannedVariants) ??
      options[0]!
    const freeQty =
      [...slot.variants, ...plannedVariants].find(
        (variant) =>
          variant.reward.type === offer.rewardType && variant.freeOffer
      )?.freeOffer?.qty ?? 0
    const freebie = dailyFreebie(controller.event, slot, offer.rewardType)
    return [
      {
        ref,
        slot,
        offer,
        options,
        label: slotLabel(slot, lockContext),
        entry,
        freeQty,
        freebie,
        freebieOf: (rewardType) =>
          dailyFreebie(controller.event, slot, rewardType),
        shown: freebie
          ? { rewardType: controller.event.currency, qty: freebie.back }
          : {
              rewardType: offer.rewardType,
              unitId: offer.unitId,
              qty: offer.rewardQty,
            },
      },
    ]
  })
}

/** The slot's variants of `rewardType` sold on the entry's day, locks ignored (as the cart resolves them). */
function plannedRewardVariants(
  controller: EventShopController,
  ref: EntryRef,
  rewardType: string
): GameCatalogShopVariant[] {
  return (
    controller.event.weeks[ref.week - 1]?.slots[ref.slotIndex]?.variants ?? []
  ).filter(
    (variant) =>
      variant.reward.type === rewardType && variant.days.includes(ref.day)
  )
}

/** One offer from one reward's variants; the largest cap, as the cart takes it. */
function offerOf(
  variants: readonly GameCatalogShopVariant[]
): ResolvedShopOffer | null {
  const first = variants[0]
  if (!first) return null
  return {
    rewardType: first.reward.type,
    unitId: first.unitId,
    rewardQty: first.reward.qty,
    cost: { currency: first.cost.currency, amount: first.cost.amount },
    maxPerDay: Math.max(
      ...variants.map((variant) => variant.maxPurchasesPerDay)
    ),
    freeOfferType: first.freeOffer?.type,
    isGuaranteed: false,
  }
}

/** The slot's subtitle ("Your tier: High", "Then mythic shards…", "Depends on your tier"). */
export function useSlotLabelText() {
  const { t } = useTranslation("eventShops")
  return (label: SlotLabel | null): string | null => {
    if (!label) return null
    if (label.kind === "tier") {
      return t("slot.tier", { tier: t(`slot.tiers.${label.tier}`) })
    }
    if (label.kind === "thenMythic") return t("slot.thenMythic")
    if (label.reason === "tier") return t("slot.dependsOnTier")
    if (label.reason === "progress") return t("slot.dependsOnProgress")
    return t("slot.dependsOnRandom")
  }
}
