import type { PortraitSize } from "@/shared/ui"

const RING_CLASS_NAMES: Record<PortraitSize, string> = {
  sm: "border-2",
  md: "border-3",
  lg: "border-4",
  hero: "border-4",
}

/** The rarity ring's width for a portrait size: thinner on the small sizes so the art stays visible. */
export function portraitRingClassName(size: PortraitSize): string {
  return RING_CLASS_NAMES[size]
}
