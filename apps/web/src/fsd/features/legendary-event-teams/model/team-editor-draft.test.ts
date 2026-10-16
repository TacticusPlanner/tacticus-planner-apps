import { describe, expect, it } from "vitest"

import {
  canSaveDraft,
  draftNeedsMembers,
  emptyEditorDraft,
  type TeamEditorDraft,
} from "./team-editor-draft"

const draft = (
  memberUnitIds: string[],
  reserveUnitId: string | null = null
): TeamEditorDraft => ({
  name: null,
  memberUnitIds,
  reserveUnitId,
  derived: [],
  excluded: [],
  depth: null,
})

describe("canSaveDraft (spec: a team needs at least three characters)", () => {
  it("refuses no members", () => {
    expect(canSaveDraft(draft([]), "Melee")).toBe(false)
    expect(draftNeedsMembers(draft([]))).toBe(true)
  })

  it("refuses two members", () => {
    expect(canSaveDraft(draft(["a", "b"]), "Melee")).toBe(false)
  })

  it("does not count the reserve", () => {
    expect(canSaveDraft(draft(["a", "b"], "c"), "Melee")).toBe(false)
    expect(draftNeedsMembers(draft(["a", "b"], "c"))).toBe(true)
  })

  it("accepts three members", () => {
    expect(canSaveDraft(draft(["a", "b", "c"]), "Melee")).toBe(true)
    expect(draftNeedsMembers(draft(["a", "b", "c"]))).toBe(false)
  })

  it("still needs a 1–60 character name", () => {
    expect(canSaveDraft(draft(["a", "b", "c"]), "")).toBe(false)
    expect(canSaveDraft(draft(["a", "b", "c"]), "x".repeat(61))).toBe(false)
  })
})

describe("emptyEditorDraft (Save and add another)", () => {
  it("clears the members, reserve, name, coverage and depth", () => {
    expect(emptyEditorDraft()).toEqual(draft([]))
  })
})
