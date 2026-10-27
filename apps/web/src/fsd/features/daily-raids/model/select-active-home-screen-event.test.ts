import { afterEach, describe, expect, it, vi } from "vitest"

import { homeScreenEventDefinition } from "@/test/fixtures/home-screen-event"

import { homeScreenEventEntryRule } from "./home-screen-event-raid-rule"

import {
  homeScreenEventInstanceKey,
  listHomeScreenEventInstances,
  resolveHomeScreenEventSelection,
  selectActiveHomeScreenEvent,
  selectListTarget,
  type HomeScreenEventEntry,
  type HomeScreenEventInstance,
} from "./select-active-home-screen-event"

const definitions = new Map(
  [
    "hse-machine-hunt",
    "hse-warp-surge",
    "hse-training-rush",
    "hse-arsenal-of-war",
    "hse-faction-boost",
    "hse-faction-focus",
    "hse-global-operation-imperator",
    "hse-trait-boost-psyker",
    "hse-against-the-tide",
  ].map((id) => [id, homeScreenEventDefinition(id)])
)
definitions.set("campaign-event", { type: "CampaignEvent", config: undefined })
const entry = (definitionId: string, startUtc: string, endUtc: string) => ({
  definitionId,
  startUtc,
  endUtc,
})
const machineHunt = entry(
  "hse-machine-hunt",
  "2026-10-02T08:00:00Z",
  "2026-10-06T08:00:00Z"
)
const at = (iso: string) => Date.parse(iso)
const activeOf = (
  entries: ReturnType<typeof entry>[],
  now: string
): ReturnType<typeof entry> | null =>
  selectActiveHomeScreenEvent(
    entries,
    definitions,
    at(now),
    homeScreenEventEntryRule
  ).active

describe("selectActiveHomeScreenEvent", () => {
  afterEach(() => vi.unstubAllEnvs())

  it("is active up to the last instant before the exclusive end", () => {
    expect(activeOf([machineHunt], "2026-10-06T07:59:59Z")).toBe(machineHunt)
    expect(activeOf([machineHunt], "2026-10-06T08:00:00Z")).toBeNull()
  })

  it("is active at the inclusive start", () => {
    expect(activeOf([machineHunt], "2026-10-02T08:00:00Z")).toBe(machineHunt)
  })

  it.each(["UTC", "Pacific/Honolulu", "Asia/Tokyo"])(
    "ignores the device timezone (%s)",
    (timeZone) => {
      vi.stubEnv("TZ", timeZone)
      // 2026-10-01 22:00 in UTC-10 is 2026-10-02T08:00Z.
      expect(activeOf([machineHunt], "2026-10-02T08:00:00Z")).toBe(machineHunt)
      expect(activeOf([machineHunt], "2026-10-02T07:59:59Z")).toBeNull()
    }
  )

  it("picks the latest-starting of two overlapping rule-bearing events", () => {
    const warp = entry(
      "hse-warp-surge",
      "2026-08-09T00:00:00Z",
      "2026-08-15T00:00:00Z"
    )
    const hunt = entry(
      "hse-machine-hunt",
      "2026-08-11T00:00:00Z",
      "2026-08-14T00:00:00Z"
    )
    expect(activeOf([warp, hunt], "2026-08-12T00:00:00Z")).toBe(hunt)
  })

  it("prefers a rule-bearing event over a later-starting one without a rule", () => {
    const warp = entry(
      "hse-warp-surge",
      "2026-08-09T00:00:00Z",
      "2026-08-15T00:00:00Z"
    )
    const arsenal = entry(
      "hse-arsenal-of-war",
      "2026-08-10T00:00:00Z",
      "2026-08-15T00:00:00Z"
    )
    expect(activeOf([arsenal, warp], "2026-08-12T00:00:00Z")).toBe(warp)
  })

  it("breaks a same-start tie by the lowest definition id", () => {
    const training = entry(
      "hse-training-rush",
      "2026-08-09T00:00:00Z",
      "2026-08-15T00:00:00Z"
    )
    const warp = entry(
      "hse-warp-surge",
      "2026-08-09T00:00:00Z",
      "2026-08-15T00:00:00Z"
    )
    expect(activeOf([warp, training], "2026-08-12T00:00:00Z")).toBe(training)
  })

  it("reports an active event without a rule", () => {
    const boost = entry(
      "hse-faction-boost",
      "2026-09-01T00:00:00Z",
      "2026-09-04T00:00:00Z"
    )
    expect(activeOf([boost], "2026-09-02T00:00:00Z")).toBe(boost)
  })

  it("selects the earliest not-yet-started event as next, ignoring non-HSE entries", () => {
    const later = entry(
      "hse-warp-surge",
      "2026-10-20T00:00:00Z",
      "2026-10-23T00:00:00Z"
    )
    const campaign = entry(
      "campaign-event",
      "2026-10-01T12:00:00Z",
      "2026-10-30T00:00:00Z"
    )
    const selection = selectActiveHomeScreenEvent(
      [later, campaign, machineHunt],
      definitions,
      at("2026-10-01T10:00:00Z"),
      homeScreenEventEntryRule
    )
    expect(selection.active).toBeNull()
    expect(selection.next).toBe(machineHunt)
  })

  it("has neither with an empty calendar or only unknown definitions", () => {
    expect(
      selectActiveHomeScreenEvent([], definitions, 0, homeScreenEventEntryRule)
    ).toEqual({
      active: null,
      next: null,
      upcoming: [],
    })
    const mystery = entry(
      "mystery",
      "2026-01-01T00:00:00Z",
      "2027-01-01T00:00:00Z"
    )
    expect(activeOf([mystery], "2026-06-01T00:00:00Z")).toBeNull()
  })

  it("lists upcoming events ascending by start, excluding the active one, with next as the first", () => {
    const warp = entry(
      "hse-warp-surge",
      "2026-10-20T00:00:00Z",
      "2026-10-23T00:00:00Z"
    )
    const training = entry(
      "hse-training-rush",
      "2026-10-09T08:00:00Z",
      "2026-10-12T08:00:00Z"
    )
    const selection = selectActiveHomeScreenEvent(
      [warp, training, machineHunt],
      definitions,
      at("2026-10-03T00:00:00Z"),
      homeScreenEventEntryRule
    )
    expect(selection.active).toBe(machineHunt)
    expect(selection.upcoming).toEqual([training, warp])
    expect(selection.next).toBe(selection.upcoming[0])
  })
})

describe("homeScreenEventInstanceKey", () => {
  it("uses the occurrence id of an authored occurrence", () => {
    expect(
      homeScreenEventInstanceKey({
        ...machineHunt,
        occurrenceId: "occ-2026-10-02-hse-machine-hunt",
      })
    ).toBe("occ-2026-10-02-hse-machine-hunt")
  })

  it("uses definition id and start for a projected placeholder", () => {
    expect(
      homeScreenEventInstanceKey({ ...machineHunt, occurrenceId: null })
    ).toBe("hse-machine-hunt@2026-10-02T08:00:00Z")
    expect(homeScreenEventInstanceKey(machineHunt)).toBe(
      "hse-machine-hunt@2026-10-02T08:00:00Z"
    )
  })
})

describe("rule lookup", () => {
  const now = at("2026-10-03T00:00:00Z")

  it("gives each instance its served raid-point rule", () => {
    const [instance] = listHomeScreenEventInstances(
      [machineHunt],
      definitions,
      now,
      homeScreenEventEntryRule
    )
    expect(instance?.raidRule?.trackers.length).toBeGreaterThan(0)
  })

  it("reads every event as rule-free without a lookup (the app shell's live signal)", () => {
    const [instance] = listHomeScreenEventInstances(
      [machineHunt],
      definitions,
      now
    )
    expect(instance?.raidRule).toBeNull()
    expect(
      selectActiveHomeScreenEvent([machineHunt], definitions, now).active
    ).toBe(machineHunt)
  })
})

describe("listHomeScreenEventInstances", () => {
  // The October 2026 calendar around 2026-10-17T12:48Z (see the add-hse-instance-switcher spec).
  const tide = {
    ...entry(
      "hse-against-the-tide",
      "2026-10-10T08:00:00Z",
      "2026-10-17T08:00:00Z"
    ),
    occurrenceId: "occ-2026-10-10-hse-against-the-tide",
  }
  const psyker = {
    ...entry(
      "hse-trait-boost-psyker",
      "2026-10-19T08:00:00Z",
      "2026-10-23T08:00:00Z"
    ),
    occurrenceId: "occ-2026-10-19-hse-trait-boost-psyker",
  }
  const imperator = {
    ...entry(
      "hse-global-operation-imperator",
      "2026-10-26T08:00:00Z",
      "2026-11-01T08:00:00Z"
    ),
    occurrenceId: "occ-2026-10-26-hse-global-operation-imperator",
  }
  const focus = {
    ...entry(
      "hse-faction-focus",
      "2026-10-26T08:00:00Z",
      "2026-11-01T08:00:00Z"
    ),
    occurrenceId: "occ-2026-10-26-hse-faction-focus",
  }
  const placeholder = {
    ...entry("hse-warp-surge", "2026-11-05T08:00:00Z", "2026-11-08T08:00:00Z"),
    occurrenceId: null,
  }
  const campaign = {
    ...entry("campaign-event", "2026-10-15T00:00:00Z", "2026-10-25T00:00:00Z"),
    occurrenceId: "occ-campaign",
  }
  const calendar = [placeholder, imperator, campaign, focus, psyker, tide]
  const list = (now: string, entries = calendar) =>
    listHomeScreenEventInstances(
      entries,
      definitions,
      at(now),
      homeScreenEventEntryRule
    )

  it("orders every HSE by start, a same start by definition id, and skips other event types", () => {
    expect(
      list("2026-10-17T12:48:00Z").map((instance) => instance.key)
    ).toEqual([
      "occ-2026-10-10-hse-against-the-tide",
      "occ-2026-10-19-hse-trait-boost-psyker",
      "occ-2026-10-26-hse-faction-focus",
      "occ-2026-10-26-hse-global-operation-imperator",
      "hse-warp-surge@2026-11-05T08:00:00Z",
    ])
  })

  it("gives each instance its status at now (start inclusive, end exclusive)", () => {
    expect(
      list("2026-10-17T12:48:00Z").map((instance) => instance.status)
    ).toEqual(["past", "upcoming", "upcoming", "upcoming", "upcoming"])
    expect(
      list("2026-10-27T00:00:00Z").map((instance) => instance.status)
    ).toEqual(["past", "past", "running", "running", "upcoming"])
    expect(list("2026-10-17T08:00:00Z")[0]?.status).toBe("past")
    expect(list("2026-10-17T07:59:59Z")[0]?.status).toBe("running")
  })

  it("keys a projected placeholder by definition id and start", () => {
    const last = list("2026-10-17T12:48:00Z").at(-1)
    expect(last).toMatchObject({
      key: "hse-warp-surge@2026-11-05T08:00:00Z",
      entry: placeholder,
    })
  })

  it("keeps a repeated entry once", () => {
    expect(list("2026-10-17T12:48:00Z", [psyker, { ...psyker }])).toHaveLength(
      1
    )
  })

  it("leaves the default to the overlap rule over the same entries", () => {
    const instances = list("2026-10-27T00:00:00Z")
    const selection = selectActiveHomeScreenEvent(
      instances.map((instance) => instance.entry),
      definitions,
      at("2026-10-27T00:00:00Z"),
      homeScreenEventEntryRule
    )
    // Neither has a raid-point rule and both start together: the lowest definition id wins.
    expect(selection.active).toBe(focus)
    expect(selection.next).toBe(placeholder)
  })
})

describe("resolveHomeScreenEventSelection", () => {
  const running = { ...machineHunt, occurrenceId: "occ-hunt" }
  const later = {
    ...entry("hse-warp-surge", "2026-10-20T00:00:00Z", "2026-10-23T00:00:00Z"),
    occurrenceId: "occ-warp",
  }
  const now = "2026-10-03T00:00:00Z"
  const instances = listHomeScreenEventInstances(
    [running, later],
    definitions,
    at(now),
    homeScreenEventEntryRule
  )
  const defaults = selectActiveHomeScreenEvent(
    [running, later],
    definitions,
    at(now),
    homeScreenEventEntryRule
  )

  it("shows the default instance without a key", () => {
    const result = resolveHomeScreenEventSelection(instances, defaults, null)
    expect(result.instance?.key).toBe("occ-hunt")
    expect(result.defaultInstance?.key).toBe("occ-hunt")
    expect(result.stale).toBe(false)
  })

  it("shows the requested instance when its key resolves", () => {
    const result = resolveHomeScreenEventSelection(
      instances,
      defaults,
      "occ-warp"
    )
    expect(result.instance?.key).toBe("occ-warp")
    expect(result.stale).toBe(false)
  })

  it("falls back to the default and flags an unknown key", () => {
    const result = resolveHomeScreenEventSelection(instances, defaults, "gone")
    expect(result.instance?.key).toBe("occ-hunt")
    expect(result.stale).toBe(true)
  })

  it("shows nothing with only past instances and no key", () => {
    const pastOnly = listHomeScreenEventInstances(
      [running],
      definitions,
      at("2026-11-01T00:00:00Z"),
      homeScreenEventEntryRule
    )
    const result = resolveHomeScreenEventSelection(
      pastOnly,
      { active: null, next: null },
      null
    )
    expect(result.instance).toBeNull()
    expect(
      resolveHomeScreenEventSelection(
        pastOnly,
        { active: null, next: null },
        "occ-hunt"
      ).instance?.status
    ).toBe("past")
  })
})

describe("selectListTarget", () => {
  const instance = (
    entryValue: HomeScreenEventEntry,
    status: HomeScreenEventInstance<HomeScreenEventEntry>["status"]
  ) => ({
    key: homeScreenEventInstanceKey(entryValue),
    entry: entryValue,
    status,
    raidRule: homeScreenEventEntryRule(entryValue, definitions),
  })
  const warp = entry(
    "hse-warp-surge",
    "2026-10-10T08:00:00Z",
    "2026-10-14T08:00:00Z"
  )
  const faction = entry(
    "hse-faction-boost",
    "2026-10-10T08:00:00Z",
    "2026-10-14T08:00:00Z"
  )

  it("lists a running rule-bearing instance live", () => {
    expect(selectListTarget(instance(warp, "running"))).toEqual({
      entry: warp,
      live: true,
      rule: homeScreenEventEntryRule(warp, definitions),
    })
  })

  it("has no lists for a running instance without a rule", () => {
    expect(selectListTarget(instance(faction, "running"))).toBeNull()
  })

  it("previews an upcoming rule-bearing instance", () => {
    expect(selectListTarget(instance(warp, "upcoming"))).toEqual({
      entry: warp,
      live: false,
      rule: homeScreenEventEntryRule(warp, definitions),
    })
  })

  it("has no lists for an upcoming instance without a rule", () => {
    expect(selectListTarget(instance(faction, "upcoming"))).toBeNull()
  })

  it("has no lists for a past instance, even with a rule", () => {
    expect(selectListTarget(instance(warp, "past"))).toBeNull()
    expect(selectListTarget(instance(faction, "past"))).toBeNull()
  })

  it("has no lists with nothing shown", () => {
    expect(selectListTarget(null)).toBeNull()
  })

  it("previews the next rule-bearing event by default when none is running", () => {
    const now = at("2026-10-07T00:00:00Z")
    const instances = listHomeScreenEventInstances(
      [machineHunt, warp],
      definitions,
      now,
      homeScreenEventEntryRule
    )
    const { instance: shown } = resolveHomeScreenEventSelection(
      instances,
      selectActiveHomeScreenEvent(
        [machineHunt, warp],
        definitions,
        now,
        homeScreenEventEntryRule
      ),
      null
    )
    expect(selectListTarget(shown)).toMatchObject({ entry: warp, live: false })
  })
})
