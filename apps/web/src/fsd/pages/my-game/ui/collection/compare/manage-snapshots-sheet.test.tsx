import { beforeEach, describe, expect, it, vi } from "vitest"

import type {
  PersonalRosterSnapshot,
  PersonalRosterSnapshotList,
} from "@/entities/roster-snapshot"
import { toast } from "@workspace/ui/lib/toast"

import { fireEvent, render, screen, within } from "@/test/render"

import { ManageSnapshotsSheet } from "./manage-snapshots-sheet"

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options && Object.keys(options).length > 0
        ? `${key} ${Object.entries(options)
            .map(([k, v]) => `${k}=${String(v)}`)
            .join(" ")}`
        : key,
    i18n: { language: "en" },
  }),
  initReactI18next: { type: "3rdParty", init: vi.fn() },
}))

const keep = vi.hoisted(() => ({ mutate: vi.fn() }))

vi.mock("@workspace/ui/lib/toast", () => ({ toast: { error: vi.fn() } }))

vi.mock("@/entities/roster-snapshot", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/roster-snapshot")>()),
  useKeepRosterSnapshot: () => ({ ...keep, isPending: false }),
  useRenameRosterSnapshot: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteRosterSnapshot: () => ({ mutate: vi.fn(), isPending: false }),
}))

const runRecords = vi.hoisted(() => ({
  get: vi.fn(),
}))
vi.mock("@/entities/legendary-event", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/entities/legendary-event")>()
  return {
    ...actual,
    legendaryEventPlanQueries: {
      ...actual.legendaryEventPlanQueries,
      latestRunRecordsAcrossEvents: () => ({
        queryKey: ["legendary-event-run-records", { scope: "allEvents" }],
        queryFn: () => runRecords.get(),
      }),
    },
  }
})

const snapshot = (
  id: string,
  source: PersonalRosterSnapshot["source"],
  name = "2026-11-03"
): PersonalRosterSnapshot => ({
  id,
  name,
  source,
  takenAt: "2026-11-03T10:00:00Z",
  characterCount: 1,
  mowCount: 0,
})

const list = (count: number): PersonalRosterSnapshotList => ({
  limit: 20,
  count,
  autoLimit: 12,
  autoCount: 1,
  items: [
    snapshot("auto-1", "auto"),
    snapshot("manual-1", "manual", "Mine"),
    snapshot("v1-1", "v1Import", "Oct"),
  ],
})

describe("ManageSnapshotsSheet", () => {
  beforeEach(() => {
    runRecords.get.mockReset()
    runRecords.get.mockResolvedValue({ records: [], nextAfter: null })
    keep.mutate.mockReset()
    vi.mocked(toast.error).mockReset()
  })

  it("lists manual and V1 snapshots first, then automatic ones with their labels and quota", () => {
    render(<ManageSnapshotsSheet open onOpenChange={vi.fn()} list={list(2)} />)

    const manual = screen.getByTestId("manage-snapshots-manual")
    expect(within(manual).getAllByTestId("manage-snapshot-row")).toHaveLength(2)
    expect(manual).toHaveTextContent(
      "myGame.collection.snapshots.v1ImportLabel name=Oct"
    )
    const auto = screen.getByTestId("manage-snapshots-auto")
    expect(auto).toHaveTextContent(
      "myGame.collection.snapshots.autoLabel date=Nov 3, 2026"
    )
    expect(auto).toHaveTextContent(
      "myGame.collection.snapshots.usage count=1 limit=12"
    )
    expect(within(manual).queryByTestId("manage-snapshot-keep")).toBeNull()
  })

  it("keeps an automatic snapshot", () => {
    render(<ManageSnapshotsSheet open onOpenChange={vi.fn()} list={list(2)} />)

    fireEvent.click(screen.getByTestId("manage-snapshot-keep"))

    expect(keep.mutate).toHaveBeenCalledWith("auto-1", expect.anything())
  })

  it("disables Keep at the manual limit", () => {
    render(<ManageSnapshotsSheet open onOpenChange={vi.fn()} list={list(20)} />)

    expect(screen.getByTestId("manage-snapshot-keep")).toBeDisabled()
    expect(screen.getByTestId("manage-snapshot-keep-limit")).toBeInTheDocument()
  })

  it("shows the automatic section without a quota when the snapshot list has not loaded", () => {
    render(
      <ManageSnapshotsSheet open onOpenChange={vi.fn()} list={undefined} />
    )

    expect(screen.getByTestId("manage-snapshots-auto")).not.toHaveTextContent(
      "myGame.collection.snapshots.usage"
    )
  })

  it("lists every Legendary Event roster read-only and says when the next automatic snapshot comes", async () => {
    vi.useFakeTimers({
      toFake: ["Date"],
      now: new Date("2026-11-25T12:00:00Z"),
    })
    runRecords.get.mockResolvedValue({
      records: [
        {
          id: "r1",
          eventId: "unplannedEvent",
          run: 2,
          startedAt: "2026-11-20T00:00:00Z",
          progressAt: "2026-11-22T00:00:00Z",
          catalogVersion: "1",
          points: 100,
        },
      ],
      nextAfter: null,
    })
    render(<ManageSnapshotsSheet open onOpenChange={vi.fn()} list={list(2)} />)

    const section = screen.getByTestId("manage-snapshots-run-records")
    const row = await within(section).findByTestId("manage-run-record-row")
    expect(row).toHaveTextContent(
      "myGame.collection.snapshots.leRow event=unplannedEvent run=2"
    )
    expect(within(row).queryByRole("button")).toBeNull()
    // The newest roster is the LE one (Nov 22), so the next automatic snapshot waits 30 days.
    expect(screen.getByTestId("manage-snapshots-next-auto")).toHaveTextContent(
      "myGame.collection.snapshots.nextAutoAfter date=Dec 22, 2026"
    )
    vi.useRealTimers()
  })

  it("says the next sync takes one when no roster is recent", async () => {
    render(
      <ManageSnapshotsSheet
        open
        onOpenChange={vi.fn()}
        list={{ ...list(0), items: [] }}
      />
    )

    expect(
      await screen.findByTestId("manage-snapshots-next-auto")
    ).toHaveTextContent("myGame.collection.snapshots.nextAutoSync")
    expect(
      screen.getByText("myGame.collection.snapshots.leNone")
    ).toBeInTheDocument()
  })

  it("reads no Legendary Event rosters while closed", () => {
    render(
      <ManageSnapshotsSheet
        open={false}
        onOpenChange={vi.fn()}
        list={list(2)}
      />
    )
    expect(runRecords.get).not.toHaveBeenCalled()
  })
})
