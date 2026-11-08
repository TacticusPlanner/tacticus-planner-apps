import { Link } from "react-router"
import { useTranslation } from "react-i18next"
import { eventIcon, mowIcon } from "@workspace/game-catalog"
import type { UnitId } from "@workspace/game-domain"
import { Badge } from "@workspace/ui/components/badge"

import { useIncursionWindow } from "@/entities/incursion"
import { formatEventCountdown } from "@/shared/lib"
import { useCatalogDataset } from "@/shared/local-data"
import { useUnitName } from "@/shared/unit-name"
import { EntityIcon } from "@/shared/ui"

import { homeIncursion } from "../../model/home-incursion"
import { CountdownChip } from "../events/home-event-visual"

const INCURSIONS_PATH = "/my-game/incursions"

/**
 * Incursion in Right now while it is live: the time left, its newest MoW and a nudge to track progress, the whole tile opening the Incursions page.
 */
export function IncursionTile({ nowMs }: { nowMs: number }) {
  const { t, i18n } = useTranslation("common")
  const incursions = useCatalogDataset("incursions")
  const unitName = useUnitName()
  const run = useIncursionWindow(nowMs)
  const featured =
    incursions.status === "ready" ? homeIncursion(incursions.data, nowMs) : null
  const mowName = featured ? unitName("Mow", featured.mowId) : ""

  return (
    <Link
      className="flex h-full items-center gap-3 rounded-xl border p-3 transition-colors hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
      data-testid="home-incursion"
      to={INCURSIONS_PATH}
    >
      <EntityIcon
        alt=""
        className="size-12 shrink-0"
        src={eventIcon("incursion", "Incursion")}
      />
      <span className="min-w-0 flex-1 space-y-1">
        <span className="flex flex-wrap items-center justify-between gap-2">
          <span className="flex items-center gap-2 font-semibold">
            {t("home.incursion.title")}
            {run?.status === "live" ? (
              <Badge>{t("home.events.live")}</Badge>
            ) : null}
          </span>
          {run ? (
            <span className="shrink-0" data-testid="home-incursion-countdown">
              <CountdownChip
                text={t(
                  run.status === "live"
                    ? "home.events.endsIn"
                    : "home.events.startsIn",
                  {
                    when: formatEventCountdown(
                      run.status === "live" ? run.endMs : run.startMs,
                      nowMs,
                      i18n.language,
                      { withHours: true }
                    ),
                  }
                )}
              />
            </span>
          ) : null}
        </span>
        {featured ? (
          <span
            className="flex items-center gap-1.5 text-sm"
            data-testid="home-incursion-mow"
          >
            <EntityIcon
              alt=""
              className="size-5 rounded-sm"
              src={mowIcon(featured.mowId as UnitId)}
            />
            {featured.arrivesMs === null
              ? t("home.incursion.latest", { mow: mowName })
              : t("home.incursion.arrives", {
                  mow: mowName,
                  date: new Intl.DateTimeFormat(i18n.language, {
                    dateStyle: "medium",
                  }).format(featured.arrivesMs),
                })}
          </span>
        ) : null}
        <span className="block text-xs text-muted-foreground">
          {t("home.incursion.track")}
        </span>
      </span>
    </Link>
  )
}
