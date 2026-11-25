import type { PortraitSize } from "@/shared/ui"

const RING_CLASS_NAMES: Record<PortraitSize, string> = {
  "portrait-sm": "border-2",
  "portrait-md": "border-3",
  "portrait-lg": "border-4",
  "portrait-xl": "border-4",
}

/** The rarity ring's width for a portrait size: thinner on the small sizes so the art stays visible. */
export function portraitRingClassName(size: PortraitSize): string {
  return RING_CLASS_NAMES[size]
}
