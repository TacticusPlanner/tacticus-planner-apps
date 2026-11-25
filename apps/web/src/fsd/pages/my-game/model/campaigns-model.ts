import { campaignDescriptor } from "@workspace/game-catalog"
import type {
  CampaignBattleStorageModel,
  CampaignDefinitionStorageModel,
} from "@workspace/game-catalog"
import type { PlayerDataChunkDto } from "@workspace/player-data"

import {
  medalCompletion,
  sumMedalStats,
  trackMedalStats,
  unclaimedTrackRewards,
} from "@/features/daily-raids"
import type {
  TrackMedalStats,
  UnclaimedTrackRewards,
} from "@/features/daily-raids"

type Story = {
  key: string
  nameKey: string
  mirror: boolean
  definitions: CampaignDefinitionStorageModel[]
}

export type BuiltTrack = {
  definition: CampaignDefinitionStorageModel
  type: string
  max: number
  completed: number
  medals: TrackMedalStats | undefined
  /** One-time rewards still to claim; absent while saved battle progress isn't available. */
  unclaimed: UnclaimedTrackRewards | undefined
}

export type BuiltStory = Omit<Story, "definitions"> & {
  definitions: BuiltTrack[]
  coreCharacters: string[]
  /** Battles across the story's tracks still holding a one-time reward. */
  unclaimedBattles: number
}

type Completion = { done: number; total: number }

/** A headline counter (campaign-progress): percent (rounded down), battles, tracks cleared and
 *  medals, plus what the percent counts. */
export type CampaignSummary = {
  done: number
  total: number
  percent: number
  cleared: number
  medals: TrackMedalStats | undefined
  completion: Completion & { basis: "medals" | "battles" }
}

export const isEliteTrack = (track: Pick<BuiltTrack, "type">) =>
  track.type.includes("Elite")

/** A track's completion: medals and Lightning Victories when recorded, else battles cleared. */
export const completionOf = (track: BuiltTrack): Completion =>
  track.medals
    ? medalCompletion(track.medals)
    : { done: track.completed, total: track.max }

export const completionOfTracks = (tracks: readonly BuiltTrack[]): Completion =>
  tracks.map(completionOf).reduce(
    (sum, part) => ({
      done: sum.done + part.done,
      total: sum.total + part.total,
    }),
    { done: 0, total: 0 }
  )

/** The exact share done, 0–100, for progress bars. */
export const percentOf = ({ done, total }: Completion) =>
  total > 0 ? (done / total) * 100 : 0

/** The share done as a readout: rounded down, so it reads 100% only when everything is earned
 *  (1,832 of 1,840 is 99%, not 100%). */
export const percentLabel = (completion: Completion) =>
  completion.total > 0
    ? Math.floor((completion.done * 100) / completion.total)
    : 0

export function summarize(tracks: readonly BuiltTrack[]): CampaignSummary {
  const done = tracks.reduce((sum, track) => sum + track.completed, 0)
  const total = tracks.reduce((sum, track) => sum + track.max, 0)
  const completion = completionOfTracks(tracks)
  return {
    done,
    total,
    percent: percentLabel(completion),
    cleared: tracks.filter((track) => track.completed >= track.max).length,
    medals: sumMedalStats(tracks.flatMap((track) => track.medals ?? [])),
    completion: {
      ...completion,
      basis: tracks.some((track) => track.medals) ? "medals" : "battles",
    },
  }
}

function groupStories(definitions: readonly CampaignDefinitionStorageModel[]) {
  const grouped = new Map<string, Story>()
  for (const definition of definitions) {
    if (definition.releaseType === "event") continue
    const type = definition.types[0] ?? "Standard"
    const descriptor = campaignDescriptor(definition.groupId, type)
    if (!descriptor) continue
    const key = `${descriptor.nameKey}|${descriptor.isMirror}`
    const current = grouped.get(key)
    if (current) current.definitions.push(definition)
    else {
      grouped.set(key, {
        key,
        nameKey: descriptor.nameKey,
        mirror: descriptor.isMirror,
        definitions: [definition],
      })
    }
  }
  return [...grouped.values()]
}

/**
 * The Campaigns page model (campaign-progress): each story's tracks with battles, medals and
 * unclaimed rewards, and four counters (Normal, Normal Elite, Mirror, Mirror Elite), each over its
 * own tracks only.
 */
export function buildCampaignsModel(data: {
  definitions: CampaignDefinitionStorageModel[]
  battles: CampaignBattleStorageModel[]
  progress: PlayerDataChunkDto<"campaign-progress">
  characters: PlayerDataChunkDto<"characters"> | null | undefined
  /** Saved battle progress; absent while signed out or before it has loaded. */
  overrides?: Parameters<typeof trackMedalStats>[2]
}) {
  const battlesByGroup = new Map<string, CampaignBattleStorageModel[]>()
  for (const battle of data.battles) {
    const current = battlesByGroup.get(battle.campaignGroupId) ?? []
    current.push(battle)
    battlesByGroup.set(battle.campaignGroupId, current)
  }
  const progressByKey = new Map(
    data.progress.map((entry) => [
      `${entry.tacticusCampaignId}|${entry.type}`,
      entry.highestCompletedBattleIndex,
    ])
  )
  const owned = new Set(
    (data.characters ?? []).map((character) => character.unitId)
  )

  const toTrack = (definition: CampaignDefinitionStorageModel): BuiltTrack => {
    const type = definition.types[0] ?? "Standard"
    const battles = (battlesByGroup.get(definition.groupId) ?? []).filter(
      (battle) => battle.type === type && !battle.challenge
    )
    const max = battles.length
    // The synced index is the frontier battle (not yet 3-medalled), so it equals the number of
    // cleared battles before it — V1's `battles.length - 1`.
    const frontierIndex = progressByKey.get(`${definition.groupId}|${type}`)
    const completed = Math.max(0, Math.min(max, frontierIndex ?? 0))
    const medals = data.overrides
      ? trackMedalStats(battles, frontierIndex, data.overrides)
      : undefined
    // Battles before the frontier are beaten, matching trackMedalStats.
    const beaten = new Set<string>(
      battles
        .filter((battle) => battle.battleIndex < (frontierIndex ?? -1))
        .map((battle) => battle.id)
    )
    const unclaimed = data.overrides
      ? unclaimedTrackRewards(
          battles,
          (battleId) => beaten.has(battleId),
          data.overrides
        )
      : undefined
    return { definition, type, max, completed, medals, unclaimed }
  }

  const stories: BuiltStory[] = groupStories(data.definitions).map((story) => {
    const definitions = story.definitions
      .map(toTrack)
      .toSorted((a, b) => a.max - b.max)
    return {
      ...story,
      definitions,
      coreCharacters: [
        ...new Set(story.definitions.flatMap((d) => d.coreCharacters)),
      ].filter((id) => owned.has(id)),
      unclaimedBattles: definitions.reduce(
        (sum, track) => sum + (track.unclaimed?.battleCount ?? 0),
        0
      ),
    }
  })
  const normal = stories.filter((story) => !story.mirror)
  const mirror = stories.filter((story) => story.mirror)
  const tracksOf = (group: BuiltStory[], elite: boolean) =>
    group
      .flatMap((story) => story.definitions)
      .filter((track) => isEliteTrack(track) === elite)
  const allTracks = stories.flatMap((story) => story.definitions)
  return {
    normal,
    mirror,
    summaries: {
      normal: summarize(tracksOf(normal, false)),
      normalElite: summarize(tracksOf(normal, true)),
      mirror: summarize(tracksOf(mirror, false)),
      mirrorElite: summarize(tracksOf(mirror, true)),
    },
    /** Tracks with a one-time reward still to claim. */
    unclaimedTracks: allTracks.filter(
      (track) => (track.unclaimed?.battleCount ?? 0) > 0
    ).length,
  }
}

export type CampaignsModel = ReturnType<typeof buildCampaignsModel>
