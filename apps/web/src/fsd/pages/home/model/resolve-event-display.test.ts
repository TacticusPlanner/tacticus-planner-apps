import { describe, expect, it } from "vitest"

import { resolveEventDisplayName } from "./resolve-event-display"
import type { EventEntryViewModel } from "./events-calendar.types"

// Real interpolation templates (matching public/locales/en/events.json) rather than an echo, since these
// tests check the *combined* output — an echo mock would just return the last-called key verbatim and
// never actually prove the chaining behavior under test.
const templates: Record<string, string> = {
  "events:withFaction": "{{name}}: {{faction}}",
  "events:withCharacter": "{{name}}: {{character}}",
  "events:withVersion": "{{name}} {{version}}",
  "events:withIteration": "{{name}} (Iteration {{iteration}})",
  "events:withSeason": "{{name}} Season {{season}}",
  "events:withNewCampaign": "{{name}} (New Campaign)",
  "events:withNewMow": "{{name}} (New MoW)",
}

const t = ((key: string, options?: Record<string, unknown>) => {
  const { defaultValue, ...values } = (options ?? {}) as {
    defaultValue?: string
  }
  const base = templates[key] ?? defaultValue ?? key

  return Object.entries(values).reduce(
    (acc, [param, value]) => acc.replace(`{{${param}}}`, String(value)),
    base
  )
}) as Parameters<typeof resolveEventDisplayName>[0]

function baseEntry(
  overrides: Partial<EventEntryViewModel>
): EventEntryViewModel {
  return {
    key: "test",
    definitionId: "legendary-event",
    definitionType: "LegendaryEvent",
    occurrenceId: "occ-1",
    confirmed: true,
    startUtc: "2026-08-09T00:00:00Z",
    endUtc: "2026-08-16T00:00:00Z",
    parameters: null,
    isActiveNow: false,
    derivedSeasonNumber: undefined,
    ...overrides,
  }
}

describe("resolveEventDisplayName", () => {
  it("combines featured character and iteration number for a legendary event", () => {
    const name = resolveEventDisplayName(
      t,
      baseEntry({
        parameters: {
          featuredCharacterId: "emperLucius",
          iterationNumber: 3,
        },
      })
    )

    expect(name).toContain("emperLucius")
    expect(name).toContain("3")
  })

  it("shows just the base name when no parameters are present", () => {
    const name = resolveEventDisplayName(t, baseEntry({ parameters: null }))

    expect(name).toBe("legendary-event")
  })

  it("appends the derived season number for a battle-pass entry", () => {
    const name = resolveEventDisplayName(
      t,
      baseEntry({
        definitionId: "battle-pass",
        definitionType: "BattlePass",
        derivedSeasonNumber: 40,
      })
    )

    expect(name).toContain("battle-pass")
    expect(name).toContain("40")
  })

  it("puts the season right after the name and the character after that", () => {
    const name = resolveEventDisplayName(
      t,
      baseEntry({
        definitionId: "battle-pass",
        definitionType: "BattlePass",
        derivedSeasonNumber: 40,
        parameters: { featuredCharacterId: "darkaSternguard" },
      })
    )

    expect(name).toBe("battle-pass Season 40: darkaSternguard")
  })

  it("indicates a new campaign for a campaign-event debut", () => {
    const name = resolveEventDisplayName(
      t,
      baseEntry({
        definitionId: "campaign-event",
        definitionType: "CampaignEvent",
        parameters: { newContentDebut: true },
      })
    )

    expect(name).toContain("New Campaign")
  })

  it("indicates a new MoW for an incursion debut", () => {
    const name = resolveEventDisplayName(
      t,
      baseEntry({
        definitionId: "incursion",
        definitionType: "Incursion",
        parameters: { newContentDebut: true },
      })
    )

    expect(name).toContain("New MoW")
  })

  it("shows no debut indicator when newContentDebut is false", () => {
    const name = resolveEventDisplayName(
      t,
      baseEntry({
        definitionId: "campaign-event",
        definitionType: "CampaignEvent",
        parameters: { newContentDebut: false },
      })
    )

    expect(name).not.toContain("New Campaign")
  })
})
