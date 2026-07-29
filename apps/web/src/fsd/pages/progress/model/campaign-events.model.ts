import {
  campaignDescriptor,
  type CampaignBattleStorageModel,
  type CampaignDefinitionStorageModel,
} from "@workspace/game-catalog"
import type { PlayerDataChunkDto } from "@workspace/player-data"

import type { CampaignEventProgressOverride } from "@/entities/player-data-override"

export type EventType = "Standard" | "Extremis"
export type EventModel = {
  definition: CampaignDefinitionStorageModel
  nameKey: string
  coreCharacters: string[]
  tracks: Record<
    EventType,
    {
      regular: CampaignBattleStorageModel[]
      challenges: CampaignBattleStorageModel[]
    }
  >
}

export function buildEvents(data: {
  definitions: CampaignDefinitionStorageModel[]
  battles: CampaignBattleStorageModel[]
  characters: PlayerDataChunkDto<"characters"> | undefined
}): EventModel[] {
  const owned = new Set(
    (data.characters ?? []).map((character) => character.id)
  )
  return data.definitions
    .filter((definition) => definition.releaseType === "event")
    .map((definition) => {
      const groupBattles = data.battles.filter(
        (battle) => battle.campaignGroupId === definition.groupId
      )
      const tracks = Object.fromEntries(
        (["Standard", "Extremis"] as const).map((type) => [
          type,
          {
            regular: groupBattles.filter(
              (battle) => battle.type === type && !battle.challenge
            ),
            challenges: groupBattles.filter(
              (battle) => battle.type === type && battle.challenge
            ),
          },
        ])
      ) as EventModel["tracks"]
      const descriptor = campaignDescriptor(definition.groupId, "Standard")
      return {
        definition,
        nameKey: descriptor?.nameKey ?? definition.groupId,
        coreCharacters: definition.coreCharacters.filter((id) => owned.has(id)),
        tracks,
      }
    })
}

export const keyOf = (groupId: string, type: string) => `${groupId}|${type}`

export const cloneOverrides = (items: CampaignEventProgressOverride[]) =>
  items.map((item) => ({
    ...item,
    completedChallengeBattlesIds: item.completedChallengeBattlesIds
      ? [...item.completedChallengeBattlesIds]
      : null,
  }))
