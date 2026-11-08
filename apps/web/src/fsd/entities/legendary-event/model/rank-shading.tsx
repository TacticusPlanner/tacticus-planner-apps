import { useMemo, type ReactNode } from "react"

import { usePersistedSelection } from "@/shared/lib"

import { RankShadingContext, type RankShading } from "./rank-shading-context"

const RANK_SHADING_KEY = "legendaryEvents.unitChips.rankShading"

type OnOff = "on" | "off"
const isOnOff = (value: unknown): value is OnOff =>
  value === "on" || value === "off"

/**
 * The event page's Rank shading setting (spec: Rank shading is a per-browser setting): whether its
 * unit chips are tinted in their rank colour. Per browser, on by default. The page provides it
 * once, so every chip on it (the Event board, team cards, the team picker, token cards) follows
 * the one switch and the choice survives tab changes and reloads.
 */
export function RankShadingProvider({ children }: { children: ReactNode }) {
  const [value, setValue] = usePersistedSelection(
    RANK_SHADING_KEY,
    isOnOff,
    "on"
  )
  const shading = useMemo<RankShading>(
    () => ({
      shaded: value === "on",
      setShaded: (shaded) => setValue(shaded ? "on" : "off"),
    }),
    [value, setValue]
  )
  return (
    <RankShadingContext.Provider value={shading}>
      {children}
    </RankShadingContext.Provider>
  )
}
