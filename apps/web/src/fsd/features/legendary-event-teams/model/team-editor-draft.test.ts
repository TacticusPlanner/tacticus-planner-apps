import { describe, expect, it } from "vitest"

import {
  teamLane,
  teamUnitList,
  teamUnits,
} from "@/test/fixtures/legendary-event-teams"

import {
  canSaveDraft,
  checkedObjectives,
  draftNeedsMembers,
  emptyEditorDraft,
  initialEditorDraft,
  toTeamDraft,
  type TeamEditorDraft,
} from "./team-editor-draft"

const context = { lane: teamLane, units: teamUnitList }

const draft = (
  memberUnitIds: string[],
  reserveUnitId: string | null = null
): TeamEditorDraft => ({
  name: null,
  memberUnitIds,
  reserveUnitId,
  derived: [],
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

describe("initialEditorDraft (spec: the team covers what its members derive)", () => {
  it("opens a saved team with an objective it no longer stores as covered, and saves it", () => {
    const team = {
      id: "t1",
      laneId: "alpha" as const,
      name: "Melee",
      sortOrder: 0,
      memberUnitIds: [teamUnits.a.id, teamUnits.b.id, teamUnits.c.id],
      reserveUnitId: null,
      objectiveIndexes: [0],
      runDepths: [],
    }
    const opened = initialEditorDraft(team, 1, context)
    expect(checkedObjectives(opened)).toEqual([0, 1])
    expect(toTeamDraft(opened, "Melee").objectiveIndexes).toEqual([0, 1])
  })

  it("covers everything a suggestion's members derive", () => {
    const opened = initialEditorDraft(undefined, 1, context, [teamUnits.a.id])
    expect(checkedObjectives(opened)).toEqual([0, 1, 2])
  })
})
