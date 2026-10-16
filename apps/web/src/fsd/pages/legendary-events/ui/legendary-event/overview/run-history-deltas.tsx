import { useTranslation } from "react-i18next"
import { characterIcon } from "@workspace/game-catalog"
import type { UnitId } from "@workspace/game-domain"

import type { RosterDelta, RunHistory } from "@/entities/legendary-event"
import { EntityIcon } from "@/shared/ui"
import { useUnitName } from "@/shared/unit-name"

import { progressionStarsKey } from "./last-run.view-model"

/** The Since last run list (or why there is none): per unit, unlocked, rank, stars and each
 *  ability that rose. Absent when the record has no teams. */
export function RunHistoryDeltas({
  history,
  since,
}: {
  history: RunHistory
  since: "last" | "then"
}) {
  const { t } = useTranslation("legendaryEvents")
  const { deltas } = history
  if (deltas.kind === "noTeams") return null
  return (
    <section
      className="flex min-w-0 flex-col gap-2"
      data-testid="last-run-since"
    >
      <h3 className="text-sm font-semibold">
        {since === "last"
          ? t("history.since.title")
          : t("history.since.titleThen")}
      </h3>
      {deltas.kind === "noSnapshot" ? (
        <p
          className="text-sm text-muted-foreground"
          data-testid="last-run-no-snapshot"
        >
          {t("history.since.noSnapshot")}
        </p>
      ) : null}
      {deltas.kind === "noRoster" ? (
        <p
          className="text-sm text-muted-foreground"
          data-testid="last-run-no-roster"
        >
          {t("history.since.noRoster")}
        </p>
      ) : null}
      {deltas.kind === "ready" && deltas.deltas.length === 0 ? (
        <p
          className="text-sm text-muted-foreground"
          data-testid="last-run-no-changes"
        >
          {t("history.since.none")}
        </p>
      ) : null}
      {deltas.kind === "ready" && deltas.deltas.length > 0 ? (
        <ul
          className="flex min-w-0 flex-col gap-2"
          data-testid="last-run-deltas"
        >
          {deltas.deltas.map((delta) => (
            <DeltaRow delta={delta} key={delta.unitId} />
          ))}
        </ul>
      ) : null}
    </section>
  )
}

function DeltaRow({ delta }: { delta: RosterDelta }) {
  const { t } = useTranslation(["legendaryEvents", "progression"])
  const unitName = useUnitName()
  const name = unitName("Character", delta.unitId)
  const lines: { key: string; text: string }[] = []
  if (delta.unlocked) {
    lines.push({ key: "unlocked", text: t("history.since.unlocked") })
  }
  if (delta.rank) {
    lines.push({
      key: "rank",
      text: t("history.since.rank", {
        from: t(`progression:ranks.${delta.rank.from}`),
        to: t(`progression:ranks.${delta.rank.to}`),
      }),
    })
  }
  if (delta.progression) {
    lines.push({
      key: "stars",
      text: t("history.since.stars", {
        from: t(
          `progression:stars.${progressionStarsKey(delta.progression.from)}`
        ),
        to: t(`progression:stars.${progressionStarsKey(delta.progression.to)}`),
      }),
    })
  }
  for (const ability of delta.abilities) {
    lines.push({
      key: `ability-${ability.slot}`,
      text: t(
        ability.slot === 0
          ? "history.since.activeAbility"
          : "history.since.passiveAbility",
        { from: ability.from, to: ability.to }
      ),
    })
  }
  return (
    <li
      className="flex min-w-0 items-start gap-2"
      data-testid="last-run-delta"
      data-unit={delta.unitId}
    >
      <EntityIcon
        alt={name}
        className="size-8 shrink-0 rounded-full"
        src={characterIcon(delta.unitId as UnitId)}
      />
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-sm font-medium">{name}</span>
        <ul className="text-xs text-muted-foreground tabular-nums">
          {lines.map((line) => (
            <li data-change={line.key} key={line.key}>
              {line.text}
            </li>
          ))}
        </ul>
      </div>
    </li>
  )
}
