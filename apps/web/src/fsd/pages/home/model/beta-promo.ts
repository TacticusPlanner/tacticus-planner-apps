import { useState } from "react"

import { safeStorage } from "@/shared/lib"

export const BETA_PROMO_CODE = "NEWPLANNERAMMUS"

/** The code is valid through 7 November 2026, so the tile is gone from the start of 8 November,
 *  the player's local time. */
export const BETA_PROMO_LAST_DAY = new Date(2026, 10, 7)
const BETA_PROMO_ENDS_AT = new Date(2026, 10, 8)

const DISMISSED_KEY = "home-beta-promo-dismissed"

export function isBetaPromoActive(now: Date): boolean {
  return now < BETA_PROMO_ENDS_AT
}

/** Home's beta promo code: shown until the code expires, unless dismissed on this device. */
export function useBetaPromo(now: Date = new Date()) {
  const [dismissed, setDismissed] = useState(
    () => safeStorage.get(DISMISSED_KEY) !== null
  )

  return {
    show: !dismissed && isBetaPromoActive(now),
    dismiss: () => {
      safeStorage.set(DISMISSED_KEY, new Date().toISOString())
      setDismissed(true)
    },
  }
}
