import { useId, type ReactElement, type ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { SlidersHorizontal } from "lucide-react"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@workspace/ui/components/drawer"
import { Label } from "@workspace/ui/components/label"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@workspace/ui/components/sheet"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Switch } from "@workspace/ui/components/switch"

import {
  MAX_CLOSE_SHARDS,
  eventMissions,
  type LegendaryEvent,
  type LegendaryEventRun,
  type LegendaryEventRunResolution,
} from "@/entities/legendary-event"
import { NumberStepper } from "@/shared/ui"

import { missionTickPatch, runInputsPhase } from "../model/run-inputs-patches"
import { useRunInputs, type RunInputsActions } from "../model/use-run-inputs"
import { useWatchAds } from "../model/use-watch-ads"
import { MissionChecklist } from "./mission-checklist"

const RUNS: readonly LegendaryEventRun[] = [1, 2, 3]
const CLOSE_SHARDS_STEP = 25

/**
 * The Run status card's Inputs button and its drawer (design D5): a right-side sheet at or above
 * 768px and a swipe-to-dismiss bottom drawer (90% of the height) below it. Runs 1–3 are stacked and
 * labelled Done / Now / Planned against the resolved runs (no labels while the run is unknown);
 * every run stays editable. Paid fields
 * show only with Show paid options on. Closing returns focus to the Inputs button.
 */
export function RunInputsDrawer({
  event,
  runs,
  isMobile,
  trigger: customTrigger,
}: {
  event: Pick<LegendaryEvent, "id" | "regularMissions" | "premiumMissions">
  runs: LegendaryEventRunResolution
  isMobile: boolean
  /** Replaces the Inputs button (the Run forecast's Edit inputs link); one focusable element. */
  trigger?: ReactElement
}) {
  const { t } = useTranslation("legendaryEvents")
  const inputs: RunInputsFormSource = {
    ...useRunInputs(event.id),
    ...useWatchAds(),
  }
  const trigger = customTrigger ?? (
    <Button
      data-testid="legendary-event-run-inputs"
      size="sm"
      type="button"
      variant="outline"
    >
      <SlidersHorizontal aria-hidden="true" />
      {t("runInputs.button")}
    </Button>
  )
  const body = (
    <RunInputsForm event={event} runs={runs} inputs={inputs} touch={isMobile} />
  )

  if (isMobile) {
    return (
      <Drawer direction="bottom">
        <DrawerTrigger asChild>{trigger}</DrawerTrigger>
        <DrawerContent
          className="h-[90dvh] max-h-[90dvh] p-0"
          data-testid="run-inputs-drawer"
        >
          <DrawerHeader className="px-6 text-left">
            <DrawerTitle>{t("runInputs.title")}</DrawerTitle>
            <DrawerDescription>{t("runInputs.description")}</DrawerDescription>
          </DrawerHeader>
          {body}
        </DrawerContent>
      </Drawer>
    )
  }
  return (
    <Sheet>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent
        className="w-[420px] data-[side=right]:sm:max-w-[420px]"
        data-testid="run-inputs-drawer"
        side="right"
      >
        <SheetHeader className="pr-14">
          <SheetTitle>{t("runInputs.title")}</SheetTitle>
          <SheetDescription>{t("runInputs.description")}</SheetDescription>
        </SheetHeader>
        {body}
      </SheetContent>
    </Sheet>
  )
}

/** What the run inputs form reads and edits: the stored plan (the drawer) or a draft (the 1-click
 *  plan wizard, which saves nothing until Create). */
export type RunInputsFormSource = Pick<
  RunInputsActions,
  "loading" | "failed" | "showPaidOptions" | "values" | "change"
> & {
  setShowPaidOptions: (on: boolean) => unknown
  /** The account's Watch daily ads; the wizard's draft leaves both out (no switch shown). */
  watchAds?: boolean
  setWatchAds?: (on: boolean) => unknown
}

/** Runs 1–3 with each run's missions, and the paid fields while Show paid options is on. */
export function RunInputsForm({
  event,
  runs,
  inputs,
  touch,
}: {
  event: Pick<LegendaryEvent, "regularMissions" | "premiumMissions">
  runs: LegendaryEventRunResolution
  inputs: RunInputsFormSource
  touch: boolean
}) {
  const { t } = useTranslation("legendaryEvents")
  const paidId = useId()
  const stepperLabels = (field: string, run: LegendaryEventRun) => ({
    value: t("runInputs.fieldLabel", { field, run }),
    decrease: t("runInputs.decrease", { field, run }),
    increase: t("runInputs.increase", { field, run }),
  })
  if (inputs.loading) {
    return (
      <div
        className="flex flex-col gap-3 px-6"
        data-testid="run-inputs-loading"
      >
        <span className="sr-only">{t("hub.loading")}</span>
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    )
  }
  if (inputs.failed) {
    return (
      <p
        className="px-6 text-sm text-muted-foreground"
        data-testid="run-inputs-unavailable"
      >
        {t("runInputs.unavailable")}
      </p>
    )
  }
  const paid = inputs.showPaidOptions
  const regular = eventMissions(event, "regular")
  const premium = eventMissions(event, "premium")
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-6 pb-6">
      <div className="flex items-center justify-between gap-3 rounded-xl border p-3">
        <Label htmlFor={paidId}>{t("runInputs.showPaidOptions")}</Label>
        <Switch
          checked={paid}
          data-testid="run-inputs-paid-switch"
          id={paidId}
          onCheckedChange={(on) => void inputs.setShowPaidOptions(on)}
        />
      </div>
      {inputs.setWatchAds ? (
        <AdsSwitch
          onChange={inputs.setWatchAds}
          watchAds={inputs.watchAds ?? true}
        />
      ) : null}
      {RUNS.map((run) => {
        const values = inputs.values(run)
        const phase = runInputsPhase(run, runs)
        return (
          <section
            aria-labelledby={`${paidId}-run-${run}`}
            className="flex flex-col gap-3 rounded-xl border p-3"
            data-phase={phase ?? undefined}
            data-run={run}
            data-testid="run-inputs-run"
            key={run}
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold" id={`${paidId}-run-${run}`}>
                {t("runInputs.run", { run })}
              </h3>
              {phase ? (
                <Badge
                  data-testid="run-inputs-phase"
                  variant={phase === "now" ? "default" : "outline"}
                >
                  {t(`runInputs.phase.${phase}`)}
                </Badge>
              ) : null}
            </div>
            {phase === "now" ? (
              <p
                className="text-xs text-muted-foreground"
                data-testid="run-inputs-now-hint"
              >
                {t("runInputs.nowHint")}
              </p>
            ) : null}
            <MissionChecklist
              completed={values.completedRegularMissions}
              count={values.regularMissions}
              defaultOpen={phase === "now"}
              field={t("runInputs.regularMissions")}
              missions={regular}
              onCountChange={(count) =>
                inputs.change(run, { regularMissions: count })
              }
              onTick={(index, done) =>
                inputs.change(
                  run,
                  missionTickPatch(values, "regular", index, done)
                )
              }
              run={run}
              testId="run-inputs-regular"
              touch={touch}
            />
            {paid ? (
              <>
                <MissionChecklist
                  completed={values.completedPremiumMissions}
                  count={values.premiumMissions}
                  defaultOpen={phase === "now"}
                  field={t("runInputs.premiumMissions")}
                  missions={premium}
                  onCountChange={(count) =>
                    inputs.change(run, { premiumMissions: count })
                  }
                  onTick={(index, done) =>
                    inputs.change(
                      run,
                      missionTickPatch(values, "premium", index, done)
                    )
                  }
                  run={run}
                  testId="run-inputs-premium"
                  touch={touch}
                />
                <BundleSwitch
                  checked={values.bundlePurchased}
                  onChange={(on) => inputs.change(run, { bundlePurchased: on })}
                  run={run}
                />
                <Field label={t("runInputs.closeShards")}>
                  <NumberStepper
                    data-testid="run-inputs-close-shards"
                    labels={stepperLabels(t("runInputs.closeShards"), run)}
                    max={MAX_CLOSE_SHARDS}
                    min={0}
                    onChange={(value) =>
                      inputs.change(run, { closeShards: value ?? 0 })
                    }
                    step={CLOSE_SHARDS_STEP}
                    touch={touch}
                    value={values.closeShards}
                  />
                </Field>
              </>
            ) : null}
          </section>
        )
      })}
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span aria-hidden="true" className="text-sm">
        {label}
      </span>
      {children}
    </div>
  )
}

function BundleSwitch({
  checked,
  onChange,
  run,
}: {
  checked: boolean
  onChange: (on: boolean) => void
  run: LegendaryEventRun
}) {
  const { t } = useTranslation("legendaryEvents")
  const id = useId()
  return (
    <div className="flex items-center justify-between gap-3">
      <Label className="font-normal" htmlFor={id}>
        {t("runInputs.bundle")}
      </Label>
      <Switch
        aria-label={t("runInputs.fieldLabel", {
          field: t("runInputs.bundle"),
          run,
        })}
        checked={checked}
        data-testid="run-inputs-bundle"
        id={id}
        onCheckedChange={onChange}
      />
    </div>
  )
}

/** Watch daily ads (an account setting, on by default): off plans no ad tokens in any event. */
function AdsSwitch({
  watchAds,
  onChange,
}: {
  watchAds: boolean
  onChange: (on: boolean) => unknown
}) {
  const { t } = useTranslation("legendaryEvents")
  const id = useId()
  const hintId = useId()
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border p-3">
      <div className="flex flex-col gap-0.5">
        <Label htmlFor={id}>{t("runInputs.watchAds")}</Label>
        <p className="text-xs text-muted-foreground" id={hintId}>
          {t("runInputs.watchAdsHint")}
        </p>
      </div>
      <Switch
        aria-describedby={hintId}
        checked={watchAds}
        data-testid="run-inputs-ads-switch"
        id={id}
        onCheckedChange={(on) => void onChange(on)}
      />
    </div>
  )
}
