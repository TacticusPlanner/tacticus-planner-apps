import { beforeEach, describe, expect, it, vi } from "vitest"

import type {
  PersonalRosterSnapshot,
  PersonalRosterSnapshotList,
} from "@/entities/roster-snapshot"
import { toast } from "sonner"

import { fireEvent, render, screen, waitFor, within } from "@/test/render"

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
const save = vi.hoisted(() => vi.fn())
const settingsState = vi.hoisted(() => ({ failed: false, retry: vi.fn() }))

vi.mock("sonner", () => ({ toast: { error: vi.fn() } }))

vi.mock("@/entities/roster-snapshot", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/roster-snapshot")>()),
  useKeepRosterSnapshot: () => ({ ...keep, isPending: false }),
  useRenameRosterSnapshot: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteRosterSnapshot: () => ({ mutate: vi.fn(), isPending: false }),
}))

vi.mock("@/entities/planning-setting", () => ({
  usePlanningSettings: () => ({
    settings: {
      dailyEnergy: 288,
      xpBookRarity: "Legendary",
      watchAds: true,
      autoRosterSnapshots: true,
      revision: 3,
    },
    loading: false,
    failed: settingsState.failed,
    retry: settingsState.retry,
    save,
  }),
}))

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
    keep.mutate.mockReset()
    save.mockReset()
    settingsState.failed = false
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

  it("saves only the automatic snapshots setting when it is switched", () => {
    save.mockResolvedValue(undefined)
    render(<ManageSnapshotsSheet open onOpenChange={vi.fn()} list={list(2)} />)

    fireEvent.click(screen.getByTestId("auto-snapshots-setting"))

    expect(save).toHaveBeenCalledWith({
      dailyEnergy: 288,
      xpBookRarity: "Legendary",
      revision: 3,
      autoRosterSnapshots: false,
    })
  })

  it("shows an error and re-enables the switch when saving fails", async () => {
    save.mockRejectedValue(new Error("network"))
    render(<ManageSnapshotsSheet open onOpenChange={vi.fn()} list={list(2)} />)

    fireEvent.click(screen.getByTestId("auto-snapshots-setting"))

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "myGame.collection.snapshots.autoSettingFailed"
      )
    )
    expect(screen.getByTestId("auto-snapshots-setting")).toBeEnabled()
  })

  it("disables the switch and offers a retry when the settings fail to load", () => {
    settingsState.failed = true
    render(<ManageSnapshotsSheet open onOpenChange={vi.fn()} list={list(2)} />)

    expect(screen.getByTestId("auto-snapshots-setting")).toBeDisabled()
    fireEvent.click(screen.getByTestId("auto-snapshots-setting-retry"))
    expect(settingsState.retry).toHaveBeenCalled()
  })

  it("keeps the switch when the snapshot list has not loaded", () => {
    render(
      <ManageSnapshotsSheet open onOpenChange={vi.fn()} list={undefined} />
    )

    expect(screen.getByTestId("auto-snapshots-setting")).toBeInTheDocument()
    expect(screen.getByTestId("manage-snapshots-auto")).not.toHaveTextContent(
      "myGame.collection.snapshots.usage"
    )
  })
})
