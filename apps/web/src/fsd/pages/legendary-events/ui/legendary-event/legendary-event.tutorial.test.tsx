import { renderHook } from "@testing-library/react"
import type { Step } from "react-joyride"
import { describe, expect, it, vi } from "vitest"

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

import { useLegendaryEventTutorial } from "./legendary-event.tutorial"

/**
 * The geometry Joyride 3 applies to a step's tooltip, reduced to the vertical axis that clips:
 * `useScrollEffect` scrolls the target to `scrollOffset` (plus the tooltip's height for a "top"
 * step), the floater offsets the tooltip by offset + spotlight padding + arrow, `flip` (padding 20,
 * no cross axis) falls back to the opposite side or the best fit, and `shift` (padding 10 unless
 * the step overrides it) clamps the cross axis only when `crossAxis` is set. Values are Joyride's
 * defaults and the app's tour options (`tour-provider.tsx`: spotlight padding 8, scroll offset 64
 * on desktop and 140 on mobile). jsdom has no layout, so the target and tooltip sizes are inputs.
 */
const OFFSET = 10
const ARROW = 16
const SPOTLIGHT_PADDING = 8
const GAP = OFFSET + SPOTLIGHT_PADDING + ARROW
const FLIP_PADDING = 20

interface Viewport {
  width: number
  height: number
  scrollOffset: number
}

function tooltipRect(
  step: Step,
  viewport: Viewport,
  target: { height: number; width: number },
  tooltip: { height: number; width: number }
) {
  const maxHeight =
    step.styles?.tooltip?.maxHeight === "calc(100dvh - 32px)"
      ? viewport.height - 32
      : Number.POSITIVE_INFINITY
  const height = Math.min(tooltip.height, maxHeight)
  const width = Math.min(tooltip.width, viewport.width)
  const placement = step.placement === "top" ? "top" : "bottom"
  const targetTop =
    viewport.scrollOffset +
    SPOTLIGHT_PADDING +
    (placement === "top" ? height + GAP : 0)
  const at = (side: "top" | "bottom") =>
    side === "bottom"
      ? targetTop + target.height + GAP
      : targetTop - GAP - height
  const overflow = (side: "top" | "bottom") =>
    side === "bottom"
      ? at(side) + height - (viewport.height - FLIP_PADDING)
      : FLIP_PADDING - at(side)
  const opposite = placement === "top" ? "bottom" : "top"
  const side =
    overflow(placement) <= 0
      ? placement
      : overflow(opposite) <= 0 || overflow(opposite) < overflow(placement)
        ? opposite
        : placement
  const shift = step.floatingOptions?.shiftOptions
  const padding = typeof shift?.padding === "number" ? shift.padding : OFFSET
  let top = at(side)
  if (shift?.crossAxis) {
    top = Math.min(Math.max(top, padding), viewport.height - padding - height)
  }
  const left = Math.min(
    Math.max((target.width - width) / 2, padding),
    viewport.width - padding - width
  )
  return { top, bottom: top + height, left, right: left + width }
}

const DESKTOP: Viewport = { width: 1280, height: 784, scrollOffset: 64 }
const MOBILE: Viewport = { width: 420, height: 784, scrollOffset: 140 }
// A 24-token expanded Token plan card is about 24 rows of 2.4rem plus group headings.
const TALL_TARGET = 1400
const TOOLTIPS = [
  { width: 380, height: 220 },
  { width: 380, height: 360 },
]

const inside = (rect: ReturnType<typeof tooltipRect>, viewport: Viewport) =>
  rect.top >= 0 &&
  rect.left >= 0 &&
  rect.bottom <= viewport.height &&
  rect.right <= viewport.width

function eventSteps() {
  const { result } = renderHook(() => useLegendaryEventTutorial(vi.fn(), true))
  return result.current
}

describe("useLegendaryEventTutorial", () => {
  it("targets the Token plan header, not the whole card", () => {
    const step = eventSteps().desktop.find(
      (entry) => entry.title === "tour.event.steps.tokenPlan.title"
    )!
    expect(step.target).toBe(
      '[data-testid="legendary-event-token-plan-header"]'
    )
    expect(step.placement).toBe("bottom")
  })

  it("shows the Token plan step's tooltip below its header inside 1280 by 784 with 24 tokens", () => {
    const step = eventSteps().desktop.find(
      (entry) => entry.title === "tour.event.steps.tokenPlan.title"
    )!
    for (const tooltip of TOOLTIPS) {
      const rect = tooltipRect(
        step,
        DESKTOP,
        { height: 56, width: 900 },
        tooltip
      )
      expect(inside(rect, DESKTOP)).toBe(true)
      // Below the header itself, so the list below it stays in view under the tooltip.
      expect(rect.top).toBe(DESKTOP.scrollOffset + SPOTLIGHT_PADDING + 56 + GAP)
    }
  })

  it("reproduces the clipped tooltip of a whole-card target without the cross-axis shift", () => {
    const wholeCard: Step = { target: "x", placement: "bottom", content: "" }
    const rect = tooltipRect(
      wholeCard,
      DESKTOP,
      { height: TALL_TARGET, width: 900 },
      TOOLTIPS[0]!
    )
    expect(inside(rect, DESKTOP)).toBe(false)
  })

  it.each([
    ["desktop", DESKTOP],
    ["mobile", MOBILE],
  ])(
    "keeps every step's tooltip inside the %s viewport, however tall its target",
    (_form, viewport) => {
      const { desktop, mobile } = eventSteps()
      const steps = viewport === MOBILE ? (mobile ?? desktop) : desktop
      expect(steps).toHaveLength(14)
      for (const step of steps) {
        for (const height of [40, 400, TALL_TARGET]) {
          for (const tooltip of TOOLTIPS) {
            const rect = tooltipRect(
              step,
              viewport,
              { height, width: viewport.width - 32 },
              tooltip
            )
            expect(
              inside(rect, viewport),
              `${String(step.target)} at ${height}px`
            ).toBe(true)
          }
        }
      }
    }
  )
})
