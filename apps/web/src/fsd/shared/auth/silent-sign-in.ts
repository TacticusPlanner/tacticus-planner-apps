import { useSyncExternalStore } from "react"

import type { IPublicClientApplication } from "@azure/msal-browser"

import { attemptSilentSignIn } from "./authentication"

export type SilentSignInStatus = "idle" | "checking" | "failed"

let status: SilentSignInStatus = "idle"
let hasStarted = false
const listeners = new Set<() => void>()

function setStatus(next: SilentSignInStatus) {
  if (status === next) {
    return
  }

  status = next
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)

  return () => {
    listeners.delete(listener)
  }
}

function getSnapshot() {
  return status
}

// `hasStarted` is a module-level guard, not a component ref: it must hold across every consumer
// of useSilentSignInStatus (landing page, sidebar, mobile header, account menu), not just across
// re-renders of a single one, so the app attempts a silent restore at most once per page load
// regardless of how many callers exist or how many times AuthProvider's effect fires (e.g. under
// StrictMode's dev-mode double-invoke).
export function startSilentSignInOnce(instance: IPublicClientApplication) {
  if (hasStarted) {
    return
  }

  hasStarted = true

  if (instance.getAllAccounts().length === 0) {
    return
  }

  setStatus("checking")

  void attemptSilentSignIn(instance).then((outcome) => {
    setStatus(outcome === "success" ? "idle" : "failed")
  })
}

export function useSilentSignInStatus() {
  return useSyncExternalStore(subscribe, getSnapshot)
}

// Test-only: resets the module-level singleton between test cases, since it otherwise persists
// for the lifetime of the module (i.e. the whole test file) once startSilentSignInOnce runs.
export function resetSilentSignInForTesting() {
  status = "idle"
  hasStarted = false
  listeners.clear()
}
