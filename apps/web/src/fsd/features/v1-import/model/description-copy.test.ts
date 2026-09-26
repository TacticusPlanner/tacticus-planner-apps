import { describe, expect, it } from "vitest"
import en from "../../../../../public/locales/en/common.json"

// 7.2 — the dialog's description previously claimed matching V2 goal kinds "will be replaced" and
// that imported goals "will be paused" unconditionally; neither is true (matching kinds are
// skipped; each goal imports Active or Paused per its own V1 daily-planning choice, whatever
// project it lands in — V1GoalImportService.cs). Reads the actual locale resource rather than the component: the
// dialog's own test mocks `useTranslation` to return raw keys, so it can't see real copy content.
describe("goals.v1Import.description copy (7.2)", () => {
  it("does not claim that matching goals are replaced or that no goal is ever paused", () => {
    const description = en.goals.v1Import.description
    expect(description).not.toMatch(/will be replaced/i)
    expect(description).not.toMatch(/will be paused/i)
    expect(description).not.toMatch(/no imported goal is paused/i)
    // States the actual, conditional behavior instead of merely omitting the false claims.
    expect(description).toMatch(/skipped/i)
    expect(description).toMatch(/paused/i)
    expect(description).toMatch(/daily planning/i)
    expect(description).not.toMatch(/active project/i)
  })
})
