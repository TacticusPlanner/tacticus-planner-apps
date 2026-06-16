import { ArrowRight, Download, Plus, Settings } from "lucide-react"

import { Button } from "@workspace/ui/components/button"

import { UiKitShowcaseCard } from "./ui-kit-showcase-card"

export function ButtonsShowcase() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <UiKitShowcaseCard title="Variants">
        <div className="flex flex-wrap gap-3" data-testid="button-variants">
          <Button>Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="link">Link</Button>
        </div>
      </UiKitShowcaseCard>

      <UiKitShowcaseCard title="Sizes and icons">
        <div className="flex flex-wrap items-center gap-3" data-testid="button-sizes">
          <Button size="xs">Extra small</Button>
          <Button size="sm">Small</Button>
          <Button size="lg">Large</Button>
          <Button disabled>Disabled</Button>
          <Button size="icon" variant="outline" aria-label="Settings">
            <Settings />
          </Button>
          <Button>
            <Download data-icon="inline-start" />
            Export
          </Button>
          <Button variant="secondary">
            Create
            <Plus data-icon="inline-end" />
          </Button>
          <Button variant="outline">
            Continue
            <ArrowRight data-icon="inline-end" />
          </Button>
        </div>
      </UiKitShowcaseCard>
    </div>
  )
}

