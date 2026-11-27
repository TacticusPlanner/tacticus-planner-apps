import { useMemo } from "react"

import { combineReadStates } from "@/shared/lib"
import type { ReadState } from "@/shared/lib"
import { useCatalogDataset } from "@/shared/local-data"

import { buildTeamRuleFacts } from "../lib/team-rule-facts"
import type { TeamRuleFacts } from "../lib/team-rules"

/** The catalog facts the team rules read, once every dataset they need is loaded. */
export function useTeamRuleFacts(): ReadState<TeamRuleFacts> {
  const characters = useCatalogDataset("characters")
  const mows = useCatalogDataset("mows")
  const campaignDefinitions = useCatalogDataset("campaign-definitions")
  const campaignBattles = useCatalogDataset("campaign-battles")
  const incursions = useCatalogDataset("incursions")
  const survivalEvents = useCatalogDataset("survival-events")
  const combined = combineReadStates(
    characters,
    mows,
    campaignDefinitions,
    campaignBattles,
    incursions,
    survivalEvents
  )
  const data = combined.status === "ready" ? combined.data : undefined
  const [
    characterData,
    mowData,
    definitionData,
    battleData,
    incursionData,
    survivalData,
  ] = data ?? []
  const facts = useMemo(
    () =>
      characterData &&
      mowData &&
      definitionData &&
      battleData &&
      incursionData &&
      survivalData
        ? buildTeamRuleFacts({
            characters: characterData,
            mows: mowData,
            campaignDefinitions: definitionData,
            campaignBattles: battleData,
            incursions: incursionData,
            survivalEvents: survivalData,
          })
        : undefined,
    [
      characterData,
      mowData,
      definitionData,
      battleData,
      incursionData,
      survivalData,
    ]
  )
  if (combined.status !== "ready" || !facts) {
    return combined.status === "error"
      ? { status: "error", retry: combined.retry }
      : { status: "loading", retry: combined.retry }
  }
  return { status: "ready", data: facts, retry: combined.retry }
}
