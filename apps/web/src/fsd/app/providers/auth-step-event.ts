import type { AnalyticsEvent } from "@/shared/analytics"
import type { JournaledAuthStep } from "@/shared/auth"

type AuthStepEvent = Extract<AnalyticsEvent, { type: "auth_step" }>

/** A journaled sign-in step as the declared `auth_step` event; absent fields are sent as null. */
export function mapJournaledAuthStepToEvent(
  entry: JournaledAuthStep
): AuthStepEvent {
  return {
    type: "auth_step",
    step: entry.step,
    occurredAt: entry.at,
    pageLoad: entry.load,
    outcome: "outcome" in entry ? entry.outcome : null,
    errorCode: ("errorCode" in entry ? entry.errorCode : undefined) ?? null,
    from: "from" in entry ? entry.from : null,
    reason: "reason" in entry ? entry.reason : null,
    trigger: "trigger" in entry ? entry.trigger : null,
    method: entry.method ?? null,
    freshLogin: "freshLogin" in entry ? entry.freshLogin : null,
  }
}
