import { ArrowRight, ListChecks, LogIn } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { toast } from "sonner"

import { AuthError, InteractionStatus } from "@azure/msal-browser"
import { useMsal } from "@azure/msal-react"

import { loginRequest } from "@/shared/auth"

export function LandingPage() {
  const { t } = useTranslation("landing")
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

      toast.error(t("authError"))
    })
  }

  return (
    <main
      className="flex min-h-svh flex-col items-center justify-center gap-8 bg-background px-6 text-center text-foreground"
      data-testid="landing-page"
    >
      <div className="flex max-w-2xl flex-col gap-4">
        <p className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
          {t("appName")}
        </p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          {t("title")}
        </h1>
        <p className="text-lg text-muted-foreground">{t("subtitle")}</p>
      </div>

      <Button
        data-testid="landing-get-started"
        disabled={isInteractionInProgress}
        onClick={handleGetStarted}
        size="lg"
      >
        <LogIn data-icon="inline-start" />
        {t("getStarted")}
      </Button>

      <section
        className="flex w-full max-w-2xl flex-col gap-4"
        data-testid="landing-lookups"
      >
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold">{t("lookups.title")}</h2>
          <p className="text-sm text-muted-foreground">
            {t("lookups.subtitle")}
          </p>
        </div>
        {/* Public reference pages. Add future lookups (MoW, NPC, Upgrades, Equipment, …) here. */}
        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            to="/lookup"
            data-testid="landing-unit-lookup-link"
            className="rounded-xl ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <Card className="h-full text-left transition-colors hover:border-primary/50 hover:bg-accent/40">
              <CardHeader>
                <ListChecks className="size-5 text-primary" />
                <CardTitle className="flex items-center justify-between gap-2">
                  {t("lookups.character.title")}
                  <ArrowRight className="size-4 text-muted-foreground" />
                </CardTitle>
                <CardDescription>
                  {t("lookups.character.description")}
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </section>
    </main>
  )
}
