import { renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import type { CampaignDescriptor } from "@workspace/game-catalog"

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { defaultValue?: string }) =>
      opts?.defaultValue ?? key,
  }),
}))

import { useCampaignDisplay } from "./use-campaign-display"

function descriptor(
  overrides: Partial<CampaignDescriptor>
): CampaignDescriptor {
  return {
    nameKey: "indomitus",
    difficultyToken: "standard",
    isMirror: false,
    isEvent: false,
    challenge: false,
    ...overrides,
  }
}

describe("useCampaignDisplay().fullLabel", () => {
  it("appends the difficulty word for a standard storyline campaign", () => {
    const { result } = renderHook(() => useCampaignDisplay())
    expect(result.current.fullLabel(descriptor({}))).toBe(
      "indomitus campaigns:difficulties.standard"
    )
  })

  it("keeps the Mirror qualifier on an elite mirror campaign (#119)", () => {
    const { result } = renderHook(() => useCampaignDisplay())
    expect(
      result.current.fullLabel(
        descriptor({
          nameKey: "saim-hann",
          isMirror: true,
          difficultyToken: "elite",
        })
      )
    ).toBe(
      "saim-hann campaigns:difficulties.mirror campaigns:difficulties.elite"
    )
  })

  it("distinguishes an elite mirror campaign from the non-mirror elite campaign", () => {
    const { result } = renderHook(() => useCampaignDisplay())
    const elite = result.current.fullLabel(
      descriptor({ nameKey: "saim-hann", difficultyToken: "elite" })
    )
    const eliteMirror = result.current.fullLabel(
      descriptor({
        nameKey: "saim-hann",
        isMirror: true,
        difficultyToken: "elite",
      })
    )
    expect(elite).toBe("saim-hann campaigns:difficulties.elite")
    expect(eliteMirror).not.toBe(elite)
  })

  it("names the mirror base tier without a redundant Standard word", () => {
    const { result } = renderHook(() => useCampaignDisplay())
    const mirror = result.current.fullLabel(descriptor({ isMirror: true }))
    expect(mirror).toBe("indomitus campaigns:difficulties.mirror")
    expect(mirror).not.toBe(result.current.fullLabel(descriptor({})))
  })

  it("appends the difficulty word for an event's Standard tier", () => {
    const { result } = renderHook(() => useCampaignDisplay())
    expect(
      result.current.fullLabel(
        descriptor({
          nameKey: "adepta-sororitas-vs-death-guard",
          isEvent: true,
          difficultyToken: "eventStandard",
        })
      )
    ).toBe(
      "adepta-sororitas-vs-death-guard campaigns:difficulties.eventStandard"
    )
  })

  it("appends the difficulty word for an event's Extremis tier, distinguishing it from Standard", () => {
    const { result } = renderHook(() => useCampaignDisplay())
    const standard = result.current.fullLabel(
      descriptor({
        nameKey: "adepta-sororitas-vs-death-guard",
        isEvent: true,
        difficultyToken: "eventStandard",
      })
    )
    const extremis = result.current.fullLabel(
      descriptor({
        nameKey: "adepta-sororitas-vs-death-guard",
        isEvent: true,
        difficultyToken: "eventExtremis",
      })
    )
    expect(extremis).toBe(
      "adepta-sororitas-vs-death-guard campaigns:difficulties.eventExtremis"
    )
    expect(extremis).not.toBe(standard)
  })
})
