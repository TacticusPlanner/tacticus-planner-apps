/** Chromium's install prompt event, which TypeScript's DOM types do not declare. */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

type InstallPromptState = {
  /** The browser offered its install prompt and it has not been used yet. */
  canPrompt: boolean
  /** The app was installed during this visit (the browser fired `appinstalled`). */
  justInstalled: boolean
}

export type InstallPromptOutcome = "accepted" | "dismissed" | "unavailable"

let deferredPrompt: BeforeInstallPromptEvent | null = null
let state: InstallPromptState = { canPrompt: false, justInstalled: false }
const listeners = new Set<() => void>()
let listening = false

function handleBeforeInstallPrompt(event: Event) {
  // Keeps the browser's own mini-infobar away; the Home card and account menu offer it instead.
  event.preventDefault()
  deferredPrompt = event as BeforeInstallPromptEvent
  setState({ canPrompt: true })
}

function handleAppInstalled() {
  deferredPrompt = null
  setState({ canPrompt: false, justInstalled: true })
}

function setState(next: Partial<InstallPromptState>) {
  state = { ...state, ...next }
  for (const listener of listeners) listener()
}

/**
 * Starts holding the browser's install prompt for the Install button. Call once at startup, before
 * React renders: Chromium fires `beforeinstallprompt` early, often before any component mounts.
 * Calling it again does nothing.
 */
export function listenForInstallPrompt() {
  if (listening) return
  listening = true
  window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
  window.addEventListener("appinstalled", handleAppInstalled)
}

export function subscribeInstallPrompt(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function getInstallPromptState(): InstallPromptState {
  return state
}

/** Shows the browser's install prompt. A prompt can be shown only once, so it is used up whatever
 *  the answer; the browser may offer a new one later. */
export async function promptInstall(): Promise<InstallPromptOutcome> {
  const prompt = deferredPrompt
  if (!prompt) return "unavailable"
  deferredPrompt = null
  setState({ canPrompt: false })
  try {
    await prompt.prompt()
    const { outcome } = await prompt.userChoice
    return outcome
  } catch {
    return "unavailable"
  }
}

/** Test seam: forgets the held prompt and the listeners' registration. */
export function resetInstallPromptForTests() {
  window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
  window.removeEventListener("appinstalled", handleAppInstalled)
  deferredPrompt = null
  state = { canPrompt: false, justInstalled: false }
  listening = false
}
