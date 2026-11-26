import { describe, expect, it } from "vitest"

import { mapJournaledAuthStepToEvent } from "./auth-step-event"

describe("mapJournaledAuthStepToEvent", () => {
  it("sends the step's own fields and null for the rest", () => {
    expect(
      mapJournaledAuthStepToEvent({
        step: "interactive_redirect_started",
        trigger: "auto",
        method: "google",
        freshLogin: true,
        at: 1700000000000,
        load: "abc",
      })
    ).toEqual({
      type: "auth_step",
      step: "interactive_redirect_started",
      occurredAt: 1700000000000,
      pageLoad: "abc",
      outcome: null,
      errorCode: null,
      from: null,
      reason: null,
      trigger: "auto",
      method: "google",
      freshLogin: true,
      navigationType: null,
      recordedAppVersion: null,
    })
  })

  it("sends how the returned-to page loaded and the build that recorded the step", () => {
    expect(
      mapJournaledAuthStepToEvent({
        step: "interactive_redirect_returned",
        outcome: "no_response",
        navigation: "reload",
        version: "v2.5.1",
        at: 1,
        load: "x",
      })
    ).toMatchObject({
      outcome: "no_response",
      navigationType: "reload",
      recordedAppVersion: "v2.5.1",
    })
  })

  it("sends a missing error code as null", () => {
    expect(
      mapJournaledAuthStepToEvent({
        step: "restore_cache",
        outcome: "success",
        at: 1,
        load: "x",
      })
    ).toMatchObject({ outcome: "success", errorCode: null })
  })
})
