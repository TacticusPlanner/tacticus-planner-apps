import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import type { Step } from "react-joyride"

import { type TourPageSteps } from "@/shared/tour"

type RaidBossTab = "details" | "seasons" | "meta"

function useSharedSteps() {
  const { t } = useTranslation("library")

  return useMemo(
    () => ({
      tabs: {
        target: '[data-testid="raid-boss-tabs"]',
        title: t("raidBosses.tour.steps.tabs.title"),
        content: t("raidBosses.tour.steps.tabs.content"),
      } satisfies Step,
      bosses: {
        target: '[data-testid="raid-boss-list-bosses"]',
        title: t("raidBosses.tour.steps.bosses.title"),
        content: t("raidBosses.tour.steps.bosses.content"),
      } satisfies Step,
      primes: {
        target: '[data-testid="raid-boss-list-primes"]',
        title: t("raidBosses.tour.steps.primes.title"),
        content: t("raidBosses.tour.steps.primes.content"),
      } satisfies Step,
      progression: {
        target: '[data-testid="raid-boss-progression"]',
        title: t("raidBosses.tour.steps.progression.title"),
        content: t("raidBosses.tour.steps.progression.content"),
      } satisfies Step,
      primeModifiers: {
        target: '[data-testid="raid-boss-prime-modifiers"]',
        title: t("raidBosses.tour.steps.primeModifiers.title"),
        content: t("raidBosses.tour.steps.primeModifiers.content"),
      } satisfies Step,
      adjustedStats: {
        target: '[data-testid="raid-boss-adjusted-stats"]',
        title: t("raidBosses.tour.steps.adjustedStats.title"),
        content: t("raidBosses.tour.steps.adjustedStats.content"),
      } satisfies Step,
      season: {
        target: '[data-testid="raid-boss-season-select"]',
        title: t("raidBosses.tour.steps.season.title"),
        content: t("raidBosses.tour.steps.season.content"),
      } satisfies Step,
      seasonBoard: {
        target: '[data-testid="raid-boss-season-reference"]',
        title: t("raidBosses.tour.steps.seasonBoard.title"),
        content: t("raidBosses.tour.steps.seasonBoard.content"),
      } satisfies Step,
      seasonContent: {
        target: '[data-testid="raid-boss-season-content"]',
        title: t("raidBosses.tour.steps.seasonContent.title"),
        content: t("raidBosses.tour.steps.seasonContent.content"),
      } satisfies Step,
      metaRecommendations: {
        target: '[data-testid="raid-boss-meta-recommendations"]',
        title: t("raidBosses.tour.steps.metaRecommendations.title"),
        content: t("raidBosses.tour.steps.metaRecommendations.content"),
      } satisfies Step,
      metaFilter: {
        target: '[data-testid="raid-boss-meta-filter"]',
        title: t("raidBosses.tour.steps.metaFilter.title"),
        content: t("raidBosses.tour.steps.metaFilter.content"),
      } satisfies Step,
      metaGuidance: {
        target: '[data-testid="raid-boss-meta-comps"]',
        title: t("raidBosses.tour.steps.metaGuidance.title"),
        content: t("raidBosses.tour.steps.metaGuidance.content"),
      } satisfies Step,
    }),
    [t]
  )
}

export function useRaidBossesTutorial(
  tab: RaidBossTab = "details",
  hasEntityDetail = true
): TourPageSteps {
  const {
    tabs,
    bosses,
    primes,
    progression,
    primeModifiers,
    adjustedStats,
    season,
    seasonBoard,
    seasonContent,
    metaRecommendations,
    metaFilter,
    metaGuidance,
  } = useSharedSteps()

  const details = useMemo<TourPageSteps>(() => {
    if (!hasEntityDetail) {
      return {
        desktop: [
          { ...tabs, placement: "bottom" },
          { ...seasonBoard, placement: "bottom" },
        ],
        mobile: [
          { ...tabs, placement: "bottom" },
          { ...seasonBoard, placement: "top" },
        ],
      }
    }

    return {
      desktop: [
        { ...tabs, placement: "bottom" },
        { ...bosses, placement: "right" },
        { ...primes, placement: "right" },
        { ...progression, placement: "bottom" },
        { ...primeModifiers, placement: "left" },
        { ...adjustedStats, placement: "top" },
      ],
      mobile: [
        { ...tabs, placement: "bottom" },
        { ...bosses, placement: "bottom" },
        { ...primes, placement: "bottom" },
        { ...progression, placement: "bottom" },
        { ...primeModifiers, placement: "top" },
        { ...adjustedStats, placement: "top" },
      ],
    }
  }, [
    adjustedStats,
    bosses,
    hasEntityDetail,
    primeModifiers,
    primes,
    progression,
    seasonBoard,
    tabs,
  ])

  const seasons = useMemo<TourPageSteps>(
    () => ({
      desktop: [
        { ...tabs, placement: "bottom" },
        ...(hasEntityDetail
          ? [
              { ...season, placement: "bottom" as const },
              { ...seasonContent, placement: "right" as const },
            ]
          : [{ ...seasonBoard, placement: "bottom" as const }]),
      ],
      mobile: [
        { ...tabs, placement: "bottom" },
        ...(hasEntityDetail
          ? [
              { ...season, placement: "bottom" as const },
              { ...seasonContent, placement: "bottom" as const },
            ]
          : [{ ...seasonBoard, placement: "top" as const }]),
      ],
    }),
    [hasEntityDetail, season, seasonBoard, seasonContent, tabs]
  )

  const meta = useMemo<TourPageSteps>(
    () => ({
      desktop: [
        { ...tabs, placement: "bottom" },
        { ...metaRecommendations, placement: "right" },
        { ...metaFilter, placement: "bottom" },
        { ...metaGuidance, placement: "left" },
      ],
      mobile: [
        { ...tabs, placement: "bottom" },
        { ...metaRecommendations, placement: "bottom" },
        { ...metaFilter, placement: "bottom" },
        { ...metaGuidance, placement: "bottom" },
      ],
    }),
    [metaFilter, metaGuidance, metaRecommendations, tabs]
  )

  return tab === "seasons" ? seasons : tab === "meta" ? meta : details
}
