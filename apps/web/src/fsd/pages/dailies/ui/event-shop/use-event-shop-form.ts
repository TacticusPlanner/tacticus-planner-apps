import { useSyncExternalStore } from "react"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"

import type { EventShopForm } from "../../model/event-shop-route"

// Desktop starts at Tailwind's `lg:` (64rem = 1024 px); this page is the only one with a tablet form.
const DESKTOP_QUERY = "(width >= 64rem)"

function subscribe(onChange: () => void) {
  const query = window.matchMedia(DESKTOP_QUERY)
  query.addEventListener("change", onChange)
  return () => query.removeEventListener("change", onChange)
}

const isDesktop = () => window.matchMedia(DESKTOP_QUERY).matches

/** Phone < 768 px, tablet 768–1023 px, desktop ≥ 1024 px (design D4). */
export function useEventShopForm(): EventShopForm {
  const mobile = useIsMobile()
  const desktop = useSyncExternalStore(subscribe, isDesktop, () => true)
  if (mobile) return "phone"
  return desktop ? "desktop" : "tablet"
}
