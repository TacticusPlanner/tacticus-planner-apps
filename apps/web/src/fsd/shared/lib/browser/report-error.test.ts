// @vitest-environment jsdom
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

  const errorWithStack = (message: string, stack: string) =>
    Object.assign(new Error(message), { stack: `Error: ${message}\n${stack}` })
  const ours = (message: string) =>
    errorWithStack(
      message,
      `    at q (${window.location.origin}/assets/main-CkD7fbtV.js:3:20709)`
    )
  const rejection = (reason: unknown) =>
    Object.assign(new Event("unhandledrejection"), { reason })

  it("reports an uncaught error thrown by our own scripts", () => {
    const target = new EventTarget() as Window
    installGlobalErrorCapture(target)
    const report = vi.fn()
    setErrorReporter(report)
    vi.spyOn(console, "error").mockImplementation(() => {})
    const error = ours("boom")

    target.dispatchEvent(new ErrorEvent("error", { error }))

    expect(report).toHaveBeenCalledExactlyOnceWith(error, "window.error")
  })

  it("ignores errors that are not from our scripts", () => {
    const target = new EventTarget() as Window
    installGlobalErrorCapture(target)
    const report = vi.fn()
    setErrorReporter(report)
    const log = vi.spyOn(console, "error").mockImplementation(() => {})

    // Detail-less: a cross-origin "Script error." and the browser's ResizeObserver notice.
    target.dispatchEvent(new ErrorEvent("error", { message: "Script error." }))
    target.dispatchEvent(
      new ErrorEvent("error", {
        message:
          "ResizeObserver loop completed with undelivered notifications.",
      })
    )
    // A wallet extension's script injected into the page: its only frame is the page URL.
    target.dispatchEvent(
      new ErrorEvent("error", {
        error: errorWithStack(
          "undefined is not an object (evaluating 'window.ethereum.selectedAddress = undefined')",
          `global code@${window.location.origin}/legendary-events/abc/plan:1:16`
        ),
      })
    )
    // A third-party widget's own script.
    target.dispatchEvent(
      rejection(
        errorWithStack(
          "signal is aborted without reason",
          "    at Object.wI (https://cdn.userjot.com/sdk/v3/uj.js:43:135361)"
        )
      )
    )
    // An extension's content script rejecting with a value from its own realm.
    target.dispatchEvent(
      rejection({
        toString: () => "Error: No Listener: tabs:outgoing.message.ready",
      })
    )

    expect(report).not.toHaveBeenCalled()
    expect(log).not.toHaveBeenCalled()
  })

  it("keeps an error without a stack", () => {
    const target = new EventTarget() as Window
    installGlobalErrorCapture(target)
    const report = vi.fn()
    setErrorReporter(report)
    vi.spyOn(console, "error").mockImplementation(() => {})
    const error = Object.assign(new Error("closed"), { stack: undefined })

    target.dispatchEvent(rejection(error))

    expect(report).toHaveBeenCalledExactlyOnceWith(error, "unhandledrejection")
  })

  it("logs an unhandled rejection exactly once and survives a throwing capture", () => {
    const target = new EventTarget() as Window
    installGlobalErrorCapture(target)
    const log = vi.spyOn(console, "error").mockImplementation(() => {})
    setErrorReporter(() => {
      throw new Error("capture failed")
    })

    expect(() => target.dispatchEvent(rejection(ours("probe")))).not.toThrow()
    expect(log).toHaveBeenCalledOnce()
  })
})
