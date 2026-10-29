import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { TooltipProvider } from "@workspace/ui/components/tooltip"

import "@workspace/ui/globals.css"
import { App } from "@/app"
import { AuthProvider, I18nProvider, QueryProvider } from "@/app/providers"
import { installPreloadErrorRecovery } from "@/app/stale-build-recovery"
import { listenForInstallPrompt } from "@/widgets/app-install"
import { initializeAuthentication, startSilentSignInOnce } from "@/shared/auth"
import { installGlobalErrorCapture } from "@/shared/lib"
import { ThemeProvider } from "@/shared/theme"
import { TourProvider } from "@/shared/tour"

// Before anything else: a chunk deleted by a newer deploy must trigger a reload, not a blank page.
installPreloadErrorRecovery()
// Every error nothing else caught is logged once and reported (spec: client-error-reporting).
installGlobalErrorCapture()
// Chromium offers its install prompt early, often before React mounts: hold it for the Install button.
listenForInstallPrompt()

async function bootstrap() {
  const msalInstance = await initializeAuthentication()
  // Before the first render, so the first API call (GET /account) finds the restore already in flight
  // and waits on it instead of racing a second hidden sign-in frame against it.
  startSilentSignInOnce(msalInstance)

  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <I18nProvider>
        <AuthProvider instance={msalInstance}>
          <QueryProvider>
            <ThemeProvider>
              <TourProvider>
                <TooltipProvider>
                  <App />
                </TooltipProvider>
              </TourProvider>
            </ThemeProvider>
          </QueryProvider>
        </AuthProvider>
      </I18nProvider>
    </StrictMode>
  )
}

void bootstrap().catch((error: unknown) => {
  console.error("Application startup failed", error)

  const root = document.getElementById("root")!
  const message = document.createElement("p")

  message.className = "p-6 text-sm text-destructive"
  message.dataset.testid = "startup-error"
  message.textContent =
    "Application configuration error. Check the required environment variables."
  root.replaceChildren(message)
})
