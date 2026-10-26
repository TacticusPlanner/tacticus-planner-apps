import type { i18n as I18n } from "i18next"

import { createTestI18n, i18nWrapper } from "@/test/i18n"
import { render } from "@/test/render"
import {
  useFixtureHseProjection,
  type HseFixtureReads,
} from "@/test/fixtures/hse-event-points"
import enDailies from "../../../public/locales/en/dailies.json"
import enNpcs from "../../../public/locales/en/npcs.json"
import enShops from "../../../public/locales/en/shops.json"
import deDailies from "../../../public/locales/de/dailies.json"
import frDailies from "../../../public/locales/fr/dailies.json"

import {
  EventDetails,
  PointsProjection,
  type HseInstance,
} from "@/features/home-screen-event-points"

// Test utilities export helpers next to the harness component.
/* eslint-disable react-refresh/only-export-components */

// Shared by the details and projection tests: the real components over the fixture state, rendered
// with the shipped English (or German or French) copy.

export function hseTestI18n(lng: "en" | "de" | "fr" = "en"): Promise<I18n> {
  return createTestI18n(lng, {
    en: { dailies: enDailies, npcs: enNpcs, shops: enShops },
    de: { dailies: deDailies },
    fr: { dailies: frDailies },
  })
}

function Harness({
  instance,
  reads,
  hasRaidLists,
}: {
  instance: HseInstance
  reads?: HseFixtureReads
  hasRaidLists: boolean
}) {
  const state = useFixtureHseProjection(instance, reads)
  return (
    <>
      <EventDetails eventName="Event" state={state} />
      <PointsProjection hasRaidLists={hasRaidLists} state={state} />
    </>
  )
}

export function renderHse(
  i18n: I18n,
  instance: HseInstance,
  options: { reads?: HseFixtureReads; hasRaidLists?: boolean } = {}
) {
  return render(
    <Harness
      hasRaidLists={options.hasRaidLists ?? false}
      instance={instance}
      reads={options.reads}
    />,
    { wrapper: i18nWrapper(i18n) }
  )
}

/** An instance of `definitionId` from 2026-10-19T08:00Z to 2026-10-23T08:00Z (Psyker Boost's). */
export function hseInstance(
  definitionId: string,
  status: HseInstance["status"],
  parameters: Record<string, unknown> | null = null
): HseInstance {
  return {
    key: `occ-${definitionId}`,
    status,
    entry: {
      definitionId,
      startUtc: "2026-10-19T08:00:00Z",
      endUtc: "2026-10-23T08:00:00Z",
      parameters,
    },
  }
}
