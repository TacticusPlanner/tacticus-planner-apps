import { describe, expect, it } from "vitest"
import type {
  CampaignBattleStorageModel,
  CampaignDefinitionStorageModel,
} from "@workspace/game-catalog"

import {
  buildEffectiveCampaignEventProgress,
  type CampaignEventProgressOverride,
  type SyncedCampaignEventProgress,
} from "@/entities/player-data-override"

import {
  applyOverridePatch,
  buildEventViews,
  buildEvents,
  normalizeOverrides,
  toEventView,
} from "./campaign-events.model"

const definition = (
  groupId: string,
  coreCharacters: string[] = []
): CampaignDefinitionStorageModel =>
  ({
    groupId,
    faction: "DeathGuard",
    releaseType: "event",
    coreCharacters,
    types: ["Standard", "Extremis"],
    battleIds: [],
  }) as unknown as CampaignDefinitionStorageModel

const battle = (
  campaignGroupId: string,
  type: string,
  nodeNumber: number,
  challenge = false
): CampaignBattleStorageModel =>
  ({
    id: `${campaignGroupId}-${type}-${nodeNumber}${challenge ? "B" : ""}`,
    campaignGroupId,
    type,
    challenge,
    nodeNumber,
  }) as unknown as CampaignBattleStorageModel

/** An event with `regular` regular battles per track and challenges at the given nodes. */
function eventBattles(
  groupId: string,
  regular: number,
  challengeNodes: Record<"Standard" | "Extremis", number[]>
) {
  return (["Standard", "Extremis"] as const).flatMap((type) => [
    ...Array.from({ length: regular }, (_, index) =>
      battle(groupId, type, index + 1)
    ),
    ...challengeNodes[type].map((node) => battle(groupId, type, node, true)),
  ])
}

const synced = (
  groupId: string,
  type: string,
  completedBattleCount: number,
  completedChallengeBattlesIds: string[] = []
): SyncedCampaignEventProgress => ({
  tacticusCampaignId: groupId,
  type,
  completedBattleCount,
  completedChallengeBattlesIds,
})

const override = (
  patch: Partial<CampaignEventProgressOverride> &
    Pick<CampaignEventProgressOverride, "campaignGroupId" | "type">
): CampaignEventProgressOverride => ({
  completedBattleCount: null,
  completedChallengeBattlesIds: null,
  ...patch,
})

describe("buildEvents", () => {
  it("keeps every core character and marks ownership", () => {
    const [event] = buildEvents({
      definitions: [definition("eventCampaign1", ["unitA", "unitB"])],
      battles: [],
      characters: [{ unitId: "unitA" }] as never,
    })
    expect(event?.coreCharacters).toEqual([
      { id: "unitA", owned: true },
      { id: "unitB", owned: false },
    ])
  })

  it("sorts challenges by node number", () => {
    const [event] = buildEvents({
      definitions: [definition("eventCampaign1")],
      battles: [
        battle("eventCampaign1", "Standard", 11, true),
        battle("eventCampaign1", "Standard", 3, true),
        battle("eventCampaign1", "Standard", 7, true),
      ],
      characters: [],
    })
    expect(
      event?.tracks.Standard.challenges.map((entry) => entry.nodeNumber)
    ).toEqual([3, 7, 11])
  })

  it("ignores non-event campaigns", () => {
    expect(
      buildEvents({
        definitions: [
          {
            ...definition("campaign1"),
            releaseType: "standard",
          } as CampaignDefinitionStorageModel,
        ],
        battles: [],
        characters: [],
      })
    ).toEqual([])
  })
})

describe("draft overrides", () => {
  it("normalizes order, drops empty entries and sorts challenge ids", () => {
    expect(
      normalizeOverrides([
        override({
          campaignGroupId: "eventCampaign2",
          type: "Standard",
          completedBattleCount: 1,
        }),
        override({ campaignGroupId: "eventCampaign1", type: "Extremis" }),
        override({
          campaignGroupId: "eventCampaign1",
          type: "Standard",
          completedChallengeBattlesIds: ["b", "a"],
        }),
      ])
    ).toEqual([
      override({
        campaignGroupId: "eventCampaign1",
        type: "Standard",
        completedChallengeBattlesIds: ["a", "b"],
      }),
      override({
        campaignGroupId: "eventCampaign2",
        type: "Standard",
        completedBattleCount: 1,
      }),
    ])
  })

  it("creates, updates and clears a track override", () => {
    const created = applyOverridePatch([], "eventCampaign1", "Standard", {
      completedBattleCount: 5,
    })
    expect(created).toEqual([
      override({
        campaignGroupId: "eventCampaign1",
        type: "Standard",
        completedBattleCount: 5,
      }),
    ])
    const updated = applyOverridePatch(created, "eventCampaign1", "Standard", {
      completedChallengeBattlesIds: ["x"],
    })
    expect(updated[0]).toMatchObject({
      completedBattleCount: 5,
      completedChallengeBattlesIds: ["x"],
    })
    const cleared = applyOverridePatch(
      applyOverridePatch(updated, "eventCampaign1", "Standard", {
        completedBattleCount: null,
      }),
      "eventCampaign1",
      "Standard",
      { completedChallengeBattlesIds: null }
    )
    expect(cleared).toEqual([])
  })
})

describe("event views", () => {
  const [event] = buildEvents({
    definitions: [definition("eventCampaign1")],
    battles: eventBattles("eventCampaign1", 30, {
      Standard: [3, 7, 11],
      Extremis: [5, 9],
    }),
    characters: [],
  })

  it("summarises Standard 12/30 · Extremis 0/30 · Challenges 2/5", () => {
    const view = toEventView(
      event!,
      buildEffectiveCampaignEventProgress(
        [
          synced("eventCampaign1", "Standard", 12, [
            "eventCampaign1-Standard-3B",
            "eventCampaign1-Standard-7B",
          ]),
        ],
        []
      )
    )
    expect(view.summary).toMatchObject({
      standard: { done: 12, total: 30 },
      extremis: { done: 0, total: 30 },
      challenges: { done: 2, total: 5 },
      hasManual: false,
      // Extremis has battles but neither synced data nor an override.
      hasNoData: true,
    })
    expect(view.completed).toBe(false)
  })

  it("ignores challenge ids that are not part of the track", () => {
    const view = toEventView(
      event!,
      buildEffectiveCampaignEventProgress(
        [synced("eventCampaign1", "Standard", 0, ["someOtherEvent-3B"])],
        []
      )
    )
    expect(view.summary.challenges.done).toBe(0)
  })

  it("flags manual values", () => {
    const view = toEventView(
      event!,
      buildEffectiveCampaignEventProgress(
        [],
        [
          override({
            campaignGroupId: "eventCampaign1",
            type: "Extremis",
            completedBattleCount: 4,
          }),
        ]
      )
    )
    expect(view.summary.hasManual).toBe(true)
    expect(view.tracks.Extremis.progress.battleSource).toBe("manual")
  })

  it("counts an event completed only when every track's battles and challenges are done", () => {
    const all = (type: string, nodes: number[]) =>
      synced(
        "eventCampaign1",
        type,
        30,
        nodes.map((node) => `eventCampaign1-${type}-${node}B`)
      )
    const done = buildEffectiveCampaignEventProgress(
      [all("Standard", [3, 7, 11]), all("Extremis", [5, 9])],
      []
    )
    expect(toEventView(event!, done).completed).toBe(true)
    const missingChallenge = buildEffectiveCampaignEventProgress(
      [all("Standard", [3, 7, 11]), all("Extremis", [5])],
      []
    )
    expect(toEventView(event!, missingChallenge).completed).toBe(false)
  })

  it("treats a track with no battles as completed", () => {
    const [standardOnly] = buildEvents({
      definitions: [definition("eventCampaign9")],
      battles: [battle("eventCampaign9", "Standard", 1)],
      characters: [],
    })
    const view = toEventView(
      standardOnly!,
      buildEffectiveCampaignEventProgress(
        [synced("eventCampaign9", "Standard", 1)],
        []
      )
    )
    expect(view.completed).toBe(true)
    expect(view.summary.hasNoData).toBe(false)
  })
})

describe("buildEventViews", () => {
  const events = buildEvents({
    definitions: ["A", "B", "C"].map((id) => definition(`event${id}`)),
    battles: ["A", "B", "C"].flatMap((id) =>
      eventBattles(`event${id}`, 1, { Standard: [], Extremis: [] })
    ),
    characters: [],
  })
  const completedA = buildEffectiveCampaignEventProgress(
    [synced("eventA", "Standard", 1), synced("eventA", "Extremis", 1)],
    []
  )

  it("orders unfinished events first, keeping catalog order (B, C, A)", () => {
    const { current, list } = buildEventViews(events, completedA, null)
    expect(current).toBeUndefined()
    expect(list.map((view) => view.event.definition.groupId)).toEqual([
      "eventB",
      "eventC",
      "eventA",
    ])
  })

  it("splits out the active event and does not repeat it in the list", () => {
    const { current, list } = buildEventViews(events, completedA, "eventC")
    expect(current?.event.definition.groupId).toBe("eventC")
    expect(list.map((view) => view.event.definition.groupId)).toEqual([
      "eventB",
      "eventA",
    ])
  })

  it("lists every event when the active id is not in the catalog", () => {
    const { current, list } = buildEventViews(events, completedA, "eventZ")
    expect(current).toBeUndefined()
    expect(list).toHaveLength(3)
  })

  it("moves an event between groups as the draft completes it", () => {
    const draft = buildEffectiveCampaignEventProgress(
      [],
      [
        override({
          campaignGroupId: "eventB",
          type: "Standard",
          completedBattleCount: 1,
        }),
        override({
          campaignGroupId: "eventB",
          type: "Extremis",
          completedBattleCount: 1,
        }),
      ]
    )
    expect(
      buildEventViews(events, draft, null).list.map(
        (view) => view.event.definition.groupId
      )
    ).toEqual(["eventA", "eventC", "eventB"])
  })
})
