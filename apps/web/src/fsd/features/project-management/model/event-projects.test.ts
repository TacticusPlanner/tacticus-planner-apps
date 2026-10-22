import { describe, expect, it } from "vitest"

import type { ProjectSummary } from "@/entities/project"

import { eventTargetOptions } from "./event-target-options"
import { linkedEventProjects } from "./use-event-projects"

const project = (
  projectId: string,
  status: ProjectSummary["status"],
  eventId: string | null
): ProjectSummary => ({
  projectId,
  name: projectId,
  description: null,
  color: null,
  status,
  isDefault: false,
  target: eventId ? { kind: "legendaryEvent", eventId } : null,
  goalIds: [] as string[],
  revision: 0,
  createdAt: "2026-10-01T00:00:00Z",
  updatedAt: "2026-10-01T00:00:00Z",
})

describe("linkedEventProjects", () => {
  it("lists the event's unarchived projects and counts the archived ones", () => {
    const { active, archivedCount } = linkedEventProjects(
      [
        project("run3", "Active", "votanUthar"),
        project("paused", "Paused", "votanUthar"),
        project("run2", "Archived", "votanUthar"),
        project("other", "Active", "astarLysander"),
        project("none", "Active", null),
      ],
      "votanUthar"
    )

    expect(active.map((entry) => entry.projectId)).toEqual(["run3", "paused"])
    expect(archivedCount).toBe(1)
  })
})

describe("eventTargetOptions", () => {
  const nowMs = Date.parse("2026-10-19T00:00:00Z")
  const event = (id: string, starts: string[]) => ({
    id,
    eventStageStartDatesUtc: starts,
  })

  it("puts the active and upcoming events first, then the rest by name", () => {
    const names: Record<string, string> = {
      active: "Zed",
      upcoming: "Yan",
      oldB: "Beta",
      oldA: "Alpha",
    }
    const options = eventTargetOptions(
      [
        event("oldB", [
          "2025-01-01T00:00:00Z",
          "2025-02-01T00:00:00Z",
          "2025-03-01T00:00:00Z",
        ]),
        event("upcoming", ["2026-11-01T00:00:00Z"]),
        event("oldA", [
          "2025-04-01T00:00:00Z",
          "2025-05-01T00:00:00Z",
          "2025-06-01T00:00:00Z",
        ]),
        event("active", ["2026-10-17T00:00:00Z"]),
      ],
      nowMs,
      (id) => names[id]!,
      "en"
    )

    expect(options).toEqual([
      { eventId: "active", name: "Zed" },
      { eventId: "upcoming", name: "Yan" },
      { eventId: "oldA", name: "Alpha" },
      { eventId: "oldB", name: "Beta" },
    ])
  })
})
