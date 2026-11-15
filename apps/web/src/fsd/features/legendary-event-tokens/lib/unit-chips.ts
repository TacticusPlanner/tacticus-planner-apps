import type { EventUnitChipData } from "@/entities/legendary-event"

/** A unit's chip when no roster is at hand (ownership unknown). */
export function unknownChip(unitId: string): EventUnitChipData {
  return { unitId, owned: undefined }
}
