import { Toggle } from '@workspace/ui'
import { BoldIcon, ItalicIcon, UnderlineIcon } from 'lucide-react'

const row = { display: 'flex', gap: 8, alignItems: 'center' }

export function Default() {
  return (
    <div style={row}>
      <Toggle aria-label="Bold">
        <BoldIcon />
      </Toggle>
      <Toggle aria-label="Italic" defaultPressed>
        <ItalicIcon />
      </Toggle>
      <Toggle aria-label="Underline">
        <UnderlineIcon />
      </Toggle>
    </div>
  )
}

export function WithText() {
  return (
    <div style={row}>
      <Toggle>
        <BoldIcon /> Bold
      </Toggle>
      <Toggle variant="outline" defaultPressed>
        <ItalicIcon /> Italic
      </Toggle>
    </div>
  )
}

export function Sizes() {
  return (
    <div style={row}>
      <Toggle size="sm" aria-label="Bold small">
        <BoldIcon />
      </Toggle>
      <Toggle size="default" aria-label="Bold default">
        <BoldIcon />
      </Toggle>
      <Toggle size="lg" aria-label="Bold large">
        <BoldIcon />
      </Toggle>
    </div>
  )
}
