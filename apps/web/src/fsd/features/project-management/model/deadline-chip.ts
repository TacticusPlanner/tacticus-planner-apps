import { useTranslation } from "react-i18next"

import { useLegendaryEvents } from "@/entities/legendary-event"
import { useProjectDeadline } from "@/entities/project"
import type { ProjectDeadline, ProjectSummary } from "@/entities/project"
import { formatEventCountdown } from "@/shared/lib"

import { useEventTargetName } from "./event-target-options"

/** Where a deadline stands: before its start, between start and end, or past its end. */
type DeadlineChipState = "upcoming" | "running" | "ended"

/** The timing a deadline chip shows; null while the deadline loads or can't be resolved. */
export type DeadlineChipTiming = {
  state: DeadlineChipState
  startMs: number
  endMs: number
  estimated: boolean
  /** The minute clock the state was read at; the countdown counts from it. */
  nowMs: number
}

/**
 * One deadline chip (project-deadline-chip): the deadline's kind, its name, where it links, and
 * its timing. Every deadline kind maps to this, so a new kind adds a mapper, not a new chip.
 */
export type DeadlineChipModel = {
  kind: "legendaryEvent"
  name: string
  href: string | null
  timing: DeadlineChipTiming | null
}

/** A resolved deadline's timing at `nowMs`: running from its start until its end. */
export function deadlineChipTiming(
  deadline: ProjectDeadline | null,
  nowMs: number
): DeadlineChipTiming | null {
  if (deadline?.status !== "ready") return null
  const state: DeadlineChipState =
    nowMs < deadline.deadlineMs
      ? "upcoming"
      : nowMs < deadline.endMs
        ? "running"
        : "ended"
  return {
    state,
    startMs: deadline.deadlineMs,
    endMs: deadline.endMs,
    estimated: deadline.estimated,
    nowMs,
  }
}

/** The chip's visible text: "LE · Lysander · starts in 18 days" (or "ends in 3 days", "ended"), and
 *  `shortLabel`, the timing alone ("starts in 18 days") for Home's narrow rows. */
export function useDeadlineChipText(model: DeadlineChipModel): {
  label: string
  shortLabel: string
  hint: string | null
} {
  const { t, i18n } = useTranslation()
  const name = t("goals.project.targetChip", { name: model.name })
  const { timing } = model
  if (!timing) return { label: name, shortLabel: name, hint: null }
  const locale = i18n.resolvedLanguage ?? "en"
  const date = (ms: number) =>
    new Intl.DateTimeFormat(locale, {
      month: "short",
      day: "numeric",
    }).format(ms)
  const key =
    timing.state === "ended"
      ? "ended"
      : timing.state === "running"
        ? "endsIn"
        : "startsIn"
  const when =
    timing.state === "ended"
      ? undefined
      : formatEventCountdown(
          timing.state === "running" ? timing.endMs : timing.startMs,
          timing.nowMs,
          locale
        )
  const label = t(`goals.project.deadlineChip.${key}`, { name, when })
  const shortLabel = t(`goals.project.deadlineChip.short.${key}`, { when })
  const hint = t(
    timing.estimated
      ? "goals.deadlineFit.header.runsEstimated"
      : "goals.deadlineFit.header.runs",
    { date: date(timing.startMs), end: date(timing.endMs) }
  )
  return { label, shortLabel, hint }
}

/** A project's deadline chip, or null without a deadline. */
export function useProjectDeadlineChip(
  project: Pick<ProjectSummary, "projectId" | "target">
): DeadlineChipModel | null {
  const events = useLegendaryEvents()
  const deadline = useProjectDeadline(project)
  const eventId = project.target?.eventId ?? ""
  const name = useEventTargetName(eventId)
  if (!project.target) return null
  return {
    kind: "legendaryEvent",
    name: name ?? eventId,
    href: name ? `/legendary-events/${eventId}` : null,
    timing: deadlineChipTiming(deadline, events.nowMs),
  }
}
