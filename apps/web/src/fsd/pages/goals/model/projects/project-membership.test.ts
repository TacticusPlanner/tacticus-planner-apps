import { describe, expect, it } from "vitest"

import { projectGoalSlotConflictDetails } from "./project-membership"

const conflict = {
  issueCode: "projectGoalSlotOccupied",
  message: "Occupied",
  projectId: "project-1",
  projectName: "Current plan",
  entityType: "Character",
  entityId: "ragnar",
  goalType: "Rank",
  existingGoalId: "goal-1",
}

describe("projectGoalSlotConflictDetails", () => {
  it("returns a fully validated conflict DTO", () => {
    expect(projectGoalSlotConflictDetails(conflict)).toEqual(conflict)
  })

  it.each(["entityType", "entityId", "goalType"] as const)(
    "rejects a conflict without %s",
    (field) => {
      expect(
        projectGoalSlotConflictDetails({ ...conflict, [field]: undefined })
      ).toBeNull()
    }
  )
})
