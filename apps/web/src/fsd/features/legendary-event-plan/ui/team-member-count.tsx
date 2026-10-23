import { useTranslation } from "react-i18next"
import { cn } from "@workspace/ui/lib/utils"

import { MIN_TEAM_MEMBERS } from "@/entities/legendary-event"

import { MAX_TEAM_MEMBERS } from "../model/team-editor-draft"

/** The editor's member count badge ("n/5", "n/5 · at least 3" below three). `pulse` counts the
 *  refused sixth members; each one replays the pulse. */
export function TeamMemberCount({
  count,
  pulse,
}: {
  count: number
  pulse: number
}) {
  const { t } = useTranslation("legendaryEvents")
  return (
    <span
      aria-live="polite"
      className={cn(
        "rounded-full border px-2 py-0.5 text-sm font-semibold tabular-nums",
        count === MAX_TEAM_MEMBERS && "border-primary text-primary",
        pulse > 0 && "motion-safe:animate-[pulse_0.4s_ease-in-out_2]"
      )}
      data-pulse={pulse > 0 ? pulse : undefined}
      data-testid="team-picker-count"
      key={pulse}
    >
      {count < MIN_TEAM_MEMBERS
        ? t("teams.picker.countBelowMinimum", {
            members: count,
            min: MIN_TEAM_MEMBERS,
          })
        : t("teams.picker.count", { members: count })}
    </span>
  )
}
