import { useMemo } from "react"
import { campaignDescriptor } from "@workspace/game-catalog"

import {
  isEliteCampaign,
  useTeamRoster,
  useTeamRuleFacts,
} from "@/entities/team"
import type { TeamRoster, TeamRuleFacts } from "@/entities/team"
import { combineReadStates, useCampaignDisplay } from "@/shared/lib"
import { useCatalogDataset } from "@/shared/local-data"
import { useUnitName, useUnitSearchNames } from "@/shared/unit-name"

import { buildPickerUnits } from "./unit-picker"
import type { PickerUnit } from "./unit-picker"

/** A campaign the editor offers: a non-Elite group with its label. */
export interface CampaignOption {
  groupId: string
  label: string
}

/** Storylines first (each before its Mirror), then the event campaigns, as the game lists them. */
function campaignOrder(groupId: string) {
  const storyline = /^(campaign|mirror)(\d+)$/.exec(groupId)
  if (storyline) {
    return Number(storyline[2]) * 2 + (storyline[1] === "mirror" ? 1 : 0)
  }
  const event = /^eventCampaign(\d+)$/.exec(groupId)
  return event ? 100 + Number(event[1]) : 1000
}

export interface TeamEditorData {
  facts: TeamRuleFacts
  /** Null when the roster has never synced. */
  roster: TeamRoster | null
  /** Every unit the picker can list, built once per open. */
  units: PickerUnit[]
  campaigns: CampaignOption[]
  /** The MoWs with a served Incursion, for the Incursion choice. */
  incursionMowIds: string[]
}

/**
 * Everything the open editor reads: the rule facts, the roster, the picker's units and the
 * campaign and Incursion choices. Derived once per open (design D6, the #620 pattern), not on
 * every draft change.
 */
export function useTeamEditorData() {
  const facts = useTeamRuleFacts()
  const roster = useTeamRoster()
  const characters = useCatalogDataset("characters")
  const mows = useCatalogDataset("mows")
  const definitions = useCatalogDataset("campaign-definitions")
  const unitName = useUnitName()
  const searchNamesOf = useUnitSearchNames()
  const { campaignName } = useCampaignDisplay()
  const combined = combineReadStates(
    facts,
    roster,
    characters,
    mows,
    definitions
  )
  const ready = combined.status === "ready" ? combined.data : undefined
  const [
    readyFacts,
    readyRoster,
    readyCharacters,
    readyMows,
    readyDefinitions,
  ] = ready ?? []

  const data = useMemo((): TeamEditorData | undefined => {
    // Undefined only while loading; the roster itself is null when nothing is synced.
    if (
      readyFacts === undefined ||
      readyRoster === undefined ||
      readyCharacters === undefined ||
      readyMows === undefined ||
      readyDefinitions === undefined
    ) {
      return undefined
    }
    const factsData = readyFacts
    const rosterData = readyRoster
    const characterData = readyCharacters
    const mowData = readyMows
    const definitionData = readyDefinitions
    const campaigns = definitionData
      .filter((definition) => !isEliteCampaign(definition))
      .map((definition) => {
        const descriptor = campaignDescriptor(definition.groupId, "Standard")
        return {
          groupId: definition.groupId,
          label: descriptor ? campaignName(descriptor) : definition.groupId,
        }
      })
      .toSorted((a, b) => campaignOrder(a.groupId) - campaignOrder(b.groupId))
    return {
      facts: factsData,
      roster: rosterData,
      units: buildPickerUnits({
        characters: characterData,
        mows: mowData,
        roster: rosterData,
        nameOf: (kind, id) =>
          unitName(kind === "mow" ? "Mow" : "Character", id),
        searchNamesOf,
      }),
      campaigns,
      incursionMowIds: [...factsData.incursionFactionsByMowId.keys()],
    }
    // Built once per loaded dataset set; the name callbacks change only with the language.
  }, [
    readyFacts,
    readyRoster,
    readyCharacters,
    readyMows,
    readyDefinitions,
    unitName,
    searchNamesOf,
    campaignName,
  ])

  if (!data) {
    return combined.status === "error"
      ? ({ status: "error", retry: combined.retry } as const)
      : ({ status: "loading", retry: combined.retry } as const)
  }
  return { status: "ready", data, retry: combined.retry } as const
}
