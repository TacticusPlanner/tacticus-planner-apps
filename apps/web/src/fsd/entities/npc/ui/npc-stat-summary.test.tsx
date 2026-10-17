import { describe, expect, it } from "vitest"

import { render, screen, within } from "@/test/render"
import { createTestI18n, i18nWrapper } from "@/test/i18n"
import { lysanderBattleNpcs } from "@/test/fixtures/lysander-battles"
import libraryEn from "../../../../../public/locales/en/library.json"

import { resolveLadderRow } from "../lib/resolve-ladder-row"
import type { NpcStatRow } from "../model/types"
import { NpcStatSummary } from "./npc-stat-summary"

const grot = lysanderBattleNpcs.find((npc) => npc.id === "orksNpc1Grot")!

async function renderSummary(row: NpcStatRow | undefined) {
  const i18n = await createTestI18n("en", { en: { library: libraryEn } })
  return render(<NpcStatSummary npc={grot} row={row} />, {
    wrapper: i18nWrapper(i18n),
  })
}

describe("NpcStatSummary", () => {
  it("shows Grot at ladder index 4 with its stats, attacks and traits", async () => {
    await renderSummary(resolveLadderRow(grot, 4)?.row)

    expect(screen.getByText("Grot")).toBeInTheDocument()
    expect(screen.getByText("Orks")).toBeInTheDocument()
    expect(screen.getByAltText("Stone III")).toBeInTheDocument()
    expect(screen.getByTestId("npc-stat-summary-health")).toHaveTextContent(
      "69"
    )
    expect(screen.getByTestId("npc-stat-summary-damage")).toHaveTextContent(
      "35"
    )
    expect(screen.getByTestId("npc-stat-summary-armour")).toHaveTextContent("0")
    expect(screen.getByTestId("npc-stat-summary-melee")).toBeInTheDocument()
    expect(
      within(screen.getByRole("list", { name: "Traits" })).getAllByRole(
        "listitem"
      ).length
    ).toBe(grot.traits.length)
  })

  it("leaves out level, stats and attacks without a row", async () => {
    await renderSummary(undefined)

    expect(screen.getByText("Grot")).toBeInTheDocument()
    expect(screen.queryByTestId("npc-stat-summary-stats")).toBeNull()
    expect(screen.queryByTestId("npc-stat-summary-melee")).toBeNull()
  })
})
