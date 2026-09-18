import { describe, expect, it } from "vitest"
import en from "../../../../../public/locales/en/common.json"

// 7.2 — the dialog's description previously claimed matching V2 goal kinds "will be replaced" and
// that imported goals "will be paused" unconditionally; neither is true (matching kinds are
// skipped; a goal is paused only when the default project isn't the active one —
// V1GoalImportService.cs). Reads the actual locale resource rather than the component: the
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
    expect(description).toMatch(/active project/i)
  })
})
