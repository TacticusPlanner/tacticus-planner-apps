import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { TooltipProvider } from "@workspace/ui/components/tooltip"

import "@workspace/ui/globals.css"
import { App } from "@/app"
import { AuthProvider, I18nProvider } from "@/app/providers"
import { CurrentUserProvider } from "@/entities/account"
import { initializeAuthentication } from "@/shared/auth"
import { ThemeProvider } from "@/shared/theme"
import { TourProvider } from "@/shared/tour"

async function bootstrap() {
  const msalInstance = await initializeAuthentication()

  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <I18nProvider>
        <AuthProvider instance={msalInstance}>
          <CurrentUserProvider>
            <ThemeProvider>
              <TourProvider>
                <TooltipProvider>
                  <App />
                </TooltipProvider>
              </TourProvider>
            </ThemeProvider>
          </CurrentUserProvider>
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
