import { Button } from '@workspace/ui'
import { ArrowRightIcon, PlusIcon, Trash2Icon } from 'lucide-react'

const row = { display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' as const }

export function Variants() {
  return (
    <div style={row}>
      <Button variant="default">Default</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="destructive">Delete</Button>
      <Button variant="link">Link</Button>
    </div>
  )
}

export function Sizes() {
  return (
    <div style={row}>
      <Button size="xs">Extra small</Button>
      <Button size="sm">Small</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Large</Button>
    </div>
  )
}

export function WithIcons() {
  return (
    <div style={row}>
      <Button>
        <PlusIcon /> New project
      </Button>
      <Button variant="outline">
        Continue <ArrowRightIcon />
      </Button>
      <Button variant="destructive">
        <Trash2Icon /> Delete
      </Button>
      <Button size="icon" variant="outline" aria-label="Add">
        <PlusIcon />
      </Button>
    </div>
  )
}

export function States() {
  return (
    <div style={row}>
      <Button>Enabled</Button>
      <Button disabled>Disabled</Button>
      <Button variant="outline" disabled>
        Disabled outline
      </Button>
    </div>
  )
}
