import { Badge } from '@workspace/ui'
import { CheckIcon } from 'lucide-react'

const row = { display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' as const }

export function Variants() {
  return (
    <div style={row}>
      <Badge>Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="outline">Outline</Badge>
      <Badge variant="destructive">Destructive</Badge>
      <Badge variant="ghost">Ghost</Badge>
    </div>
  )
}

export function WithContent() {
  return (
    <div style={row}>
      <Badge>
        <CheckIcon /> Verified
      </Badge>
      <Badge variant="secondary">New</Badge>
      <Badge variant="outline">v2.4.0</Badge>
      <Badge variant="destructive">3 errors</Badge>
    </div>
  )
}
