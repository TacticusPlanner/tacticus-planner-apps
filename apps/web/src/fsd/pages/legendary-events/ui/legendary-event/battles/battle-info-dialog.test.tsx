import { beforeAll, describe, expect, it } from "vitest"
import type { i18n as I18n } from "i18next"

import { createTestI18n, i18nWrapper } from "@/test/i18n"
import { render, screen } from "@/test/render"

import { BattleInfoDialog } from "./battle-info-dialog"
import { lysanderLane } from "./battles.test-utils"
import type { BattlesViewModel } from "./battles.view-model"

let i18n: I18n

describe("BattleInfoDialog", () => {
  beforeAll(async () => {
    i18n = await createTestI18n("en")
  })

  it("opens the battle by its number when the read left an earlier battle out", () => {
    // Battle 2 was not served: the ready list holds battles 1, 3, 4, …
    const served = lysanderLane("alpha").filter((battle) => battle.number !== 2)
    const alpha: BattlesViewModel = {
      state: {
        kind: "ready",
        battles: served,
        defaultIndex: 0,
        retryNpcs: undefined,
      },
      selectedIndex: undefined,
      onSelect: () => {},
      mapOpen: false,
      onMapOpenChange: () => {},
    }
    render(
      <BattleInfoDialog
        battles={{ alpha }}
        isMobile={false}
        onClose={() => {}}
        target={{ laneId: "alpha", battleIndex: 4 }}
      />,
      { wrapper: i18nWrapper(i18n) }
    )

    expect(screen.getByTestId("battle-title")).toHaveTextContent("Battle 5")
  })
})
