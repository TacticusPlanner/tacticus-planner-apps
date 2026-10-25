import userEvent from "@testing-library/user-event"
import type { i18n as I18n } from "i18next"
import { beforeAll, describe, expect, it, vi } from "vitest"

import { EMPTY_RUN_INPUT_VALUES } from "@/entities/legendary-event"
import { utharEvent } from "@/test/fixtures/legendary-events"
import { createTestI18n, i18nWrapper } from "@/test/i18n"
import { render, screen } from "@/test/render"

import type { StepTarget } from "./plan-ceiling"
import { writeCounts, type PlanWrites } from "./plan-create"
import { PlanSummary } from "./plan-summary"
import { planSummaryFacts } from "./plan-summary.model"
import type { DraftTeam } from "./plan-teams"
import { TargetCard } from "./target-card"
import { runAssumptions, targetBar } from "./target-step.model"
import { upgradeGroups } from "./upgrades-step.model"
import { RunsStep } from "./runs-step"
import type { PlanDraft } from "./use-plan-draft"
import type { PlanSource } from "./use-plan-source"

const tokenProps = vi.hoisted(() => ({
  plan: null as Record<string, unknown> | null,
  forecast: null as Record<string, unknown> | null,
}))
vi.mock("@/features/legendary-event-tokens", () => ({
  TokenPlanList: (props: Record<string, unknown>) => {
    tokenProps.plan = props
    return null
  },
  RunForecastSection: (props: Record<string, unknown>) => {
    tokenProps.forecast = props
    return null
  },
}))

let i18n: I18n
beforeAll(async () => {
  i18n = await createTestI18n("en")
})

const UNLOCK: StepTarget = { step: "unlock", kind: "points", points: 10_000 }

describe("targetBar", () => {
  it("fills the synced share solid and caps the upgraded share at the target", () => {
    // 6,136 ÷ 10,000 = 61.36%; 10,450 is above the target, so the hatched part ends at 100%.
    expect(targetBar(UNLOCK, 6136, 10_450)).toEqual({
      synced: 61.36,
      upgraded: 100,
    })
  })

  it("has no bar for an unreachable step", () => {
    expect(
      targetBar({ step: "fiveStars", kind: "unreachable" }, 1, 2)
    ).toBeNull()
  })
})

describe("TargetCard", () => {
  it("reads the verdict, the roster shortfall and the spare with upgrades", () => {
    render(
      <TargetCard
        buttonRef={() => undefined}
        checked
        currentKind="needsUpgrades"
        focusable
        onKeyDown={() => undefined}
        onSelect={() => undefined}
        rechecking={false}
        syncedCeiling={6136}
        target={UNLOCK}
        upgradedCeiling={10_450}
        verdict={{ kind: "needsUpgrades", short: 3864 }}
      />,
      { wrapper: i18nWrapper(i18n) }
    )
    expect(screen.getByRole("radio")).toBeChecked()
    expect(screen.getByTestId("plan-wizard-verdict-detail")).toHaveTextContent(
      "Needs upgrades · 3,864 points short with your roster · +450 spare with upgrades"
    )
    expect(screen.getByTestId("plan-wizard-target-bar-synced")).toHaveStyle({
      width: "61.36%",
    })
    expect(screen.getByTestId("plan-wizard-target-bar-upgraded")).toHaveStyle({
      width: "100%",
    })
  })
})

describe("runAssumptions", () => {
  it("counts each plan run's missions of the catalog's, and the bundle with paid options on", () => {
    const regular = utharEvent.regularMissions.length
    const premium = utharEvent.premiumMissions.length
    const economy = {
      showPaidOptions: true,
      runs: [
        {
          run: 2 as const,
          ...EMPTY_RUN_INPUT_VALUES,
          regularMissions: 4,
          premiumMissions: 2,
          bundlePurchased: true,
          updatedAt: "",
        },
      ],
    }
    expect(runAssumptions(utharEvent, economy, [2, 3])).toEqual([
      { run: 2, missions: 6, of: regular + premium, bundle: true },
      { run: 3, missions: 0, of: regular + premium, bundle: false },
    ])
    expect(
      runAssumptions(utharEvent, { ...economy, showPaidOptions: false }, [2])
    ).toEqual([{ run: 2, missions: 4, of: regular, bundle: false }])
  })
})

describe("upgradeGroups", () => {
  it("groups by first run in run order, keeping the list order within a group", () => {
    expect(
      upgradeGroups([{ firstRun: 3 }, { firstRun: 2 }, { firstRun: 3 }])
    ).toEqual([
      { run: 2, indexes: [1] },
      { run: 3, indexes: [0, 2] },
    ])
  })
})

const team = (key: string, storedId: string | null = null): DraftTeam => ({
  key,
  laneId: "alpha",
  storedId,
  name: "",
  memberUnitIds: ["a", "b", "c"],
  reserveUnitId: null,
  objectiveIndexes: [],
  depthByRun: {},
  edited: storedId !== null,
})

const WRITES: PlanWrites = {
  goals: [
    {
      unitId: "calgar",
      from: undefined,
      steps: [],
      request: { unitId: "calgar", from: undefined },
      alreadyPlanned: false,
    },
  ],
  lanes: [
    {
      laneId: "alpha",
      remove: ["mine"],
      update: [team("melee", "melee")],
      create: [team("new")],
    },
  ],
  runs: [],
  showPaidOptions: null,
}

describe("writeCounts", () => {
  it("counts goals, created and updated teams, and run inputs", () => {
    expect(writeCounts(WRITES)).toEqual({ goals: 1, teams: 2, runs: false })
  })
})

/** The slice of the draft the summary reads. */
function summaryDraft(
  ceiling: number,
  verdict: "needsUpgrades" | "tooAmbitious"
) {
  return {
    chosenTarget: UNLOCK,
    target: "unlock",
    options: {
      options: [{ target: UNLOCK, verdict: { kind: verdict, short: 900 } }],
      best: "unlock",
    },
    evaluation: { ceiling, teams: [], rosters: new Map() },
    recommendations: {
      status: "done",
      recommendations: [],
      upgradedCeiling: ceiling,
    },
    settling: false,
    movedToBest: false,
  } as unknown as PlanDraft
}

describe("PlanSummary", () => {
  it("follows the ticks: spare points, then the ceiling against the target", () => {
    expect(
      planSummaryFacts(summaryDraft(10_450, "needsUpgrades"))
    ).toMatchObject({ kind: "points", ceiling: 10_450, points: 10_000 })
    const { rerender } = render(
      <PlanSummary
        draft={summaryDraft(10_450, "needsUpgrades")}
        locked={false}
        mobile={false}
        onChangeTarget={() => undefined}
        writes={WRITES}
      />,
      { wrapper: i18nWrapper(i18n) }
    )
    expect(screen.getByTestId("plan-wizard-summary-ceiling")).toHaveTextContent(
      "+450 spare"
    )
    expect(screen.getByTestId("plan-wizard-summary-goals")).toHaveTextContent(
      "1 goal to create"
    )
    expect(screen.getByTestId("plan-wizard-summary-teams")).toHaveTextContent(
      "Teams: +1 / −1"
    )
    rerender(
      <PlanSummary
        draft={summaryDraft(9100, "needsUpgrades")}
        locked={false}
        mobile={false}
        onChangeTarget={() => undefined}
        writes={{ ...WRITES, goals: [] }}
      />
    )
    expect(screen.getByTestId("plan-wizard-summary-ceiling")).toHaveTextContent(
      "ceiling 9,100 of 10,000 needed"
    )
    expect(screen.getByTestId("plan-wizard-summary-goals")).toHaveTextContent(
      "0 goals to create"
    )
  })

  it("shows the Too ambitious warning with Change target, in both placements", async () => {
    for (const mobile of [false, true]) {
      const onChangeTarget = vi.fn()
      const { unmount } = render(
        <PlanSummary
          draft={summaryDraft(9100, "tooAmbitious")}
          locked={false}
          mobile={mobile}
          onChangeTarget={onChangeTarget}
          writes={WRITES}
        />,
        { wrapper: i18nWrapper(i18n) }
      )
      expect(
        screen.getByTestId("plan-wizard-summary-warning")
      ).toHaveTextContent("Unlock looks out of reach")
      await userEvent.click(
        screen.getByRole("button", { name: "Change target" })
      )
      expect(onChangeTarget).toHaveBeenCalledOnce()
      unmount()
    }
  })
})

describe("RunsStep", () => {
  it("opens both sections with the wizard's own keys, reports no expand events and links leftovers to Teams", () => {
    const onOpenTeams = vi.fn()
    render(
      <RunsStep
        draft={{ tokenView: { kind: "loading" } } as unknown as PlanDraft}
        onOpenTeams={onOpenTeams}
        source={
          { event: utharEvent } as Extract<PlanSource, { status: "ready" }>
        }
      />,
      { wrapper: i18nWrapper(i18n) }
    )
    for (const props of [tokenProps.plan, tokenProps.forecast]) {
      expect(props).toMatchObject({ defaultOpen: true, trackExpand: false })
      expect(String(props?.openKey)).toContain("planWizard")
    }
    const open = tokenProps.forecast?.onOpenTeams as (lane: string) => void
    open("beta")
    expect(onOpenTeams).toHaveBeenCalledWith("beta")
  })
})
