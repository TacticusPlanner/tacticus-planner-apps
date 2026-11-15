import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import type { Step } from "react-joyride"

import { useTourPageSteps, type TourPageSteps } from "@/shared/tour"

import type { EventShopForm } from "../../model/event-shop-route"

type StepKey =
  | "picker"
  | "calendar"
  | "chips"
  | "slots"
  | "tiles"
  | "tick"
  | "sideColumn"
  | "listButton"
  | "planTab"
  | "stillToBuy"
  | "coverage"
  | "rewards"
  | "search"

/**
 * Joyride tour for Dailies > Event shop (spec event-shop-planner: onboarding tour): the event picker,
 * the day picker, the slots and adding to the cart, then the shopping list where the form keeps it
 * (desktop side column, tablet drawer button, phone Plan tab and bar), Coverage and the reward tabs.
 * The tour has desktop and mobile arrays: the desktop one is the tablet steps on a tablet. `hasTick`
 * gates the phone tick step, which only a planned tile renders; `hasSlots` the slot steps.
 */
export function useEventShopTutorial({
  form,
  hasTick,
  hasSlots,
}: {
  form: EventShopForm
  hasTick: boolean
  hasSlots: boolean
}) {
  const { t } = useTranslation("dailies")

  const steps = useMemo<TourPageSteps>(() => {
    const step = (target: string, key: StepKey): Step => ({
      target: `[data-testid${target.endsWith("-") ? "^" : ""}="${target}"]`,
      title: t(`tour.eventShop.steps.${key}.title`),
      content: t(`tour.eventShop.steps.${key}.content`),
    })
    const desktop = [
      step("event-shop-picker", "picker"),
      step("event-shop-week-calendar", "calendar"),
      ...(hasSlots ? [step("event-shop-slots", "slots")] : []),
      step("event-shop-side-column", "sideColumn"),
      step("event-shop-coverage", "coverage"),
      step("event-shop-tab-milestones", "rewards"),
      step("event-shop-search-open", "search"),
    ]
    const tablet = [
      step("event-shop-picker", "picker"),
      step("event-shop-week-calendar", "calendar"),
      ...(hasSlots ? [step("event-shop-slots", "slots")] : []),
      step("event-shop-list-button", "listButton"),
      step("event-shop-tab-milestones", "rewards"),
      step("event-shop-search-open", "search"),
    ]
    const phone = [
      step("event-shop-picker", "picker"),
      step("event-shop-day-chips", "chips"),
      ...(hasSlots ? [step("event-shop-tiles", "tiles")] : []),
      ...(hasTick ? [step("event-shop-tick-", "tick")] : []),
      step("event-shop-tab-plan", "planTab"),
      step("event-shop-still-to-buy-bar", "stillToBuy"),
      step("event-shop-tab-rewards", "rewards"),
      step("event-shop-search-open", "search"),
    ]
    return { desktop: form === "tablet" ? tablet : desktop, mobile: phone }
  }, [t, form, hasTick, hasSlots])

  useTourPageSteps(steps)
}
