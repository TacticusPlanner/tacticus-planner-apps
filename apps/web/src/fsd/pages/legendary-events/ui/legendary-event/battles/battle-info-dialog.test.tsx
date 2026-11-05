import { beforeAll, describe, expect, it, vi } from "vitest"
import type { i18n as I18n } from "i18next"

import { createTestI18n, i18nWrapper } from "@/test/i18n"
import { lysanderEvent } from "@/test/fixtures/legendary-events"
import { fireEvent, render, screen } from "@/test/render"

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
        event={lysanderEvent}
        isMobile={false}
        onChange={() => {}}
        onClose={() => {}}
        target={{ laneId: "alpha", battleIndex: 4 }}
      />,
      { wrapper: i18nWrapper(i18n) }
    )

    expect(screen.getByTestId("battle-title")).toHaveTextContent("Battle 5")
  })

  it("steps to the previous and next battle, with a bottom Close on mobile", () => {
    const alpha: BattlesViewModel = {
      state: {
        kind: "ready",
        battles: lysanderLane("alpha"),
        defaultIndex: 0,
        retryNpcs: undefined,
      },
      selectedIndex: undefined,
      onSelect: () => {},
      mapOpen: false,
      onMapOpenChange: () => {},
    }
    const onChange = vi.fn()
    const onClose = vi.fn()
    render(
      <BattleInfoDialog
        battles={{ alpha }}
        event={lysanderEvent}
        isMobile
        onChange={onChange}
        onClose={onClose}
        target={{ laneId: "alpha", battleIndex: 0 }}
      />,
      { wrapper: i18nWrapper(i18n) }
    )

    expect(screen.getByTestId("battle-info-previous")).toBeDisabled()
    fireEvent.click(screen.getByTestId("battle-info-next"))
    expect(onChange).toHaveBeenCalledWith({ laneId: "alpha", battleIndex: 1 })
    fireEvent.click(screen.getByTestId("battle-info-close"))
    expect(onClose).toHaveBeenCalled()
  })

  it("has no Close button on desktop and stops Next at the lane's last battle", () => {
    const last = lysanderEvent.alpha.battlesPoints.length - 1
    render(
      <BattleInfoDialog
        battles={{}}
        event={lysanderEvent}
        isMobile={false}
        onChange={() => {}}
        onClose={() => {}}
        target={{ laneId: "alpha", battleIndex: last }}
      />,
      { wrapper: i18nWrapper(i18n) }
    )

    expect(screen.getByTestId("battle-info-next")).toBeDisabled()
    expect(screen.getByTestId("battle-info-previous")).toBeEnabled()
    expect(screen.queryByTestId("battle-info-close")).toBeNull()
  })
})
