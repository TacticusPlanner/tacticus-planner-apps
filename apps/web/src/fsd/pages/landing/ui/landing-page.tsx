import { LogIn } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"
import { toast } from "sonner"

import { AuthError, InteractionStatus } from "@azure/msal-browser"
import { useMsal } from "@azure/msal-react"

import { loginRequest } from "@/shared/auth"

export function LandingPage() {
  const { t } = useTranslation()
  const { inProgress, instance } = useMsal()
  const isInteractionInProgress = inProgress !== InteractionStatus.None

  const handleGetStarted = () => {
    void instance.loginRedirect(loginRequest).catch((error: unknown) => {
      if (error instanceof AuthError) {
        console.error("[MSAL] sign-in failed", {
          errorCode: error.errorCode,
          message: error.message,
        })
      } else {
        console.error("[MSAL] sign-in failed", error)
      }

      toast.error(t("auth.error"))
    })
  }

  return (
    <main
      className="flex min-h-svh flex-col items-center justify-center gap-8 bg-background px-6 text-center text-foreground"
      data-testid="landing-page"
    >
      <div className="flex max-w-2xl flex-col gap-4">
        <p className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
          {t("app.name")}
        </p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          {t("landing.title")}
        </h1>
        <p className="text-lg text-muted-foreground">{t("landing.subtitle")}</p>
      </div>

      <Button
        data-testid="landing-get-started"
        disabled={isInteractionInProgress}
        onClick={handleGetStarted}
        size="lg"
      >
        <LogIn data-icon="inline-start" />
        {t("landing.getStarted")}
      </Button>
    </main>
  )
}
