import { afterEach, beforeAll, describe, expect, it, vi } from "vitest"
import type { i18n as I18n } from "i18next"

import { createTestI18n, i18nWrapper } from "@/test/i18n"
import { lysanderEvent } from "@/test/fixtures/legendary-events"
import { fireEvent, render, screen } from "@/test/render"
import { setViewportWidth } from "@/test/viewport"

import { BattleInfoDialog } from "./battle-info-dialog"
import { lysanderLane } from "./battles.test-utils"
import type { BattlesViewModel } from "./battles.view-model"

let i18n: I18n
const button = (name: string) => screen.getByRole("button", { name })

afterEach(() => {
  vi.unstubAllGlobals()
})

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
    setViewportWidth(375)
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
    const dialog = (battleIndex: number) => (
      <BattleInfoDialog
        battles={{ alpha }}
        event={lysanderEvent}
        isMobile
        onChange={onChange}
        onClose={onClose}
        target={{ laneId: "alpha", battleIndex }}
      />
    )
    const { rerender } = render(dialog(0), { wrapper: i18nWrapper(i18n) })

    expect(button("Previous")).toBeDisabled()
    fireEvent.click(button("Next"))
    expect(onChange).toHaveBeenCalledWith({ laneId: "alpha", battleIndex: 1 })
    fireEvent.click(screen.getByTestId("battle-info-close"))
    expect(onClose).toHaveBeenCalled()

    rerender(dialog(2))
    fireEvent.click(button("Previous"))
    expect(onChange).toHaveBeenLastCalledWith({
      laneId: "alpha",
      battleIndex: 1,
    })
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

    expect(button("Next")).toBeDisabled()
    expect(button("Previous")).toBeEnabled()
    expect(screen.queryByTestId("battle-info-close")).toBeNull()
  })
})
