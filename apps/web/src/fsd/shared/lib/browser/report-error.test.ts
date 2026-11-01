import { afterEach, describe, expect, it, vi } from "vitest"

import {
  installGlobalErrorCapture,
  reportError,
  setErrorReporter,
} from "./report-error"

describe("reportError", () => {
  afterEach(() => {
    setErrorReporter(null)
    vi.restoreAllMocks()
  })

  it("logs once and reports nothing while no reporter is registered (not identified)", () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {})

    reportError(new Error("boom"))

    expect(log).toHaveBeenCalledOnce()
  })

  it("logs once and reports once to the registered reporter", () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {})
    const report = vi.fn()
    setErrorReporter(report)
    const error = new Error("boom")

    reportError(error, "sync")

    expect(log).toHaveBeenCalledOnce()
    expect(report).toHaveBeenCalledExactlyOnceWith(error, "sync")
  })

  it("logs and reports the same error object only once", () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {})
    const report = vi.fn()
    setErrorReporter(report)
    const error = new Error("boom")

    reportError(error, "route render")
    reportError(error, "window.error")

    expect(log).toHaveBeenCalledOnce()
    expect(report).toHaveBeenCalledExactlyOnceWith(error, "route render")
  })

  it("swallows a reporter that throws", () => {
    vi.spyOn(console, "error").mockImplementation(() => {})
    setErrorReporter(() => {
      throw new Error("capture failed")
    })

    expect(() => reportError(new Error("boom"))).not.toThrow()
  })
})

describe("installGlobalErrorCapture", () => {
  afterEach(() => {
    setErrorReporter(null)
    vi.restoreAllMocks()
  })

  it("ignores the detail-less error a cross-origin script raises", () => {
    const target = new EventTarget() as Window
    installGlobalErrorCapture(target)
    const log = vi.spyOn(console, "error").mockImplementation(() => {})

    target.dispatchEvent(new ErrorEvent("error", { message: "Script error." }))
    target.dispatchEvent(new ErrorEvent("error", { message: "boom" }))

    expect(log).toHaveBeenCalledExactlyOnceWith(
      "Unhandled error (window.error)",
      "boom"
    )
  })

  it("logs an unhandled rejection exactly once and survives a throwing capture", () => {
    const target = new EventTarget() as Window
    installGlobalErrorCapture(target)
    const log = vi.spyOn(console, "error").mockImplementation(() => {})
    setErrorReporter(() => {
      throw new Error("capture failed")
    })
    const event = new Event("unhandledrejection") as PromiseRejectionEvent
    Object.assign(event, { reason: new Error("probe") })

    expect(() => target.dispatchEvent(event)).not.toThrow()
    expect(log).toHaveBeenCalledOnce()
  })
})
