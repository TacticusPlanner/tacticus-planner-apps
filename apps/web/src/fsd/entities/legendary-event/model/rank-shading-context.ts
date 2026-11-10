import { createContext, useContext } from "react"

export interface RankShading {
  shaded: boolean
  setShaded: (shaded: boolean) => void
}

// Without a provider (a chip outside the event page) chips are shaded, the setting's default.
export const RankShadingContext = createContext<RankShading>({
  shaded: true,
  setShaded: () => {},
})

/** The event page's Rank shading setting, provided by `RankShadingProvider`. */
export function useRankShading(): RankShading {
  return useContext(RankShadingContext)
}
