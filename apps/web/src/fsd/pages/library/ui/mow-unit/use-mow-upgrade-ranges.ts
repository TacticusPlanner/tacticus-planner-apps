import { useState } from "react"

import {
  defaultMowRange,
  withFrom,
  type MowAbility,
  type MowLevelRange,
  type MowLevelRanges,
} from "./mow-upgrades.model"

/**
 * The Ability upgrades ranges: From starts at the player's level (or 1), To at From + 10, capped at
 * `max`. Setting From above To raises To with it; To is never set below From. The defaults follow
 * `startLevels` until the user changes that ability's range (player data can arrive after the first
 * render). Page state only — the page is keyed by MoW id, so the ranges reset when the MoW changes.
 */
export function useMowUpgradeRanges(
  startLevels: Record<MowAbility, number>,
  max: number
) {
  const [edited, setEdited] = useState<
    Partial<Record<MowAbility, MowLevelRange>>
  >({})
  const ranges: MowLevelRanges = {
    primary: edited.primary ?? defaultMowRange(startLevels.primary, max),
    secondary: edited.secondary ?? defaultMowRange(startLevels.secondary, max),
  }

  const setFrom = (ability: MowAbility, from: number) =>
    setEdited((current) => ({
      ...current,
      [ability]: withFrom(current[ability] ?? ranges[ability], from),
    }))
  const setTo = (ability: MowAbility, to: number) =>
    setEdited((current) => {
      const range = current[ability] ?? ranges[ability]
      return {
        ...current,
        [ability]: { from: range.from, to: Math.max(to, range.from) },
      }
    })

  return { ranges, setFrom, setTo }
}
