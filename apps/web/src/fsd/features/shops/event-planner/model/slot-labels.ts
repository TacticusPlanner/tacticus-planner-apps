import type {
  ResolvedEventSlot,
  ShopLockContext,
} from "@workspace/game-catalog"

/**
 * Why a slot shows the offer it shows (spec event-shop-planner: the Shop tab):
 * - `tier`: resolved by the player's shop tier ("Your tier: High");
 * - `thenMythic`: a shard offer resolved by unit progress, mythic shards follow at max legendary;
 * - `options`: without synced data the slot lists every option it may show, because of the tier or
 *   unit progress (or a random draw, which no current event shop has).
 */
export type SlotLabel =
  | { kind: "tier"; tier: NonNullable<ShopLockContext["tier"]> }
  | { kind: "thenMythic" }
  | { kind: "options"; reason: "tier" | "progress" | "random" }

const TIER_LOCK = /^lock_mythic_shop_tier_/
const PROGRESS_LOCK = /^lock_(below_max_legendary|max_legendary|not_unlocked)_/

/** The slot's label, or null when it needs none. `lockContext` is absent without synced player data. */
export function slotLabel(
  slot: ResolvedEventSlot,
  lockContext: ShopLockContext | undefined
): SlotLabel | null {
  const locks = slot.variants.map((variant) => variant.lockId ?? "")
  const byTier = locks.some((lock) => TIER_LOCK.test(lock))
  const byProgress = locks.some((lock) => PROGRESS_LOCK.test(lock))

  if (!lockContext) {
    if (slot.offers.length < 2) return null
    return {
      kind: "options",
      reason: byTier ? "tier" : byProgress ? "progress" : "random",
    }
  }
  if (byTier && lockContext.tier)
    return { kind: "tier", tier: lockContext.tier }
  if (byProgress && slot.offers[0]?.rewardType.startsWith("shards_")) {
    return { kind: "thenMythic" }
  }
  return null
}
