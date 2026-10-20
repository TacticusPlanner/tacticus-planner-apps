import { useCallback, useMemo, useState } from "react"
import { useLiveQuery } from "dexie-react-hooks"
import { useTranslation } from "react-i18next"
import { getCharactersMap } from "@workspace/game-catalog/queries"
import { getPlayerCharacters } from "@workspace/player-data/queries"

import type { HreTeamPlan } from "@/features/hre-missions"

import type { RawRosterCharacter } from "./arena-recommendations.types"
import { buildSummonerIds } from "./hre-summoners"
import { buildHreTeam, type HreTeam } from "./hre-team-recommendations"
import { useTeamUnitPower } from "./use-team-unit-power"

type CatalogCharacter =
  Awaited<ReturnType<typeof getCharactersMap>> extends ReadonlyMap<
    unknown,
    infer TValue
  >
    ? TValue
    : never

type HreTeamsRead =
  | {
      status: "ready"
      roster: readonly RawRosterCharacter[]
      catalog: ReadonlyMap<string, CatalogCharacter>
    }
  | { status: "error" }

export type HreTeamViewModel =
  | { status: "hidden" }
  | { status: "loading" }
  | { status: "error"; retry: () => void }
  | { status: "ready"; team: HreTeam }

// `useLiveQuery` has no error channel, so the querier resolves a tagged result instead.
async function readTeams(): Promise<HreTeamsRead> {
  try {
    const [roster, catalog] = await Promise.all([
      getPlayerCharacters(),
      getCharactersMap(),
    ])
    return { status: "ready", roster: roster ?? [], catalog }
  } catch {
    return { status: "error" }
  }
}

/**
 * One HRE mission team per team plan of the current mission (`selectTeamPlans`), in plan order.
 * Summoners come from the English ability rules text (`npcAbilityText`).
 */
export function useHreTeamRecommendations(input: {
  plans: readonly HreTeamPlan[]
  alliance: string | null
  featuredCharacterId: string | null
}): HreTeamViewModel[] {
  const [retryNonce, setRetryNonce] = useState(0)
  const read = useLiveQuery(readTeams, [retryNonce])
  const retry = useCallback(() => setRetryNonce((nonce) => nonce + 1), [])
  const { loading: unitPowerLoading, unitPower } = useTeamUnitPower()
  const { i18n } = useTranslation("npcAbilityText")

  const summoners = useMemo(() => {
    if (read?.status !== "ready") return new Set<never>()
    return buildSummonerIds(read.catalog.values(), (abilityId) => {
      const entry = i18n.getResource("en", "npcAbilityText", abilityId) as
        { description?: string } | undefined
      return entry?.description
    })
  }, [read, i18n])

  return input.plans.map((plan): HreTeamViewModel => {
    if (!read || unitPowerLoading) return { status: "loading" }
    if (read.status === "error") return { status: "error", retry }
    const team = buildHreTeam({
      plan,
      alliance: input.alliance,
      featuredCharacterId: input.featuredCharacterId,
      roster: read.roster,
      catalog: read.catalog,
      summoners,
      unitPower,
    })
    return team ? { status: "ready", team } : { status: "hidden" }
  })
}
