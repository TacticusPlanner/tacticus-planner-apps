import { ArrowRight, Check, LogIn } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router"
import { Button } from "@workspace/ui/components/button"

import { useSignInRedirect } from "@/shared/auth"

import {
  features,
  landingArt,
  libraryCards,
  previewRows,
} from "../model/landing-content"

const cardLinkClass =
  "group flex h-full flex-col gap-3 rounded-xl border bg-card p-5 text-left text-card-foreground transition-colors hover:border-primary/50 hover:bg-accent/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"

/** Signed-out landing page: rendered inside `PublicLayout`, which owns the top bar, footer and `main`. */
export function LandingPage() {
  return (
    <div className="flex flex-col" data-testid="landing-page">
      <LandingHero />
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-4 py-14 md:px-6">
        <FeaturesSection />
        <LibrarySection />
      </div>
    </div>
  )
}

function LandingHero() {
  const { t } = useTranslation(["landing", "common"])
  const { checkingSignIn, disabled, signIn } = useSignInRedirect()
  const trustPoints = [
    t("hero.trust.apiKey"),
    t("hero.trust.mobile"),
    t("hero.trust.openSource"),
  ]

  return (
    // Always dark: the copy sits on night-sky art, so the hero keeps the dark tokens in either theme.
    <section
      aria-labelledby="landing-title"
      className="dark relative isolate overflow-hidden border-b bg-background text-foreground"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-20 bg-cover bg-center opacity-90"
        style={{ backgroundImage: `url(${landingArt.heroBackground})` }}
      />
      <img
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute top-16 -right-36 -z-10 w-[22rem] [mask-image:radial-gradient(circle,#000_55%,transparent_72%)] opacity-50 md:top-10 md:-right-32 md:w-[36rem]"
        src={landingArt.heroPlanet}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-linear-to-b from-transparent from-30% to-background"
      />
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 pt-12 pb-16 md:grid-cols-[1.1fr_0.9fr] md:px-6 md:pt-20 md:pb-20">
        <div className="flex flex-col items-start gap-5">
          <p className="text-xs font-semibold tracking-[0.12em] text-chart-4 uppercase">
            {t("hero.eyebrow")}
          </p>
          <h1
            className="font-heading text-4xl leading-[1.05] font-semibold tracking-tight text-balance md:text-6xl"
            id="landing-title"
          >
            {t("hero.title")}
          </h1>
          <p className="max-w-[36ch] text-lg text-muted-foreground">
            {t("hero.subtitle")}
          </p>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Button
              className="h-11 rounded-full px-6 text-base"
              data-testid="landing-get-started"
              disabled={disabled}
              onClick={signIn}
            >
              <LogIn data-icon="inline-start" />
              {checkingSignIn
                ? t("common:auth.checkingSignIn")
                : t("hero.getStarted")}
            </Button>
            <Button
              asChild
              className="h-11 rounded-full bg-card/60 px-6 text-base backdrop-blur"
              variant="outline"
            >
              <Link to="/library/characters">{t("hero.browseLibrary")}</Link>
            </Button>
          </div>
          <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
            {trustPoints.map((point) => (
              <li className="flex items-center gap-1.5" key={point}>
                <Check aria-hidden="true" className="size-4 text-primary" />
                {point}
              </li>
            ))}
          </ul>
        </div>
        <ExamplePlanCard />
      </div>
    </section>
  )
}

/** Fixed illustration of a daily plan; reads no player or catalog data. Desktop only. */
function ExamplePlanCard() {
  const { t } = useTranslation("landing")

  return (
    <figure
      aria-labelledby="landing-example-plan-title"
      className="hidden flex-col rounded-2xl border bg-card/85 p-4 shadow-2xl backdrop-blur md:flex"
      data-testid="landing-example-plan"
    >
      <figcaption
        className="pb-2 text-sm text-muted-foreground"
        id="landing-example-plan-title"
      >
        {t("preview.title")}
      </figcaption>
      <ul className="flex flex-col divide-y">
        {previewRows.map((row) => (
          <li className="flex items-center gap-3 py-2.5" key={row.key}>
            <img
              alt=""
              className="size-10 shrink-0 rounded-full bg-muted"
              height={40}
              src={row.portrait}
              width={40}
            />
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm">
                {t(`preview.rows.${row.key}.label`)}
              </span>
              <span className="truncate text-xs text-muted-foreground">
                {t(`preview.rows.${row.key}.detail`)}
              </span>
            </div>
            <span
              aria-hidden="true"
              className="h-1.5 w-24 shrink-0 overflow-hidden rounded-full bg-border"
            >
              <span
                className="block h-full rounded-full bg-chart-4"
                style={{ width: `${row.progress}%` }}
              />
            </span>
          </li>
        ))}
      </ul>
    </figure>
  )
}

function FeaturesSection() {
  const { t } = useTranslation("landing")

  return (
    <section
      aria-labelledby="landing-features-title"
      className="flex flex-col gap-6"
    >
      <div className="flex flex-col gap-1">
        <h2
          className="font-heading text-2xl font-semibold tracking-tight"
          id="landing-features-title"
        >
          {t("features.title")}
        </h2>
        <p className="text-muted-foreground">{t("features.subtitle")}</p>
      </div>
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {features.map((feature) => (
          <li
            className="flex flex-col gap-2 rounded-xl border bg-card p-4 text-card-foreground md:p-5"
            key={feature.key}
          >
            <img
              alt=""
              className="size-11 object-contain"
              height={44}
              loading="lazy"
              src={feature.icon}
              width={44}
            />
            <h3 className="font-medium">
              {t(`features.items.${feature.key}.title`)}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t(`features.items.${feature.key}.description`)}
            </p>
          </li>
        ))}
      </ul>
    </section>
  )
}

function LibrarySection() {
  const { t } = useTranslation(["landing", "library"])

  return (
    <section
      aria-labelledby="landing-library-title"
      className="flex flex-col gap-6"
      data-testid="landing-library"
    >
      <div className="flex flex-col gap-1">
        <h2
          className="font-heading text-2xl font-semibold tracking-tight"
          id="landing-library-title"
        >
          {t("library.title")}
        </h2>
        <p className="text-muted-foreground">{t("library.subtitle")}</p>
      </div>
      <ul className="grid gap-3 md:grid-cols-3">
        {libraryCards.map((card) => (
          <li key={card.key}>
            <Link className={cardLinkClass} to={card.to}>
              <img
                alt=""
                className="size-12 object-contain"
                height={48}
                loading="lazy"
                src={card.icon}
                width={48}
              />
              <h3 className="flex items-center justify-between gap-2 font-medium">
                {t(`library.${card.key}.title`)}
                <ArrowRight
                  aria-hidden="true"
                  className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                />
              </h3>
              <p className="text-sm text-muted-foreground">
                {t(`library.${card.key}.description`)}
              </p>
              {card.previews.length > 0 ? (
                <span aria-hidden="true" className="mt-auto flex -space-x-2">
                  {card.previews.map((src) => (
                    <img
                      alt=""
                      className="size-9 rounded-full border-2 border-card bg-muted"
                      height={36}
                      key={src}
                      loading="lazy"
                      src={src}
                      width={36}
                    />
                  ))}
                </span>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
      <p className="text-sm text-muted-foreground">
        {t("library.more")}{" "}
        <Link
          className="text-primary underline-offset-4 hover:underline"
          to="/library/machines-of-war"
        >
          {t("library:collections.machinesOfWar.label")}
        </Link>
        {" · "}
        <Link
          className="text-primary underline-offset-4 hover:underline"
          to="/library/npcs"
        >
          {t("library:collections.npcs.label")}
        </Link>
      </p>
    </section>
  )
}
