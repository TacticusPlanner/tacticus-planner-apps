import {
  campaignDescriptor,
  type CampaignBattleStorageModel,
  type CampaignDefinitionStorageModel,
} from "@workspace/game-catalog"
import type { PlayerDataChunkDto } from "@workspace/player-data"

import {
  campaignEventTrackKey,
  resolveCampaignEventProgress,
  type CampaignEventProgressOverride,
  type EffectiveCampaignEventProgress,
} from "@/entities/player-data-override"

export const eventTypes = ["Standard", "Extremis"] as const
export type EventType = (typeof eventTypes)[number]

type TrackBattles = {
  regular: CampaignBattleStorageModel[]
  /** Sorted by node number, so "Challenge N" is the Nth challenge along the track. */
  challenges: CampaignBattleStorageModel[]
}

export type EventModel = {
  definition: CampaignDefinitionStorageModel
  nameKey: string
  coreCharacters: { id: string; owned: boolean }[]
  tracks: Record<EventType, TrackBattles>
}

export function buildEvents(data: {
  definitions: CampaignDefinitionStorageModel[]
  battles: CampaignBattleStorageModel[]
  characters: PlayerDataChunkDto<"characters"> | undefined
}): EventModel[] {
  const owned = new Set(
    (data.characters ?? []).map((character) => character.unitId)
  )
  return data.definitions
    .filter((definition) => definition.releaseType === "event")
    .map((definition) => {
      const groupBattles = data.battles.filter(
        (battle) => battle.campaignGroupId === definition.groupId
      )
      const tracks = Object.fromEntries(
        eventTypes.map((type) => [
          type,
          {
            regular: groupBattles.filter(
              (battle) => battle.type === type && !battle.challenge
            ),
            challenges: groupBattles
              .filter((battle) => battle.type === type && battle.challenge)
              .sort((a, b) => a.nodeNumber - b.nodeNumber),
          },
        ])
      ) as EventModel["tracks"]
      const descriptor = campaignDescriptor(definition.groupId, "Standard")
      return {
        definition,
        nameKey: descriptor?.nameKey ?? definition.groupId,
        coreCharacters: definition.coreCharacters.map((id) => ({
          id,
          owned: owned.has(id),
        })),
        tracks,
      }
    })
}

// ---------------------------------------------------------------------------------------------
// Draft overrides
// ---------------------------------------------------------------------------------------------

/**
 * Canonical form of the override list: cloned, entries with nothing set dropped, sorted by track
 * key, and challenge ids sorted — so two drafts that mean the same thing compare equal.
 */
export function normalizeOverrides(
  items: readonly CampaignEventProgressOverride[]
): CampaignEventProgressOverride[] {
  return items
    .filter(
      (item) =>
        item.completedBattleCount !== null ||
        item.completedChallengeBattlesIds !== null
    )
    .map((item) => ({
      ...item,
      completedChallengeBattlesIds: item.completedChallengeBattlesIds
        ? [...item.completedChallengeBattlesIds].sort()
        : null,
    }))
    .sort((a, b) =>
      campaignEventTrackKey(a.campaignGroupId, a.type).localeCompare(
        campaignEventTrackKey(b.campaignGroupId, b.type)
      )
    )
}

export type OverridePatch = Partial<
  Pick<
    CampaignEventProgressOverride,
    "completedBattleCount" | "completedChallengeBattlesIds"
  >
>

/** Sets or clears (`null`) one track's override values, returning a new normalized draft. */
export function applyOverridePatch(
  draft: readonly CampaignEventProgressOverride[],
  groupId: string,
  type: EventType,
  patch: OverridePatch
): CampaignEventProgressOverride[] {
  const existing = draft.find(
    (entry) => entry.campaignGroupId === groupId && entry.type === type
  ) ?? {
    campaignGroupId: groupId,
    type,
    completedBattleCount: null,
    completedChallengeBattlesIds: null,
  }
  return normalizeOverrides([
    ...draft.filter((entry) => entry !== existing),
    { ...existing, ...patch },
  ])
}

// ---------------------------------------------------------------------------------------------
// Effective view of events
// ---------------------------------------------------------------------------------------------

export type TrackView = {
  battles: TrackBattles
  progress: EffectiveCampaignEventProgress
  /** Completed challenges of this track (ids outside the track's catalog are ignored). */
  completedChallenges: number
}

export type EventView = {
  event: EventModel
  tracks: Record<EventType, TrackView>
  completed: boolean
  summary: {
    standard: { done: number; total: number }
    extremis: { done: number; total: number }
    challenges: { done: number; total: number }
    /** Any value in the event is a manual override. */
    hasManual: boolean
    /** Any track that has battles has a value with neither synced data nor an override. */
    hasNoData: boolean
  }
}

const NO_PROGRESS = resolveCampaignEventProgress(undefined, undefined)

function trackView(
  battles: TrackBattles,
  progress: EffectiveCampaignEventProgress
): TrackView {
  const challengeIds = new Set<string>(
    battles.challenges.map((battle) => battle.id)
  )
  return {
    battles,
    progress,
    completedChallenges: progress.completedChallengeBattlesIds.filter((id) =>
      challengeIds.has(id)
    ).length,
  }
}

const isTrackCompleted = (track: TrackView) =>
  track.progress.completedBattleCount >= track.battles.regular.length &&
  track.completedChallenges >= track.battles.challenges.length

export function toEventView(
  event: EventModel,
  effective: ReadonlyMap<string, EffectiveCampaignEventProgress>
): EventView {
  const tracks = Object.fromEntries(
    eventTypes.map((type) => [
      type,
      trackView(
        event.tracks[type],
        effective.get(campaignEventTrackKey(event.definition.groupId, type)) ??
          NO_PROGRESS
      ),
    ])
  ) as Record<EventType, TrackView>
  // Each track's sources, but only for the kinds of nodes it has: a track without challenge nodes
  // has no challenge value to be manual or missing.
  const sources = eventTypes.flatMap((type) => {
    const track = tracks[type]
    return [
      ...(track.battles.regular.length > 0
        ? [track.progress.battleSource]
        : []),
      ...(track.battles.challenges.length > 0
        ? [track.progress.challengeSource]
        : []),
    ]
  })
  const done = (track: TrackView) =>
    Math.min(track.progress.completedBattleCount, track.battles.regular.length)
  return {
    event,
    tracks,
    completed: eventTypes.every((type) => isTrackCompleted(tracks[type])),
    summary: {
      standard: {
        done: done(tracks.Standard),
        total: tracks.Standard.battles.regular.length,
      },
      extremis: {
        done: done(tracks.Extremis),
        total: tracks.Extremis.battles.regular.length,
      },
      challenges: {
        done:
          tracks.Standard.completedChallenges +
          tracks.Extremis.completedChallenges,
        total:
          tracks.Standard.battles.challenges.length +
          tracks.Extremis.battles.challenges.length,
      },
      hasManual: sources.includes("manual"),
      hasNoData: sources.includes("none"),
    },
  }
}

/**
 * Splits out the active event (when the catalog has it) and orders the rest unfinished first,
 * keeping catalog order within each group.
 */
export function buildEventViews(
  events: readonly EventModel[],
  effective: ReadonlyMap<string, EffectiveCampaignEventProgress>,
  activeCampaignEventId: string | null | undefined
): { current: EventView | undefined; list: EventView[] } {
  const views = events.map((event) => toEventView(event, effective))
  const current = views.find(
    (view) => view.event.definition.groupId === activeCampaignEventId
  )
  const rest = views.filter((view) => view !== current)
  return {
    current,
    list: [
      ...rest.filter((view) => !view.completed),
      ...rest.filter((view) => view.completed),
    ],
  }
}
