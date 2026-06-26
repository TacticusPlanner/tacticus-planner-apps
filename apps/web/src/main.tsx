import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import "@workspace/ui/globals.css"
import { App } from "@/app"
import {
  AuthProvider,
  I18nProvider,
  ThemeProvider,
  TourProvider,
} from "@/app/providers"
import { initializeAuthentication } from "@/shared/auth"

async function bootstrap() {
  const msalInstance = await initializeAuthentication()

  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <I18nProvider>
        <AuthProvider instance={msalInstance}>
          <ThemeProvider>
            <TourProvider>
              <App />
            </TourProvider>
          </ThemeProvider>
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
