import { useTranslation } from "react-i18next"

import {
  QUEST_POWER_RATIO_CALIBRATED,
  type QuestBattleEstimate,
  type QuestTeamEstimate,
} from "../model/quest-estimates"
import { useObjectiveWording, type Objective } from "./use-objective-wording"

/**
 * One battle's clear estimates (spec: quest-event-clear-estimates): the objective team against the
 * required power with its margin and points, the hard-rules team when it is shown with what it gives
 * up, and the shortfall with the cap gains when neither clears. Labelled an uncalibrated estimate.
 */
export function QuestEstimateBlock({
  estimate,
  objectives,
  nameOf,
}: {
  estimate: QuestBattleEstimate | null
  objectives: readonly Objective[]
  nameOf: (unitId: string) => string
}) {
  const { t, i18n } = useTranslation("quest")
  const word = useObjectiveWording()
  const number = new Intl.NumberFormat(i18n.language)
  const percent = new Intl.NumberFormat(i18n.language, {
    style: "percent",
    maximumFractionDigits: 0,
  })
  if (!estimate) return null
  const result = (team: QuestTeamEstimate) =>
    team.clears
      ? t(team.marginal ? "estimate.verdict.close" : "estimate.verdict.clears")
      : t("estimate.verdict.fails")
  return (
    <section
      aria-labelledby="quest-estimate-title"
      className="flex min-w-0 flex-col gap-1.5 rounded-xl border p-3 text-sm"
      data-testid="quest-estimate"
    >
      <h4 className="font-semibold" id="quest-estimate-title">
        {t("estimate.title")}{" "}
        <span className="font-normal text-muted-foreground">
          {QUEST_POWER_RATIO_CALIBRATED
            ? t("estimate.label")
            : t("estimate.labelUncalibrated")}
        </span>
      </h4>
      {estimate.kind === "unknown" ? (
        <p
          className="text-muted-foreground"
          data-testid="quest-estimate-unknown"
        >
          {t("estimate.unknown")}
        </p>
      ) : (
        <>
          <p className="tabular-nums" data-testid="quest-estimate-first">
            {t("estimate.first", {
              result: result(estimate.first),
              power: number.format(estimate.first.power),
              required: number.format(Math.round(estimate.required)),
            })}
            {estimate.first.clears
              ? ` · ${t("estimate.margin", {
                  margin: percent.format(estimate.first.margin),
                })} · ${t("estimate.points", {
                  points: number.format(estimate.first.points),
                })}`
              : null}
          </p>
          {estimate.second ? (
            <div
              className="flex flex-col gap-0.5"
              data-testid="quest-estimate-second"
            >
              <p className="tabular-nums">
                {estimate.second.clears
                  ? t("estimate.secondClears", {
                      points: number.format(estimate.second.points),
                      instead: number.format(estimate.first.points),
                      margin: percent.format(estimate.second.margin),
                    })
                  : t("estimate.secondFails", {
                      power: number.format(estimate.second.power),
                    })}
              </p>
              {estimate.second.givenUp.map((given) => {
                const objective = objectives[given.index]
                if (!objective) return null
                return (
                  <p
                    className="text-muted-foreground"
                    data-testid="quest-estimate-given-up"
                    key={given.index}
                  >
                    {given.breakers.length > 0
                      ? t("estimate.givenUp", {
                          units: given.breakers.map(nameOf).join(", "),
                          objective: word(objective),
                        })
                      : t("estimate.givenUpNoUnit", {
                          objective: word(objective),
                        })}
                  </p>
                )
              })}
            </div>
          ) : null}
          {estimate.shortfall === null ? null : (
            <div
              className="flex flex-col gap-0.5"
              data-testid="quest-estimate-short"
            >
              <p className="font-medium text-destructive">
                {t("estimate.short", {
                  percent: percent.format(estimate.shortfall),
                })}
              </p>
              {estimate.capGains.length > 0 ? (
                <ul className="flex flex-col gap-0.5">
                  {estimate.capGains.map((gain) => (
                    <li data-testid="quest-estimate-cap-gain" key={gain.unitId}>
                      {t("estimate.capGain", {
                        name: nameOf(gain.unitId),
                        gain: number.format(gain.gain),
                      })}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          )}
        </>
      )}
    </section>
  )
}
