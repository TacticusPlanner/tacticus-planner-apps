import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import type { RaidBossListItem } from "@/entities/raid-boss"

import {
  RaidBossMobilePicker,
  type RaidBossMobilePickerGroup,
} from "./raid-boss-mobile-picker"

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) =>
      ({
        "raidBosses.pickerPlaceholder": "Search bosses and primes…",
        "raidBosses.pickerEmpty": "No boss or prime found.",
      })[key] ?? key,
  }),
}))

function item(unitSetId: string, name: string): RaidBossListItem {
  return {
    unitSetId,
    kind: unitSetId.includes("Boss") ? "boss" : "prime",
    isPrimarch: false,
    factionId: "Tyranids",
    name,
    // A resolved portrait so the option renders just the name — an unresolved portrait renders an
    // initials badge whose text would otherwise leak into `optionNames()`.
    portraitSrc: `https://example.test/${unitSetId}.png`,
  }
}

const rosterGroups: RaidBossMobilePickerGroup[] = [
  {
    boss: item("GuildBoss1Boss1TyranTervigonLeviathan", "Tervigon Leviathan"),
    primes: [
      item("GuildBoss1MiniBoss1TyranWarriorLeviathan", "Warrior Leviathan"),
    ],
  },
  {
    boss: item("GuildBoss4Boss1OrksGhazghkull", "Ghazghkull"),
    primes: [item("GuildBoss4MiniBoss1OrksBigMek", "Gibbascrapz")],
  },
]

function renderPicker({
  onSelect = vi.fn<(id: string) => void>(),
  selectedId,
}: {
  onSelect?: ReturnType<typeof vi.fn<(id: string) => void>>
  selectedId?: string
} = {}) {
  render(
    <RaidBossMobilePicker
      rosterGroups={rosterGroups}
      selectedId={selectedId}
      onSelect={onSelect}
    />
  )
  fireEvent.click(screen.getByRole("combobox"))
  return onSelect
}

function optionNames() {
  return screen.getAllByRole("option").map((el) => el.textContent)
}

describe("RaidBossMobilePicker", () => {
  it("renders a group heading per boss with the boss then its primes", () => {
    renderPicker()

    expect(
      screen.getByRole("group", { name: "Tervigon Leviathan" })
    ).toBeInTheDocument()
    expect(optionNames()).toEqual([
      "Tervigon Leviathan",
      "Warrior Leviathan",
      "Ghazghkull",
      "Gibbascrapz",
    ])
  })

  it("calls onSelect with the unit-set id when an item is chosen", () => {
    const onSelect = renderPicker()

    fireEvent.click(screen.getByText("Warrior Leviathan"))

    expect(onSelect).toHaveBeenCalledWith(
      "GuildBoss1MiniBoss1TyranWarriorLeviathan"
    )
  })

  it("keeps the whole group when the search matches the boss name", () => {
    renderPicker()

    fireEvent.change(screen.getByPlaceholderText("Search bosses and primes…"), {
      target: { value: "tervigon" },
    })

    expect(optionNames()).toEqual(["Tervigon Leviathan", "Warrior Leviathan"])
  })

  it("narrows to matching members when the search matches a prime name", () => {
    renderPicker()

    fireEvent.change(screen.getByPlaceholderText("Search bosses and primes…"), {
      target: { value: "warrior" },
    })

    expect(optionNames()).toEqual(["Warrior Leviathan"])
  })

  it("shows the empty state when nothing matches", () => {
    renderPicker()

    fireEvent.change(screen.getByPlaceholderText("Search bosses and primes…"), {
      target: { value: "zzz-no-match" },
    })

    expect(screen.getByText("No boss or prime found.")).toBeVisible()
    expect(screen.queryAllByRole("option")).toHaveLength(0)
  })
})
