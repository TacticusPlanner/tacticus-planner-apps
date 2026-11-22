import { useRef, useState } from "react"

import type { Rarity } from "@workspace/game-domain"

import { normalizeXpBookRarity } from "./types"
import type { PlanningSettings } from "./types"
import { usePlanningSettings } from "./use-planning-settings"

type Edit = Pick<PlanningSettings, "dailyEnergy" | "xpBookRarity">

/**
 * The Planning settings dialog's values, saved as they change (style guide rule 3: planner-only
 * settings have no Save button). Writes run one at a time, each sending the revision the previous
 * one returned, so two quick edits never conflict with each other. `onError` gets the failure of a
 * write; the shown value stays as edited so the player can try again.
 */
export function usePlanningSettingsEditor(onError: (error: unknown) => void) {
  const { settings, save } = usePlanningSettings()
  // The saved value until it is edited, even when the energy ladder no longer offers it.
  const [dailyEnergy, setDailyEnergy] = useState(settings.dailyEnergy)
  const [xpBookRarity, setXpBookRarity] = useState<Rarity>(() =>
    normalizeXpBookRarity(settings.xpBookRarity)
  )
  // The settings the next write starts from; each write leaves the stored result here.
  const stored = useRef(settings)
  // Every edited value, so a write after a failed one still sends what the failed one carried.
  const edited = useRef<Partial<Edit>>({})
  const queue = useRef<Promise<void>>(Promise.resolve())

  const persist = (edit: Partial<Edit>) => {
    edited.current = { ...edited.current, ...edit }
    queue.current = queue.current.then(async () => {
      try {
        stored.current = await save({ ...stored.current, ...edited.current })
      } catch (error) {
        onError(error)
      }
    })
  }

  return {
    dailyEnergy,
    /** Moves the shown value only; `commitDailyEnergy` saves it (the slider's release). */
    previewDailyEnergy: setDailyEnergy,
    commitDailyEnergy: (energy: number) => {
      setDailyEnergy(energy)
      if (energy !== stored.current.dailyEnergy)
        persist({ dailyEnergy: energy })
    },
    xpBookRarity,
    changeXpBookRarity: (rarity: Rarity) => {
      setXpBookRarity(rarity)
      persist({ xpBookRarity: rarity })
    },
  }
}
